# 🚀 APEX AI Platform - Development Guide

## Quick Start

### 🎯 **Main Development Command**
```bash
npm start
```
This will start both the Client Portal and Backend API concurrently with beautiful colored output.

---

## 🌐 **Access URLs**

Once running, you can access:

- **🌐 Client Portal:** http://localhost:5173
- **⚡ Backend API:** http://localhost:5001  
- **📚 API Docs:** http://localhost:5001/api/docs
- **🔍 Health Check:** http://localhost:5001/api/health

---

## 📋 **Available Commands**

### 🚀 **Development**
```bash
npm start          # Start both Client Portal + Backend
npm run dev        # Same as npm start
npm run restart    # Stop all processes and restart
npm run stop       # Kill all Node.js processes
npm run logs       # Start with enhanced logging
```

### 🔧 **Individual Services**
```bash
npm run start-client-portal    # Start only Client Portal (port 5173)
npm run start-backend          # Start only Backend API (port 5001)
```

### 🏗️ **Building**
```bash
npm run build      # Build Client Portal for production
npm run build-all  # Build both Client Portal and Backend
```

### 📦 **Installation**
```bash
npm run setup             # Install all dependencies + setup message
npm run install-all       # Install dependencies for all components
npm run install-client-portal  # Install only Client Portal deps
npm run install-backend   # Install only Backend deps
```

### 🧹 **Maintenance**
```bash
npm run lint       # Lint Client Portal code
npm run lint:fix   # Fix linting issues in both projects
npm run type-check # TypeScript type checking
npm run clean      # Clean build artifacts
npm run test       # Run tests
```

### 🔍 **Diagnostics**
```bash
npm run health-check   # Check if backend is responding
npm run ports-check    # Check if ports 5001/5173 are available
npm run info          # Show platform information
```

---

## 🛠️ **Development Workflow**

### **First Time Setup:**
```bash
# 1. Install all dependencies
npm run setup

# 2. Start development environment
npm start
```

### **Daily Development:**
```bash
# Start both services
npm start

# Your services will be available at:
# - Client Portal: http://localhost:5173
# - Backend API: http://localhost:5001
```

### **Testing the Authentication Fix:**
1. Open http://localhost:5173
2. Click "Access Client Portal"
3. Use demo credentials:
   - **Email:** sarah.johnson@luxeapartments.com
   - **Password:** Demo123!
4. Should successfully login and redirect to dashboard

---

## 🔧 **Configuration**

### **Ports:**
- **Client Portal:** 5173 (Vite dev server)
- **Backend API:** 5001 (Express server)

### **Key Files:**
- **Root:** `package.json` - Main development scripts
- **Client Portal:** `client-portal/vite.config.ts` - Frontend configuration
- **Backend:** `backend/src/server.mjs` - API server configuration

---

## 🐛 **Troubleshooting**

### **Port Already in Use:**
```bash
npm run ports-check    # Check what's using the ports
npm run stop           # Kill all Node processes
npm start              # Try again
```

### **Dependencies Issues:**
```bash
npm run clean          # Clean build artifacts
npm run install-all    # Reinstall all dependencies
```

### **Backend Not Responding:**
```bash
npm run health-check   # Check backend health
```

---

## 🎯 **Current Status**

✅ **Authentication Fixed** - Login redirect loop resolved  
✅ **Client Portal** - Fully functional with dashboard, incidents, evidence  
✅ **Backend API** - Complete with authentication, authorization, rate limiting  
✅ **Database** - Multi-tenant PostgreSQL with audit logging  
✅ **Production Ready** - Ready for deployment  

---

## 🚀 **Next Steps**

The platform is now **production-ready**! You can:

1. **Deploy Client Portal** to Render/Vercel
2. **Continue building** desktop console components
3. **Add advanced features** like Helios dispatch console
4. **Onboard clients** to the working platform

---

*Happy coding! 🎉*
