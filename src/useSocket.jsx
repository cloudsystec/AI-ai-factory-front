import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getApiBase, getToken } from "./api.js";

const SocketContext = createContext(null);

function buildWsUrl() {
  const token = getToken();
  if (!token) return null;
  const base = getApiBase() || window.location.origin;
  const httpUrl = base.startsWith("http") ? base : `${window.location.origin}${base}`;
  const wsUrl = httpUrl.replace(/^http/, "ws");
  return `${wsUrl}/ws?token=${encodeURIComponent(token)}`;
}

const MAX_RECONNECT_DELAY = 10_000;
const BASE_DELAY = 500;

/**
 * @param {{ children: import("react").ReactNode }} props
 */
export function SocketProvider({ children }) {
  const wsRef = useRef(null);
  const listenersRef = useRef(new Map());
  const reconnectTimer = useRef(null);
  const attemptRef = useRef(0);
  const mountedRef = useRef(true);
  const [connected, setConnected] = useState(false);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    const url = buildWsUrl();
    if (!url) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      attemptRef.current = 0;
      setConnected(true);
    };

    ws.onmessage = (ev) => {
      try {
        const event = JSON.parse(ev.data);
        const type = event.type;
        if (!type) return;
        const handlers = listenersRef.current.get(type);
        if (handlers) {
          for (const fn of handlers) fn(event);
        }
        const wildcard = listenersRef.current.get("*");
        if (wildcard) {
          for (const fn of wildcard) fn(event);
        }
      } catch { /* malformed */ }
    };

    ws.onclose = () => {
      wsRef.current = null;
      setConnected(false);
      if (!mountedRef.current) return;
      const delay = Math.min(MAX_RECONNECT_DELAY, BASE_DELAY * 2 ** attemptRef.current);
      attemptRef.current += 1;
      reconnectTimer.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const subscribe = useCallback((type, handler) => {
    if (!listenersRef.current.has(type)) {
      listenersRef.current.set(type, new Set());
    }
    listenersRef.current.get(type).add(handler);
    return () => {
      const set = listenersRef.current.get(type);
      if (set) {
        set.delete(handler);
        if (set.size === 0) listenersRef.current.delete(type);
      }
    };
  }, []);

  const value = { subscribe, connected };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

/**
 * @returns {{ subscribe: (type: string, handler: (event: object) => void) => () => void, connected: boolean }}
 */
export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket fora de SocketProvider");
  return ctx;
}
