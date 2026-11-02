import React, { useState, useEffect } from 'react';
import Image1 from "../../assets/Hero/women.png";
import Image2 from "../../assets/Hero/shopping.png";
import Image3 from "../../assets/Hero/sale.png";
import { ArrowRight } from "lucide-react";

const ImageList = [
  {
    id: 1,
    img: Image1,
    tag: "YENİ SEZON",
    title: "Zamansız Formlar, Modern Çizgiler",
    description: "Doğal materyaller ve titiz terzilikle şekillenen yeni koleksiyon seçkisi.",
  },
  {
    id: 2,
    img: Image2,
    tag: "ZARİF & MODERN",
    title: "Konforlu ve Şık Günlük Stiller",
    description: "Gün boyu hareket özgürlüğü sunan nefes alabilir doğal kumaşlar ve modern kesimler.",
  },
  {
    id: 3,
    img: Image3,
    tag: "SINIRLI SEÇKİ",
    title: "Özel Tasarım Parçalar",
    description: "Zarafeti ve konforu bir arada sunan, gardırobunuza değer katacak seçkin modeller.",
  },
];

const Hero = ({ handleOrderPopup }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % ImageList.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const data = ImageList[current];

  return (
    <section className="relative overflow-hidden py-16 sm:py-24 border-b border-zinc-100 dark:border-zinc-800">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Sol Kolon: Editoryal Tipografi */}
          <div className="md:col-span-7 space-y-6 text-left">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 block">
              {data.tag}
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-zinc-950 dark:text-zinc-50 tracking-tight leading-tight min-h-[140px] sm:min-h-[160px] flex items-center">
              {data.title}
            </h1>

            <p className="text-sm text-zinc-500 font-light leading-relaxed max-w-lg">
              {data.description}
            </p>

            <div className="pt-4 flex items-center gap-6">
              <button
                type="button"
                onClick={handleOrderPopup}
                className="py-3 px-8 rounded-full bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 text-xs font-medium hover:opacity-85 transition-all inline-flex items-center gap-2"
              >
                <span>Koleksiyonu Keşfet</span>
                <ArrowRight size={14} />
              </button>

              {/* Minimal Slider Göstergeleri */}
              <div className="flex gap-2 items-center">
                {ImageList.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrent(idx)}
                    aria-label={`Slide ${idx + 1}`}
                    className={`h-1 rounded-full transition-all duration-300 ${
                      current === idx 
                        ? "w-8 bg-zinc-900 dark:bg-zinc-100" 
                        : "w-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-400"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Sağ Kolon: Temiz Ürün Görseli */}
          <div className="md:col-span-5 flex justify-center">
            <div className="w-full max-w-sm aspect-square flex items-center justify-center p-4">
              <img
                key={data.id}
                src={data.img}
                alt={data.title}
                className="max-h-[380px] w-auto object-contain select-none animate-in fade-in zoom-in-95 duration-500"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
