# APEX AI MCP SERVER - MODEL CONTEXT PROTOCOL IMPLEMENTATION

## 🚀 Overview

The APEX AI MCP Server is the **central nervous system** for all AI capabilities in your Enhanced DVR Security System. It implements the Model Context Protocol (MCP) to provide a unified, scalable, and flexible architecture for AI service orchestration.

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Integration](#integration)
- [Troubleshooting](#troubleshooting)

## ✨ Features

### 🧠 AI Capabilities
- **Vision Analysis Tool**: YOLO-based object detection with security threat assessment
- **Conversation Tool**: LLM-powered suspect interaction with escalation logic
- **Voice Synthesis Tool**: AI-powered text-to-speech with emotion modulation
- **Alerting Tool**: Comprehensive notification and dispatch system

### 📚 MCP Resources
- **Security Scripts**: Pre-approved conversation templates for various scenarios
- **Threat Profiles**: Comprehensive threat classification and response protocols

### 🔧 Technical Features
- **FastAPI Server**: Production-ready HTTP/WebSocket API
- **Async/Await**: High-performance asynchronous processing
- **WebSocket Support**: Real-time communication with frontend
- **Unified API**: Single endpoint for all AI services
- **Integration Bridge**: Compatibility with existing AI infrastructure

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    APEX AI MCP SERVER                          │
├─────────────────────────────────────────────────────────────────┤
│  🧠 MCP TOOLS                    │  📚 MCP RESOURCES            │
│  ├── Vision Analysis Tool        │  ├── Security Scripts        │
│  ├── Conversation Tool           │  └── Threat Profiles         │
│  ├── Voice Synthesis Tool        │                               │
│  └── Alerting Tool               │                               │
├─────────────────────────────────────────────────────────────────┤
│  🔧 FASTAPI SERVER              │  🔌 WEBSOCKET HANDLER        │
│  ├── HTTP API Endpoints         │  ├── Real-time Communication │
│  ├── Tool Execution             │  ├── Client Management       │
│  └── Resource Access            │  └── Message Broadcasting    │
├─────────────────────────────────────────────────────────────────┤
│  🔗 INTEGRATION LAYER           │  📊 MONITORING & STATS       │
│  ├── Unified API               │  ├── Performance Metrics     │
│  ├── Backward Compatibility    │  ├── Health Checks          │
│  └── Legacy Bridge             │  └── Error Handling         │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd apex_ai_engine/mcp_server
pip install -r requirements.txt
```

### 2. Start the Server
```bash
python start_mcp_server.py --mode full
```

### 3. Test the Installation
```bash
python test_mcp_server.py
```

### 4. Access the API
- **HTTP API**: http://localhost:8766
- **WebSocket**: ws://localhost:8766/mcp/ws/your_client_id
- **API Documentation**: http://localhost:8766/docs

## 📦 Installation

### Prerequisites
- Python 3.8+
- PostgreSQL (for database integration)
- CUDA (optional, for GPU acceleration)

### Step 1: Environment Setup
```bash
# Create virtual environment
python -m venv mcp_env
source mcp_env/bin/activate  # On Windows: mcp_env\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Environment Variables
Create a `.env` file in the `mcp_server` directory:

```env
# Database Configuration
PG_HOST=localhost
PG_DB=apex
PG_USER=swanadmin
PG_PASSWORD=your_password
PG_PORT=5432

# AI Service API Keys
OPENAI_API_KEY=your_openai_key
AZURE_TTS_KEY=your_azure_tts_key
AZURE_TTS_REGION=eastus

# Server Configuration
MCP_SERVER_HOST=0.0.0.0
MCP_SERVER_PORT=8766
```

### Step 3: Initialize Database
```bash
# Run database setup (if not already done)
cd ../backend
node setup-database.mjs
```

## ⚙️ Configuration

The MCP server uses YAML configuration files:

### Main Configuration (`config.yaml`)
```yaml
server:
  host: "0.0.0.0"
  port: 8766
  debug: true

ai_models:
  vision_model: "yolov8n.pt"
  conversation_model: "gpt-3.5-turbo"
  voice_model: "azure-tts"

tools:
  vision_analysis:
    enabled: true
    timeout: 30
  conversation:
    enabled: true
    timeout: 15
  voice_synthesis:
    enabled: true
    timeout: 10
  alerting:
    enabled: true
    timeout: 5
```

### Integration Configuration
```yaml
integration_mode:
  unified_api: true
  backward_compatibility: true
  migration_mode: true

existing_ai:
  enabled: true
  websocket_port: 8765
  bridge_mode: true
```

## 🔧 Usage

### Starting the Server

#### Full Integration Mode (Recommended)
```bash
python start_mcp_server.py --mode full
```

#### MCP Server Only
```bash
python start_mcp_server.py --mode mcp-only
```

#### Custom Configuration
```bash
python start_mcp_server.py --mode full --config custom_config.yaml --port 8080
```

### Using the API

#### HTTP API Example
```python
import aiohttp
import asyncio

async def analyze_frame():
    payload = {
        "image_data": "base64_encoded_image",
        "camera_id": "camera_001",
        "analysis_type": "threat_detection"
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            "http://localhost:8766/mcp/tools/vision_analysis/execute",
            json=payload
        ) as response:
            result = await response.json()
            print(f"Detections: {result['result']['detections']}")

asyncio.run(analyze_frame())
```

#### WebSocket Example
```python
import asyncio
import websockets
import json

async def websocket_client():
    uri = "ws://localhost:8766/mcp/ws/client_001"
    
    async with websockets.connect(uri) as websocket:
        # Wait for connection message
        message = await websocket.recv()
        print(f"Connected: {message}")
        
        # Send vision analysis request
        request = {
            "type": "execute_tool",
            "payload": {
                "tool_name": "vision_analysis",
                "payload": {
                    "image_data": "base64_encoded_image",
                    "camera_id": "camera_001"
                }
            }
        }
        
        await websocket.send(json.dumps(request))
        response = await websocket.recv()
        print(f"Response: {response}")

asyncio.run(websocket_client())
```

## 📚 API Documentation

### Core Endpoints

#### Server Status
```
GET /
```
Returns server status and statistics.

#### List Tools
```
GET /mcp/tools
```
Returns available MCP tools.

#### List Resources
```
GET /mcp/resources
```
Returns available MCP resources.

#### Execute Tool
```
POST /mcp/tools/{tool_name}/execute
```
Executes a specific MCP tool.

#### Get Resource
```
GET /mcp/resources/{resource_name}
```
Retrieves a specific MCP resource.

### Tool-Specific APIs

#### Vision Analysis
```
POST /mcp/tools/vision_analysis/execute
```
Payload:
```json
{
  "image_data": "base64_encoded_image",
  "camera_id": "camera_001",
  "analysis_type": "threat_detection",
  "options": {
    "confidence_threshold": 0.5,
    "threat_assessment": true
  }
}
```

#### Conversation
```
POST /mcp/tools/conversation/execute
```
Payload:
```json
{
  "conversation_id": "conv_001",
  "camera_id": "camera_001",
  "situation_context": {
    "threat_level": "medium",
    "detection_type": "unauthorized_person",
    "location": "lobby"
  },
  "interaction_type": "initiate"
}
```

#### Voice Synthesis
```
POST /mcp/tools/voice_synthesis/execute
```
Payload:
```json
{
  "text": "Security alert message",
  "voice_profile": "security_professional",
  "language": "en-US"
}
```

#### Alerting
```
POST /mcp/tools/alerting/execute
```
Payload:
```json
{
  "alert_type": "unauthorized_person",
  "camera_id": "camera_001",
  "location": "lobby",
  "severity": "high",
  "custom_message": "Unauthorized person detected"
}
```

### Unified API

#### Unified Vision Analysis
```
POST /api/unified/vision-analysis
```

#### Unified Conversation
```
POST /api/unified/conversation
```

#### Unified Voice Synthesis
```
POST /api/unified/voice-synthesis
```

#### Unified Alerting
```
POST /api/unified/alert
```

## 🧪 Testing

### Run All Tests
```bash
python test_mcp_server.py
```

### Run Specific Test Categories
```bash
python test_mcp_server.py --host localhost --port 8766
```

### Run Stress Tests
```bash
python test_mcp_server.py --stress --duration 120
```

### Test Output Example
```
🧪 APEX AI MCP SERVER - COMPREHENSIVE TEST SUITE
================================================================================
📡 Testing Server Connectivity...
   ✅ PASS Server Root Endpoint: Status: operational

🔧 Testing API Endpoints...
   ✅ PASS API Tools List: Returned 4 items
   ✅ PASS API Resources List: Returned 2 items

👁️ Testing Vision Analysis Tool...
   ✅ PASS Vision Analysis Tool: Detections: 2

💬 Testing Conversation Tool...
   ✅ PASS Conversation Tool: Response length: 127 chars
```

## 🔗 Integration

### With Existing AI Infrastructure

The MCP server provides seamless integration with your existing AI infrastructure:

#### Integration Modes
1. **Full Integration**: MCP server + existing AI engine
2. **MCP Only**: New MCP-based architecture only
3. **Bridge Mode**: Gradual migration from existing to MCP

#### Example Integration
```python
from integration import ApexAIIntegration

# Initialize integration
integration = ApexAIIntegration("config.yaml")

# Start full integration
await integration.start_integration()

# Check status
status = integration.get_integration_status()
print(f"Integration active: {status['integration_active']}")
```

### With Electron Desktop App

The MCP server communicates with your Electron desktop app via WebSocket:

```javascript
// Electron renderer process
const ws = new WebSocket('ws://localhost:8766/mcp/ws/desktop_app');

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    
    switch (data.type) {
        case 'visual_alert':
            displayVisualAlert(data);
            break;
        case 'audio_alert':
            playAudioAlert(data);
            break;
        case 'guard_dispatch':
            handleGuardDispatch(data);
            break;
    }
};
```

### With Backend API

The MCP server integrates with your Node.js backend:

```javascript
// Node.js backend integration
const axios = require('axios');

async function analyzeFrame(imageData, cameraId) {
    const response = await axios.post(
        'http://localhost:8766/api/unified/vision-analysis',
        {
            image_data: imageData,
            camera_id: cameraId,
            analysis_type: 'threat_detection'
        }
    );
    
    return response.data;
}
```

## 🛠️ Troubleshooting

### Common Issues

#### Server Won't Start
```bash
# Check dependencies
pip install -r requirements.txt

# Check port availability
netstat -an | grep 8766

# Check environment variables
python -c "import os; print(os.getenv('OPENAI_API_KEY'))"
```

#### Tools Not Loading
```bash
# Check model files
ls -la yolov8n.pt

# Check database connection
python -c "import psycopg2; print('DB OK')"

# Check API keys
python -c "import openai; print('OpenAI OK')"
```

#### Performance Issues
```bash
# Monitor memory usage
python -c "import psutil; print(f'Memory: {psutil.virtual_memory().percent}%')"

# Check GPU availability
python -c "import torch; print(f'CUDA: {torch.cuda.is_available()}')"
```

### Debug Mode

Enable debug mode for detailed logging:

```bash
python start_mcp_server.py --mode full --config debug_config.yaml
```

Debug configuration:
```yaml
server:
  debug: true
  log_level: "DEBUG"

tools:
  vision_analysis:
    debug: true
    log_detections: true
```

### Log Files

Logs are stored in:
- `logs/mcp_server.log` - Main server log
- `logs/vision_analysis.log` - Vision tool log
- `logs/conversation.log` - Conversation tool log
- `logs/integration.log` - Integration log

## 🤝 Support

For support and questions:

1. **Check the logs** in the `logs/` directory
2. **Run the test suite** to identify issues
3. **Check the configuration** files
4. **Verify environment variables** are set correctly

## 📄 License

This MCP server implementation is part of the APEX AI Enhanced DVR Security System and follows the same licensing terms as the main project.

---

**🎉 Congratulations! You now have a fully functional MCP server that serves as the central nervous system for your AI-powered security system.**

The MCP implementation provides:
- ✅ **Unified AI orchestration** through the Model Context Protocol
- ✅ **Scalable architecture** that can grow with your needs
- ✅ **Production-ready performance** with async/await
- ✅ **Seamless integration** with existing infrastructure
- ✅ **Comprehensive testing** and monitoring capabilities

Your Phase 2a AI infrastructure is now complete and ready for production deployment!
