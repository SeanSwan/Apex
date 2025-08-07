# 🏢 APEX AI Dispatcher Dashboard - Camera Integration Guide

Welcome to your professional security dispatcher interface! This guide will help you integrate your DVR/IP cameras with the AI alert system.

## 🚀 Quick Start

### 1. Access the Dispatcher Dashboard
Navigate to: `http://localhost:5173/dispatcher`

### 2. What You'll See
- **Live Camera Grid**: 2x2, 3x3, or 4x4 layout options
- **Real-time Alert Overlays**: AI alerts appear directly over camera feeds
- **Professional Controls**: Audio system, voice response, alert management
- **Camera Management**: Add, configure, and test camera connections

## 📹 Adding Your Cameras

### Supported Camera Types
- **Hikvision DVR/NVR**: Most common security system
- **Dahua DVR/NVR**: Popular alternative brand
- **Generic MJPEG Cameras**: Standard IP cameras
- **Generic HTTP Streams**: Custom streaming sources
- **RTSP Cameras**: Professional IP cameras

### Configuration Steps

1. **Click "Add Camera"** in the dashboard header
2. **Select your device type** from the dropdown:
   - Hikvision DVR/NVR
   - Dahua DVR/NVR
   - Generic MJPEG Camera
   - Generic HTTP Stream
   - RTSP Camera

3. **Enter connection details**:
   - **IP Address**: Your DVR/camera IP (e.g., `192.168.1.100`)
   - **Port**: Usually `80` for HTTP, `554` for RTSP
   - **Username/Password**: Your camera credentials

4. **Select channels**: Choose which camera channels to add
5. **Test connection**: Verify the stream works
6. **Add cameras**: They'll appear in your grid

## 🔧 Common Camera Configurations

### Hikvision DVR Example
```
Device Type: Hikvision DVR/NVR
IP Address: 192.168.1.100
Port: 80
Username: admin
Password: [your_password]
Channels: 1, 2, 3, 4
```

### Generic IP Camera Example
```
Device Type: Generic MJPEG Camera
IP Address: 192.168.1.101
Port: 8080
Username: admin
Password: [your_password]
Channels: 1
```

### Custom RTSP Stream Example
```
Device Type: RTSP Camera
IP Address: 192.168.1.102
Port: 554
Username: user
Password: [your_password]
Channels: 1
```

## 🚨 How AI Alerts Work

### Alert Integration
- **Real-time Detection**: AI analyzes camera feeds for threats
- **Visual Overlays**: Colored borders appear over camera feeds
- **Threat Levels**: SAFE (green) → LOW (yellow) → MEDIUM (orange) → HIGH (red) → CRITICAL (red) → WEAPON (dark red)
- **Audio Alerts**: 3D spatial audio indicates threat location
- **Voice Response**: AI conversation system for de-escalation

### Alert Types
- **Weapon Detection**: Immediate critical alert with audio
- **Trespassing**: Medium/high alert with location tracking
- **Package Theft**: Medium alert with confidence meter
- **Violence Detection**: Critical alert with emergency protocols
- **Loitering**: Low-level monitoring alert

## 🎛️ Professional Controls

### Camera Grid Controls
- **Layout**: Switch between 1x1, 2x2, 3x3, 4x4 views
- **Full Screen**: Click any camera for expanded view
- **Status**: Real-time connection status for each camera

### Alert Management
- **Active Alerts**: Live count and details
- **Alert History**: Recent threat activity
- **Quick Actions**: Clear alerts, test system
- **Statistics**: Threat levels, zones, confidence

### Audio System
- **3D Spatial Audio**: Directional threat alerts
- **Volume Control**: Master and per-alert levels
- **Device Selection**: Choose audio output
- **Visualization**: Real-time audio meters

### Voice Response
- **AI De-escalation**: Pre-defined security scripts
- **Conversation Control**: Start/stop AI interactions
- **Script Library**: Professional security responses
- **Live Transcript**: Real-time conversation logging

## 🔧 Troubleshooting

### Camera Connection Issues

**Can't connect to camera:**
1. Check IP address and port
2. Verify username/password
3. Ensure camera is on same network
4. Try different stream type (HTTP vs MJPEG)

**Stream loads but no video:**
1. Check if camera supports the selected format
2. Try reducing quality settings on camera
3. Verify firewall isn't blocking ports

**Alerts not appearing:**
1. Ensure AI detection is enabled
2. Check alert system status in control panel
3. Verify camera position settings match actual layout

### Network Configuration

**Find your camera IP:**
```bash
# Scan network for cameras
nmap -p 80,554,8080 192.168.1.0/24

# Or check your router's device list
```

**Common ports:**
- **HTTP**: 80, 8080, 8081
- **RTSP**: 554, 8554
- **MJPEG**: 80, 8080

## 📊 System Requirements

### Network
- **Bandwidth**: 2-10 Mbps per camera (depending on quality)
- **Latency**: <100ms for real-time alerts
- **Connections**: Up to 16 simultaneous camera feeds

### Performance
- **CPU**: Modern multi-core processor
- **RAM**: 8GB+ recommended for multiple cameras
- **GPU**: Hardware acceleration for smooth alerts

## 🎯 Next Steps

1. **Test the Demo**: Use "Test Alert" button to see alert system
2. **Add Your Cameras**: Configure your actual DVR/IP cameras
3. **Customize Alerts**: Adjust thresholds and response scripts
4. **Train the AI**: Use your camera feeds to improve detection
5. **Deploy Full System**: Integrate with existing security protocols

## 📞 Support

For technical support or custom integrations:
- Check console logs for detailed error messages
- Verify camera manufacturer documentation
- Test with demo mode first before adding production cameras

---

**Welcome to the future of AI-powered security monitoring!** 🚀