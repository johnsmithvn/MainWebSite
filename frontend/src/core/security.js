export function isSecureKey(key) {
  const list = window.secureKeys || [];
  return list.includes(key && key.toUpperCase());
}

export function getToken(key) {
  return localStorage.getItem(`secureToken_${key}`);
}

export function setToken(key, token) {
  localStorage.setItem(`secureToken_${key}`, token);
}

export async function showLoginModal(key) {
  return new Promise((resolve) => {
    let modal = document.getElementById('login-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'login-modal';
      modal.className = 'modal-overlay hidden';
      modal.innerHTML = `
        <div class="modal-box">
          <p>Nhập mật khẩu</p>
          <input type="password" id="login-password" style="width:100%;padding:8px;margin-bottom:10px" />
          <div class="buttons">
            <button class="ok">OK</button>
            <button class="cancel">Huỷ</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
    modal.classList.remove('hidden');
    const input = modal.querySelector('#login-password');
    input.value = '';
    input.focus();
    const okBtn = modal.querySelector('button.ok');
    const cancelBtn = modal.querySelector('button.cancel');
    const cleanup = () => {
      modal.classList.add('hidden');
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
    };
    const onOk = async () => {
      const password = input.value;
      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, password })
        });
        if (res.ok) {
          const data = await res.json();
          setToken(key, data.token);
          cleanup();
          resolve(true);
        } else {
          window.showToast && window.showToast('Sai mật khẩu');
          input.value = '';
        }
      } catch (e) {
        window.showToast && window.showToast('Lỗi kết nối');
      }
    };
    const onCancel = () => {
      cleanup();
      resolve(false);
    };
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
  });
}

// Override fetch to attach token automatically
const originalFetch = window.fetch;
window.fetch = function(url, options = {}) {
  try {
    const key = localStorage.getItem('sourceKey');
    if (key && isSecureKey(key)) {
      const token = getToken(key);
      if (token) {
        options.headers = Object.assign({}, options.headers, { 'x-secure-token': token });
      }
    }
  } catch {}
  return originalFetch(url, options);
};
