import { io } from 'socket.io-client';

export const socket = io();

export function getState() {
  return fetch('/api/state').then((r) => r.json());
}

export function uploadPhoto(file) {
  const form = new FormData();
  form.append('photo', file);
  return fetch('/api/photos', { method: 'POST', body: form }).then(async (r) => {
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      throw new Error(body.error || 'Upload fehlgeschlagen');
    }
    return r.json();
  });
}

export function sendControl(action, extra = {}) {
  socket.emit('control', { action, ...extra });
}
