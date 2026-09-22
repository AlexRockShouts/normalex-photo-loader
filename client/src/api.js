import { io } from 'socket.io-client';

const TOKEN_KEY = 'photoLoaderToken';

function urlParam(name) {
  return new URLSearchParams(window.location.search).get(name) || '';
}

// View-Token kommt aus der URL (?view=...) und ist fuer Projektor/Steuerung gedacht.
const viewToken = urlParam('view');

export const socket = io({
  auth: { view: viewToken, token: getToken() },
});

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

// Liefert die Query-Anhaenge fuer Anzeige-Zugriff (view-Token, sonst Upload-Token).
function viewQuery() {
  const q = new URLSearchParams();
  const v = viewToken || getToken();
  if (v) q.set('view', v);
  return q.toString();
}

// Haengt den View-Zugriff an Bild-URLs an (fuer Projektor & Steuerung).
export function imgUrl(url) {
  const q = viewQuery();
  return q ? `${url}?${q}` : url;
}

function authHeaders() {
  const t = getToken();
  return t ? { 'x-upload-token': t } : {};
}

export function getState() {
  return fetch(`/api/state?${viewQuery()}`).then((r) => r.json());
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
