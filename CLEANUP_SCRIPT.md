# 🧹 CLEANUP SCRIPT - APEX AI PLATFORM

## IMMEDIATE ACTIONS REQUIRED

### 1. Frontend Dependency Cleanup
```bash
cd frontend

# Remove conflicting UI libraries
npm uninstall @mui/material @mui/icons-material @emotion/react @emotion/styled

# Remove conflicting state management
npm uninstall @reduxjs/toolkit react-redux redux swr

# Remove deprecated packages
npm uninstall moment

# Install missing dependencies if needed
npm install date-fns
```

### 2. Backend Dependency Cleanup
```bash
cd backend

# Remove frontend packages from backend
npm uninstall react-modal swr

# Remove unused AI library
npm uninstall llama-node

# Remove conflicting database
npm uninstall mysql2

# Remove deprecated packages
npm uninstall moment

# Install missing dependencies if needed
npm install date-fns
```

### 3. Fix Import Issues
```bash
# Fix use-toast.ts
# Remove "use client" directive from:
# frontend/src/hooks/use-toast.ts
```

### 4. Verify Dependencies
```bash
cd frontend
npm audit
npm audit fix

cd ../backend
npm audit
npm audit fix
```

### 5. Test After Cleanup
```bash
# From project root
npm run start

# Verify all modules load correctly:
# - http://localhost:3000/ (Platform Landing)
# - http://localhost:3000/live-monitoring
# - http://localhost:3000/guard-operations
# - http://localhost:3000/admin
# - http://localhost:3000/reports/new
```

## BUNDLE SIZE OPTIMIZATION

### Before Cleanup (Estimated)
- Frontend: ~3.5MB (with conflicts)
- Multiple UI libraries loading
- Unused Redux store
- Deprecated moment.js

### After Cleanup (Estimated)
- Frontend: ~2.1MB (optimized)
- Single UI paradigm
- Efficient state management
- Modern date handling

### Performance Gains Expected
- ⚡ 40% smaller bundle size
- 🚀 Faster initial load
- 🧹 Cleaner development experience
- 🔧 Easier maintenance
