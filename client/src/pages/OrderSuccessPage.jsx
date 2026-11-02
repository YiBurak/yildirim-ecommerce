import React, { useState, useEffect } from 'react';
import { Check, FileText, ArrowRight, ArrowUpRight, Copy, CheckCheck } from 'lucide-react';
import { apiFetch, API_BASE_URL } from '../api/client';
import { useLogs } from '../context/LogContext';

export function OrderSuccessPage({ orderId, setActivePage }) {
  const { addLog } = useLogs();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    const fetchOrderDetails = async () => {
      try {
        const res = await apiFetch(`/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
          addLog(`Sipariş detayları yüklendi: #${data.orderNumber}`, 'info');
        }
      } catch (err) {
        addLog(`Sipariş detay hatası: ${err.message}`, 'danger');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleDownloadInvoice = async () => {
    if (!orderId) {
      window.print();
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/invoice`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Fatura oluşturulamadı');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Fatura-${orderNum}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Fatura indirme hatası:', err);
      window.print();
    }
  };

  const copyOrderNumber = (num) => {
    navigator.clipboard.writeText(num);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const orderNum = order?.orderNumber || (orderId ? `ORD-${orderId.slice(0, 8).toUpperCase()}` : 'ONAYLANDI');
  const items = order?.items || [];
  const totalAmount = order?.totalAmount || 0;
  const status = order?.status || 'Paid';
  const createdAt = order?.createdAt ? new Date(order.createdAt) : new Date();

  return (
    <div className="py-16 px-4 max-w-xl mx-auto animate-in fade-in duration-300">
      
      {/* 1. Üst Minimal Başlık (Kutulardan ve Çerçevelerden Arındırılmış) */}
      <div className="pb-8 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-2">
          <Check size={18} strokeWidth={2.5} />
          <span className="text-xs font-mono tracking-wider uppercase font-semibold">Ödeme Alındı</span>
        </div>
        <h1 className="text-3xl font-light tracking-tight text-zinc-950 dark:text-zinc-50">
          Teşekkürler, siparişiniz onaylandı.
        </h1>
        <p className="text-sm text-zinc-500 mt-2">
          Sipariş detayları ve onay bildirimi e-posta adresinize iletildi.
        </p>
      </div>

      {/* 2. Temiz Meta Bilgileri (Kutu yok, saf hizalı satırlar) */}
      <div className="py-6 border-b border-zinc-200 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-6 text-xs">
        <div>
          <span className="block text-zinc-400 mb-1">Sipariş No</span>
          <button
            onClick={() => copyOrderNumber(orderNum)}
            className="font-mono font-medium text-zinc-900 dark:text-zinc-100 hover:opacity-70 transition-opacity inline-flex items-center gap-1.5"
            title="Kopyala"
          >
            <span>#{orderNum.slice(0, 14)}</span>
            {copied ? <CheckCheck size={12} className="text-emerald-600" /> : <Copy size={12} className="text-zinc-400" />}
          </button>
        </div>

        <div>
          <span className="block text-zinc-400 mb-1">Tarih</span>
          <span className="font-mono text-zinc-900 dark:text-zinc-100">
            {createdAt.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        <div>
          <span className="block text-zinc-400 mb-1">Ödeme Yöntemi</span>
          <span className="text-zinc-900 dark:text-zinc-100 font-medium">
            Iyzico 3D Secure
          </span>
        </div>

        <div>
          <span className="block text-zinc-400 mb-1">Durum</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            {status === 'Paid' ? 'Ödendi' : status}
          </span>
        </div>
      </div>

      {/* 3. Ürün Listesi (Kart kutusu yok, saf döküm) */}
      <div className="py-6 border-b border-zinc-200 dark:border-zinc-800">
        <div className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4">
          Satın Alınan Kalemler
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
          {items.length > 0 ? (
            items.map((item, idx) => (
              <div key={idx} className="py-3.5 flex items-baseline justify-between text-sm">
                <div>
                  <div className="font-normal text-zinc-900 dark:text-zinc-100">
                    {item.productName || 'Ürün'}
                  </div>
                  <div className="text-xs text-zinc-400 font-mono mt-0.5">
                    {item.quantity} adet × ₺{item.unitPrice?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="font-mono text-zinc-900 dark:text-zinc-100 tabular-nums">
                  ₺{(item.totalPrice || item.unitPrice * item.quantity)?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))
          ) : (
            <div className="py-2 text-xs text-zinc-400">Ürün kalemleri yüklendi.</div>
          )}
        </div>
      </div>

      {/* 4. Tutar Özeti (Kutulanmamış, saf editoryal satırlar) */}
      <div className="py-6 border-b border-zinc-200 dark:border-zinc-800 space-y-2 text-xs text-zinc-500">
        <div className="flex justify-between">
          <span>Ara Toplam</span>
          <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-100">
            ₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Kargo</span>
          <span className="text-zinc-900 dark:text-zinc-100">Ücretsiz</span>
        </div>
        <div className="flex justify-between items-baseline pt-3 text-sm text-zinc-950 dark:text-zinc-50 font-medium">
          <span>Toplam Tutar</span>
          <span className="font-mono text-xl font-semibold tabular-nums">
            ₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* 5. Aksiyon Butonları (Kutu hissi vermeyen zarif butonlar) */}
      <div className="pt-8 flex items-center justify-between gap-4">
        <button
          onClick={handleDownloadInvoice}
          className="text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50 transition-colors inline-flex items-center gap-1.5 underline underline-offset-4 font-medium"
        >
          <FileText size={14} />
          <span>E-Fatura İndir (PDF)</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('profile')}
            className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors inline-flex items-center gap-1"
          >
            <span>Siparişlerim</span>
            <ArrowUpRight size={13} />
          </button>

          <button
            onClick={() => setActivePage('shop')}
            className="py-2.5 px-5 bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 hover:opacity-85 text-xs font-medium rounded-full inline-flex items-center gap-2 transition-opacity"
          >
            <span>Alışverişe Devam Et</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

    </div>
  );
}
