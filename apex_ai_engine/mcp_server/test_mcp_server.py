#!/usr/bin/env python3
"""
APEX AI MCP SERVER TEST SCRIPT
==============================
Comprehensive test suite for the Model Context Protocol server

This script tests:
- MCP server startup and initialization
- All MCP tools (vision, conversation, voice, alerting)
- MCP resources (security scripts, threat profiles)
- Integration with existing AI infrastructure
- WebSocket communication
- API endpoints
"""

import asyncio
import json
import logging
import sys
import time
from pathlib import Path
from typing import Dict, List, Any
import aiohttp
import websockets
import base64
import io
from PIL import Image
import numpy as np

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MCPServerTester:
    """
    Comprehensive test suite for MCP server functionality
    """
    
    def __init__(self, server_host: str = "localhost", server_port: int = 8766):
        self.server_host = server_host
        self.server_port = server_port
        self.base_url = f"http://{server_host}:{server_port}"
        self.websocket_url = f"ws://{server_host}:{server_port}"
        
        # Test results
        self.test_results = {
            'total_tests': 0,
            'passed_tests': 0,
            'failed_tests': 0,
            'test_details': []
        }
        
        logger.info(f"🧪 MCP Server Tester initialized: {self.base_url}")

    async def run_all_tests(self):
        """Run all test suites"""
        print("\n" + "="*80)
        print("       🧪 APEX AI MCP SERVER - COMPREHENSIVE TEST SUITE")
        print("="*80)
        
        try:
            # Basic connectivity tests
            await self.test_server_connectivity()
            await self.test_api_endpoints()
            
            # MCP tool tests
            await self.test_vision_analysis_tool()
            await self.test_conversation_tool()
            await self.test_voice_synthesis_tool()
            await self.test_alerting_tool()
            
            # MCP resource tests
            await self.test_security_scripts_resource()
            await self.test_threat_profiles_resource()
            
            # Integration tests
            await self.test_websocket_communication()
            await self.test_unified_api()
            
            # Performance tests
            await self.test_performance_metrics()
            
        except Exception as e:
            logger.error(f"❌ Test suite execution failed: {e}")
            await self.record_test_result("Test Suite Execution", False, str(e))
        
        # Display results
        await self.display_test_results()

    async def test_server_connectivity(self):
        """Test basic server connectivity"""
        print("\n📡 Testing Server Connectivity...")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/") as response:
                    if response.status == 200:
                        data = await response.json()
                        await self.record_test_result("Server Root Endpoint", True, 
                                                    f"Status: {data.get('status', 'unknown')}")
                    else:
                        await self.record_test_result("Server Root Endpoint", False, 
                                                    f"HTTP {response.status}")
        except Exception as e:
            await self.record_test_result("Server Root Endpoint", False, str(e))

    async def test_api_endpoints(self):
        """Test core API endpoints"""
        print("\n🔧 Testing API Endpoints...")
        
        endpoints = [
            ("/mcp/tools", "GET", "Tools List"),
            ("/mcp/resources", "GET", "Resources List"),
        ]
        
        for endpoint, method, description in endpoints:
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.request(method, f"{self.base_url}{endpoint}") as response:
                        if response.status == 200:
                            data = await response.json()
                            await self.record_test_result(f"API {description}", True, 
                                                        f"Returned {len(data)} items")
                        else:
                            await self.record_test_result(f"API {description}", False, 
                                                        f"HTTP {response.status}")
            except Exception as e:
                await self.record_test_result(f"API {description}", False, str(e))

    async def test_vision_analysis_tool(self):
        """Test vision analysis tool"""
        print("\n👁️ Testing Vision Analysis Tool...")
        
        try:
            # Create test image
            test_image = self.create_test_image()
            
            payload = {
                "image_data": test_image,
                "camera_id": "test_camera_001",
                "timestamp": "2024-07-16T10:30:00Z",
                "analysis_type": "threat_detection",
                "options": {
                    "confidence_threshold": 0.5,
                    "threat_assessment": True
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.base_url}/mcp/tools/vision_analysis/execute", 
                                      json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        success = data.get('success', False)
                        await self.record_test_result("Vision Analysis Tool", success, 
                                                    f"Detections: {len(data.get('result', {}).get('detections', []))}")
                    else:
                        await self.record_test_result("Vision Analysis Tool", False, 
                                                    f"HTTP {response.status}")
        except Exception as e:
            await self.record_test_result("Vision Analysis Tool", False, str(e))

    async def test_conversation_tool(self):
        """Test conversation tool"""
        print("\n💬 Testing Conversation Tool...")
        
        try:
            payload = {
                "conversation_id": "test_conv_001",
                "camera_id": "test_camera_001",
                "situation_context": {
                    "threat_level": "medium",
                    "detection_type": "unauthorized_person",
                    "location": "lobby",
                    "time_of_day": "after_hours"
                },
                "interaction_type": "initiate",
                "options": {
                    "enable_ai_generation": False,  # Use scripts for testing
                    "max_escalation_level": 3
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.base_url}/mcp/tools/conversation/execute", 
                                      json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        success = data.get('success', False)
                        response_text = data.get('result', {}).get('response_text', '')
                        await self.record_test_result("Conversation Tool", success, 
                                                    f"Response length: {len(response_text)} chars")
                    else:
                        await self.record_test_result("Conversation Tool", False, 
                                                    f"HTTP {response.status}")
        except Exception as e:
            await self.record_test_result("Conversation Tool", False, str(e))

    async def test_voice_synthesis_tool(self):
        """Test voice synthesis tool"""
        print("\n🎤 Testing Voice Synthesis Tool...")
        
        try:
            payload = {
                "text": "This is a test security alert",
                "voice_profile": "security_professional",
                "language": "en-US",
                "context": {
                    "urgency": "medium",
                    "scenario": "test_scenario",
                    "location": "test_location"
                },
                "options": {
                    "output_format": "mp3",
                    "enable_cache": False
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.base_url}/mcp/tools/voice_synthesis/execute", 
                                      json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        success = data.get('success', False)
                        duration = data.get('result', {}).get('duration', 0)
                        await self.record_test_result("Voice Synthesis Tool", success, 
                                                    f"Audio duration: {duration:.1f}s")
                    else:
                        await self.record_test_result("Voice Synthesis Tool", False, 
                                                    f"HTTP {response.status}")
        except Exception as e:
            await self.record_test_result("Voice Synthesis Tool", False, str(e))

    async def test_alerting_tool(self):
        """Test alerting tool"""
        print("\n🚨 Testing Alerting Tool...")
        
        try:
            payload = {
                "alert_type": "unauthorized_person",
                "camera_id": "test_camera_001",
                "location": "test_lobby",
                "severity": "high",
                "detection_details": {
                    "confidence": 0.87,
                    "detection_type": "person",
                    "bounding_box": {"x": 0.1, "y": 0.1, "width": 0.2, "height": 0.3}
                },
                "custom_message": "Test alert from MCP server",
                "options": {
                    "auto_dispatch": False,  # Don't actually dispatch for testing
                    "voice_announcement": True,
                    "escalation_enabled": True
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.base_url}/mcp/tools/alerting/execute", 
                                      json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        success = data.get('success', False)
                        alert_id = data.get('result', {}).get('alert_id', '')
                        await self.record_test_result("Alerting Tool", success, 
                                                    f"Alert ID: {alert_id}")
                    else:
                        await self.record_test_result("Alerting Tool", False, 
                                                    f"HTTP {response.status}")
        except Exception as e:
            await self.record_test_result("Alerting Tool", False, str(e))

    async def test_security_scripts_resource(self):
        """Test security scripts resource"""
        print("\n📚 Testing Security Scripts Resource...")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/mcp/resources/security_scripts") as response:
                    if response.status == 200:
                        data = await response.json()
                        success = data.get('success', False)
                        scripts = data.get('data', {}).get('security_scripts', {})
                        await self.record_test_result("Security Scripts Resource", success, 
                                                    f"Loaded {len(scripts)} scripts")
                    else:
                        await self.record_test_result("Security Scripts Resource", False, 
                                                    f"HTTP {response.status}")
        except Exception as e:
            await self.record_test_result("Security Scripts Resource", False, str(e))

    async def test_threat_profiles_resource(self):
        """Test threat profiles resource"""
        print("\n🎯 Testing Threat Profiles Resource...")
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/mcp/resources/threat_profiles") as response:
                    if response.status == 200:
                        data = await response.json()
                        success = data.get('success', False)
                        profiles = data.get('data', {}).get('threat_levels', {})
                        await self.record_test_result("Threat Profiles Resource", success, 
                                                    f"Loaded {len(profiles)} threat levels")
                    else:
                        await self.record_test_result("Threat Profiles Resource", False, 
                                                    f"HTTP {response.status}")
        except Exception as e:
            await self.record_test_result("Threat Profiles Resource", False, str(e))

    async def test_websocket_communication(self):
        """Test WebSocket communication"""
        print("\n🔌 Testing WebSocket Communication...")
        
        try:
            websocket_url = f"{self.websocket_url}/mcp/ws/test_client"
            
            async with websockets.connect(websocket_url) as websocket:
                # Wait for connection message
                connection_msg = await websocket.recv()
                connection_data = json.loads(connection_msg)
                
                if connection_data.get('type') == 'connection_established':
                    await self.record_test_result("WebSocket Connection", True, 
                                                f"Client ID: {connection_data.get('client_id')}")
                    
                    # Test ping/pong
                    ping_msg = {
                        "type": "ping",
                        "payload": {"timestamp": time.time()}
                    }
                    await websocket.send(json.dumps(ping_msg))
                    
                    pong_msg = await websocket.recv()
                    pong_data = json.loads(pong_msg)
                    
                    if pong_data.get('type') == 'pong':
                        await self.record_test_result("WebSocket Ping/Pong", True, 
                                                    "Response received")
                    else:
                        await self.record_test_result("WebSocket Ping/Pong", False, 
                                                    f"Unexpected response: {pong_data}")
                else:
                    await self.record_test_result("WebSocket Connection", False, 
                                                f"Unexpected message: {connection_data}")
                    
        except Exception as e:
            await self.record_test_result("WebSocket Communication", False, str(e))

    async def test_unified_api(self):
        """Test unified API endpoints"""
        print("\n🔗 Testing Unified API...")
        
        # Test unified vision analysis
        try:
            test_image = self.create_test_image()
            payload = {
                "image_data": test_image,
                "camera_id": "test_camera_unified",
                "analysis_type": "threat_detection"
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.base_url}/api/unified/vision-analysis", 
                                      json=payload) as response:
                    if response.status == 200:
                        data = await response.json()
                        success = data.get('success', False)
                        await self.record_test_result("Unified Vision API", success, 
                                                    "Endpoint accessible")
                    else:
                        await self.record_test_result("Unified Vision API", False, 
                                                    f"HTTP {response.status}")
        except Exception as e:
            await self.record_test_result("Unified Vision API", False, str(e))

    async def test_performance_metrics(self):
        """Test performance metrics and statistics"""
        print("\n📊 Testing Performance Metrics...")
        
        try:
            # Get server statistics
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{self.base_url}/") as response:
                    if response.status == 200:
                        data = await response.json()
                        stats = data.get('stats', {})
                        uptime = data.get('uptime', 0)
                        await self.record_test_result("Server Statistics", True, 
                                                    f"Uptime: {uptime:.1f}s")
                    else:
                        await self.record_test_result("Server Statistics", False, 
                                                    f"HTTP {response.status}")
        except Exception as e:
            await self.record_test_result("Server Statistics", False, str(e))

    def create_test_image(self) -> str:
        """Create a test image for vision analysis"""
        # Create a simple test image
        image = Image.new('RGB', (640, 480), color='blue')
        
        # Convert to base64
        buffer = io.BytesIO()
        image.save(buffer, format='JPEG')
        image_data = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        return image_data

    async def record_test_result(self, test_name: str, success: bool, details: str = ""):
        """Record a test result"""
        self.test_results['total_tests'] += 1
        
        if success:
            self.test_results['passed_tests'] += 1
            status = "✅ PASS"
        else:
            self.test_results['failed_tests'] += 1
            status = "❌ FAIL"
        
        result = {
            'test_name': test_name,
            'success': success,
            'details': details,
            'timestamp': time.time()
        }
        
        self.test_results['test_details'].append(result)
        print(f"   {status} {test_name}: {details}")

    async def display_test_results(self):
        """Display comprehensive test results"""
        print("\n" + "="*80)
        print("                    📊 TEST RESULTS SUMMARY")
        print("="*80)
        
        total = self.test_results['total_tests']
        passed = self.test_results['passed_tests']
        failed = self.test_results['failed_tests']
        success_rate = (passed / total * 100) if total > 0 else 0
        
        print(f"Total Tests:    {total}")
        print(f"Passed:         {passed} ✅")
        print(f"Failed:         {failed} ❌")
        print(f"Success Rate:   {success_rate:.1f}%")
        
        if failed > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results['test_details']:
                if not result['success']:
                    print(f"   • {result['test_name']}: {result['details']}")
        
        print("\n" + "="*80)
        
        if success_rate >= 80:
            print("🎉 MCP Server is functioning well!")
        elif success_rate >= 60:
            print("⚠️ MCP Server has some issues that need attention")
        else:
            print("❌ MCP Server has significant issues requiring immediate attention")
        
        print("="*80)

    async def run_stress_test(self, duration: int = 60):
        """Run stress test for specified duration"""
        print(f"\n🔥 Running Stress Test for {duration} seconds...")
        
        start_time = time.time()
        request_count = 0
        error_count = 0
        
        async def make_request():
            nonlocal request_count, error_count
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(f"{self.base_url}/") as response:
                        if response.status == 200:
                            request_count += 1
                        else:
                            error_count += 1
            except:
                error_count += 1
        
        # Run concurrent requests
        while time.time() - start_time < duration:
            tasks = [make_request() for _ in range(10)]
            await asyncio.gather(*tasks, return_exceptions=True)
            await asyncio.sleep(0.1)
        
        elapsed = time.time() - start_time
        rps = request_count / elapsed
        
        print(f"Stress Test Results:")
        print(f"   • Duration: {elapsed:.1f}s")
        print(f"   • Requests: {request_count}")
        print(f"   • Errors: {error_count}")
        print(f"   • RPS: {rps:.1f}")
        print(f"   • Error Rate: {error_count/(request_count+error_count)*100:.1f}%")

async def main():
    """Main test execution"""
    import argparse
    
    parser = argparse.ArgumentParser(description="APEX AI MCP Server Test Suite")
    parser.add_argument("--host", default="localhost", help="Server host")
    parser.add_argument("--port", type=int, default=8766, help="Server port")
    parser.add_argument("--stress", action="store_true", help="Run stress test")
    parser.add_argument("--duration", type=int, default=60, help="Stress test duration")
    
    args = parser.parse_args()
    
    # Initialize tester
    tester = MCPServerTester(args.host, args.port)
    
    # Run tests
    await tester.run_all_tests()
    
    # Run stress test if requested
    if args.stress:
        await tester.run_stress_test(args.duration)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n🛑 Test execution interrupted by user")
    except Exception as e:
        print(f"❌ Test execution failed: {e}")
        import traceback
        traceback.print_exc()
