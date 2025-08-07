"""
APEX AI DEMO VERIFICATION SCRIPT
================================
Quick test to verify all components are working correctly
"""

import asyncio
import websockets
import json
import sys
from datetime import datetime

async def test_ai_engine():
    """Test the AI engine WebSocket connection"""
    print("🧠 Testing AI Engine connection...")
    
    try:
        uri = "ws://localhost:8765"
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to AI Engine successfully!")
            
            # Send a test message
            test_message = {
                "command": "get_status",
                "data": {}
            }
            await websocket.send(json.dumps(test_message))
            
            # Wait for response
            response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            response_data = json.loads(response)
            
            print(f"✅ AI Engine responded: {response_data.get('type', 'unknown')}")
            return True
            
    except websockets.exceptions.ConnectionRefused:
        print("❌ AI Engine not running (connection refused)")
        return False
    except asyncio.TimeoutError:
        print("❌ AI Engine not responding (timeout)")
        return False
    except Exception as e:
        print(f"❌ AI Engine test failed: {e}")
        return False

def test_demo_files():
    """Test if all required demo files exist"""
    print("📁 Testing demo files...")
    
    import os
    required_files = [
        "apex_ai_engine/inference.py",
        "apex_ai_engine/config.yaml",
        "apex_ai_engine/requirements.txt",
        "apex_ai_desktop_app/main.js",
        "apex_ai_desktop_app/package.json",
        "apex_ai_desktop_app/src/App.js"
    ]
    
    missing_files = []
    for file_path in required_files:
        if not os.path.exists(file_path):
            missing_files.append(file_path)
    
    if missing_files:
        print("❌ Missing demo files:")
        for file_path in missing_files:
            print(f"   • {file_path}")
        return False
    else:
        print("✅ All demo files present")
        return True

async def main():
    """Main verification function"""
    print("=" * 50)
    print("   APEX AI DEMO VERIFICATION")
    print("=" * 50)
    print(f"Test time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Test 1: Files
    files_ok = test_demo_files()
    print()
    
    # Test 2: AI Engine
    ai_engine_ok = await test_ai_engine()
    print()
    
    # Summary
    print("=" * 50)
    print("   VERIFICATION SUMMARY")
    print("=" * 50)
    
    if files_ok and ai_engine_ok:
        print("🎉 ALL TESTS PASSED - Demo is ready!")
        print()
        print("Demo Launch Instructions:")
        print("1. Run: START_APEX_AI_DEMO.bat")
        print("2. Wait for both windows to open")
        print("3. Focus on the Desktop App window")
        print("4. Navigate through the tabs to show features")
        return 0
    else:
        print("⚠️  ISSUES FOUND:")
        if not files_ok:
            print("   • Missing demo files")
        if not ai_engine_ok:
            print("   • AI Engine not running")
        print()
        print("Fix Instructions:")
        if not ai_engine_ok:
            print("   • Start AI Engine: python apex_ai_engine/inference.py")
        print("   • Then re-run this verification")
        return 1

if __name__ == "__main__":
    try:
        result = asyncio.run(main())
        sys.exit(result)
    except KeyboardInterrupt:
        print("\n🛑 Verification cancelled by user")
        sys.exit(1)
