@echo off
REM APEX AI - ENHANCED ENGINE STARTUP SCRIPT (FIXED)
REM ================================================
REM Production startup script for Phase 2A-1: Multi-Monitor Correlation
REM Fixed for path and import issues

echo.
echo ================================================================================
echo    APEX AI - ENHANCED ENGINE WITH MULTI-MONITOR CORRELATION
echo    Phase 2A-1: Starting Enhanced AI System...
echo ================================================================================
echo.

REM Change to defense directory
cd /d "%~dp0"

echo [1/5] 🔍 Running quick validation test...
cd apex_ai_engine
python quick_start_test.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ Quick validation failed! Please check dependencies.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo.
echo [2/5] 🗄️  Starting backend server...
cd ..\.\backend
start "APEX AI Backend" cmd /k "npm start"
echo    ⏳ Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo.
echo [3/5] 🎛️  Setting up database tables...
node setup-multi-monitor-correlation-db.mjs
if %ERRORLEVEL% NEQ 0 (
    echo    ⚠️  Database setup warning - continuing anyway...
) else (
    echo    ✅ Database tables ready
)

cd ..

echo.
echo [4/5] 🤖 Starting Enhanced AI Engine...
cd apex_ai_engine
echo    🔗 Multi-Monitor Correlation: ENABLED
echo    ⚡ Target Handoff Latency: ^<500ms
echo    🎯 Correlation Confidence: 65%%+
echo.

REM Start the enhanced AI engine with correlation
python enhanced_ai_engine_with_correlation.py

echo.
echo [5/5] 🛑 Enhanced AI Engine stopped
echo.
echo Press any key to exit...
pause >nul
