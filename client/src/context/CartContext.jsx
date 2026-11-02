import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api/client';
import { useAuth } from './AuthContext';
import { useLogs } from './LogContext';
import { useToast } from './ToastContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const { addLog } = useLogs();
  const { showToast } = useToast();

  // 💾 KALICI SEPET: Sayfa açılırken localStorage'dan sepeti yükle
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('enterprise_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.error('Kalıcı sepet okunamadı:', err);
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // 💾 Her sepet değişikliğinde anında localStorage'a senkronize et
  useEffect(() => {
    try {
      localStorage.setItem('enterprise_cart', JSON.stringify(cart));
    } catch (err) {
      console.error('Sepet localStorage kaydı başarısız:', err);
    }
  }, [cart]);

  // 🚀 Sepete Animasyon Efekti
  const triggerFlyToCart = (e, customImage = null) => {
    if (!e) return;

    let startX = e.clientX;
    let startY = e.clientY;

    if (!startX && e.target) {
      const rect = e.target.getBoundingClientRect();
      startX = rect.left + rect.width / 2;
      startY = rect.top + rect.height / 2;
    }

    const cartBtn = document.getElementById('navbar-cart-button');
    if (!cartBtn) return;
    const destRect = cartBtn.getBoundingClientRect();
    const destX = destRect.left + destRect.width / 2;
    const destY = destRect.top + destRect.height / 2;

    const flyingEl = document.createElement('div');
    flyingEl.className = 'fixed z-[9999] pointer-events-none rounded-full flex items-center justify-center';
    flyingEl.style.width = '28px';
    flyingEl.style.height = '28px';
    flyingEl.style.left = `${startX - 14}px`;
    flyingEl.style.top = `${startY - 14}px`;
    flyingEl.style.background = '#18181b';
    flyingEl.style.transition = 'all 0.6s cubic-bezier(0.2, 0.8, 0.25, 1)';
    flyingEl.style.transform = 'scale(1)';

    if (customImage) {
      flyingEl.innerHTML = `<img src="${customImage}" class="w-full h-full object-cover rounded-full" />`;
    }

    document.body.appendChild(flyingEl);

    requestAnimationFrame(() => {
      flyingEl.style.left = `${destX - 10}px`;
      flyingEl.style.top = `${destY - 10}px`;
      flyingEl.style.transform = 'scale(0.3)';
      flyingEl.style.opacity = '0.5';
    });

    setTimeout(() => {
      cartBtn.classList.add('scale-110');
      setTimeout(() => {
        cartBtn.classList.remove('scale-110');
      }, 200);

      if (flyingEl.parentNode) {
        flyingEl.parentNode.removeChild(flyingEl);
      }
    }, 600);
  };

  const addToCart = (product, clickEvent = null, quantityToAdd = 1) => {
    // 🔒 1. GİRİŞ YAPILMAMIŞSA KESİNLİKLE ENGELLE VE LOGİN MODALINI TETİKLE:
    if (!isAuthenticated) {
      showToast({
        type: 'warning',
        message: 'Ürünleri sepete eklemek ve sipariş verebilmek için lütfen önce giriş yapınız.'
      });
      window.dispatchEvent(new CustomEvent('open-login-modal'));
      return false;
    }

    const existing = cart.find((item) => item.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    const maxStock = typeof product.stockQuantity === 'number' ? product.stockQuantity : 999;

    // 2. Stok bitmişse engelle:
    if (maxStock <= 0) {
      showToast({
        type: 'error',
        message: `Tükendi: '${product.name}' için stok bulunmamaktadır.`
      });
      return false;
    }

    // 3. Mevcut stok adedini aşıyorsa engelle:
    if (currentQty + quantityToAdd > maxStock) {
      showToast({
        type: 'error',
        message: `Yetersiz Stok: '${product.name}' için en fazla ${maxStock} adet alabilirsiniz.`
      });
      return false;
    }

    // 4. Başarıyla sepete ekle:
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.id === product.id);
      if (idx !== -1) {
        return prev.map((item, i) =>
          i === idx ? { ...item, quantity: item.quantity + quantityToAdd } : item
        );
      }
      return [...prev, { ...product, quantity: quantityToAdd }];
    });

    // 5. Animasyon tetikle:
    if (clickEvent) {
      triggerFlyToCart(clickEvent, product.imageUrl);
    }

    // 6. Başarı bildirimi:
    showToast({
      type: 'success',
      message: `'${product.name}' sepetinize eklendi.`
    });

    return true;
  };

  const removeFromCart = (productId) => {
    const removedItem = cart.find(i => i.id === productId);
    setCart((prev) => prev.filter((item) => item.id !== productId));
    if (removedItem) {
      showToast({
        type: 'warning',
        message: `'${removedItem.name}' sepetten çıkarıldı.`
      });
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.stockQuantity) {
              showToast({
                type: 'error',
                message: `Yetersiz Stok: Bu üründen en fazla ${item.stockQuantity} adet ekleyebilirsiniz.`
              });
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const clearCart = () => {
    try {
      localStorage.removeItem('enterprise_cart');
    } catch (err) {
      console.error('LocalStorage temizleme hatası:', err);
    }
    setCart([]);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const checkout = async (cardData = null) => {
    if (cart.length === 0) return;

    if (!isAuthenticated) {
      showToast({
        type: 'warning',
        message: 'Lütfen ödemeyi tamamlamak için giriş yapınız.'
      });
      window.dispatchEvent(new CustomEvent('open-login-modal'));
      return;
    }

    setIsCheckingOut(true);
    const idempotencyKey = crypto.randomUUID();

    const payload = {
      items: cart.map((i) => ({
        productId: i.id,
        quantity: i.quantity
      })),
      ...(cardData ? {
        paymentCard: {
          cardNumber: cardData.cardNumber,
          cardHolderName: cardData.cardHolder,
          expireMonth: cardData.expiry?.split('/')[0] || '12',
          expireYear: cardData.expiry && cardData.expiry.includes('/') ? `20${cardData.expiry.split('/')[1]}` : '2030',
          cvc: cardData.cvv
        }
      } : {})
    };

    try {
      const res = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          'Idempotency-Key': idempotencyKey
        }
      });

      if (res.ok) {
        const data = await res.json();
        const createdOrderId = data.id || data.orderId;
        showToast({
          type: 'success',
          message: `Siparişiniz başarıyla alındı. No: #${createdOrderId ? createdOrderId.slice(0, 8) : 'Onaylandı'}`
        });
        clearCart();
        setIsCartOpen(false);
        return { success: true, orderId: createdOrderId, data };
      } else {
        const err = await res.json();
        showToast({
          type: 'error',
          message: err.detail || 'Sipariş oluşturulamadı.'
        });
        throw new Error(err.detail || 'Sipariş oluşturulamadı.');
      }
    } catch (err) {
      throw err;
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        setIsCartOpen,
        isCheckingOut,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        checkout,
        totalAmount,
        totalCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
