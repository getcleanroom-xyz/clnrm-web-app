"use client";

import { useRef, useEffect, useState, useCallback } from "react";

interface UseReconnectingWSOptions {
  onMessage?: (event: MessageEvent) => void;
  onOpen?: () => void;
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
}

interface UseReconnectingWSResult {
  isConnected: boolean;
  retryCount: number;
  send: (data: string) => void;
  disconnect: () => void;
}

export function useReconnectingWS(
  url: string | null,
  options: UseReconnectingWSOptions = {}
): UseReconnectingWSResult {
  const {
    onMessage,
    onOpen,
    maxRetries = Infinity,
    baseDelay = 1000,
    maxDelay = 30000,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const onMessageRef = useRef(onMessage);
  const onOpenRef = useRef(onOpen);
  const connectRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
  }, [onMessage, onOpen]);

  const connect = useCallback(() => {
    if (!url) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      retryRef.current = 0;
      setRetryCount(0);
      onOpenRef.current?.();
    };

    ws.onmessage = (event) => {
      onMessageRef.current?.(event);
    };

    ws.onclose = () => {
      if (wsRef.current !== ws) return;
      setIsConnected(false);
      wsRef.current = null;

      if (retryRef.current < maxRetries) {
        const delay = Math.min(
          baseDelay * Math.pow(2, retryRef.current),
          maxDelay
        );
        retryRef.current++;
        setRetryCount(retryRef.current);
        timerRef.current = setTimeout(() => connectRef.current?.(), delay);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [url, baseDelay, maxDelay, maxRetries]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  const disconnect = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    retryRef.current = Infinity;
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, []);

  const send = useCallback((data: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(data);
    }
  }, []);

  useEffect(() => {
    if (!url) return;
    connect();
    return disconnect;
  }, [url, connect, disconnect]);

  return { isConnected, retryCount, send, disconnect };
}
