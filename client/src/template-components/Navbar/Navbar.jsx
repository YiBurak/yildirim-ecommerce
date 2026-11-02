import React from "react";
import Logo from "../../assets/logo.png";
import { ShoppingBag, User, LogOut, Shield, Moon, Sun } from "lucide-react";
import DarkMode from "./DarkMode";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";

const Navbar = ({ activePage, setActivePage, isConsoleOpen, setIsConsoleOpen, openLoginModal }) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { totalCount, setIsCartOpen } = useCart();

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-100 dark:border-zinc-800 transition-colors">
      <div className="container mx-auto px-4 max-w-6xl h-16 flex items-center justify-between">
        
        {/* Sol Alan: Logo & Marka (Kutusuz) */}
        <div className="flex items-center gap-8">
          <div 
            onClick={() => setActivePage('shop')} 
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <img src={Logo} alt="Logo" className="w-7 h-7 object-contain grayscale group-hover:grayscale-0 transition-all" />
            <span className="text-base font-light tracking-tight text-zinc-950 dark:text-zinc-50">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">YILDIRIM</span>
            </span>
          </div>

          {/* Menü Linkleri (Kutusuz, sade editoryal) */}
          <nav className="flex items-center gap-4 sm:gap-6 text-xs">
            <button
              onClick={() => setActivePage('shop')}
              className={`transition-colors py-1 ${
                activePage === 'shop' 
                  ? 'text-zinc-950 dark:text-zinc-50 font-medium border-b border-zinc-950 dark:border-zinc-50' 
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
              }`}
            >
              Koleksiyon
            </button>

            {isAuthenticated && (
              <button
                onClick={() => setActivePage('profile')}
                className={`transition-colors py-1 ${
                  activePage === 'profile' 
                    ? 'text-zinc-950 dark:text-zinc-50 font-medium border-b border-zinc-950 dark:border-zinc-50' 
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Siparişlerim
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setActivePage('admin')}
                className={`transition-colors py-1 flex items-center gap-1.5 ${
                  activePage === 'admin' 
                    ? 'text-amber-600 dark:text-amber-400 font-medium border-b border-amber-600 dark:border-amber-400' 
                    : 'text-amber-600/80 hover:text-amber-600'
                }`}
              >
                <Shield size={12} />
                <span>Yönetici</span>
              </button>
            )}
          </nav>
        </div>

        {/* Sağ Alan: Sepet, Tema & Profil Butonları */}
        <div className="flex items-center gap-3">
          
          {/* Dark Mode */}
          <DarkMode />

          {/* Sepet Butonu (Kutu/kare yok, saf hap buton) */}
          <button
            id="navbar-cart-button"
            onClick={() => setIsCartOpen(true)}
            className="inline-flex items-center gap-2 py-1.5 px-3.5 rounded-full text-xs font-medium text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <ShoppingBag size={15} strokeWidth={1.5} />
            <span className="hidden sm:inline">Sepet</span>
            {totalCount > 0 && (
              <span className="font-mono text-[11px] bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 px-1.5 py-0.2 rounded-full tabular-nums">
                {totalCount}
              </span>
            )}
          </button>

          {/* Kullanıcı Giriş / Çıkış */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 hidden sm:inline">
                {user.fullName || user.email}
              </span>
              <button
                onClick={logout}
                title="Çıkış Yap"
                className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors"
              >
                <LogOut size={15} strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="text-xs font-medium py-1.5 px-4 rounded-full bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 hover:opacity-85 transition-opacity"
            >
              Giriş Yap
            </button>
          )}

        </div>

      </div>
    </header>
  );
};

export default Navbar;
