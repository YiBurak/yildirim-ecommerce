import React, { useState } from 'react';
import { 
  ArrowLeft, Star, ShieldCheck, 
  Truck, RotateCcw, Plus, Minus, User
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import Img1 from '../assets/women/women.png';
import Img2 from '../assets/women/women2.jpg';
import Img3 from '../assets/women/women3.jpg';
import Img4 from '../assets/women/women4.jpg';

const sampleImages = [Img1, Img2, Img3, Img4];

const mockReviews = [
  {
    id: 1,
    author: "Caner T.",
    rating: 5,
    date: "3 gün önce",
    comment: "Kumaş kalitesi ve dikiş detayları gerçekten üst düzey. Beden tam oturdu, kargo da ertesi gün ulaştı.",
  },
  {
    id: 2,
    author: "Selin B.",
    rating: 5,
    date: "Geçen hafta",
    comment: "Görseldekinden çok daha şık duruyor. Paketleme ve sunum çok özenliydi, kesinlikle tavsiye ederim.",
  },
  {
    id: 3,
    author: "Mert A.",
    rating: 4,
    date: "2 hafta önce",
    comment: "Kalıbı gayet rahat, dikiş kalitesi başarılı. Minimalist ve temiz bir parça.",
  },
];

export function ProductDetailPage({ product, setActivePage }) {
  const { addToCart, setIsCartOpen } = useCart();
  const [selectedQty, setSelectedQty] = useState(1);

  if (!product) {
    return (
      <div className="py-24 text-center">
        <h2 className="text-sm font-medium mb-4 text-zinc-500">Ürün bulunamadı</h2>
        <button
          onClick={() => setActivePage('shop')}
          className="text-xs text-zinc-950 dark:text-zinc-50 underline underline-offset-4"
        >
          Mağazaya Dön
        </button>
      </div>
    );
  }

  const productImage = product.imageUrl || sampleImages[(product.name?.length || 0) % sampleImages.length];
  const isOutOfStock = product.stockQuantity === 0;
  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 3;

  const handleAddToCart = (e) => {
    addToCart(product, e, selectedQty);
  };

  const handleBuyNow = (e) => {
    const success = addToCart(product, e, selectedQty);
    if (success) {
      setTimeout(() => {
        setIsCartOpen(true);
      }, 300);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-in fade-in duration-300">
      
      {/* 1. Üst Minimal Navigasyon (Kutusuz) */}
      <div className="pb-8 flex items-center justify-between text-xs text-zinc-500">
        <button
          onClick={() => setActivePage('shop')}
          className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Koleksiyona Dön</span>
        </button>

        <span className="font-mono text-zinc-400">
          SKU: {product.sku || 'PRD-AUTO'}
        </span>
      </div>

      {/* 2. Ana Ürün Düzeni (Kutu/Çerçeve Yok, Doğal ve Geniş) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start pb-16">
        
        {/* Sol Kolon: Doğal Görsel (Kare Çerçeve Yok) */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full flex items-center justify-center py-6">
            <img
              src={productImage}
              alt={product.name}
              className="max-h-[460px] w-auto object-contain select-none"
            />
          </div>

          {/* Minimal Garanti Notları (Kutulanmamış, Saf İkon + Metin) */}
          <div className="w-full pt-8 mt-6 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-around text-xs text-zinc-500">
            <div className="flex items-center gap-2">
              <Truck size={15} strokeWidth={1.5} className="text-zinc-400" />
              <span>Ücretsiz Kargo</span>
            </div>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <div className="flex items-center gap-2">
              <RotateCcw size={15} strokeWidth={1.5} className="text-zinc-400" />
              <span>14 Gün İade</span>
            </div>
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} strokeWidth={1.5} className="text-zinc-400" />
              <span>Orijinal Ürün</span>
            </div>
          </div>
        </div>

        {/* Sağ Kolon: Başlık, Fiyat, Açıklama ve Satın Alma (Kutusuz) */}
        <div className="lg:col-span-6 space-y-8">
          
          <div className="space-y-3 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-500">Koleksiyon</span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <span className={`font-medium ${
                isOutOfStock ? 'text-rose-500' : isLowStock ? 'text-amber-500' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {isOutOfStock ? 'Stok Tükendi' : isLowStock ? `Son ${product.stockQuantity} Adet` : 'Stokta Mevcut'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-light text-zinc-950 dark:text-zinc-50 tracking-tight leading-snug">
              {product.name}
            </h1>

            {/* Fiyat (Kutu içinde değil, saf editoryal rakam) */}
            <div className="pt-2 flex items-baseline gap-3">
              <span className="text-3xl font-mono font-medium text-zinc-950 dark:text-zinc-50 tabular-nums">
                ₺{product.price?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-zinc-400 font-mono">KDV Dahil</span>
            </div>
          </div>

          {/* Açıklama (Kutu Çerçeve Yok) */}
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-zinc-400">Detaylar</div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
              {product.description || 'Yüksek kaliteli malzeme ve titiz işçilikle üretilmiş özel kurumsal ürün. Günlük kullanım ve özel günler için ideal konfor ve estetik sunar.'}
            </p>
          </div>

          {/* Adet Seçici ve Satın Alma Aksiyonları (Hafif ve Kutusuz) */}
          <div className="pt-4 space-y-4">
            
            <div className="flex items-center gap-4">
              <span className="text-xs text-zinc-500">Adet:</span>
              <div className="inline-flex items-center border border-zinc-200 dark:border-zinc-800 rounded-full px-2 py-1">
                <button
                  type="button"
                  onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                  disabled={selectedQty <= 1 || isOutOfStock}
                  className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30"
                >
                  <Minus size={13} />
                </button>
                <span className="w-8 text-center text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100 tabular-nums">
                  {selectedQty}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedQty(Math.min(product.stockQuantity || 99, selectedQty + 1))}
                  disabled={selectedQty >= (product.stockQuantity || 99) || isOutOfStock}
                  className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="flex-1 py-3 px-6 rounded-full border border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-100 dark:hover:text-zinc-950 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isOutOfStock ? 'Tükendi' : 'Sepete Ekle'}
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="flex-1 py-3 px-6 rounded-full bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 hover:opacity-85 text-xs font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                Hemen Satın Al
              </button>
            </div>

            <p className="text-[11px] text-zinc-400 text-center font-mono pt-2">
              Iyzico güvencesiyle 256-bit şifreli ödeme altyapısı.
            </p>
          </div>

        </div>
      </div>

      {/* 3. Ürün İnceleme & Kullanıcı Yorumları (Kareler ve Kart Kutuları YOK, Saf Editoryal Akış) */}
      <div className="pt-16 border-t border-zinc-100 dark:border-zinc-800 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 block mb-1">
              Değerlendirmeler
            </span>
            <h2 className="text-2xl font-light text-zinc-950 dark:text-zinc-50 tracking-tight">
              Ürün İncelemeleri
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
            <div className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={13} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">4.8 / 5.0</span>
            <span>•</span>
            <span>(3 değerlendirme)</span>
          </div>
        </div>

        {/* İnceleme Listesi (Kutusuz, sadece ince hairline ayırıcılar) */}
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {mockReviews.map((review) => (
            <div key={review.id} className="py-6 first:pt-0 last:pb-0 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {review.author}
                  </span>
                  <div className="flex text-amber-500">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                </div>
                <span className="font-mono text-[11px] text-zinc-400">
                  {review.date}
                </span>
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-light">
                {review.comment}
              </p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
