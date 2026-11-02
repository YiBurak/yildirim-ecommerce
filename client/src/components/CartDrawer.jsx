import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, ShieldCheck, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { PaymentModal } from './PaymentModal';

export function CartDrawer({ onOrderSuccess }) {
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    updateQuantity,
    removeFromCart,
    totalAmount,
    checkout,
    isCheckingOut
  } = useCart();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handleStartPayment = () => {
    setIsPaymentModalOpen(true);
  };

  const handleConfirmPayment = async (cardData) => {
    try {
      const res = await checkout(cardData);
      if (res?.success) {
        setIsPaymentModalOpen(false);
        setIsCartOpen(false);
        if (onOrderSuccess) {
          onOrderSuccess(res.orderId);
        }
      }
    } catch (err) {
      // Hata bildirimi CartContext tarafından gösteriliyor
    }
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/40 backdrop-blur-xs transition-opacity duration-300">
      {/* Arka plan tıklama alanı */}
      <div className="flex-1" onClick={() => setIsCartOpen(false)} />

      {/* Çekmece Paneli (Kutusuz, editoryal) */}
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 border-l border-zinc-100 dark:border-zinc-800 flex flex-col h-full animate-in slide-in-from-right duration-300">
        
        {/* Çekmece Başlığı */}
        <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingBag size={18} strokeWidth={1.5} className="text-zinc-900 dark:text-zinc-100" />
            <div>
              <h2 className="text-sm font-medium tracking-tight">Alışveriş Sepeti</h2>
              <p className="text-[11px] font-mono text-zinc-400">
                {cart.length > 0 ? `${cart.length} çeşit ürün` : 'Sepetiniz boş'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sepetteki Ürünler Listesi (Kare kutular / kartlar YOK; saf hairline ayırıcılar) */}
        <div className="flex-1 overflow-y-auto px-6 divide-y divide-zinc-100 dark:divide-zinc-800">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16 space-y-4">
              <ShoppingBag size={32} strokeWidth={1} className="text-zinc-300 dark:text-zinc-700" />
              <div className="space-y-1">
                <h3 className="text-sm font-light text-zinc-800 dark:text-zinc-200">Sepetiniz Boş</h3>
                <p className="text-xs text-zinc-400 max-w-xs font-light">
                  Koleksiyonumuzdaki seçkin ürünleri keşfederek sepetinize ekleyebilirsiniz.
                </p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-xs font-medium text-zinc-950 dark:text-zinc-50 underline underline-offset-4 pt-2"
              >
                Koleksiyona Göz At
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                className="py-5 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <h4 className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {item.name}
                  </h4>
                  <div className="text-[11px] font-mono text-zinc-400">
                    Birim: ₺{item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="font-mono text-xs font-medium text-zinc-950 dark:text-zinc-50 tabular-nums">
                    ₺{(item.price * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Adet Kontrolü (Hafif ve ince) */}
                  <div className="inline-flex items-center border border-zinc-200 dark:border-zinc-800 rounded-full px-1.5 py-0.5">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      title="Azalt"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-[11px] font-mono font-medium w-6 text-center text-zinc-800 dark:text-zinc-200 tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                      title="Artır"
                    >
                      <Plus size={11} />
                    </button>
                  </div>

                  {/* Sil Butonu */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-1 text-zinc-400 hover:text-rose-500 transition-colors"
                    title="Sepetten Çıkar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Alt Toplam ve Sipariş Tamamlama */}
        {cart.length > 0 && (
          <div className="p-6 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Ara Toplam</span>
                <span className="font-mono tabular-nums">
                  ₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm font-medium border-t border-zinc-100 dark:border-zinc-800 pt-2">
                <span className="text-zinc-900 dark:text-zinc-100">Genel Toplam</span>
                <span className="font-mono text-base text-zinc-950 dark:text-zinc-50 tabular-nums">
                  ₺{totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-zinc-400 pt-1">
              <ShieldCheck size={13} className="text-zinc-400" />
              <span>Iyzico 256-Bit SSL Koruması</span>
            </div>

            <button
              onClick={handleStartPayment}
              disabled={isCheckingOut}
              className="w-full py-3 px-6 rounded-full bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 text-xs font-medium hover:opacity-85 transition-opacity flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Ödemeye Geç</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* 💳 Kredi Kartı Ödeme Modalı */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        totalAmount={totalAmount}
        onConfirmPayment={handleConfirmPayment}
        isProcessing={isCheckingOut}
      />
    </div>
  );
}
