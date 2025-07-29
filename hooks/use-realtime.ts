'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface UseRealtimeOptions {
  orderId?: string;
  onOrderUpdate?: (order: any) => void;
  onProgressUpdate?: (progress: any) => void;
  onNotification?: (notification: any) => void;
}

export function useRealtime({
  orderId,
  onOrderUpdate,
  onProgressUpdate,
  onNotification
}: UseRealtimeOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (isConnecting || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    setIsConnecting(true);

    try {
      // Use wss:// for production, ws:// for development
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/ws`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        reconnectAttempts.current = 0;

        // Subscribe to order updates if orderId is provided
        if (orderId) {
          wsRef.current?.send(JSON.stringify({
            type: 'subscribe_order',
            orderId
          }));
        }

        // Subscribe to general notifications
        wsRef.current?.send(JSON.stringify({
          type: 'subscribe_notifications'
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'order_update':
              onOrderUpdate?.(data.order);
              break;
              
            case 'progress_update':
              onProgressUpdate?.(data.progress);
              break;
              
            case 'notification':
              onNotification?.(data.notification);
              
              // Show toast notification
              if (data.notification.type === 'SUCCESS') {
                toast.success(data.notification.message);
              } else if (data.notification.type === 'ERROR') {
                toast.error(data.notification.message);
              } else {
                toast(data.notification.message);
              }
              break;
              
            case 'transfer_progress':
              // Handle real-time transfer progress
              if (data.orderId === orderId) {
                onProgressUpdate?.(data.progress);
              }
              break;
              
            default:
              console.log('Unknown WebSocket message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);

        // Attempt to reconnect unless it was a clean close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnecting(false);
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
  };

  const sendMessage = (message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
    }
  };

  // Auto-connect when hook is used
  useEffect(() => {
    connect();

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [orderId]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Reconnect when page becomes visible
        if (!isConnected && !isConnecting) {
          connect();
        }
      } else {
        // Optionally disconnect when page is hidden to save resources
        // disconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isConnected, isConnecting]);

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    sendMessage
  };
}

// Hook for polling fallback when WebSocket is not available
export function usePolling(
  callback: () => Promise<void>,
  interval: number = 5000,
  enabled: boolean = true
) {
  const callbackRef = useRef(callback);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const poll = async () => {
      try {
        await callbackRef.current();
      } catch (error) {
        console.error('Polling error:', error);
      }
    };

    // Run immediately
    poll();

    // Set up interval
    intervalRef.current = setInterval(poll, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [interval, enabled]);

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const restart = () => {
    stop();
    if (enabled) {
      intervalRef.current = setInterval(async () => {
        try {
          await callbackRef.current();
        } catch (error) {
          console.error('Polling error:', error);
        }
      }, interval);
    }
  };

  return { stop, restart };
}

// Combined hook that uses WebSocket with polling fallback
export function useRealtimeWithFallback({
  orderId,
  onOrderUpdate,
  onProgressUpdate,
  onNotification,
  pollingInterval = 10000
}: UseRealtimeOptions & { pollingInterval?: number } = {}) {
  const { isConnected, ...wsAPI } = useRealtime({
    orderId,
    onOrderUpdate,
    onProgressUpdate,
    onNotification
  });

  // Use polling as fallback when WebSocket is not connected
  const { stop: stopPolling, restart: restartPolling } = usePolling(
    async () => {
      if (orderId && onOrderUpdate) {
        try {
          const response = await fetch(`/api/orders/${orderId}`);
          if (response.ok) {
            const order = await response.json();
            onOrderUpdate(order);
          }
        } catch (error) {
          console.error('Polling fetch error:', error);
        }
      }
    },
    pollingInterval,
    !isConnected // Only poll when WebSocket is not connected
  );

  return {
    isConnected,
    ...wsAPI,
    stopPolling,
    restartPolling
  };
}
