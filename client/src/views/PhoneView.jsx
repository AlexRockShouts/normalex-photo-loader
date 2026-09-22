import { useRef, useState } from 'react';
import { uploadPhoto, getState } from '../api.js';

export default function PhoneView() {
  const fileInput = useRef(null);
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | success | error
  const [message, setMessage] = useState('');
  const [photoCount, setPhotoCount] = useState(0);

  async function refreshCount() {
    try {
      const state = await getState();
      setPhotoCount(state.photos.length);
    } catch {
      /* ignore */
    }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setStatus('idle');
  }

  async function handleUpload() {
    const file = fileInput.current?.files?.[0];
    if (!file) return;
    setStatus('uploading');
    setMessage('');
    try {
      await uploadPhoto(file);
      setStatus('success');
      setMessage('Photo hochgeladen und in der Projektion!');
      // Kamera zuruecksetzen fuer naechstes Foto
      fileInput.current.value = '';
      setPreview(null);
      refreshCount();
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'Upload fehlgeschlagen');
    }
  }

  return (
    <div className="phone">
      <header className="phone-header">
        <a href="/" className="back">←</a>
        <span>📸 Photo aufnehmen</span>
        <span className="count" title="Fotos in der Warteschlange">{photoCount} 📷</span>
      </header>

      <main className="phone-body">
        {preview ? (
          <img src={preview} alt="Vorschau" className="preview" />
        ) : (
          <button
            className="camera-btn"
            onClick={() => fileInput.current?.click()}
          >
            <span className="camera-icon">📷</span>
            <span>Foto aufnehmen</span>
          </button>
        )}

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          hidden
        />

        {preview && (
          <div className="actions">
            <button className="btn secondary" onClick={() => { setPreview(null); fileInput.current.value = ''; }}>
              Verwerfen
            </button>
            <button
              className="btn primary"
              onClick={handleUpload}
              disabled={status === 'uploading'}
            >
              {status === 'uploading' ? 'Lade hoch…' : 'Hochladen'}
            </button>
          </div>
        )}

        {status === 'success' && <p className="msg success">{message}</p>}
        {status === 'error' && <p className="msg error">{message}</p>}
      </main>
    </div>
  );
}
