import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, API_BASE_URL } from '../api/client';
import { useLogs } from './LogContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { addLog } = useLogs();
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'Admin';

  const login = async (email, password) => {
    addLog(`🔑 Giriş yapılıyor: ${email}...`, 'info');
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || 'Giriş başarısız!');
    }

    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    
    const userData = {
      fullName: data.fullName,
      email: data.email,
      role: data.role
    };

    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    addLog(`✅ Hoş geldin, ${data.fullName}! (Rol: ${data.role})`, 'success');
    return userData;
  };

  const register = async (firstName, lastName, email, password) => {
    addLog(`📝 Yeni kayıt oluşturuluyor: ${email}...`, 'info');
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, password })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || err.message || 'Kayıt işlemi başarısız!');
    }

    addLog(`📧 Doğrulama mektubu gönderildi: ${email}`, 'success');
    return { success: true, email };
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await fetch(`${API_BASE_URL}/auth/revoke`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        addLog('🚪 Oturum sunucudan da iptal edildi (Revoked).', 'info');
      } catch (err) {
        console.error(err);
      }
    }

    localStorage.clear();
    setUser(null);
    addLog('👋 Çıkış yapıldı.', 'warning');
  };

  useEffect(() => {
    // Token öldüğünde apiFetch'ten tetiklenen olayı dinle:
    const handleExpired = () => {
      setUser(null);
    };
    window.addEventListener('auth-expired', handleExpired);
    return () => window.removeEventListener('auth-expired', handleExpired);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isAdmin, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
