export function setupSecurityFetch() {
  const orig = window.fetch;
  window.fetch = async (url, options = {}) => {
    const key = localStorage.getItem('sourceKey');
    if (window.securityKeys?.includes(key)) {
      const token = localStorage.getItem(`securityToken::${key}`);
      if (token) {
        options.headers = options.headers || {};
        options.headers['X-Security-Token'] = token;
      }
    }
    return orig(url, options);
  };
}

export async function ensureAuth(key) {
  if (!window.securityKeys?.includes(key)) return true;
  const stored = localStorage.getItem(`securityToken::${key}`);
  if (stored) return true;
  const password = prompt('Enter password');
  if (!password) return false;
  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, password })
    });
    if (!res.ok) {
      alert('Sai password');
      return false;
    }
    const data = await res.json();
    localStorage.setItem(`securityToken::${key}`, data.token);
    return true;
  } catch (err) {
    alert('Lỗi xác thực');
    return false;
  }
}
