# 🛠️ Defense Project - Complete Fix Guide

## Issues Identified & Solutions

### 📋 **Summary of Problems Found:**
1. ❌ **Frontend**: Missing dependency resolution for multiple packages  
2. ❌ **Backend**: Missing `jsdom` dependency in sanitizers.mjs
3. ⚠️ **Database**: PostgreSQL connection refused (service not running)
4. ✅ **Application Structure**: All files and configurations are correct

---

## 🚀 **Quick Fix Options**

### **Option 1: Run Master Fix Script (Recommended)**
```bash
# Run this single command to fix everything:
./master-fix.bat
```

### **Option 2: Individual Fix Scripts**
```bash
# Fix frontend dependencies only:
./fix-frontend-deps.bat

# Fix backend dependencies only:  
./fix-backend-deps.bat

# Check database setup:
./check-database.bat
```

### **Option 3: Manual Step-by-Step**
See detailed manual steps below.

---

## 📝 **Detailed Issue Analysis**

### **1. Frontend Dependencies Issue**
**Problem**: Vite cannot resolve these packages:
- `lucide-react`
- `@radix-ui/react-toast`
- `@radix-ui/react-slot` 
- `class-variance-authority`
- `tailwind-merge`
- `@radix-ui/react-switch`
- `@radix-ui/react-label`
- `@radix-ui/react-tabs`

**Root Cause**: Incomplete npm installation - packages declared in package.json but not properly installed in node_modules.

**Solution Applied**:
✅ Clean node_modules completely  
✅ Fresh npm install with verification  
✅ Package-by-package verification script

### **2. Backend jsdom Dependency**
**Problem**: 
```
Cannot find package 'jsdom' imported from sanitizers.mjs
```

**Root Cause**: Backend trying to import jsdom but it's only installed in frontend devDependencies.

**Solution Applied**:
✅ Added jsdom to backend package.json devDependencies  
✅ npm install to get the missing package

### **3. Database Connection**
**Problem**:
```
connect ECONNREFUSED ::1:5432
connect ECONNREFUSED 127.0.0.1:5432
```

**Root Cause**: PostgreSQL service not running on port 5432.

**Configuration Found**:
- Database: `apex`
- User: `swanadmin` 
- Host: `localhost`
- Port: `5432`

**Solutions Available**:
1. ✅ **Start PostgreSQL service** (if installed)
2. ✅ **Install PostgreSQL** (if not installed)  
3. ✅ **Use Docker PostgreSQL**
4. ✅ **Run in development mode** (application still works without DB for many features)

---

## 🔧 **Manual Fix Steps**

### **Frontend Dependencies Fix**
```bash
# 1. Clear cache and navigate
npm cache clean --force
cd frontend

# 2. Clean install
rm -rf node_modules
npm install

# 3. Verify critical packages
npm list lucide-react
npm list @radix-ui/react-toast
npm list tailwind-merge

# 4. Test
npm run dev
```

### **Backend Dependencies Fix**  
```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies (jsdom now added to package.json)
npm install

# 3. Verify
npm list jsdom

# 4. Test
npm run dev
```

### **Database Setup Options**

#### **Option A: Start Existing PostgreSQL**
```bash
# Windows
net start postgresql-x64-16

# Or try older versions
net start postgresql-x64-15
net start postgresql-x64-14
```

#### **Option B: Install PostgreSQL**
1. Download from https://www.postgresql.org/download/
2. Install with default settings
3. Create database `apex` and user `swanadmin`

#### **Option C: Docker PostgreSQL**
```bash
docker run -d \\
  --name postgres-defense \\
  -e POSTGRES_DB=apex \\
  -e POSTGRES_USER=swanadmin \\
  -e POSTGRES_PASSWORD=your_password \\
  -p 5432:5432 \\
  postgres:16
```

#### **Option D: Development Mode (No Database)**
The application is designed to continue working without a database connection for development and testing purposes.

---

## ✅ **Verification Steps**

After running any fix option:

### **1. Test Frontend**
```bash
cd frontend
npm run dev
# Should start without dependency errors
# Available at http://localhost:5173
```

### **2. Test Backend** 
```bash
cd backend
npm run dev  
# Should start without jsdom errors
# Available at http://localhost:5000
```

### **3. Test Complete Application**
```bash
npm start
# Both should start together
# Frontend: http://localhost:5173
# Backend: http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### **4. Health Check**
Visit: http://localhost:5000/api/health

Expected response:
```json
{
  "status": "Server is running",
  "security": {
    "helmet_enabled": true,
    "rate_limiting_active": true,
    "cors_configured": true
  },
  "version": "2.0.0-security-enhanced"
}
```

---

## 🎯 **Expected Final State**

✅ **Frontend**: Vite dev server running on port 5173  
✅ **Backend**: Express server running on port 5000  
✅ **Dependencies**: All packages properly installed  
✅ **Security**: All security middleware active  
⚠️ **Database**: Connected if PostgreSQL running, graceful fallback if not  

---

## 🔍 **Troubleshooting**

### **If Frontend Still Has Issues:**
1. Delete `node_modules` and `package-lock.json`
2. Run `npm cache clean --force`  
3. Run `npm install` again
4. Check Node.js version: `node --version` (should be 18+)

### **If Backend Still Has Issues:**
1. Check if jsdom was added to package.json
2. Run `npm install` in backend directory
3. Check for other missing imports

### **If Database Issues Persist:**
1. Check PostgreSQL service status
2. Verify connection credentials in backend/.env
3. Consider running without database for development

### **If Both Won't Start Together:**
1. Check if ports 5173 and 5000 are available
2. Run frontend and backend separately first
3. Check for conflicting processes

---

## 📁 **Files Created/Modified**

✅ `master-fix.bat` - Complete automated fix  
✅ `fix-frontend-deps.bat` - Frontend dependency fix  
✅ `fix-backend-deps.bat` - Backend dependency fix  
✅ `check-database.bat` - Database setup check  
✅ `backend/package.json` - Added jsdom dependency  

**Ready to run!** 🚀
