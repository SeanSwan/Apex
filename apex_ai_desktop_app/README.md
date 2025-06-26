# APEX AI DESKTOP MONITOR

## 🚀 Advanced AI-Powered Security Monitoring Desktop Application

A cutting-edge desktop application for real-time AI security monitoring, featuring live camera feeds, intelligent detection, and automated alerting.

## ✨ Features

### 🎥 Live AI Monitor
- **Multi-Camera Grid**: Display up to 16+ camera feeds simultaneously
- **Adaptive Quality**: Automatic quality switching based on view mode
- **Real-Time AI Overlays**: Bounding boxes with confidence scores
- **Smart Detection**: Person, vehicle, and object detection using YOLOv8
- **Interactive Focus Mode**: Click cameras for detailed investigation

### 🚨 AI Alert System
- **Intelligent Alerts**: Loitering, zone breach, unknown person detection
- **Priority Classification**: Critical, high, medium, low alert levels
- **Real-Time Feed**: Live event stream with detailed information
- **Alert Management**: Search, filter, and export alert logs

### ⚙️ CTO AI Console
- **Camera Management**: Add, configure, and monitor camera streams
- **AI Model Control**: Load and switch between trained models
- **Rule Configuration**: Customize detection zones and alert thresholds
- **System Monitoring**: Performance metrics and health status

### 🎤 "Wow" Features for Demo
- **AI Voice Response**: Simulated voice communication system
- **Digital Zoom**: Auto-zoom on detection events
- **Quick Actions**: Snapshot capture, emergency alerts, backup requests
- **Professional UI**: Dark theme optimized for security operations

## 🛠️ Technical Stack

- **Frontend**: React 18, Styled Components, Electron
- **Backend AI**: Python, YOLOv8 (Ultralytics), OpenCV
- **Communication**: WebSocket (real-time), IPC (Electron-Python)
- **Video Processing**: FFmpeg, HLS streaming
- **Platform**: Cross-platform (Windows, Linux, macOS)

## 📋 Prerequisites

### System Requirements
- **OS**: Windows 10/11, Ubuntu 20.04+, or macOS 11+
- **RAM**: 8GB minimum, 16GB recommended
- **GPU**: NVIDIA GPU recommended for AI acceleration
- **Storage**: 2GB free space

### Software Dependencies
- **Node.js**: 18.0+ (for Electron app)
- **Python**: 3.8+ (for AI engine)
- **FFmpeg**: Latest version (for video processing)

## 🚀 Quick Start

### 1. Install Node.js Dependencies
```bash
cd apex_ai_desktop_app
npm install
```

### 2. Install Python AI Engine
```bash
cd ../apex_ai_engine
pip install -r requirements.txt
```

### 3. Download YOLOv8 Model (Optional)
```bash
# The app will auto-download yolov8n.pt on first run
# For custom models, place .pt files in apex_ai_engine/models/
```

### 4. Start the Application

**Development Mode:**
```bash
# Terminal 1: Start React development server
cd apex_ai_desktop_app
npm run dev

# Terminal 2: Start Python AI Engine
cd ../apex_ai_engine
python inference.py
```

**Production Mode:**
```bash
# Build and run the desktop app
cd apex_ai_desktop_app
npm run build
npm start
```

## 🎬 Demo Configuration

### For July 28th Demo
1. **Prepare Demo Environment**:
   - Ensure stable internet for RTSP streams
   - Have backup video files ready
   - Test all "wow" features beforehand

2. **Camera Setup**:
   - Use provided demo RTSP URLs
   - Configure 4-6 cameras for optimal demo
   - Set up demo detection zones

3. **AI Model**:
   - Start with YOLOv8 nano for speed
   - Upgrade to larger model if performance allows
   - Ensure model is pre-loaded before demo

## 📁 Project Structure

