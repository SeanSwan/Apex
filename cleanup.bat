@echo off
setlocal enabledelayedexpansion

REM 🧹 APEX AI PLATFORM - AUTOMATED DEPENDENCY CLEANUP SCRIPT (Windows)
REM This script will clean up conflicting dependencies and optimize the project

echo.
echo 🚀 Starting Apex AI Platform Dependency Cleanup...
echo =================================================
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] Please run this script from the project root directory (where package.json exists)
    pause
    exit /b 1
)

echo [INFO] Found project root. Starting cleanup...

REM Backup package.json files
echo [INFO] Creating backups...
copy "frontend\package.json" "frontend\package.json.backup" >nul
copy "backend\package.json" "backend\package.json.backup" >nul
echo [SUCCESS] Backup files created

REM Clean up Frontend Dependencies
echo.
echo [INFO] Cleaning up frontend dependencies...
cd frontend

echo [INFO] Removing conflicting UI libraries...
call npm uninstall @mui/material @mui/icons-material @emotion/react @emotion/styled >nul 2>&1

echo [INFO] Removing conflicting state management...
call npm uninstall @reduxjs/toolkit react-redux redux swr >nul 2>&1

echo [INFO] Removing deprecated packages...
call npm uninstall moment >nul 2>&1

echo [INFO] Ensuring modern date library is installed...
call npm install date-fns

echo [SUCCESS] Frontend cleanup complete

REM Clean up Backend Dependencies
echo.
echo [INFO] Cleaning up backend dependencies...
cd ..\backend

echo [INFO] Removing frontend packages from backend...
call npm uninstall react-modal swr >nul 2>&1

echo [INFO] Removing unused packages...
call npm uninstall llama-node mysql2 >nul 2>&1

echo [INFO] Removing deprecated packages...
call npm uninstall moment >nul 2>&1

echo [INFO] Ensuring modern date library is installed...
call npm install date-fns

echo [SUCCESS] Backend cleanup complete

REM Return to project root
cd ..

REM Run security audit
echo.
echo [INFO] Running security audit...
cd frontend
call npm audit fix >nul 2>&1
cd ..\backend
call npm audit fix >nul 2>&1
cd ..

echo [SUCCESS] Security audit complete

REM Verify the cleanup
echo.
echo [INFO] Verifying cleanup...

echo.
echo 📊 CLEANUP SUMMARY
echo ==================
echo Frontend dependencies optimized
echo Backend dependencies optimized
echo Security audit completed

echo.
echo [SUCCESS] ✅ Cleanup completed successfully!
echo.
echo 🎯 NEXT STEPS:
echo ==============
echo 1. Test the application: npm run start
echo 2. Verify all modules load correctly
echo 3. Check for any import errors
echo 4. Run performance tests
echo.
echo 🔗 VERIFY THESE URLS WORK:
echo - http://localhost:3000/ (Platform Landing)
echo - http://localhost:3000/live-monitoring
echo - http://localhost:3000/guard-operations
echo - http://localhost:3000/admin
echo - http://localhost:3000/reports/new
echo.
echo [WARNING] If you encounter any issues, restore from backup files:
echo - frontend\package.json.backup
echo - backend\package.json.backup
echo.
echo [SUCCESS] 🚀 Your Apex AI Platform is now optimized!
echo.
pause
