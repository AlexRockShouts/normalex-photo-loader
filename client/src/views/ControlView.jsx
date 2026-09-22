import { useEffect, useState } from 'react';
import { socket, sendControl, getState, deletePhoto, deleteAllPhotos } from '../api.js';

const INTERVALS = [
  { label: '2s', value: 2000 },
  { label: '4s', value: 4000 },
  { label: '6s', value: 6000 },
  { label: '10s', value: 10000 },
  { label: '15s', value: 15000 },
];

export default function ControlView() {
  const [state, setState] = useState(null);

  useEffect(() => {
    socket.on('state', setState);
    getState().then(setState).catch(() => {});
    return () => socket.off('state', setState);
  }, []);

  const photos = state?.photos ?? [];
  const currentId = state?.photos[state.index]?.id;

  return (
    <div className="control">
      <header className="control-header">
        <a href="/" className="back">←</a>
        <h1>🎛️ Steuerung</h1>
        <span className="count">{photos.length} 📷</span>
      </header>

      <div className="transport">
        <button className="ctrl-btn" onClick={() => sendControl('prev')}>⏮</button>
        <button className="ctrl-btn" onClick={() => sendControl(state?.paused ? 'play' : 'pause')}>
          {state?.paused ? '▶' : '⏸'}
        </button>
        <button className="ctrl-btn" onClick={() => sendControl('next')}>⏭</button>
      </div>

      <div className="speed">
        <span>Intervall:</span>
        <div className="speed-btns">
          {INTERVALS.map((it) => (
            <button
              key={it.value}
              className={`pill ${state?.intervalMs === it.value ? 'active' : ''}`}
              onClick={() => sendControl('interval', { intervalMs: it.value })}
            >
              {it.label}
            </button>
          ))}
        </div>
      </div>

      <h2>Fotos</h2>
      <div className="grid">
        {photos.length === 0 && <p className="empty-hint">Noch keine Fotos hochgeladen.</p>}
        {photos.map((p, i) => (
          <div key={p.id} className={`thumb ${p.id === currentId ? 'active' : ''}`}>
            <button className="thumb-img" onClick={() => sendControl('goto', { id: p.id })}>
              <img src={p.url} alt={p.name} />
            </button>
            <span className="thumb-num">{i + 1}</span>
            <button className="thumb-del" onClick={() => deletePhotoItem(p)} title="Loeschen">✕</button>
          </div>
        ))}
      </div>

      <button className="btn danger" onClick={clearAll}>Alle loeschen</button>
    </div>
  );
}

async function deletePhotoItem(p) {
  await deletePhoto(p.id);
}

async function clearAll() {
  if (!confirm('Wirklich ALLE Fotos loeschen?')) return;
  await deleteAllPhotos();
}
