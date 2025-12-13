"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface WebSocketConfig {
  url: string;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

interface WebSocketMessage {
  type: string;
  payload: any;
}

export function useWebSocket(config: WebSocketConfig) {
  const { url, reconnectDelay = 3000, maxReconnectAttempts = 5 } = config;
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttempts.current = 0;
        console.log("WebSocket connected");
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
        } catch {
          console.error("Failed to parse WebSocket message");
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(
            `WebSocket reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`
          );
          reconnectTimeoutRef.current = setTimeout(connect, reconnectDelay);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      wsRef.current = ws;
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
    }
  }, [url, reconnectDelay, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const send = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    // Don't auto-connect - WebSocket server needs to be implemented first
    // connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    connect,
    disconnect,
    send,
  };
}

// Animation utilities for charts
export const chartAnimationConfig = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
};

export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// CSS keyframe animations for charts
export const chartAnimations = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes growWidth {
    from {
      width: 0;
    }
  }
  
  @keyframes growHeight {
    from {
      height: 0;
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }
  
  @keyframes slideInFromRight {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  @keyframes countUp {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.5s ease-out forwards;
  }
  
  .animate-grow-width {
    animation: growWidth 1s ease-out forwards;
  }
  
  .animate-grow-height {
    animation: growHeight 1s ease-out forwards;
  }
  
  .animate-pulse-slow {
    animation: pulse 2s ease-in-out infinite;
  }
  
  .animate-slide-in-right {
    animation: slideInFromRight 0.3s ease-out forwards;
  }
  
  .animate-delay-100 { animation-delay: 100ms; }
  .animate-delay-200 { animation-delay: 200ms; }
  .animate-delay-300 { animation-delay: 300ms; }
  .animate-delay-400 { animation-delay: 400ms; }
  .animate-delay-500 { animation-delay: 500ms; }
`;

// Number animation hook
export function useAnimatedNumber(value: number, duration: number = 1000) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + (endValue - startValue) * easeProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return displayValue;
}
