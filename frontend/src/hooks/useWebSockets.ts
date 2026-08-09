import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

export interface WebSocketNotification {
  type: string;
  [key: string]: any;
}

export const useWebSockets = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<WebSocketNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.close();
      }
      return;
    }

    const wsUrl = `ws://localhost:8000/ws/${user.id}`;
    const connect = () => {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        console.log("WebSocket connected successfully to", wsUrl);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setNotifications((prev) => [data, ...prev].slice(0, 50)); // Keep last 50
        } catch (err) {
          console.error("WebSocket message parse error:", err);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        console.log("WebSocket connection closed. Reconnecting in 5 seconds...");
        setTimeout(() => {
          if (user) connect(); // Reconnect if user still logged in
        }, 5000);
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
      };
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user]);

  const clearNotifications = () => setNotifications([]);

  return { isConnected, notifications, clearNotifications };
};
