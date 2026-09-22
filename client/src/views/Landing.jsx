export default function Landing() {
  return (
    <div className="landing">
      <h1>📸 Photo Loader</h1>
      <p className="sub">Waehle eine Ansicht</p>
      <a className="big-btn" href="/phone">
        <span className="icon">📱</span>
        <span>
          <strong>Photo aufnehmen</strong>
          <small>Vom Handy hochladen</small>
        </span>
      </a>
      <a className="big-btn" href="/projector">
        <span className="icon">🖥️</span>
        <span>
          <strong>Projektor</strong>
          <small>Vollbild-Projektion</small>
        </span>
      </a>
      <a className="big-btn" href="/control">
        <span className="icon">🎛️</span>
        <span>
          <strong>Steuerung</strong>
          <small>Slideshow bedienen</small>
        </span>
      </a>
    </div>
  );
}
