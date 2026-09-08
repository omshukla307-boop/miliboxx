import { useEffect, useRef, useCallback } from 'react';
import { WS_URL } from '../services/api';

/**
 * useWebSocket — connects to Member 2's FastAPI WebSocket endpoint
 * and calls onMessage(parsedPayload) for each incoming event.
 *
 * Expected WebSocket message format (from FastAPI):
 * {
 *   "id":        "ALT-xxx",
 *   "container": "ALPHA-023",
 *   "event":     "Shock detected",
 *   "severity":  "CRITICAL",        // "CRITICAL" | "WARNING" | "INFO"
 *   "location":  "Delhi",
 *   "timestamp": "10:42:31",
 *   "status":    "UNREAD"
 * }
 *
 * The hook auto-reconnects on disconnect with exponential back-off.
 */
export default function useWebSocket(endpoint, onMessage, enabled = true) {
  const wsRef       = useRef(null);
  const retryDelay  = useRef(1000);
  const mountedRef  = useRef(true);
  const onMessageRef = useRef(onMessage);

  // Keep callback ref current without triggering reconnect
  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);

  const connect = useCallback(() => {
    if (!enabled || !mountedRef.current) return;

    const url = `${WS_URL}${endpoint}`;
    console.info(`[WS] Connecting → ${url}`);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.info('[WS] Connected');
      retryDelay.current = 1000; // reset back-off
    };

    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        onMessageRef.current(data);
      } catch (e) {
        console.warn('[WS] Could not parse message', evt.data);
      }
    };

    ws.onerror = (err) => {
      console.warn('[WS] Error', err);
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      const delay = Math.min(retryDelay.current, 30000);
      console.info(`[WS] Disconnected — retrying in ${delay}ms`);
      retryDelay.current = delay * 2;
      setTimeout(connect, delay);
    };
  }, [endpoint, enabled]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) connect();
    return () => {
      mountedRef.current = false;
      wsRef.current?.close();
    };
  }, [connect, enabled]);

  /** Send a message to the server (e.g. simulator commands) */
  const send = useCallback((payload) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  return { send };
}
