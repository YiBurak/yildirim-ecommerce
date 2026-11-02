import React, { useState, useEffect } from 'react';
import { Search, RotateCw, ShoppingBag, AlertTriangle, Sparkles } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useCart } from '../context/CartContext';
import { useLogs } from '../context/LogContext';

export function ShopPage({ refreshTrigger }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { addToCart } = useCart();
  const { addLog } = useLogs();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/products');
      if (res.ok) {
        const data = await res.json();
        const items = data.items || data;
        setProducts(items);
        addLog(`📦 ${items.length} adet ürün getirildi (Cache-Aside devrede).`, 'success');
      }
    } catch (err) {
      addLog(`❌ Ürün Hatası: ${err.message}`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [refreshTrigger]); // SignalR'dan stok güncellendiğinde burası otomatik tetiklenir!

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        padding: '3rem 2rem',
        marginBottom: '2.5rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'rgba(59, 130, 246, 0.15)',
          color: 'var(--accent-blue)',
          padding: '0.35rem 0.9rem',
          borderRadius: '999px',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: '1rem'
        }}>
          <Sparkles size={16} /> .NET 10 & Clean Architecture & SignalR
        </div>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.8rem' }}>
          Kurumsal E-Ticaret Platformu
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto', fontSize: '1rem' }}>
          Gerçek zamanlı stok takibi, Idempotency-Key sipariş zırhı ve RedLock dağıtık kilit koruması.
        </p>
      </div>

      {/* Arama ve Yenileme Barı */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-dim)' }} />
          <input
            type="text"
            placeholder="Ürün ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '0.75rem 1rem 0.75rem 2.6rem',
              borderRadius: '12px',
              fontSize: '0.95rem',
              outline: 'none'
            }}
          />
        </div>

        <button
          onClick={fetchProducts}
          title="Yenile"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            padding: '0.75rem 1.2rem',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
            fontSize: '0.9rem'
          }}
        >
          <RotateCw size={16} className={loading ? 'spin' : ''} />
          Yenile
        </button>
      </div>

      {/* Ürün Kartları Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Ürünler taranıyor...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Hiç ürün bulunamadı.
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {filtered.map((p) => {
            const isLowStock = p.stockQuantity <= 3 && p.stockQuantity > 0;
            const isOutOfStock = p.stockQuantity === 0;

            return (
              <div
                key={p.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{p.name}</h3>
                    <span style={{
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      background: 'rgba(148, 163, 184, 0.1)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      color: 'var(--text-dim)'
                    }}>
                      {p.sku}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.2rem', minHeight: '38px' }}>
                    {p.description || 'Açıklama belirtilmemiş.'}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      ₺{p.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </div>

                    <div style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      color: isOutOfStock ? 'var(--danger)' : isLowStock ? 'var(--warning)' : 'var(--success)'
                    }}>
                      {isLowStock && <AlertTriangle size={14} />}
                      {isOutOfStock ? 'Tükendi' : `Stok: ${p.stockQuantity}`}
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(p)}
                    disabled={isOutOfStock}
                    style={{
                      width: '100%',
                      background: isOutOfStock ? 'rgba(51, 65, 85, 0.5)' : 'var(--accent-gradient)',
                      color: isOutOfStock ? 'var(--text-dim)' : '#fff',
                      border: 'none',
                      padding: '0.75rem',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      transition: 'transform 0.1s'
                    }}
                  >
                    <ShoppingBag size={16} />
                    {isOutOfStock ? 'Tükendi' : 'Sepete Ekle'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
