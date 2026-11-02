import React, { useRef, useEffect } from 'react';
import { Terminal, Trash2, X } from 'lucide-react';
import { useLogs } from '../context/LogContext';

export function LiveConsole({ isOpen, onClose }) {
  const { logs, clearLogs } = useLogs();
  const logsEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isOpen]);

  if (!isOpen) return null;

  const typeStyles = {
    info: 'text-sky-400',
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-rose-400'
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-60 bg-gray-950/95 backdrop-blur-xl border-t border-gray-800 text-gray-100 shadow-2xl z-40 flex flex-col font-sans animate-in slide-in-from-bottom duration-200">
      {/* Başlık Çubuğu */}
      <div className="px-4 py-2 bg-gray-900/90 border-b border-gray-800 flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-2.5">
          <Terminal size={15} className="text-primary" />
          <span className="font-bold text-gray-200">
            📡 Canlı Mimarî & Güvenlik Konsolu (SignalR, Silent Auth, Outbox, Caching)
          </span>
          <span className="text-[10px] bg-primary/20 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/30">
            {logs.length} olay
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearLogs}
            title="Konsolu Temizle"
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={onClose}
            title="Kapat"
            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Log Akışı */}
      <div className="flex-1 overflow-y-auto p-3 sm:px-4 font-mono text-xs space-y-1.5 select-text">
        {logs.length === 0 ? (
          <div className="text-gray-500 py-6 text-center italic text-xs">
            Henüz ağ isteği veya mimari olay tetiklenmedi.
          </div>
        ) : (
          logs.map((item) => (
            <div key={item.id} className="flex items-start gap-2.5 leading-relaxed">
              <span className="text-gray-500 select-none text-[11px]">[{item.time}]</span>
              <span className={`flex-1 break-words ${typeStyles[item.type] || 'text-gray-200'}`}>
                {item.message}
              </span>
            </div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
