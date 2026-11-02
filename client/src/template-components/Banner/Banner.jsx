import React from "react";
import BannerImg from "../../assets/women/women2.jpg";
import { ShieldCheck, Truck, CreditCard, Sparkles } from "lucide-react";

const Banner = () => {
  return (
    <section className="py-20 border-t border-zinc-100 dark:border-zinc-800">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Sol Kolon: Doğal Fotoğraf */}
          <div className="md:col-span-5 flex justify-center">
            <div className="w-full max-w-md aspect-4/5 overflow-hidden rounded-2xl bg-zinc-50 dark:bg-zinc-900/40">
              <img
                src={BannerImg}
                alt="Editorial Highlight"
                className="w-full h-full object-cover object-center grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
          </div>

          {/* Sağ Kolon: Açık Tipografi & Özellikler */}
          <div className="md:col-span-7 space-y-8">
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 block">
                Sezon Seçkisi
              </span>
              <h2 className="text-3xl sm:text-4xl font-light text-zinc-950 dark:text-zinc-50 tracking-tight leading-tight">
                Zarafet ve Kusursuz Konforun Buluşması
              </h2>
              <p className="text-sm text-zinc-500 font-light leading-relaxed max-w-lg">
                Yüksek standartlarda işlenmiş doğal kumaşlar ve özenli terzilik anlayışıyla, günlük yaşamınıza değer katan parçalar üretiyoruz.
              </p>
            </div>

            {/* Özellik Maddeleri */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="flex items-start gap-3">
                <ShieldCheck size={18} strokeWidth={1.5} className="text-zinc-900 dark:text-zinc-100 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    Orijinal Kalite
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
                    Sertifikalı organik kumaş ve titiz dikiş işçiliği.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Truck size={18} strokeWidth={1.5} className="text-zinc-900 dark:text-zinc-100 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    Hızlı Teslimat
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
                    Aynı gün kargo ve sigortalı paketleme güvencesi.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard size={18} strokeWidth={1.5} className="text-zinc-900 dark:text-zinc-100 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    Güvenli Ödeme
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
                    256-bit SSL ve 3D Secure korumalı ödeme altyapısı.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Sparkles size={18} strokeWidth={1.5} className="text-zinc-900 dark:text-zinc-100 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    Kolay Değişim & İade
                  </h4>
                  <p className="text-[11px] text-zinc-400 font-light leading-relaxed">
                    14 gün içerisinde zahmetsiz ve ücretsiz iade desteği.
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default Banner;
