#!/usr/bin/env python3
"""
Quick Connection Test for Fixed WebSocket Architecture
=====================================================
Tests the corrected Socket.io connection between AI Engine and Backend
"""

import asyncio
import sys
import os

# Add the apex_ai_engine directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'apex_ai_engine'))

from apex_ai_engine.enhanced_websocket_client import EnhancedWebSocketClient

async def test_connection():
    """Test the enhanced WebSocket connection"""
    print("🔧 TESTING FIXED WEBSOCKET CONNECTION")
    print("====================================")
    
    # Create client
    client = EnhancedWebSocketClient(
        server_url="http://localhost:5000",
        auth_token="apex_ai_engine_2024"
    )
    
    print("1. 🔌 Attempting to connect to backend...")
    
    # Try to connect
    success = await client.connect()
    
    if success:
        print("2. ✅ CONNECTION SUCCESSFUL!")
        print("3. 🏷️ Client identification sent")
        print("4. 🔐 Authentication completed")
        
        # Send a test message
        await client.send_message('test_message', {
            'message': 'Hello from fixed AI Engine!',
            'test_type': 'connection_verification',
            'timestamp': 1234567890
        })
        
        print("5. 📤 Test message sent")
        
        # Wait a bit
        await asyncio.sleep(3)
        
        # Get stats
        stats = client.get_stats()
        print(f"6. 📊 Connection stats: {stats}")
        
        print("7. 🎉 CONNECTION FIX SUCCESSFUL!")
        print("\n🚀 Ready to proceed with TIER 2 visual alerts!")
        
        # Disconnect gracefully
        await client.disconnect()
        
    else:
        print("2. ❌ CONNECTION FAILED")
        print("   Check if backend is running on port 5000")
        
        # Get stats for debugging
        stats = client.get_stats()
        print(f"   Debug stats: {stats}")

if __name__ == "__main__":
    asyncio.run(test_connection())
