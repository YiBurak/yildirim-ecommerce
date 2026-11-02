import React from "react";
import Img1 from "../../assets/shirts/shirt.png";
import Img2 from "../../assets/shirts/shirt2.png";
import Img3 from "../../assets/shirts/shirt3.png";
import { ArrowUpRight } from "lucide-react";

const ProductsData = [
  {
    id: 'top-1',
    img: Img1,
    title: "Minimal Casual Wear",
    category: "Giyim / Erkek",
    priceText: "₺1.250,00",
    price: 1250.00,
    description: "Nefes alabilir organik pamuk kumaş, ergonomik kesim ve zamansız tasarım.",
  },
  {
    id: 'top-2',
    img: Img2,
    title: "Signature Printed Shirt",
    category: "Giyim / Unisex",
    priceText: "₺1.490,00",
    price: 1490.00,
    description: "Hassas dokuma teknolojisi ve modern hatlarla tasarlanmış hafif yapı.",
  },
  {
    id: 'top-3',
    img: Img3,
    title: "Yildirim Classic Shirt",
    category: "Giyim / Kadın",
    priceText: "₺1.850,00",
    price: 1850.00,
    description: "Özel dokuma iplik yapısı ile gün boyu konfor ve saf zarafet sunar.",
  },
];

const TopProducts = ({ handleOrderPopup, onSelectProduct }) => {
  return (
    <section className="py-20 border-t border-zinc-100 dark:border-zinc-800">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Üst Başlık (Kutusuz, editoryal) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-14 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 block mb-1">
              Küratör Seçkisi
            </span>
            <h2 className="text-3xl font-light text-zinc-950 dark:text-zinc-50 tracking-tight">
              Öne Çıkan Tasarımlar
            </h2>
          </div>
          <p className="text-xs text-zinc-400 max-w-xs font-light">
            Titizlikle seçilmiş parçalar, birinci sınıf materyaller ve minimalist tasarım anlayışı.
          </p>
        </div>

        {/* Ürünler Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
          {ProductsData.map((data) => (
            <div
              key={data.id}
              className="group flex flex-col justify-between cursor-pointer"
              onClick={() => {
                if (onSelectProduct) {
                  onSelectProduct({
                    id: data.id,
                    name: data.title,
                    price: data.price,
                    description: data.description,
                    stockQuantity: 12,
                    imageUrl: data.img
                  });
                } else if (handleOrderPopup) {
                  handleOrderPopup();
                }
              }}
            >
              {/* Görsel Alanı */}
              <div className="w-full aspect-square flex items-center justify-center p-8 mb-6 overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl transition-colors group-hover:bg-zinc-100/60 dark:group-hover:bg-zinc-800/40">
                <img
                  src={data.img}
                  alt={data.title}
                  className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Bilgi Alanı */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                    {data.category}
                  </span>
                  <span className="font-mono text-sm font-medium text-zinc-950 dark:text-zinc-50 tabular-nums">
                    {data.priceText}
                  </span>
                </div>

                <h3 className="text-base font-normal text-zinc-900 dark:text-zinc-100 group-hover:underline underline-offset-4">
                  {data.title}
                </h3>

                <p className="text-xs text-zinc-500 font-light leading-relaxed line-clamp-2">
                  {data.description}
                </p>

                <div className="pt-2 flex items-center gap-1 text-xs font-medium text-zinc-950 dark:text-zinc-50 group-hover:opacity-75 transition-opacity">
                  <span>İncele</span>
                  <ArrowUpRight size={13} />
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default TopProducts;
