import React from "react";
import Logo from "../../assets/logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500 py-12 transition-colors">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="flex flex-col md:flex-row items-baseline justify-between gap-8 pb-10 border-b border-zinc-100 dark:border-zinc-800">
          
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center gap-2">
              <img src={Logo} alt="Logo" className="w-5 h-5 grayscale" />
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 tracking-tight">
                YILDIRIM
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-light leading-relaxed">
              Zamansız tasarımlar, seçkin materyaller ve üst düzey müşteri memnuniyeti odaklı hazır giyim deneyimi.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs">
            <div className="space-y-3">
              <span className="font-mono uppercase tracking-wider text-zinc-400 block text-[10px]">
                Koleksiyon
              </span>
              <ul className="space-y-2 font-light">
                <li className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">Yeni Gelenler</li>
                <li className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">Erkek Seçkisi</li>
                <li className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">Kadın Seçkisi</li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="font-mono uppercase tracking-wider text-zinc-400 block text-[10px]">
                Müşteri Hizmetleri
              </span>
              <ul className="space-y-2 font-light">
                <li className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">Sıkça Sorulan Sorular</li>
                <li className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">Kargo & Teslimat</li>
                <li className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer">İade ve Değişim</li>
              </ul>
            </div>

            <div className="space-y-3">
              <span className="font-mono uppercase tracking-wider text-zinc-400 block text-[10px]">
                Güvenli Alışveriş
              </span>
              <div className="inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>256-Bit SSL Koruması Aktif</span>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-zinc-400 font-mono gap-4">
          <p>© {new Date().getFullYear()} YILDIRIM. Tüm hakları saklıdır.</p>
          <div className="flex gap-4">
            <span className="hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer">Gizlilik İlkeleri</span>
            <span>•</span>
            <span className="hover:text-zinc-600 dark:hover:text-zinc-300 cursor-pointer">Mesafeli Satış Sözleşmesi</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
