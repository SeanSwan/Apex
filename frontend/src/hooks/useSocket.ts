/**
 * APEX AI SIMPLE SOCKET HOOK
 * ==========================
 * Simple hook to access the WebSocket instance from context
 * Compatible with AlertManager and other components needing direct socket access
 */

import { useContext } from 'react'
import { WebSocketContext } from './useEnhancedWebSocket'

/**
 * Simple hook to get the socket instance from WebSocket context
 * Returns null if not connected or context not available
 */
export const useSocket = () => {
  const context = useContext(WebSocketContext)
  
  if (!context) {
    console.warn('useSocket must be used within a WebSocketProvider')
    return null
  }
  
  return context.socket
}

export default useSocket