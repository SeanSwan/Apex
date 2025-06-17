# 🚀 Apex AI Security Platform - Development Commands

## 🎯 Quick Start Commands

### Start Both Servers (Recommended)
```bash
npm start
```
**What it does:** Starts both frontend and backend with color-coded logs

### Alternative Start Commands
```bash
npm run dev          # Same as npm start  
npm run logs         # Start with auto-restart on failure
```

## 🛠️ Individual Server Commands

### Frontend Only
```bash
npm run start-fe     # or start-frontend
```

### Backend Only  
```bash
npm run start-be     # or start-backend
```

## 🧹 Clean Development Environment

### Quick Cleanup
```bash
npm run cleanup         # Simple cleanup: update browserslist
npm run update-browserslist  # Update outdated browserslist database
```

### Check Code Quality (If Needed)
```bash
npm run lint            # Run ESLint check
npm run lint:verbose    # Show all warnings and errors
npm run typecheck       # TypeScript type checking
```

**Note:** ESLint warnings are disabled during development for a cleaner console experience.

## 🔧 Management Commands

### Stop All Servers
```bash
npm run stop
```

### Restart Everything
```bash
npm run restart
```

### Install All Dependencies
```bash
npm run install-all
```

## 📊 Log Output Guide

When you run `npm start`, you'll see color-coded logs:

- **🔵 [FRONTEND]** - Vite dev server (port 5173)
- **🟡 [BACKEND]**  - Express API server (port varies)

## 🌟 Features Enabled

✅ **Auto-restart** - Backend restarts when you save files  
✅ **Color coding** - Easy to distinguish frontend vs backend logs  
✅ **Error handling** - If one server fails, both stop  
✅ **Hot reload** - Frontend updates instantly on file changes  
✅ **Clean console** - ESLint warnings disabled during development  
✅ **Simple cleanup** - Easy command to fix common warnings  

## 🎯 Access Your Application

Once both servers are running:

- **Main App:** http://localhost:5173/reports/new
- **Landing Page:** http://localhost:5173/
- **All Reports:** http://localhost:5173/reports

## 🐛 Troubleshooting

If servers won't start:
1. Run `npm run stop` to kill any hanging processes
2. Run `npm run install-all` to ensure all dependencies are installed  
3. Run `npm start` to start fresh

---
**🌟 Your 7-Star AAA Apex AI Security Platform is ready for development!**
