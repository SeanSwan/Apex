# APEX AI DYNAMIC PORT ALLOCATION SYSTEM
# =======================================
# Automatic port conflict resolution for development servers

## 🎯 PROBLEM SOLVED
No more "EADDRINUSE: address already in use" errors! The system automatically finds available ports starting from 5000 (backend) and 5173 (frontend), incrementing until free ports are found.

## 🚀 QUICK START

### Option 1: Use Dynamic Server Restart (Recommended)
```bash
# This handles everything automatically
restart-dynamic-servers.bat
```

### Option 2: Manual Dynamic Startup
```bash
# Start backend with dynamic port
node utils/startBackendDynamic.mjs

# Start frontend with dynamic port (in new terminal)
node utils/startFrontendDynamic.mjs
```

### Option 3: Test the System
```bash
# Test dynamic port utilities
test-dynamic-system.bat
```

## 🔧 HOW IT WORKS

### 1. Port Discovery
- **Backend**: Starts from port 5000, tries 5001, 5002, etc. until available port found
- **Frontend**: Starts from port 5173, tries 5174, 5175, etc. until available port found
- **Automatic**: No manual intervention required

### 2. Port Information Storage
- Backend port info saved to: `backend-port-info.json`
- Frontend port info saved to: `frontend-port-info.json`
- Integration tests read these files to discover actual ports

### 3. Dynamic Integration Testing
```bash
# Automatically discovers and tests actual server ports
node test-integration-dynamic.mjs
```

## 📁 FILES CREATED

### Core Utilities
- `utils/findAvailablePort.mjs` - Port availability checker
- `utils/startBackendDynamic.mjs` - Dynamic backend starter
- `utils/startFrontendDynamic.mjs` - Dynamic frontend starter
- `utils/discoverServerPorts.mjs` - Server port discovery

### Enhanced Scripts
- `restart-dynamic-servers.bat` - Start both servers with dynamic ports
- `test-integration-dynamic.mjs` - Integration tests with port discovery
- `test-dynamic-system.bat` - Test the dynamic port system

## 🎯 USAGE EXAMPLES

### Scenario 1: Port 5173 is in use
```
🔍 Finding available port for frontend (starting from 5173)...
⚠️  Port 5173 is in use, trying next...
✅ Found available port: 5174
🚀 Starting frontend server on port 5174
📱 Frontend URL: http://localhost:5174
```

### Scenario 2: Multiple development environments
```
Developer A: Backend on 5000, Frontend on 5173
Developer B: Backend on 5001, Frontend on 5174
Developer C: Backend on 5002, Frontend on 5175
```

### Scenario 3: Integration testing adapts automatically
```
📊 DYNAMIC SERVER DISCOVERY
🖥️  Backend discovered: http://localhost:5001 (Port 5001)
📱 Frontend discovered: http://localhost:5174 (Port 5174)
🔌 WebSocket URL: http://localhost:5001

✅ All systems ready for integration testing
```

## 🔍 MONITORING & DEBUGGING

### Check Current Port Usage
```bash
# See which ports are actually being used
node utils/discoverServerPorts.mjs
```

### Manual Port Testing
```bash
# Find next available port starting from 5173
node utils/findAvailablePort.mjs 5173

# Check port availability for common ports
netstat -an | findstr ":5000\|:5173\|:5174\|:5175"
```

### View Saved Port Information
```bash
# Backend port info
type backend-port-info.json

# Frontend port info  
type frontend-port-info.json
```

## 📋 INTEGRATION WITH EXISTING WORKFLOWS

### For Phase 5A Integration Testing
1. **Start Servers**: `restart-dynamic-servers.bat`
2. **Run Tests**: `node test-integration-dynamic.mjs`
3. **Result**: Tests automatically find and use correct ports

### For Development
1. **No Changes Needed**: Your code continues to work
2. **Environment Variables**: Updated automatically
3. **Frontend Config**: VITE_BACKEND_URL set to discovered backend URL

### For CI/CD (Future)
- Multiple test runners can use different port ranges
- No port conflicts between parallel test executions
- Automatic cleanup and port release

## 🎉 BENEFITS

### ✅ No More Port Conflicts
- Automatic detection and resolution
- Works in any development environment
- Supports multiple developers on same machine

### ✅ Zero Configuration
- Works out of the box
- No manual port management
- Automatic environment variable updates

### ✅ Robust Integration Testing
- Tests adapt to actual server ports
- No hardcoded URLs
- Better error messages with actual URLs

### ✅ Development Flexibility
- Run multiple instances simultaneously
- Each developer gets unique ports automatically
- Easy switching between projects

## 🚨 TROUBLESHOOTING

### If servers fail to start
1. Check terminal windows for error messages
2. Verify Node.js is installed: `node --version`
3. Check if utils directory exists and has .mjs files
4. Run: `test-dynamic-system.bat` to verify system

### If integration tests fail
1. Verify both servers are running: `node utils/discoverServerPorts.mjs`
2. Check port info files exist: `backend-port-info.json`, `frontend-port-info.json`
3. Run dynamic tests: `node test-integration-dynamic.mjs`

### If ports are not detected
1. Wait longer for servers to start (8-10 seconds)
2. Check if antivirus is blocking port scanning
3. Verify no firewall blocking local connections

## 🔄 MIGRATION FROM OLD SYSTEM

### Old Way (Port Conflicts)
```bash
# Often failed with EADDRINUSE errors
cd backend && npm run dev     # Port 5000
cd frontend && npm run dev    # Port 5173
```

### New Way (Dynamic Ports)
```bash
# Always works, finds available ports automatically
restart-dynamic-servers.bat
```

## 📈 NEXT STEPS

This dynamic port system is now ready for Phase 5A integration testing and beyond. The system will:

1. **Eliminate port conflicts** during development
2. **Automatically adapt integration tests** to actual server ports
3. **Support multiple development environments** without manual configuration
4. **Provide clear feedback** about which ports are being used

---

**🎯 Ready for Phase 5A Integration Testing with Zero Port Conflicts!**
