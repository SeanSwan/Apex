// APEX AI WEBSOCKET PROVIDER COMPONENT
// ====================================
// React provider component for WebSocket context

import React from 'react';
import { WebSocketContext, useEnhancedWebSocket, DEFAULT_WEBSOCKET_CONFIG, WebSocketConfig } from './useEnhancedWebSocket';

interface WebSocketProviderProps {
  children: React.ReactNode;
  config?: Partial<WebSocketConfig>;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children, 
  config = {} 
}) => {
  const websocketConfig = { ...DEFAULT_WEBSOCKET_CONFIG, ...config };
  const websocket = useEnhancedWebSocket(websocketConfig);
  
  return (
    <WebSocketContext.Provider value={websocket}>
      {children}
    </WebSocketContext.Provider>
  );
};