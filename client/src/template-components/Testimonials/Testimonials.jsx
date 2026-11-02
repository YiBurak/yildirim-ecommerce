import React from "react";
import { Star } from "lucide-react";

const TestimonialData = [
  {
    id: 1,
    name: "Ahmet Yılmaz",
    role: "Doğrulanmış Müşteri",
    rating: 5,
    date: "2 gün önce",
    text: "Siparişim ertesi gün özenli bir paketleme ile elime ulaştı. Kumaş dokusu ve dikiş kalitesi mağazalarda gördüklerimden çok daha iyi.",
    img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
  },
  {
    id: 2,
    name: "Elif Demir",
    role: "Doğrulanmış Müşteri",
    rating: 5,
    date: "1 hafta önce",
    text: "Beden tablosu tam uyumlu, kumaşın dökümü ve rengi fotoğraftakinin birebir aynısı. Müşteri hizmetlerinin ilgisi de ayrıca takdiri hak ediyor.",
    img: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
  },
  {
    id: 3,
    name: "Mehmet Kaya",
    role: "Doğrulanmış Müşteri",
    rating: 5,
    date: "2 hafta önce",
    text: "Minimalist tasarımı ve rahat kesimi ile gardırobumun en sevdiğim parçası oldu. Güvenli ödeme ve hızlı kargo için teşekkürler.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
  },
];

const Testimonials = () => {
  return (
    <section className="py-20 border-t border-zinc-100 dark:border-zinc-800">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Üst Başlık (Kutusuz, editoryal) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 block mb-1">
              Müşteri Deneyimi
            </span>
            <h2 className="text-3xl font-light text-zinc-950 dark:text-zinc-50 tracking-tight">
              Kullanıcı İncelemeleri & Değerlendirmeler
            </h2>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-zinc-500">
            <span className="flex text-amber-500">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
              ))}
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">5.0</span>
            <span>•</span>
            <span>Doğrulanmış Alıcılar</span>
          </div>
        </div>

        {/* İncelemeler Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {TestimonialData.map((data) => (
            <div key={data.id} className="flex flex-col justify-between space-y-6">
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex text-amber-500">
                    {[...Array(data.rating)].map((_, i) => (
                      <Star key={i} size={12} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">{data.date}</span>
                </div>

                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-light">
                  “{data.text}”
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-3">
                <img
                  src={data.img}
                  alt={data.name}
                  className="w-9 h-9 rounded-full object-cover grayscale"
                />
                <div>
                  <h4 className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    {data.name}
                  </h4>
                  <span className="text-[11px] text-zinc-400 font-mono block">
                    {data.role}
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Testimonials;
