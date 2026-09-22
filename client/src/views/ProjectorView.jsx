import { useEffect, useRef, useState } from 'react';
import { socket, sendControl } from '../api.js';

export default function ProjectorView() {
  const [state, setState] = useState(null);
  const fullscreenRef = useRef(null);

  useEffect(() => {
    socket.on('state', setState);
    getInitialState(setState);
    return () => socket.off('state', setState);
  }, []);

  const photo = state?.photos[state.index] ?? null;

  return (
    <div
      className="projector"
      ref={fullscreenRef}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') sendControl('next');
        if (e.key === 'ArrowLeft') sendControl('prev');
        if (e.key === ' ') { e.preventDefault(); sendControl(state?.paused ? 'play' : 'pause'); }
      }}
      tabIndex={0}
    >
      {photo ? (
        <img key={photo.id} src={photo.url} alt={photo.name} className="slide" />
      ) : (
        <div className="empty">
          <span className="empty-icon">📷</span>
          <p>Warte auf neue Fotos…</p>
          <p className="empty-hint">Fotos erscheinen hier automatisch, sobald sie hochgeladen werden.</p>
        </div>
      )}

      <div className="projector-chrome">
        <span className="badge">
          {state?.photos.length ? `${state.index + 1} / ${state.photos.length}` : '0 / 0'}
        </span>
        {state?.paused && <span className="badge pause">⏸ Pause</span>}
        <button className="fs-btn" onClick={toggleFullscreen} title="Vollbild">⛶</button>
      </div>
    </div>
  );
}

async function getInitialState(setState) {
  try {
    const r = await fetch('/api/state');
    setState(await r.json());
  } catch {
    /* ignore */
  }
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen?.();
  }
}
