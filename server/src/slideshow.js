import { randomUUID } from 'node:crypto';

const DEFAULT_INTERVAL_MS = 6000;

/**
 * Zentrale Slideshow-Logik. Der Server ist die Quelle der Wahrheit.
 * Er haelt die Liste aller Fotos, den aktuellen Index und den Pause-Zustand.
 * Bei neuen Fotos springt er auf das neueste Foto, ansonsten loopt er durch alle.
 */
export class Slideshow {
  constructor({ intervalMs = DEFAULT_INTERVAL_MS } = {}) {
    this.photos = []; // [{ id, name, url, uploadedAt }]
    this.index = 0;
    this.paused = false;
    this.intervalMs = intervalMs;

    this.onChange = null; // wird bei jeder Aenderung aufgerufen
    this._timer = null;
    this._startTimer();
  }

  _startTimer() {
    if (this._timer) clearInterval(this._timer);
    this._timer = setInterval(() => {
      if (this.paused || this.photos.length === 0) return;
      this.index = (this.index + 1) % this.photos.length;
      this._emit();
    }, this.intervalMs);
    this._timer.unref?.();
  }

  _emit() {
    this.onChange?.(this.getState());
  }

  getState() {
    return {
      photos: this.photos,
      index: this.index,
      paused: this.paused,
      intervalMs: this.intervalMs,
    };
  }

  addPhoto({ name, url }) {
    const photo = {
      id: randomUUID(),
      name,
      url,
      uploadedAt: Date.now(),
    };
    this.photos.push(photo);
    // Zeige das neu hochgeladene Foto sofort an.
    this.index = this.photos.length - 1;
    this._emit();
    return photo;
  }

  removePhoto(id) {
    const idx = this.photos.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.photos.splice(idx, 1);
    if (this.photos.length === 0) {
      this.index = 0;
    } else {
      this.index = Math.min(this.index, this.photos.length - 1);
    }
    this._emit();
    return true;
  }

  clear() {
    this.photos = [];
    this.index = 0;
    this._emit();
  }

  next() {
    if (this.photos.length === 0) return;
    this.index = (this.index + 1) % this.photos.length;
    this._emit();
  }

  prev() {
    if (this.photos.length === 0) return;
    this.index = (this.index - 1 + this.photos.length) % this.photos.length;
    this._emit();
  }

  goto(id) {
    const idx = this.photos.findIndex((p) => p.id === id);
    if (idx === -1) return;
    this.index = idx;
    this._emit();
  }

  pause() {
    this.paused = true;
    this._emit();
  }

  play() {
    this.paused = false;
    this._emit();
  }

  setIntervalMs(ms) {
    this.intervalMs = ms;
    this._startTimer();
    this._emit();
  }

  destroy() {
    if (this._timer) clearInterval(this._timer);
  }
}
