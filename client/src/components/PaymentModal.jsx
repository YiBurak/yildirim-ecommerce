import React, { useState } from 'react';
import { X, Lock, CreditCard, ShieldCheck } from 'lucide-react';

export function PaymentModal({ isOpen, onClose, totalAmount, onConfirmPayment, isProcessing }) {
  const [cardNumber, setCardNumber] = useState('5890040000000016');
  const [cardHolder, setCardHolder] = useState('BURAK YILDIRIM');
  const [expiry, setExpiry] = useState('12/30');
  const [cvv, setCvv] = useState('123');

  if (!isOpen) return null;

  const formatCardNumber = (value) => {
    const raw = value.replace(/\D/g, '').slice(0, 16);
    return raw.replace(/(\d{4})/g, '$1 ').trim();
  };

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    setCardNumber(raw);
  };

  const handleExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setExpiry(raw);
  };

  const fillSuccessCard = () => {
    setCardNumber('5890040000000016');
    setCardHolder('BURAK YILDIRIM');
    setExpiry('12/30');
    setCvv('123');
  };

  const fillFailCard = () => {
    setCardNumber('5890040000000002');
    setCardHolder('TEST YETERSIZ BAKIYE');
    setExpiry('12/30');
    setCvv('123');
  };

  const isMasterCard = cardNumber.startsWith('5');
  const isVisa = cardNumber.startsWith('4');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirmPayment({
      cardNumber,
      cardHolder,
      expiry,
      cvv
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Üst Başlık */}
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock size={15} className="text-zinc-500" />
            <h3 className="font-semibold text-zinc-950 dark:text-zinc-50 text-sm tracking-tight">
              Güvenli Ödeme
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* İçerik */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* Mat Titanyum Kredi Kartı Görseli */}
          <div className="relative w-full h-44 rounded-xl p-5 text-zinc-100 shadow-md overflow-hidden bg-zinc-950 dark:bg-zinc-900 border border-zinc-800 select-none flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div className="w-9 h-7 rounded bg-amber-400/90 border border-amber-300 flex items-center justify-center">
                <div className="w-full h-[1px] bg-amber-700/50 my-0.5" />
              </div>
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {isMasterCard ? 'Mastercard' : isVisa ? 'Visa' : 'Kart'}
              </span>
            </div>

            <div className="font-mono text-xl font-medium tracking-widest text-zinc-100 text-center">
              {formatCardNumber(cardNumber || '••••••••••••••••')}
            </div>

            <div className="flex items-end justify-between text-xs font-mono">
              <div>
                <div className="text-[9px] uppercase tracking-wider text-zinc-500">Kart Sahibi</div>
                <div className="font-medium text-zinc-200 truncate max-w-[170px] uppercase">
                  {cardHolder || 'AD SOYAD'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[9px] uppercase tracking-wider text-zinc-500">Son Kul.</div>
                <div className="font-medium text-zinc-200">{expiry || 'AA/YY'}</div>
              </div>
            </div>
          </div>

          {/* Test Kartı Seçici */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-medium text-zinc-500 flex items-center justify-between">
              <span>Iyzico Test Modu</span>
              <span className="font-mono text-[10px]">Sandbox</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={fillSuccessCard}
                className="py-1.5 px-3 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors text-left"
              >
                <span className="block font-semibold text-emerald-600 dark:text-emerald-400">Onaylı Kart</span>
                <span className="text-[10px] text-zinc-400 font-mono">...0016</span>
              </button>
              <button
                type="button"
                onClick={fillFailCard}
                className="py-1.5 px-3 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors text-left"
              >
                <span className="block font-semibold text-rose-600 dark:text-rose-400">Yetersiz Bakiye</span>
                <span className="text-[10px] text-zinc-400 font-mono">...0002</span>
              </button>
            </div>
          </div>

          {/* Form Alanları */}
          <form onSubmit={handleSubmit} id="payment-form" className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Kart Üzerindeki İsim
              </label>
              <input
                type="text"
                required
                value={cardHolder}
                onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                placeholder="AD SOYAD"
                className="w-full px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs uppercase focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Kart Numarası
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formatCardNumber(cardNumber)}
                  onChange={handleCardNumberChange}
                  placeholder="5890 0400 0000 0016"
                  maxLength={19}
                  className="w-full px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs font-mono focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors"
                />
                <CreditCard size={15} className="absolute right-3 top-2.5 text-zinc-400 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Son Kul. Tarihi
                </label>
                <input
                  type="text"
                  required
                  value={expiry}
                  onChange={handleExpiryChange}
                  placeholder="AA/YY"
                  maxLength={5}
                  className="w-full px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs font-mono text-center focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Güvenlik Kodu (CVV)
                </label>
                <input
                  type="password"
                  required
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="•••"
                  maxLength={4}
                  className="w-full px-3.5 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 text-xs font-mono text-center focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </form>

          <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-1">
            <span className="inline-flex items-center gap-1">
              <ShieldCheck size={14} className="text-zinc-400" />
              Iyzico 3D Koruması
            </span>
            <span>256-Bit SSL</span>
          </div>
        </div>

        {/* Alt Çubuk */}
        <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between gap-4">
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Toplam Tutar</div>
            <div className="text-lg font-mono font-semibold text-zinc-950 dark:text-zinc-50 tabular-nums">
              ₺{totalAmount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <button
            type="submit"
            form="payment-form"
            disabled={isProcessing}
            className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-950 dark:bg-zinc-50 text-white dark:text-zinc-950 hover:opacity-90 text-xs font-medium inline-flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            {isProcessing ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/30 dark:border-zinc-900/30 border-t-white dark:border-t-zinc-900 rounded-full animate-spin" />
                <span>İşleniyor...</span>
              </span>
            ) : (
              <span>Ödemeyi Onayla</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