```
apex_ai_desktop_app/
├── main.js                 # Electron main process
├── preload.js             # Secure API bridge
├── package.json           # Dependencies and scripts
└── src/
    ├── App.js             # Main React application
    ├── components/
    │   ├── LiveAIMonitor/ # Core monitoring interface
    │   ├── AIAlertLog/    # Alert management
    │   ├── CTOAIConsole/  # Configuration panel
    │   └── StatusBar/     # System status display
    └── index.js           # React entry point

apex_ai_engine/
├── inference.py           # Main AI processing engine
├── requirements.txt       # Python dependencies
├── config.yaml           # AI engine configuration
└── models/               # AI model storage
```

## 🔧 Configuration

### Camera Configuration
Edit camera settings in the CTO AI Console or modify the demo camera list in `LiveAIMonitor.js`:

```javascript
const demoCameras = [
  {
    id: 'cam_entrance_1',
    name: 'Main Entrance',
    rtspUrl: 'rtsp://your-camera-url',
    location: 'Building A - Ground Floor'
  }
  // Add more cameras...
];
```

### AI Rules Configuration
Customize detection rules in `apex_ai_engine/config.yaml` or through the CTO AI Console interface.

### Performance Tuning
- **For Speed**: Use YOLOv8 nano model, increase frame_skip
- **For Accuracy**: Use YOLOv8 medium/large model, decrease frame_skip
- **For GPU**: Ensure CUDA is installed and `use_gpu: true` in config

## 🐛 Troubleshooting

### Common Issues

**"AI Engine Offline"**
```bash
cd apex_ai_engine
python inference.py
# Check for error messages and ensure WebSocket port 8765 is free
```

**"Camera Connection Error"**
- Verify RTSP URLs are accessible
- Check network connectivity
- Try demo mode for offline testing

**"Model Loading Failed"**
```bash
pip install ultralytics torch
# Ensure internet connection for initial model download
```

**Performance Issues**
- Reduce number of active cameras
- Lower video resolution in config
- Use YOLOv8 nano model
- Enable GPU acceleration

### Development Tools
```bash
# Test AI services integration
cd ../backend
npm run test:ai

# Check Electron app in dev mode
cd apex_ai_desktop_app
npm run dev
```

## 🎯 Demo Talking Points

### For July 28th Presentation

**1. Opening (30 seconds)**
- "This is Apex AI - the next generation of intelligent security monitoring"
- Show clean, professional interface loading

**2. Live AI Monitor (2 minutes)**
- Demonstrate multi-camera grid view
- Show real-time AI detection overlays
- Switch between view modes (Grid → Focus → Investigation)
- Click on detection events to focus cameras

**3. "Wow" Features (1 minute)**
- **AI Voice Response**: Click voice button, play simulated response
- **Digital Zoom**: Click detection event, show auto-zoom
- **Real-Time Alerts**: Show alert feed updating live

**4. CTO Console (1 minute)**
- Quick tour of camera management
- Show AI model selection
- Demonstrate rule configuration

**5. Scalability & Vision (30 seconds)**
- "Currently processing 6 cameras, designed for 300+"
- "Single GPU start, multi-server scalability"
- "Production-ready architecture"

## 📊 Performance Metrics

### Target Performance (July 28th Demo)
- **Camera Capacity**: 6-8 simultaneous streams
- **Detection Latency**: <200ms per frame
- **UI Responsiveness**: 60fps smooth interactions
- **Memory Usage**: <2GB total system impact
- **CPU Usage**: <50% on modern hardware

## 🔒 Security Considerations

- **Local Processing**: All AI inference runs locally
- **Secure Communication**: WebSocket over localhost only
- **No Cloud Dependencies**: Fully offline capable
- **Data Privacy**: Video streams processed in real-time, not stored

## 🚧 Future Roadmap

### Post-Demo Enhancements
- **Face Recognition**: Integration with face database
- **Mobile Alerts**: Push notifications to guard devices
- **Cloud Sync**: Optional cloud backup and sync
- **Advanced Analytics**: Detection trends and reporting
- **Multi-Site Management**: Enterprise dashboard

## 📞 Support

For demo preparation or technical issues:
- Review session notes and documentation
- Test all features before the presentation
- Have backup plans for network/hardware issues
- Ensure all dependencies are pre-installed

---

**⚡ Built for the July 28th Demo | Designed for Production Scale**
