import React, { createContext, useContext, useState, useEffect } from 'react';
import { registerLogListener } from '../api/client';

const LogContext = createContext();

export function LogProvider({ children }) {
  const [logs, setLogs] = useState([
    {
      id: 1,
      message: '🚀 React + Vite istemcisi hazır. Backend dinleniyor...',
      type: 'info',
      time: new Date().toLocaleTimeString()
    }
  ]);

  const addLog = (message, type = 'info') => {
    setLogs((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        message,
        type,
        time: new Date().toLocaleTimeString()
      }
    ]);
  };

  const clearLogs = () => setLogs([]);

  useEffect(() => {
    // apiFetch'ten gelen logları doğrudan bu state'e bağlıyoruz:
    registerLogListener(({ message, type, time }) => {
      setLogs((prev) => [
        ...prev,
        { id: Date.now() + Math.random(), message, type, time }
      ]);
    });
  }, []);

  return (
    <LogContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LogContext.Provider>
  );
}

export function useLogs() {
  return useContext(LogContext);
}
