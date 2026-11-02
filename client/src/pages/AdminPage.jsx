import React, { useState, useEffect } from 'react';
import { 
  Shield, Plus, Save, Trash2, RotateCw, AlertOctagon, 
  Package, ShoppingCart, TrendingUp, CheckCircle, Clock, 
  XCircle, ArrowLeft, Image as ImageIcon, Sparkles 
} from 'lucide-react';
import { apiFetch } from '../api/client';
import { useLogs } from '../context/LogContext';
import { useToast } from '../context/ToastContext';
import Img1 from '../assets/women/women.png';
import Img2 from '../assets/women/women2.jpg';
import Img3 from '../assets/women/women3.jpg';
import Img4 from '../assets/women/women4.jpg';

const sampleImages = [Img1, Img2, Img3, Img4];

const PRESET_IMAGES = [
  { name: '👗 Moda Elbise', url: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500&auto=format&fit=crop&q=60' },
  { name: '👔 Şık Gömlek', url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&auto=format&fit=crop&q=60' },
  { name: '🧥 Deri Ceket', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=60' },
  { name: '👟 Spor Ayakkabı', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60' },
  { name: '🕶️ Güneş Gözlüğü', url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&auto=format&fit=crop&q=60' },
  { name: '🎒 Sırt Çantası', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=60' }
];

export function AdminPage({ refreshTrigger, setActivePage }) {
  const { addLog } = useLogs();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [loading, setLoading] = useState(true);

  // Yeni ürün form state'i (Dinamik kategori ve Fotoğraf URL desteği):
  const [newProd, setNewProd] = useState({
    name: '',
    sku: '',
    price: '',
    stockQuantity: '',
    description: '',
    imageUrl: '',
    categoryId: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, ordRes, catRes] = await Promise.all([
        apiFetch('/products'),
        apiFetch('/orders/all'),
        apiFetch('/categories')
      ]);

      if (prodRes.ok) {
        const prodData = await prodRes.json();
        setProducts(prodData.items || prodData);
      }
      if (ordRes.ok) {
        setOrders(await ordRes.json());
      }
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
        if (catData.length > 0) {
          setNewProd(prev => ({ ...prev, categoryId: prev.categoryId || catData[0].id }));
        }
      }
    } catch (err) {
      addLog(`❌ Admin Veri Hatası: ${err.message}`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshTrigger]);

  const handleUpdate = async (product) => {
    try {
      const res = await apiFetch(`/products/${product.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          id: product.id,
          name: product.name,
          description: product.description || 'Yönetici tarafından güncellendi',
          price: parseFloat(product.price),
          stockQuantity: parseInt(product.stockQuantity, 10),
          sku: product.sku,
          categoryId: product.categoryId || '11111111-1111-1111-1111-111111111111',
          imageUrl: product.imageUrl || null
        })
      });

      if (res.ok) {
        showToast({
          type: 'success',
          message: `✅ '${product.name}' güncellendi ve SignalR ile yayınlandı!`
        });
        addLog(`✅ [STOK GÜNCELLENDİ] '${product.name}' kaydedildi!`, 'success');
        loadData();
      }
    } catch (err) {
      showToast({ type: 'error', message: `❌ Güncelleme Hatası: ${err.message}` });
      addLog(`❌ Güncelleme Hatası: ${err.message}`, 'danger');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`'${name}' ürününü silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await apiFetch(`/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast({ type: 'warning', message: `🗑️ '${name}' vitrinden kaldırıldı.` });
        addLog(`🗑️ '${name}' mağazadan kaldırıldı.`, 'warning');
        loadData();
      }
    } catch (err) {
      showToast({ type: 'error', message: `❌ Silme Hatası: ${err.message}` });
      addLog(`❌ Silme Hatası: ${err.message}`, 'danger');
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    try {
      const res = await apiFetch('/categories', {
        method: 'POST',
        body: JSON.stringify({ name: newCatName.trim(), description: newCatDesc.trim() })
      });

      if (res.ok) {
        const data = await res.json();
        showToast({ type: 'success', message: `📁 '${newCatName}' kategorisi başarıyla eklendi!` });
        addLog(`📁 [YENİ KATEGORİ] '${newCatName}' oluşturuldu.`, 'success');
        setNewCatName('');
        setNewCatDesc('');
        setShowCategoryModal(false);

        const catRes = await apiFetch('/categories');
        if (catRes.ok) {
          const catData = await catRes.json();
          setCategories(catData);
          setNewProd(prev => ({ ...prev, categoryId: data.id || catData[catData.length - 1]?.id }));
        }
      } else {
        const err = await res.json().catch(() => ({}));
        showToast({ type: 'error', message: err.detail || err.message || 'Kategori eklenemedi!' });
        addLog(`❌ Kategori Hatası: ${err.detail || err.message}`, 'danger');
      }
    } catch (err) {
      showToast({ type: 'error', message: `❌ Kategori Hatası: ${err.message}` });
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    const targetCategoryId = newProd.categoryId || categories[0]?.id;
    if (!targetCategoryId) {
      showToast({ type: 'warning', message: '⚠️ Lütfen önce bir kategori oluşturun veya seçin!' });
      return;
    }

    try {
      const res = await apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify({
          name: newProd.name,
          description: newProd.description,
          price: parseFloat(newProd.price),
          stockQuantity: parseInt(newProd.stockQuantity, 10),
          sku: newProd.sku,
          categoryId: targetCategoryId,
          imageUrl: newProd.imageUrl?.trim() || null
        })
      });

      if (res.ok) {
        showToast({
          type: 'success',
          message: `🎉 Yeni ürün vitrine eklendi: ${newProd.name}`
        });
        addLog(`🎉 Yeni ürün vitrine eklendi: ${newProd.name}`, 'success');
        setNewProd({ name: '', sku: '', price: '', stockQuantity: '', description: '', imageUrl: '', categoryId: targetCategoryId });
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        showToast({ type: 'error', message: err.detail || err.message || 'Ürün eklenemedi!' });
        addLog(`❌ Ürün Ekleme Hatası: ${err.detail || err.message}`, 'danger');
      }
    } catch (err) {
      showToast({ type: 'error', message: `❌ Ekleme Hatası: ${err.message}` });
      addLog(`❌ Ekleme Hatası: ${err.message}`, 'danger');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Bu siparişi iptal edip stokları depoya iade (Saga Compensation) etmek istiyor musunuz?')) return;
    try {
      const res = await apiFetch(`/orders/${orderId}/cancel`, { method: 'POST' });
      if (res.ok) {
        showToast({
          type: 'success',
          message: `🚫 Sipariş iptal edildi ve stoklar depoya geri telafi edildi!`
        });
        addLog(`🚫 Sipariş iptal edildi ve stoklar telafi edildi (Saga Compensation)!`, 'success');
        loadData();
      }
    } catch (err) {
      showToast({ type: 'error', message: `❌ İptal Hatası: ${err.message}` });
      addLog(`❌ İptal Hatası: ${err.message}`, 'danger');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <CheckCircle size={12} /> Ödendi
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <Clock size={12} /> Beklemede
          </span>
        );
      case 'PaymentFailed':
        return (
          <span className="inline-flex items-center gap-1 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold">
            <XCircle size={12} /> İptal Edildi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-gray-500/10 text-gray-600 dark:text-gray-400 px-2.5 py-0.5 rounded-full text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl animate-in fade-in duration-300">
      
      {/* Üst Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
              <Shield size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                Yönetici Paneli
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Canlı Stok Yönetimi, Görsel Tanımlama ve Müşteri Sipariş Operasyonları
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {setActivePage && (
            <button
              onClick={() => setActivePage('shop')}
              className="flex items-center gap-1.5 text-xs font-bold py-2.5 px-4 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
            >
              <ArrowLeft size={14} /> Mağaza
            </button>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 text-xs font-bold py-2.5 px-4 rounded-xl bg-gradient-to-r from-primary to-secondary text-white shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <RotateCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Verileri Yenile</span>
          </button>
        </div>
      </div>

      {/* İstatistik Rozetleri */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
        <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Package size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kayıtlı Ürünler</div>
            <div className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
              {products.length}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <ShoppingCart size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Toplam Sipariş</div>
            <div className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
              {orders.length}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ödenen Başarılı</div>
            <div className="text-2xl font-black text-emerald-500 mt-0.5">
              {orders.filter(o => o.status === 'Paid').length}
            </div>
          </div>
        </div>
      </div>

      {/* 1. Yeni Ürün Ekleme Kartı (Fotoğraf Yükleme / URL Destekli!) */}
      <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 rounded-3xl p-6 sm:p-7 shadow-sm mb-10">
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-gray-100 dark:border-gray-700/60">
          <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
            <Plus size={18} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Yeni Ürün & Fotoğraf Tanımla
            </h3>
            <p className="text-xs text-gray-400">
              Görsel URL'si ekleyebilir veya hazır şablon fotoğraflardan tek tıkla seçebilirsiniz.
            </p>
          </div>
        </div>

        <form onSubmit={handleCreateProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Ürün Adı</label>
              <input
                type="text"
                placeholder="Örn: Klasik Deri Ceket"
                value={newProd.name}
                onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                required
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">SKU Kodu</label>
              <input
                type="text"
                placeholder="Örn: JKT-001"
                value={newProd.sku}
                onChange={(e) => setNewProd({ ...newProd, sku: e.target.value })}
                required
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Kategori</label>
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(true)}
                  className="text-[11px] font-bold text-primary hover:underline inline-flex items-center gap-0.5"
                >
                  <Plus size={11} /> Yeni
                </button>
              </div>
              <select
                value={newProd.categoryId}
                onChange={(e) => setNewProd({ ...newProd, categoryId: e.target.value })}
                required
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                {categories.length === 0 && <option value="">Kategori Yok (+ Yeni)</option>}
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Fiyat (₺)</label>
              <input
                type="number"
                step="0.01"
                placeholder="999.90"
                value={newProd.price}
                onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                required
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Başlangıç Stoğu</label>
              <input
                type="number"
                placeholder="50"
                value={newProd.stockQuantity}
                onChange={(e) => setNewProd({ ...newProd, stockQuantity: e.target.value })}
                required
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Ürün Açıklaması</label>
              <input
                type="text"
                placeholder="Detaylı ürün açıklaması ve özellikleri..."
                value={newProd.description}
                onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* 📷 FOTOĞRAF EKLEME ALANI (Özel URL + Hazır Şablonlar + Önizleme) */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700/70 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <ImageIcon size={15} className="text-primary" /> Ürün Fotoğrafı (Görsel URL'si)
              </label>
              <span className="text-[11px] text-gray-400">İsteğe bağlı (boş bırakılırsa varsayılan atanır)</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input
                type="url"
                placeholder="https://images.unsplash.com/... veya herhangi bir web görsel linki"
                value={newProd.imageUrl}
                onChange={(e) => setNewProd({ ...newProd, imageUrl: e.target.value })}
                className="flex-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary"
              />

              {/* Görsel Önizleme Kutusu */}
              <div className="w-14 h-14 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                {newProd.imageUrl ? (
                  <img
                    src={newProd.imageUrl}
                    alt="Önizleme"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <ImageIcon size={20} className="text-gray-400" />
                )}
              </div>
            </div>

            {/* Hazır Görsel Seçme Hapları */}
            <div>
              <div className="text-[11px] font-semibold text-gray-400 mb-1.5 flex items-center gap-1">
                <Sparkles size={12} className="text-primary" /> Hızlı Fotoğraf Seç:
              </div>
              <div className="flex flex-wrap gap-2">
                {PRESET_IMAGES.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setNewProd({ ...newProd, imageUrl: preset.url })}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 hover:bg-primary/20 hover:text-primary border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-all"
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-gradient-to-r from-primary to-secondary hover:scale-[1.02] active:scale-[0.98] transition-all text-white font-bold py-3 px-8 rounded-xl shadow-md shadow-primary/30 flex items-center justify-center gap-2 text-xs"
            >
              <Plus size={16} /> Vitrine Ekle & Yayınla
            </button>
          </div>
        </form>
      </div>

      {/* 2. Mevcut Ürünler ve Canlı Stok Yönetim Tablosu */}
      <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 rounded-3xl p-6 sm:p-7 shadow-sm mb-10">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100 dark:border-gray-700/60">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Package size={20} className="text-primary" /> Ürün Kataloğu & Canlı Stok
            </h3>
            <p className="text-xs text-gray-400">
              Fiyat veya stok değiştirip "Kaydet"e bastığınızda tüm vitrinler anında güncellenir.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-gray-100 dark:bg-gray-900 rounded-full text-gray-600 dark:text-gray-300">
            {products.length} Ürün
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3 w-16">Fotoğraf</th>
                <th className="py-3 px-3">Ürün</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3 w-32">Fiyat (₺)</th>
                <th className="py-3 px-3 w-28">Stok Adedi</th>
                <th className="py-3 px-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {products.map((prod, idx) => {
                const img = prod.imageUrl || sampleImages[idx % sampleImages.length];

                return (
                  <tr key={prod.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 overflow-hidden flex items-center justify-center">
                        <img src={img} alt={prod.name} className="w-full h-full object-cover" />
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-gray-900 dark:text-white text-sm">
                        {prod.name}
                      </div>
                      <div className="text-[11px] text-gray-400 max-w-xs truncate">
                        {prod.description}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-gray-500 dark:text-gray-400 font-mono">
                      {prod.sku}
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={prod.price}
                        onChange={(e) => { prod.price = e.target.value; }}
                        className="w-28 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1 text-xs text-gray-900 dark:text-white font-bold focus:border-primary outline-none"
                      />
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        defaultValue={prod.stockQuantity}
                        onChange={(e) => { prod.stockQuantity = e.target.value; }}
                        className="w-24 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1 text-xs text-gray-900 dark:text-white font-bold focus:border-primary outline-none"
                      />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleUpdate(prod)}
                          className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-colors"
                          title="Stok & Fiyat Güncelle (Kaydet)"
                        >
                          <Save size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(prod.id, prod.name)}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors"
                          title="Ürünü Sil"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Sistemdeki Tüm Siparişler (Sipariş Yönetimi & Telafi Butonu) */}
      <div className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="flex items-center justify-between mb-5 pb-3 border-b border-gray-100 dark:border-gray-700/60">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <ShoppingCart size={20} className="text-primary" /> Sistemdeki Tüm Müşteri Siparişleri
            </h3>
            <p className="text-xs text-gray-400">
              İptal edilen siparişlerin stokları otomatik olarak mağaza envanterine iade edilir.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-gray-100 dark:bg-gray-900 rounded-full text-gray-600 dark:text-gray-300">
            {orders.length} Sipariş
          </span>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs">
            Henüz oluşturulmuş müşteri siparişi yok.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-3">Sipariş No</th>
                  <th className="py-3 px-3">Tarih</th>
                  <th className="py-3 px-3">Ürünler</th>
                  <th className="py-3 px-3">Toplam Tutar</th>
                  <th className="py-3 px-3">Durum</th>
                  <th className="py-3 px-3 text-right">Telafi / Aksiyon</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="py-3 px-3 font-bold font-mono text-gray-900 dark:text-white">
                      #{o.orderNumber || o.id?.slice(0, 8)}
                    </td>
                    <td className="py-3 px-3 text-gray-400">
                      {new Date(o.createdAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                      {o.items?.map(i => `${i.productName} (x${i.quantity})`).join(', ') || '-'}
                    </td>
                    <td className="py-3 px-3 font-black text-primary text-sm">
                      ₺{o.totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-3">
                      {getStatusBadge(o.status)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {o.status !== 'PaymentFailed' && o.status !== 'Cancelled' ? (
                        <button
                          onClick={() => handleCancelOrder(o.id)}
                          className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold transition-colors"
                          title="Siparişi İptal Et & Stoğa İade Et"
                        >
                          <AlertOctagon size={13} />
                          <span>Siparişi İptal Et</span>
                        </button>
                      ) : (
                        <span className="text-gray-400 text-[11px] italic">İşlem Tamamlandı</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 📁 YENİ KATEGORİ EKLEME MODALI */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-850 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700/60">
              <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                📁 Yeni Kategori Tanımla
              </h4>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Kategori Adı *
                </label>
                <input
                  type="text"
                  placeholder="Örn: Elektronik, Moda, Kozmetik..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Açıklama (Opsiyonel)
                </label>
                <input
                  type="text"
                  placeholder="Kategori hakkında kısa bilgi..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-xl shadow-md shadow-primary/20 transition-all flex items-center gap-1.5"
                >
                  <Plus size={14} /> Kategoriyi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
