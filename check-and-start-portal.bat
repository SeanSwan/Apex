@echo off
echo ========================================
echo CHECKING BACKEND STATUS
echo ========================================

curl -s http://localhost:5001/api/health
if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Backend is READY on port 5001
    echo.
    echo ========================================
    echo STARTING CLIENT PORTAL NOW...
    echo ========================================
    echo.
    
    cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"
    start http://localhost:3000
    npm run dev
) else (
    echo.
    echo ❌ Backend is NOT running
    echo Please run: setup-phase-3-fixed.bat first
    echo.
    pause
)
