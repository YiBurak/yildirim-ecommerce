import React, { useState, useEffect } from "react";
import Img1 from "../../assets/women/women.png";
import Img2 from "../../assets/women/women2.jpg";
import Img3 from "../../assets/women/women3.jpg";
import Img4 from "../../assets/women/women4.jpg";
import { Search, X, RotateCw, Plus, ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";
import { apiFetch } from "../../api/client";
import { useCart } from "../../context/CartContext";
import { useLogs } from "../../context/LogContext";

const sampleImages = [Img1, Img2, Img3, Img4];

const Products = ({ refreshTrigger, onSelectProduct }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtreleme State'leri
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const { addToCart } = useCart();
  const { addLog } = useLogs();

  // Kategorileri Çek
  const fetchCategories = async () => {
    try {
      const res = await apiFetch('/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : data.items || []);
      }
    } catch (err) {
      console.error("Kategoriler getirilemedi:", err);
    }
  };

  // Ürünleri Filtrelere Göre Çek
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('pageNumber', pageNumber);
      params.append('pageSize', 8);

      if (searchTerm.trim()) params.append('searchTerm', searchTerm.trim());
      if (selectedCategoryId) params.append('categoryId', selectedCategoryId);
      if (sortBy) params.append('sortBy', sortBy);

      const res = await apiFetch(`/products?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const items = data.items || data;
        setProducts(items);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || items.length);
        addLog(`${items.length} adet ürün listelendi (Filtre: ${searchTerm || selectedCategoryId ? 'Aktif' : 'Tümü'}).`, 'info');
      }
    } catch (err) {
      addLog(`Ürün getirme hatası: ${err.message}`, 'danger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [refreshTrigger, selectedCategoryId, sortBy, pageNumber]);

  // Arama için debounce (350ms bekleme):
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageNumber(1);
      fetchProducts();
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategoryId("");
    setSortBy("");
    setPageNumber(1);
  };

  const hasActiveFilters = searchTerm !== "" || selectedCategoryId !== "" || sortBy !== "";

  return (
    <section id="products-section" className="py-20 border-t border-zinc-100 dark:border-zinc-800">
      <div className="container mx-auto px-4 max-w-6xl space-y-10">
        
        {/* 1. Üst Başlık (Kutusuz, editoryal) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 block mb-1">
              Kürasyon
            </span>
            <h2 className="text-3xl font-light text-zinc-950 dark:text-zinc-50 tracking-tight">
              Öne Çıkan Koleksiyon
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-400">
              {totalCount} parça
            </span>
            <button
              onClick={fetchProducts}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 inline-flex items-center gap-1.5 transition-colors"
              title="Yenile"
            >
              <RotateCw size={12} />
              <span>Yenile</span>
            </button>
          </div>
        </div>

        {/* 2. Filtreleme & Arama Çubuğu (Kareler/Kutular YOK, Hairline ve Açık Tipografi) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4">
          
          {/* Canlı Arama Çubuğu */}
          <div className="relative w-full md:max-w-xs">
            <Search size={14} className="absolute left-0 top-2.5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ürün veya model ara..."
              className="w-full bg-transparent pl-6 pr-6 py-2 border-b border-zinc-200 dark:border-zinc-800 focus:border-zinc-950 dark:focus:border-zinc-100 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none transition-colors font-light"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-0 top-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Kategori Seçici Hapları (Kutulanmamış, açık editoryal bağlantılar) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => { setSelectedCategoryId(""); setPageNumber(1); }}
              className={`text-xs px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                selectedCategoryId === ""
                  ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950 font-medium"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              }`}
            >
              Tümü
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategoryId(cat.id); setPageNumber(1); }}
                className={`text-xs px-3 py-1.5 rounded-full transition-all whitespace-nowrap ${
                  selectedCategoryId === cat.id
                    ? "bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950 font-medium"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Fiyata Göre Sıralama Dropdown */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <SlidersHorizontal size={13} className="text-zinc-400" />
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPageNumber(1); }}
              className="bg-transparent text-xs text-zinc-700 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="" className="dark:bg-zinc-900">Varsayılan (En Yeniler)</option>
              <option value="price_asc" className="dark:bg-zinc-900">Fiyat: Düşükten Yükseğe</option>
              <option value="price_desc" className="dark:bg-zinc-900">Fiyat: Yüksekten Düşüğe</option>
              <option value="name_asc" className="dark:bg-zinc-900">İsim: A - Z</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-[11px] font-mono text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-2 ml-2"
              >
                Temizle
              </button>
            )}
          </div>

        </div>

        {/* 3. Ürünler Grid (Kutu ve kart çerçeveleri olmadan, saf editoryal akış) */}
        {loading ? (
          <div className="py-24 text-center">
            <div className="w-6 h-6 border-2 border-zinc-900 dark:border-zinc-100 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-xs text-zinc-400 font-mono">Koleksiyon getiriliyor...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="py-24 text-center space-y-3">
            <p className="text-sm text-zinc-500 font-light">Arama kriterlerine uygun ürün bulunamadı.</p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-zinc-950 dark:text-zinc-50 underline underline-offset-4"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-14">
            {products.map((item, index) => {
              const img = item.imageUrl || sampleImages[index % sampleImages.length];
              const isOutOfStock = item.stockQuantity === 0;

              return (
                <div
                  key={item.id}
                  className="group cursor-pointer select-none flex flex-col justify-between"
                  onClick={() => onSelectProduct && onSelectProduct(item)}
                >
                  {/* Görsel Alanı (Kare kart çerçevesi ve ağır gölge yok) */}
                  <div className="relative w-full aspect-square flex items-center justify-center p-6 mb-4 overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl transition-colors group-hover:bg-zinc-100/60 dark:group-hover:bg-zinc-800/40">
                    <img
                      src={img}
                      alt={item.name}
                      className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Minimal Stok Durumu */}
                    {isOutOfStock ? (
                      <span className="absolute top-3 right-3 text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                        Tükendi
                      </span>
                    ) : item.stockQuantity <= 3 ? (
                      <span className="absolute top-3 right-3 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        Son {item.stockQuantity}
                      </span>
                    ) : null}
                  </div>

                  {/* Ürün Metin Alanı */}
                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="font-normal text-sm text-zinc-900 dark:text-zinc-100 truncate group-hover:underline underline-offset-4">
                        {item.name}
                      </h3>
                      <div className="font-mono text-sm font-medium text-zinc-950 dark:text-zinc-50 tabular-nums">
                        ₺{item.price?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>

                    <p className="text-xs text-zinc-500 line-clamp-1 font-light">
                      {item.description || 'Özel tasarım seçkin parça.'}
                    </p>

                    {/* Hızlı Ekle Butonu */}
                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-zinc-400 font-mono">
                        {isOutOfStock ? 'Tükendi' : `Stok: ${item.stockQuantity}`}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(item, e);
                        }}
                        disabled={isOutOfStock}
                        className="text-xs text-zinc-900 dark:text-zinc-100 hover:opacity-70 transition-opacity inline-flex items-center gap-1 font-medium disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus size={13} />
                        <span>Sepete Ekle</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Sayfalama (Pagination) */}
        {totalPages > 1 && (
          <div className="pt-10 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 text-xs">
            <span className="font-mono text-zinc-400">
              Sayfa {pageNumber} / {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                disabled={pageNumber <= 1}
                className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Önceki Sayfa"
              >
                <ChevronLeft size={14} />
              </button>

              <button
                onClick={() => setPageNumber(prev => Math.min(totalPages, prev + 1))}
                disabled={pageNumber >= totalPages}
                className="p-2 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Sonraki Sayfa"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

export default Products;
