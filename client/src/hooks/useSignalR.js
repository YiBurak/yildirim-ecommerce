import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { apiFetch } from '../api/client';
import { useLogs } from '../context/LogContext';
import { useAuth } from '../context/AuthContext';

export function useSignalR({ onStockUpdated, onOrderCreated, onOrderStatusChanged } = {}) {
  const { addLog } = useLogs();
  const { user } = useAuth();
  const connectionRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;

    async function startConnection() {
      try {
        let ticketQuery = '';
        const token = localStorage.getItem('accessToken');

        // 1. Oturum varsa tek kullanımlık 30 sn'lik bilet al:
        if (token) {
          try {
            const ticketRes = await apiFetch('/auth/hub-ticket', { method: 'POST' });
            if (ticketRes.ok) {
              const ticketData = await ticketRes.json();
              ticketQuery = `?ticket=${ticketData.ticket}`;
              addLog('🎟️ [GÜVENLİ BİLET] SignalR için tek kullanımlık bilet alındı.', 'info');
            }
          } catch (e) {
            console.warn('Bilet alınamadı, anonim deneniyor:', e);
          }
        }

        // Varsa eski bağlantıyı temizle:
        if (connectionRef.current) {
          await connectionRef.current.stop();
        }

        // 2. Hub'a bağlan (URL'de sadece anlamsız bilet var!):
        const hubBase = import.meta.env.VITE_HUB_URL || '/hubs/commerce';
        const connection = new signalR.HubConnectionBuilder()
          .withUrl(`${hubBase}${ticketQuery}`)
          .withAutomaticReconnect()
          .build();

        // 📡 Frekans 1: Stok Güncellemesi
        connection.on('ReceiveStockUpdated', (data) => {
          addLog(`⚡ [CANLI STOK] Ürün: ${data.productId} ➔ Yeni Stok: ${data.newStock}`, 'warning');
          if (onStockUpdated) onStockUpdated(data);
        });

        // 📡 Frekans 2: Yeni Sipariş Bildirimi
        connection.on('ReceiveOrderCreated', (data) => {
          addLog(`🔔 [YENİ SİPARİŞ] ${data.orderNumber} - ₺${data.totalAmount} (${data.customerEmail})`, 'success');
          if (onOrderCreated) onOrderCreated(data);
        });

        // 📡 Frekans 3: Sipariş Durumu Değişti
        connection.on('ReceiveOrderStatusChanged', (data) => {
          addLog(`📢 [DURUM DEĞİŞTİ] Sipariş ${data.orderId} ➔ ${data.status}`, 'info');
          if (onOrderStatusChanged) onOrderStatusChanged(data);
        });

        await connection.start();
        if (!isCancelled) {
          connectionRef.current = connection;
          addLog('🟢 [SignalR BAĞLANDI] Çift yönlü canlı WebSocket kanalı aktif!', 'success');
        }
      } catch (err) {
        addLog(`🔴 [SignalR BAĞLANTI HATASI] ${err.message}`, 'danger');
      }
    }

    startConnection();

    return () => {
      isCancelled = true;
      if (connectionRef.current) {
        connectionRef.current.stop();
      }
    };
  }, [user]); // Kullanıcı giriş/çıkış yaptıkça bağlantı yetkili olarak yenilenir!

  return connectionRef.current;
}
