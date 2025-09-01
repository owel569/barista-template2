import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data?: unknown;
  timestamp?: number;
}

interface WebSocketConfig {
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  sendMessage: (message: WebSocketMessage) => boolean;
  disconnect: () => void;
  reconnect: () => void;
  getConnectionInfo: () => {
    readyState: number;
    url: string | null;
    protocol: string;
  };
}

export function useWebSocket(
  url: string = '/api/ws',
  config: WebSocketConfig = {}
): UseWebSocketReturn {
  const {
    reconnect = true, // Defaulting reconnect to true, assuming this is desired
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onMessage,
    onOpen,
    onClose,
    onError
  } = config;

  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');

  const ws = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeout = useRef<NodeJS.Timeout | null>(null);
  const messageQueue = useRef<WebSocketMessage[]>([]);

  const clearTimeouts = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
    if (heartbeatTimeout.current) {
      clearTimeout(heartbeatTimeout.current);
      heartbeatTimeout.current = null;
    }
  }, []);

  const startHeartbeat = useCallback(() => {
    // Explicitly remove previous heartbeat timeout
    if (heartbeatTimeout.current) {
      clearTimeout(heartbeatTimeout.current);
    }

    // Set new heartbeat timeout
    heartbeatTimeout.current = setTimeout(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        sendMessage({ type: 'ping', timestamp: Date.now() });
        startHeartbeat(); // Schedule the next heartbeat
      }
    }, 30000); // Assuming a default heartbeat interval of 30 seconds
  }, [sendMessage]); // Depend on sendMessage

  const processMessageQueue = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN && messageQueue.current.length > 0) {
      while (messageQueue.current.length > 0) {
        const message = messageQueue.current.shift();
        if (message) {
          ws.current.send(JSON.stringify(message));
        }
      }
    }
  }, []);

  const connect = useCallback(() => {
    // Éviter les connexions multiples
    if (ws.current && (ws.current.readyState === WebSocket.CONNECTING || ws.current.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      setConnectionStatus('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}${url}`;

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connecté');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectCount.current = 0;
        startHeartbeat();
        processMessageQueue();
        if (onOpen) onOpen();
      };

      ws.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;

          // Ignorer les messages de pong
          if (message.type === 'pong') {
            return;
          }

          setLastMessage({
            ...message,
            timestamp: Date.now()
          });

          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('Erreur parsing message WebSocket:', error);
          // Potentially call onError here if parsing fails, or handle differently
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket déconnecté', event.code, event.reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        clearTimeouts();

        // Tentative de reconnexion automatique
        if (reconnect && reconnectCount.current < maxReconnectAttempts && !event.wasClean) {
          reconnectCount.current++;
          const delay = reconnectInterval * Math.pow(1.5, reconnectCount.current - 1);

          console.log(`Tentative de reconnexion ${reconnectCount.current}/${maxReconnectAttempts} dans ${delay}ms`);

          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, delay);
        }
        if (onClose) onClose();
      };

      ws.current.onerror = (error) => {
        console.error('Erreur WebSocket:', error);
        setIsConnected(false);
        setConnectionStatus('error');
        clearTimeouts();
        if (onError) onError(error);
      };
    } catch (error) {
      console.error('Erreur connexion WebSocket:', error);
      setIsConnected(false);
      setConnectionStatus('error');
      // If there's an immediate error creating the WebSocket object
      if (onError) onError(error as any); // Cast to any for broader compatibility if error is not Event
    }
  }, [url, reconnect, maxReconnectAttempts, reconnectInterval, startHeartbeat, processMessageQueue, onOpen, onMessage, onClose, onError]);

  const sendMessage = useCallback((message: WebSocketMessage): boolean => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      try {
        ws.current.send(JSON.stringify({
          ...message,
          timestamp: Date.now()
        }));
        return true;
      } catch (error) {
        console.error('Erreur envoi message WebSocket:', error);
        return false;
      }
    } else {
      // Ajouter à la queue si pas connecté
      messageQueue.current.push(message);
      return false;
    }
  }, []);

  const disconnect = useCallback(() => {
    clearTimeouts();
    if (ws.current) {
      ws.current.close(1000, 'Déconnexion volontaire');
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
    reconnectCount.current = maxReconnectAttempts; // Empêcher la reconnexion automatique
  }, [maxReconnectAttempts]);

  const reconnect = useCallback(() => {
    disconnect();
    reconnectCount.current = 0;
    // Ensure there's a slight delay before attempting to reconnect
    setTimeout(connect, 100);
  }, [connect, disconnect]);

  const getConnectionInfo = useCallback(() => ({
    readyState: ws.current?.readyState ?? WebSocket.CLOSED,
    url: ws.current?.url ?? null,
    protocol: ws.current?.protocol ?? ''
  }), []);

  useEffect(() => {
    connect();

    return () => {
      clearTimeouts();
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect, clearTimeouts]);

  // Nettoyage automatique des anciens messages
  useEffect(() => {
    const cleanup = setInterval(() => {
      setLastMessage(prev => {
        if (prev && prev.timestamp && Date.now() - prev.timestamp > 60000) {
          return null; // Supprimer les messages de plus d'1 minute
        }
        return prev;
      });
    }, 30000);

    return () => clearInterval(cleanup);
  }, []);

  return {
    isConnected,
    lastMessage,
    connectionStatus,
    sendMessage,
    disconnect,
    reconnect,
    getConnectionInfo
  };
}

// This is a simulated WebSocket hook for development purposes.
// In a real application, you would use the actual WebSocket implementation above.
interface SimulatedWebSocketHook {
  sendMessage: (message: any) => void;
  onMessage: (callback: (data: any) => void) => void;
}

export function useSimulatedWebSocket(channel: string): SimulatedWebSocketHook {
  const messageCallbacks = useRef<Array<(data: any) => void>>([]);

  useEffect(() => {
    console.log(`Simulated WebSocket connected to channel: ${channel}`);

    // Simulate receiving messages
    const interval = setInterval(() => {
      if (messageCallbacks.current.length > 0) {
        const simulatedData = {
          timestamp: Date.now(),
          channel: channel,
          payload: `Simulated data for ${channel} at ${new Date().toLocaleTimeString()}`,
        };
        messageCallbacks.current.forEach((callback) => callback(simulatedData));
      }
    }, 5000); // Send simulated message every 5 seconds

    return () => {
      clearInterval(interval);
      console.log(`Simulated WebSocket disconnected from channel: ${channel}`);
    };
  }, [channel]);

  const onMessage = useCallback((callback: (data: any) => void) => {
    messageCallbacks.current.push(callback);
    // Cleanup callback when component unmounts or if callback changes
    return () => {
      messageCallbacks.current = messageCallbacks.current.filter(cb => cb !== callback);
    };
  }, []);

  const sendMessage = useCallback((message: any): void => {
    console.log(`Simulated WebSocket sending message to ${channel}:`, message);
    // In a real scenario, this would send to the server.
    // For simulation, we might just log it or trigger a response.
  }, [channel]);

  return { sendMessage, onMessage };
}