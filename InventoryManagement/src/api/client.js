const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

let _token = null;

export function initClient() {
  const t = localStorage.getItem('sm_token');
  if (t) _token = t;
}

export function setToken(token) {
  _token = token;
  localStorage.setItem('sm_token', token);
}

export function clearToken() {
  _token = null;
  localStorage.removeItem('sm_token');
}

async function request(path, opts = {}) {
  const headers = opts.headers ? { ...opts.headers } : {};
  if (!headers['Content-Type'] && !(opts.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  // Build URL
  let fullUrl = `${API_BASE}${path}`;

  let res;
  try {
    res = await fetch(fullUrl, { ...opts, headers });
  } catch (err) {
    // Network / CORS failures show up here as TypeError: Failed to fetch
    // Provide a clearer error to the caller
    const e = new Error('Network error: Failed to fetch from API (check backend / CORS)');
    e.original = err;
    throw e;
  }
  if (!res.ok) {
    const text = await res.text();
    let message = text || res.statusText;
    try {
        const json = JSON.parse(text);
        if (json.detail) message = json.detail;
    } catch (e) { /* ignore */ }
    
    const err = new Error(message);
    err.status = res.status;
    err.response = res;
    throw err;
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return res.text();
}

export const get = (path) => request(path, { method: 'GET' });
export const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) });

export const postForm = (path, formObj) => {
  const body = new URLSearchParams();
  Object.keys(formObj || {}).forEach(k => body.append(k, formObj[k]));
  // Ensure proper header for form-encoded data so FastAPI's OAuth2 form parser works
  return request(path, { method: 'POST', body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
};

export default { initClient, setToken, clearToken, get, post, postForm };
