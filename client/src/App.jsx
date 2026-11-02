import React, { useState, useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import { LogProvider } from "./context/LogContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CartProvider, useCart } from "./context/CartContext";
import { useSignalR } from "./hooks/useSignalR";
import { API_BASE_URL } from "./api/client";

import Navbar from "./template-components/Navbar/Navbar";
import Hero from "./template-components/Hero/Hero";
import Products from "./template-components/Products/Products";
import TopProducts from "./template-components/TopProducts/TopProducts";
import Banner from "./template-components/Banner/Banner";
import Subscribe from "./template-components/Subscribe/Subscribe";
import Testimonials from "./template-components/Testimonials/Testimonials";
import Footer from "./template-components/Footer/Footer";

import { CartDrawer } from "./components/CartDrawer";
import { LoginModal } from "./components/LoginModal";
import { LiveConsole } from "./components/LiveConsole";

import { ProfilePage } from "./pages/ProfilePage";
import { AdminPage } from "./pages/AdminPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { OrderSuccessPage } from "./pages/OrderSuccessPage";

const AppContent = () => {
  const [activePage, setActivePage] = useState("shop"); // 'shop' | 'profile' | 'admin' | 'product-detail' | 'order-success'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [successOrderId, setSuccessOrderId] = useState(null);
  const [isConsoleOpen, setIsConsoleOpen] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { isAdmin } = useAuth();
  const { setIsCartOpen } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    AOS.init({
      offset: 100,
      duration: 800,
      easing: "ease-in-sine",
      delay: 100,
    });
    AOS.refresh();

    // 🔒 Giriş Modalı Dinleyicisi (Sepet veya korumalı alanlar tetiklediğinde)
    const handleOpenLogin = () => setIsLoginModalOpen(true);
    window.addEventListener("open-login-modal", handleOpenLogin);

    const params = new URLSearchParams(window.location.search);

    // 🔑 1. Şifre Sıfırlama Linki Kontrolü:
    if (params.get("resetToken") && params.get("email")) {
      setIsLoginModalOpen(true);
    }

    // ✉️ 2. E-Posta Onay Linki Kontrolü:
    const confirmToken = params.get("confirmToken");
    const confirmEmail = params.get("email");
    if (confirmToken && confirmEmail) {
      fetch(`${API_BASE_URL}/auth/confirm-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: confirmEmail, token: confirmToken }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.detail || data.message || "Doğrulama başarısız.");
          showToast({
            type: "success",
            message: "🎉 " + (data.message || "E-posta adresiniz doğrulandı! Şimdi giriş yapabilirsiniz."),
          });
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsLoginModalOpen(true);
        })
        .catch((err) => {
          showToast({
            type: "error",
            message: err.message || "Geçersiz veya süresi dolmuş onay linki.",
          });
        });
    }

    return () => {
      window.removeEventListener("open-login-modal", handleOpenLogin);
    };
  }, []);

  // ⚡ Canlı SignalR Dinleyicisi
  useSignalR({
    onStockUpdated: () => {
      setRefreshTrigger((prev) => prev + 1);
    },
    onOrderCreated: () => {
      setRefreshTrigger((prev) => prev + 1);
    },
    onOrderStatusChanged: () => {
      setRefreshTrigger((prev) => prev + 1);
    },
  });

  const handleOrderPopup = () => {
    setIsCartOpen(true);
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setActivePage("product-detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-white dark:bg-gray-900 dark:text-white duration-200 min-h-screen flex flex-col">
      {/* 1. Üst Bar */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        isConsoleOpen={isConsoleOpen}
        setIsConsoleOpen={setIsConsoleOpen}
        openLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* 2. Sayfa İçeriği */}
      <main className="flex-1 pb-48">
        {activePage === "shop" && (
          <div>
            <Hero handleOrderPopup={handleOrderPopup} />
            <Products
              refreshTrigger={refreshTrigger}
              onSelectProduct={handleSelectProduct}
            />
            <TopProducts 
              handleOrderPopup={handleOrderPopup} 
              onSelectProduct={handleSelectProduct} 
            />
            <Banner />
            <Subscribe />
            <Testimonials />
          </div>
        )}

        {activePage === "product-detail" && (
          <ProductDetailPage
            product={selectedProduct}
            setActivePage={setActivePage}
          />
        )}

        {activePage === "profile" && (
          <ProfilePage setActivePage={setActivePage} />
        )}

        {activePage === "admin" && isAdmin && (
          <AdminPage
            refreshTrigger={refreshTrigger}
            setActivePage={setActivePage}
          />
        )}

        {activePage === "order-success" && (
          <OrderSuccessPage
            orderId={successOrderId}
            setActivePage={setActivePage}
          />
        )}
      </main>

      {/* 3. Footer */}
      <Footer />

      {/* 4. Yan Çekmeceler ve Modallar */}
      <CartDrawer
        onOrderSuccess={(orderId) => {
          setSuccessOrderId(orderId);
          setActivePage("order-success");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <LogProvider>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </LogProvider>
  );
}
