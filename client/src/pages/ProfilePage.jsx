import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  RotateCw, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  CheckCheck,
  AlertOctagon,
  FileText
} from 'lucide-react';
import { apiFetch, API_BASE_URL } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useLogs } from '../context/LogContext';
import { useToast } from '../context/ToastContext';

export function ProfilePage({ setActivePage }) {
  const { user } = useAuth();
  const { addLog } = useLogs();
  const { showToast } = useToast();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profRes, ordRes] = await Promise.all([
        apiFetch('/auth/me'),
        apiFetch('/orders/my-orders')
      ]);

      if (profRes.ok) setProfile(await profRes.json());
      if (ordRes.ok) setOrders(await ordRes.json());
    } catch (err) {
      addLog(`Profil verileri yüklenemedi: ${err.message}`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleExpand = (id) => {
    setExpandedOrderId(prev => prev === id ? null : id);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadInvoice = async (orderId, orderNum) => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Fatura oluşturulamadı');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fatura-${orderNum || 'Siparis'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      showToast({ type: 'success', message: 'Faturanız başarıyla indirildi.' });
    } catch (err) {
      showToast({ type: 'error', message: 'Fatura indirilemedi: ' + err.message });
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bu siparişi iptal etmek ve ödemeyi karta iade etmek istiyor musunuz?')) return;
    try {
      const res = await apiFetch(`/orders/${orderId}/cancel`, { method: 'POST' });
      if (res.ok) {
        showToast({
          type: 'success',
          message: 'Siparişiniz iptal edildi, stoklar telafi edildi ve kartınıza iade çağrısı yapıldı.'
        });
        addLog(`Sipariş iptali ve Iyzico iade işlemi başarılı: #${orderId.slice(0, 8)}`, 'success');
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast({ type: 'error', message: err.detail || 'İptal işlemi başarısız.' });
      }
    } catch (err) {
      showToast({ type: 'error', message: err.message || 'İptal hatası.' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const fullName = profile?.fullName || user?.fullName || 'Kullanıcı';
  const email = profile?.email || user?.email || '';
  const role = profile?.role || user?.role || 'Müşteri';
  const totalSpent = orders.reduce((sum, o) => o.status === 'Paid' ? sum + o.totalAmount : sum, 0);

  return (
    <div className="py-16 px-4 max-w-3xl mx-auto animate-in fade-in duration-300">
      
      {/* 1. Üst Navigasyon (Kutusuz, minimalist) */}
      <div className="flex items-center justify-between pb-8">
        {setActivePage && (
          <button
            onClick={() => setActivePage('shop')}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} />
            <span>Mağazaya Dön</span>
          </button>
        )}

        <button
          onClick={loadData}
          className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors inline-flex items-center gap-1 ml-auto"
        >
          <RotateCw size={12} />
          <span>Yenile</span>
        </button>
      </div>

      {/* 2. Müşteri Bilgisi (Kutu/Çerçeve Yok, Saf Tipografi) */}
      <div className="pb-10 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest block mb-2">
            Müşteri Hesabı • {role}
          </span>
          <h1 className="text-3xl font-light tracking-tight text-zinc-950 dark:text-zinc-50">
            {fullName}
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            {email}
          </p>
        </div>

        <div className="flex items-baseline gap-8 text-xs text-zinc-500">
          <div>
            <span className="block text-zinc-400 mb-0.5">Sipariş Sayısı</span>
            <span className="font-mono text-lg font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">
              {orders.length}
            </span>
          </div>
          <div>
            <span className="block text-zinc-400 mb-0.5">Toplam Alışveriş</span>
            <span className="font-mono text-lg font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">
              ₺{totalSpent.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Sipariş Başlığı */}
      <div className="pt-8 pb-4 flex items-baseline justify-between">
        <h2 className="text-base font-normal text-zinc-950 dark:text-zinc-50 tracking-tight">
          Sipariş Geçmişi
        </h2>
        <span className="text-xs text-zinc-400 font-mono">
          {orders.length} sipariş
        </span>
      </div>

      {/* 4. Kutusuz, Saf Liste Siparişler */}
      {orders.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-zinc-500 mb-4">Henüz kayıtlı bir siparişiniz bulunmuyor.</p>
          {setActivePage && (
            <button
              onClick={() => setActivePage('shop')}
              className="text-xs text-zinc-950 dark:text-zinc-50 underline underline-offset-4 font-medium"
            >
              Koleksiyonu Keşfet ➔
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {orders.map((o) => {
            const isExpanded = expandedOrderId === o.id;
            const itemsCount = o.items ? o.items.reduce((s, i) => s + i.quantity, 0) : 0;
            const orderCode = o.orderNumber || o.id?.slice(0, 8);
            const dateStr = new Date(o.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
            const isPaid = o.status === 'Paid';
            const isCancelled = o.status === 'Cancelled' || o.status === 'PaymentFailed';

            return (
              <div key={o.id} className="py-5">
                {/* Ana Satır */}
                <div
                  onClick={() => toggleExpand(o.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none group"
                >
                  <div className="flex items-center gap-4 text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        copyToClipboard(orderCode, o.id);
                      }}
                      className="font-mono font-medium text-zinc-900 dark:text-zinc-100 hover:opacity-70 transition-opacity inline-flex items-center gap-1.5"
                      title="Kopyala"
                    >
                      <span>#{orderCode}</span>
                      {copiedId === o.id ? <CheckCheck size={11} className="text-emerald-600" /> : <Copy size={11} className="text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </button>
                    <span className="text-zinc-400 font-mono">{dateStr}</span>
                    <span className="text-zinc-400">{itemsCount} adet</span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6">
                    <span className={`text-xs ${
                      isPaid ? 'text-emerald-600 dark:text-emerald-400 font-medium' : isCancelled ? 'text-zinc-400 italic' : 'text-amber-500'
                    }`}>
                      {isPaid ? 'Ödendi' : isCancelled ? 'İptal / İade Edildi' : o.status}
                    </span>
                    <div className="font-mono text-sm text-zinc-900 dark:text-zinc-100 tabular-nums font-medium">
                      ₺{o.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                      {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </div>
                  </div>
                </div>

                {/* Genişletilmiş Döküm */}
                {isExpanded && (
                  <div className="mt-4 pt-3 pl-2 sm:pl-4 border-l border-zinc-200 dark:border-zinc-800 space-y-3 animate-in fade-in duration-150">
                    {o.items && o.items.length > 0 ? (
                      o.items.map((item, idx) => (
                        <div key={idx} className="flex items-baseline justify-between text-xs">
                          <span className="text-zinc-700 dark:text-zinc-300">
                            {item.productName || 'Ürün'} <span className="text-zinc-400 font-mono">× {item.quantity}</span>
                          </span>
                          <span className="font-mono text-zinc-500 tabular-nums">
                            ₺{(item.totalPrice || item.unitPrice * item.quantity)?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-zinc-400">Ürün detayı mevcut değil.</div>
                    )}

                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-zinc-400 font-mono border-t border-zinc-100 dark:border-zinc-850">
                      <div>
                        {o.paymentId ? `Iyzico Ref: ${o.paymentId}` : 'Iyzico Güvenli Ödeme'} • Ücretsiz Kargo
                      </div>

                      <div className="flex items-center gap-4 self-start sm:self-auto">
                        {/* Fatura İndir Butonu */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadInvoice(o.id, orderCode);
                          }}
                          className="text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50 hover:underline inline-flex items-center gap-1 font-sans"
                        >
                          <FileText size={12} />
                          <span>E-Fatura (PDF)</span>
                        </button>

                        {/* İptal / İade Butonu */}
                        {!isCancelled && o.status !== 'Shipped' && o.status !== 'Delivered' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelOrder(o.id);
                            }}
                            className="text-xs text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 font-sans"
                          >
                            <AlertOctagon size={12} />
                            <span>Siparişi İptal Et & İade İste</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
