import { io } from 'socket.io-client';

export const socket = io();

const TOKEN_KEY = 'photoLoaderToken';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

function authHeaders() {
  const t = getToken();
  return t ? { 'x-upload-token': t } : {};
}

export function getState() {
  return fetch('/api/state').then((r) => r.json());
}

export function uploadPhoto(file) {
  const form = new FormData();
  form.append('photo', file);
  return fetch('/api/photos', {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  }).then(async (r) => {
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      throw new Error(body.error || 'Upload fehlgeschlagen');
    }
    return r.json();
  });
}

export function deletePhoto(id) {
  return fetch(`/api/photos/${id}`, { method: 'DELETE', headers: authHeaders() });
}

export function deleteAllPhotos() {
  return fetch('/api/photos', { method: 'DELETE', headers: authHeaders() });
}

export function sendControl(action, extra = {}) {
  socket.emit('control', { action, ...extra });
}
