import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, Key, User, UserPlus, LogIn, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../api/client';

export function LoginModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'reset'

  // Giriş State'leri
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Kayıt State'leri
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Şifremi Unuttum & Sıfırlama State'leri
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Doğrulama Mailini Yeniden Gönder State'leri
  const [resendSuccess, setResendSuccess] = useState('');
  const [resending, setResending] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('resetToken');
    const emailParam = params.get('email');

    if (token && emailParam) {
      setResetToken(token);
      setResetEmail(emailParam);
      setMode('reset');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cleanEmail = email.trim();
      await login(cleanEmail, password);
      showToast({ type: 'success', message: 'Başarıyla oturum açıldı.' });
      onClose();
    } catch (err) {
      setError(err.message || 'Giriş yapılamadı.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (regPassword !== regConfirmPassword) {
      setError('Girdiğiniz şifreler eşleşmiyor.');
      return;
    }

    if (regPassword.length < 6) {
      setError('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    try {
      await register(regFirstName, regLastName, regEmail, regPassword);
      showToast({
        type: 'info',
        message: `Doğrulama e-postası ${regEmail} adresine iletildi.`
      });
      setEmail(regEmail);
      setPassword('');
      setMode('login');
      setError('Hesabınız oluşturuldu. Giriş yapabilmek için lütfen e-postanızı onaylayın.');
    } catch (err) {
      setError(err.message || 'Kayıt işlemi başarısız.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setForgotSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'İstek işlenemedi.');
      }

      setForgotSuccess(data.message || 'Sıfırlama bağlantısı e-posta adresinize gönderildi.');
    } catch (err) {
      setError(err.message || 'İşlem başarısız.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmNewPassword) {
      setError('Yeni şifreler eşleşmiyor.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Yeni şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail,
          token: resetToken,
          newPassword: newPassword
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Şifre sıfırlanamadı.');
      }

      showToast({ type: 'success', message: 'Şifreniz güncellendi. Giriş yapabilirsiniz.' });
      window.history.replaceState({}, document.title, window.location.pathname);
      setMode('login');
      setEmail(resetEmail);
      setPassword('');
    } catch (err) {
      setError(err.message || 'Şifre sıfırlama başarısız.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    const targetEmail = email || regEmail;
    if (!targetEmail) {
      setError('Lütfen e-posta adresinizi giriniz.');
      return;
    }

    setResending(true);
    setError('');
    setResendSuccess('');

    try {
      const response = await fetch(`${API_BASE_URL}/auth/resend-confirmation-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Doğrulama e-postası gönderilemedi.');
      }

      setResendSuccess(data.message || 'Yeni doğrulama bağlantısı e-postanıza gönderildi!');
    } catch (err) {
      setError(err.message || 'E-posta gönderilirken bir hata oluştu.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-6 sm:p-7 shadow-xl relative">
        
        {/* Kapat Butonu */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Sekme Seçici (Kutusuz, editoryal) */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex border-b border-zinc-100 dark:border-zinc-800 mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className={`pb-2.5 mr-6 text-xs transition-colors ${
                mode === 'login'
                  ? 'border-b border-zinc-950 dark:border-zinc-50 font-medium text-zinc-950 dark:text-zinc-50'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              Giriş Yap
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(''); }}
              className={`pb-2.5 text-xs transition-colors ${
                mode === 'register'
                  ? 'border-b border-zinc-950 dark:border-zinc-50 font-medium text-zinc-950 dark:text-zinc-50'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              Kayıt Ol
            </button>
          </div>
        )}

        {/* Hata Uyarısı */}
        {error && (
          <div className="mb-4 text-xs font-mono text-rose-500">
            {error}
          </div>
        )}

        {/* Başarı Uyarısı (Tekrar Gönderim vb.) */}
        {resendSuccess && (
          <div className="mb-4 text-xs font-mono text-emerald-500">
            {resendSuccess}
          </div>
        )}

        {/* 1. GİRİŞ YAP */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">E-Posta</label>
              <input
                type="text"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ad@ornek.com"
                className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 focus:border-zinc-950 dark:focus:border-zinc-100 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs text-zinc-500">Şifre</label>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setError('');
                    setForgotSuccess('');
                    setForgotEmail(email);
                  }}
                  className="text-[11px] text-zinc-400 hover:underline"
                >
                  Şifremi unuttum?
                </button>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 focus:border-zinc-950 dark:focus:border-zinc-100 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 rounded-full bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 text-xs font-medium hover:opacity-85 transition-opacity disabled:opacity-40"
            >
              {loading ? 'İşleniyor...' : 'Giriş Yap'}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resending}
                className="text-[11px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
              >
                {resending ? 'Gönderiliyor...' : 'Doğrulama e-postası almadınız mı? Yeniden gönder'}
              </button>
            </div>
          </form>
        )}

        {/* 2. KAYIT OL */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} noValidate className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Ad</label>
                <input
                  type="text"
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  required
                  placeholder="Adınız"
                  className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 focus:border-zinc-950 dark:focus:border-zinc-100 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Soyad</label>
                <input
                  type="text"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  required
                  placeholder="Soyadınız"
                  className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 focus:border-zinc-950 dark:focus:border-zinc-100 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">E-Posta</label>
              <input
                type="text"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck="false"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
                placeholder="ad@ornek.com"
                className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 focus:border-zinc-950 dark:focus:border-zinc-100 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Şifre</label>
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                  placeholder="••••••"
                  className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 focus:border-zinc-950 dark:focus:border-zinc-100 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Şifre Tekrar</label>
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••"
                  className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 focus:border-zinc-950 dark:focus:border-zinc-100 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 rounded-full bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 text-xs font-medium hover:opacity-85 transition-opacity disabled:opacity-40"
            >
              {loading ? 'İşleniyor...' : 'Hesap Oluştur'}
            </button>
          </form>
        )}

        {/* 3. ŞİFREMİ UNUTTUM */}
        {mode === 'forgot' && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Şifre Sıfırlama</h3>
              <p className="text-xs text-zinc-400">Hesabınıza kayıtlı e-postayı giriniz.</p>
            </div>

            {forgotSuccess ? (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 py-4">
                {forgotSuccess}
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">E-Posta</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="ad@ornek.com"
                    className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 focus:border-zinc-950 dark:focus:border-zinc-100 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-full bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 text-xs font-medium hover:opacity-85 transition-opacity disabled:opacity-40"
                >
                  {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); }}
              className="text-xs text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors block mx-auto pt-2"
            >
              Giriş Ekranına Dön
            </button>
          </div>
        )}

        {/* 4. ŞİFRE YENİLEME */}
        {mode === 'reset' && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Yeni Şifre Belirleyin</h3>
              <p className="text-xs text-zinc-400 font-mono">{resetEmail}</p>
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Yeni Şifre</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="••••••"
                className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 focus:border-zinc-950 dark:focus:border-zinc-100 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-500 mb-1">Yeni Şifre Tekrar</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                placeholder="••••••"
                className="w-full bg-transparent border-b border-zinc-200 dark:border-zinc-800 focus:border-zinc-950 dark:focus:border-zinc-100 py-2 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 text-xs font-medium hover:opacity-85 transition-opacity disabled:opacity-40"
            >
              {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
