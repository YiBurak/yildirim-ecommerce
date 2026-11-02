import React from 'react';
import { ShoppingBag, Terminal, Shield, User, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function Navbar({ activePage, setActivePage, isConsoleOpen, setIsConsoleOpen, openLoginModal }) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalCount, setIsCartOpen } = useCart();

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      backdropFilter: 'var(--glass-blur)',
      background: 'rgba(9, 13, 22, 0.8)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0.9rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      {/* Sol: Logo */}
      <div 
        onClick={() => setActivePage('shop')}
        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
      >
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)'
        }}>
          ⚡
        </div>
        <span style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
          Enterprise<span style={{ color: 'var(--accent-blue)' }}>Commerce</span>
        </span>
      </div>

      {/* Orta: Sayfa Butonları */}
      <nav style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <button
          onClick={() => setActivePage('shop')}
          style={{
            background: activePage === 'shop' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            color: activePage === 'shop' ? 'var(--accent-blue)' : 'var(--text-muted)',
            border: activePage === 'shop' ? '1px solid var(--accent-blue)' : '1px solid transparent',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            transition: 'all 0.2s'
          }}
        >
          📦 Mağaza Vitrini
        </button>

        {isAuthenticated && (
          <button
            onClick={() => setActivePage('profile')}
            style={{
              background: activePage === 'profile' ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
              color: activePage === 'profile' ? 'var(--accent-blue)' : 'var(--text-muted)',
              border: activePage === 'profile' ? '1px solid var(--accent-blue)' : '1px solid transparent',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s'
            }}
          >
            <User size={16} /> Hesabım & Siparişler
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setActivePage('admin')}
            style={{
              background: activePage === 'admin' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.08)',
              color: 'var(--warning)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.2s'
            }}
          >
            <Shield size={16} /> Yönetici Paneli
          </button>
        )}
      </nav>

      {/* Sağ: Sepet, Konsol Butonu & Oturum */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {/* Canlı Konsol Aç/Kapa */}
        <button
          onClick={() => setIsConsoleOpen(!isConsoleOpen)}
          title="Canlı Mimarî Konsolunu Aç/Kapat"
          style={{
            background: isConsoleOpen ? 'rgba(16, 185, 129, 0.2)' : 'rgba(30, 41, 59, 0.7)',
            color: isConsoleOpen ? 'var(--success)' : 'var(--text-muted)',
            border: '1px solid var(--border-color)',
            padding: '0.5rem 0.85rem',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem',
            fontWeight: 500
          }}
        >
          <Terminal size={16} />
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--success)',
              boxShadow: '0 0 8px var(--success)'
            }}></span>
            Konsol
          </span>
        </button>

        {/* Sepet Butonu */}
        <button
          onClick={() => setIsCartOpen(true)}
          style={{
            background: 'var(--accent-gradient)',
            color: '#fff',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
          }}
        >
          <ShoppingBag size={18} />
          <span>Sepet</span>
          {totalCount > 0 && (
            <span style={{
              background: '#fff',
              color: 'var(--bg-primary)',
              borderRadius: '999px',
              padding: '0.1rem 0.5rem',
              fontSize: '0.75rem',
              fontWeight: 800
            }}>
              {totalCount}
            </span>
          )}
        </button>

        {/* Oturum Durumu */}
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              {user.fullName}
            </span>
            <button
              onClick={logout}
              title="Güvenli Çıkış"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--danger)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                padding: '0.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={openLoginModal}
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              color: 'var(--accent-blue)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '0.5rem 0.9rem',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 600,
              fontSize: '0.85rem'
            }}
          >
            <LogIn size={16} /> Giriş Yap
          </button>
        )}
      </div>
    </header>
  );
}
