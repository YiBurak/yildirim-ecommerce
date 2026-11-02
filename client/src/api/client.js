export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Canlı konsola log göndermek için event callback'i
let logListener = null;

export function registerLogListener(callback) {
  logListener = callback;
}

function emitLog(message, type = 'info') {
  if (logListener) {
    logListener({ message, type, time: new Date().toLocaleTimeString() });
  }
}

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  options.headers = options.headers || {};

  if (options.body && typeof options.body === 'string') {
    options.headers['Content-Type'] = 'application/json';
  }

  // Cebimizdeki Access Token'ı ekle:
  const token = localStorage.getItem('accessToken');
  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  emitLog(`➡️ [İSTEK] ${options.method || 'GET'} ${endpoint}`, 'info');

  let response = await fetch(url, options);

  // 🔄 SESSİZ YENİLEME (Silent Refresh):
  if (response.status === 401) {
    emitLog('⚠️ [401 UNAUTHORIZED] Access Token bitti! Sessiz yenileme deneniyor...', 'warning');

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      emitLog('❌ Refresh Token yok, oturum sonlandırılıyor.', 'danger');
      localStorage.clear();
      window.dispatchEvent(new Event('auth-expired'));
      throw new Error('Oturum süresi doldu.');
    }

    try {
      const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!refreshRes.ok) {
        throw new Error('Refresh token geçersiz.');
      }

      const refreshData = await refreshRes.json();
      localStorage.setItem('accessToken', refreshData.accessToken);
      localStorage.setItem('refreshToken', refreshData.refreshToken);

      emitLog('🔄 [TOKEN ROTASYONU] Yeni token çifti başarıyla alındı!', 'success');

      // Yarım kalan isteği yeni token ile tekrar dene:
      options.headers['Authorization'] = `Bearer ${refreshData.accessToken}`;
      emitLog(`🔁 [TEKRAR DENE] ${options.method || 'GET'} ${endpoint}`, 'info');
      response = await fetch(url, options);

    } catch (err) {
      emitLog('🚨 [OTURUM ÖLDÜ] Lütfen tekrar giriş yapın!', 'danger');
      localStorage.clear();
      window.dispatchEvent(new Event('auth-expired'));
      throw err;
    }
  }

  // 🛑 429 Rate Limiting Yakalama:
  if (response.status === 429) {
    emitLog('🛑 [429 TOO MANY REQUESTS] Rate limiter devrede! Çok hızlı istek attınız.', 'danger');
  }

  // ⚡ 409 Concurrency Yakalama:
  if (response.status === 409) {
    emitLog('⚡ [409 CONFLICT] Flaş indirim çakışması! Stok başka biri tarafından alındı.', 'danger');
  }

  return response;
}
