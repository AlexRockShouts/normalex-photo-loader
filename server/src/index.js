import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import express from 'express';
import multer from 'multer';
import { Server } from 'socket.io';
import { Slideshow } from './slideshow.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const UPLOADS_DIR = path.join(ROOT, 'uploads');
const CLIENT_DIST = path.join(ROOT, '..', 'client', 'dist');

const PORT = process.env.PORT || 3000;
// Wenn UPLOAD_TOKEN gesetzt ist, wird er fuer Upload/Delete verlangt.
const UPLOAD_TOKEN = process.env.UPLOAD_TOKEN || '';
// Wenn VIEW_TOKEN gesetzt ist, wird er (oder der Upload-Token) fuer Anzeige verlangt.
const VIEW_TOKEN = process.env.VIEW_TOKEN || '';

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const slideshow = new Slideshow({
  intervalMs: Number(process.env.SLIDESHOW_INTERVAL_MS) || 6000,
});

// --- Multer fuer Photo-Uploads ---
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) cb(null, true);
    else cb(new Error('Nur Bilddateien (JPEG/PNG/WebP/GIF) erlaubt'));
  },
});

// --- Statische Dateien ---
app.use('/uploads', express.static(UPLOADS_DIR));

// --- Auth-Middleware: schuetzt schreibende Endpunkte, falls Token gesetzt ---
function requireToken(req, res, next) {
  if (!UPLOAD_TOKEN) return next();
  const provided = req.get('x-upload-token') || req.query.token;
  if (provided !== UPLOAD_TOKEN) {
    return res.status(401).json({ error: 'Ungueltiger oder fehlender Zugangs-Token' });
  }
  next();
}

// --- Auth-Middleware: schuetzt das Anzeigen (State + Bilder + Socket), falls VIEW_TOKEN gesetzt ---
// Der Upload-Token gilt hier ebenfalls, damit das Handy Fotos anzeigen/zählen kann.
function requireView(req, res, next) {
  if (!VIEW_TOKEN) return next();
  const view = req.query.view;
  const token = req.query.token;
  if (view === VIEW_TOKEN || (UPLOAD_TOKEN && token === UPLOAD_TOKEN)) return next();
  return res.status(401).json({ error: 'Zugriff verweigert: gueltiger View-Token fehlt' });
}

// --- Statische Dateien ---
app.use('/uploads', requireView, express.static(UPLOADS_DIR));

// --- API ---
app.get('/api/state', requireView, (_req, res) => {
  res.json(slideshow.getState());
});

app.post('/api/photos', requireToken, upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Keine Datei hochgeladen' });
  }
  const photo = slideshow.addPhoto({
    name: req.file.originalname,
    url: `/uploads/${req.file.filename}`,
  });
  res.status(201).json(photo);
});

app.delete('/api/photos/:id', requireToken, (req, res) => {
  const photo = slideshow.photos.find((p) => p.id === req.params.id);
  if (!photo) return res.status(404).json({ error: 'Nicht gefunden' });
  const filename = path.basename(photo.url);
  fs.promises.unlink(path.join(UPLOADS_DIR, filename)).catch(() => {});
  slideshow.removePhoto(photo.id);
  res.json({ ok: true });
});

app.delete('/api/photos', requireToken, async (_req, res) => {
  for (const p of slideshow.photos) {
    const filename = path.basename(p.url);
    await fs.promises.unlink(path.join(UPLOADS_DIR, filename)).catch(() => {});
  }
  slideshow.clear();
  res.json({ ok: true });
});

app.post('/api/control', (req, res) => {
  const { action, id, intervalMs } = req.body || {};
  switch (action) {
    case 'next': slideshow.next(); break;
    case 'prev': slideshow.prev(); break;
    case 'pause': slideshow.pause(); break;
    case 'play': slideshow.play(); break;
    case 'goto':
      if (id) slideshow.goto(id);
      break;
    case 'interval':
      if (intervalMs) slideshow.setIntervalMs(Number(intervalMs));
      break;
    default:
      return res.status(400).json({ error: 'Unbekannte Aktion' });
  }
  res.json(slideshow.getState());
});

// Fehlerbehandlung fuer Multer
app.use((err, _req, res, _next) => {
  res.status(400).json({ error: err.message || 'Upload-Fehler' });
});

// --- WebSocket: Echtzeit-State an alle Clients ---
slideshow.onChange = (state) => io.emit('state', state);

io.use((socket, next) => {
  if (!VIEW_TOKEN) return next();
  const { view, token } = socket.handshake.auth || {};
  if (view === VIEW_TOKEN || (UPLOAD_TOKEN && token === UPLOAD_TOKEN)) return next();
  next(new Error('unauthorized'));
});

io.on('connection', (socket) => {
  socket.emit('state', slideshow.getState());

  socket.on('control', (data) => {
    const { action, id, intervalMs } = data || {};
    switch (action) {
      case 'next': slideshow.next(); break;
      case 'prev': slideshow.prev(); break;
      case 'pause': slideshow.pause(); break;
      case 'play': slideshow.play(); break;
      case 'goto': if (id) slideshow.goto(id); break;
      case 'interval': if (intervalMs) slideshow.setIntervalMs(Number(intervalMs)); break;
      default: break;
    }
  });
});

// --- React-Client ausliefern (falls gebaut) ---
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST));
  app.get(/^\/(?!api|uploads|socket\.io).*/, (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`Photo-Loader Server laeuft auf http://localhost:${PORT}`);
  console.log(`Uploads: ${UPLOADS_DIR}`);
});
