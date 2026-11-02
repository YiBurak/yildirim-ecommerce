import React, { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

const Subscribe = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      setTimeout(() => {
        setEmail("");
        setSubmitted(false);
      }, 4000);
    }
  };

  return (
    <section className="py-20 border-t border-zinc-100 dark:border-zinc-800">
      <div className="container mx-auto px-4 max-w-2xl text-center space-y-6">
        
        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 block">
            Bülten
          </span>
          <h2 className="text-3xl font-light text-zinc-950 dark:text-zinc-50 tracking-tight">
            Yeni Koleksiyonlardan İlk Siz Haberdar Olun
          </h2>
          <p className="text-xs text-zinc-500 font-light leading-relaxed max-w-md mx-auto">
            Sadece yeni sezon seçkileri, özel davetler ve tasarım güncellemeleri. Asla spam göndermiyoruz.
          </p>
        </div>

        {submitted ? (
          <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400 py-3">
            <Check size={14} />
            <span>Kaydınız başarıyla alındı. Teşekkür ederiz.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex max-w-md mx-auto items-center border-b border-zinc-300 dark:border-zinc-700 focus-within:border-zinc-950 dark:focus-within:border-zinc-100 transition-colors py-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-posta adresinizi giriniz"
              required
              className="w-full bg-transparent text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none py-2 px-1"
            />
            <button
              type="submit"
              className="text-xs text-zinc-950 dark:text-zinc-50 hover:opacity-70 transition-opacity flex items-center gap-1 font-medium whitespace-nowrap pl-2"
            >
              <span>Kaydol</span>
              <ArrowRight size={13} />
            </button>
          </form>
        )}

      </div>
    </section>
  );
};

export default Subscribe;
