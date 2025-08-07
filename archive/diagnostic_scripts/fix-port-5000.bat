@echo off
echo.
echo ================================================
echo APEX AI PORT 5000 CLEANUP UTILITY
echo ================================================
echo.
echo Checking what's using port 5000...
echo.

REM Check what's using port 5000
echo 🔍 Processes using port 5000:
netstat -ano | findstr :5000

echo.
echo 🛑 Killing all processes on port 5000...

REM Kill processes using port 5000
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    echo Killing process ID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo.
echo ✅ Port 5000 should now be available
echo.

REM Wait a moment for processes to fully terminate
timeout /t 2 /nobreak >nul

echo 🔍 Verifying port 5000 is now free...
netstat -ano | findstr :5000
if errorlevel 1 (
    echo ✅ Port 5000 is now available!
) else (
    echo ⚠️ Some processes may still be using port 5000
)

echo.
echo ================================================
echo 🚀 NOW RESTART THE BACKEND SERVER
echo ================================================
echo.
echo To restart backend server:
echo   cd backend
echo   npm run dev
echo.
pause
