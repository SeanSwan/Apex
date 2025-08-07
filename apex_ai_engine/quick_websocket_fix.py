#!/usr/bin/env python3
"""
APEX AI - QUICK FIX SCRIPT FOR WEBSOCKET CLIENT
===============================================
Applies a quick fix to the WebSocket client attribute error
"""

import sys
import os
from pathlib import Path

def apply_websocket_fix():
    """Apply quick fix to WebSocket client"""
    
    print("🔧 Applying WebSocket Client Fix...")
    
    websocket_file = Path(__file__).parent / "enhanced_websocket_client.py"
    
    if not websocket_file.exists():
        print("❌ WebSocket client file not found")
        return False
    
    try:
        # Read the file
        with open(websocket_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Apply fixes
        fixes_applied = 0
        
        # Fix 1: Ensure websocket attribute exists
        if "self.websocket" in content and "self.sio" in content:
            content = content.replace("self.websocket", "self.sio")
            fixes_applied += 1
            print("✅ Fixed websocket attribute reference")
        
        # Fix 2: Add missing websocket attribute if needed
        if "def __init__" in content and "self.websocket = None" not in content:
            content = content.replace(
                "self.sio = socketio.AsyncClient()",
                "self.sio = socketio.AsyncClient()\n        self.websocket = self.sio  # Compatibility alias"
            )
            fixes_applied += 1
            print("✅ Added websocket compatibility alias")
        
        if fixes_applied > 0:
            # Write back the fixed content
            with open(websocket_file, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"✅ Applied {fixes_applied} fixes to WebSocket client")
            return True
        else:
            print("ℹ️ No fixes needed for WebSocket client")
            return True
            
    except Exception as e:
        print(f"❌ Failed to apply WebSocket fix: {e}")
        return False

if __name__ == "__main__":
    success = apply_websocket_fix()
    if success:
        print("\n🎉 WebSocket client fix applied successfully!")
        print("🚀 You can now run the fixed correlation demo:")
        print("   python fixed_correlation_demo.py")
    else:
        print("\n❌ Fix failed - but the fixed demo should still work with fallbacks")
        
    input("\nPress Enter to continue...")
