# Normalex Photo Loader

Handy-Fotos aufnehmen, hochladen und auf einem Beamer / Samsung Freestyle projizieren.

## Funktionsweise

- **Handy** oeffnet die Web-App, nimmt ein Foto auf und laedt es hoch.
- **Server** (Node.js/Express) speichert Fotos permanent und verwaltet die Slideshow in Echtzeit (WebSocket).
- **Projektion** zeigt neue Fotos automatisch an; sind keine neuen da, laeuft die vorhandene Liste im Loop.

## Aufbau

```
server/    Node.js/Express-API + Slideshow-Manager (Socket.io)
client/    React-Web-App (Vite): Handy-Upload, Projektor, Steuerung
deploy/pi/ Setup-Skript fuer den Raspberry Pi (Server + Kiosk-Projektion per HDMI)
```

## URLs

| Ansicht | URL | Zweck |
|---|---|---|
| Start | `/` | Auswahl-Menue |
| Handy | `/phone` | Foto aufnehmen + hochladen |
| Projektor | `/projector` | Vollbild-Projektion (Loop/Auto) |
| Steuerung | `/control` | Bedienpanel: weiter/zurueck/pause, Intervall, Fotos loeschen |

## Lokal starten (Entwicklung)

```bash
# Terminal 1 - Server
cd server
npm install
npm run dev            # http://localhost:3000

# Terminal 2 - Client (Vite-Dev-Server mit Proxy)
cd client
npm install
npm run dev            # http://localhost:5173
```

Fuer Produktion nur den gebauten Client brauchen:

```bash
cd client && npm run build
cd ../server && npm start   # http://localhost:3000 (liefert auch den Client aus)
```

## Raspberry Pi + Samsung Freestyle (per HDMI)

Der Pi laeuft als **Server** und zeigt die **Projektion** auf dem Freestyle.

1. Projekt auf den Pi kopieren (z.B. `git clone` oder `scp`) nach `~/normalex-photo-loader`.
2. Ausfuehren:
   ```bash
   cd ~/normalex-photo-loader/deploy/pi
   bash pi-setup.sh
   ```
3. `sudo reboot`.

Nach dem Boot:
- Der Server laeuft als systemd-Dienst (`photo-loader`).
- Chromium startet automatisch im Vollbild auf `/projector`.
- Handys und Freestyle muessen im **gleichen WLAN** sein wie der Pi.

## Im WLAN erreichbar machen

Finde die IP des Pi: `hostname -I` (z.B. `192.168.1.42`).
Auf dem Handy: `http://192.168.1.42:3000` oeffnen.

## Konfiguration (Umgebungsvariablen)

- `PORT` – Port des Servers (Standard `3000`)
- `SLIDESHOW_INTERVAL_MS` – Wechsel-Intervall der Slideshow (Standard `6000`)
- `UPLOAD_TOKEN` – Zugangs-Token fuer Upload/Loeschen. Leer lassen deaktiviert den Schutz (nur LAN-Betrieb). Fuer Cloud-Betrieb unbedingt setzen!

## Cloud-Betrieb (Railway / PaaS)

Handy laedt zur Cloud hoch, der Raspberry Pi projiziert von dort – alle drei brauchen Internet, kein gemeinsames WLAN noetig. HTTPS kommt automatisch von der Plattform (wichtig fuer die Handy-Kamera).

1. Auf [Railway](https://railway.app) ein neues Projekt anlegen, das Repo verbinden oder per `railway up` deployen.
2. **Wichtig:** In den Variablen `UPLOAD_TOKEN` auf einen schwer zu ratenden Wert setzen.
3. Nach dem Deploy bekommst du eine HTTPS-URL, z.B. `https://<name>.up.railway.app`.
   - Handy: `https://<name>.up.railway.app/phone`
   - Raspberry Pi: `https://<name>.up.railway.app/projector`
   - Steuerung: `https://<name>.up.railway.app/control`
4. Auf dem Pi den Kiosk-Browser auf die `/projector`-URL umstellen.

Hinweis: Auf einer PaaS-VM ist der Speicher fluechtig – Fotos koennen bei einem Re-Deploy verloren gehen. Fuer dauerhafte Speicherung eine eigene VM oder ein Volume/Objekt-Speicher verwenden.

Lokal in Docker testen:
```bash
docker build -t photo-loader .
docker run --rm -p 3000:3000 -e UPLOAD_TOKEN=geheim photo-loader
```

