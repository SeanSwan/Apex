@echo off
REM APEX AI DESKTOP MONITOR - QUICK SETUP SCRIPT (WINDOWS)
REM =======================================================
REM Automated setup for demo environment on Windows

echo.
echo ======================================== 
echo 🚀 APEX AI DESKTOP MONITOR - QUICK SETUP
echo ========================================
echo.

REM Check if running in correct directory
if not exist "package.json" (
    echo [ERROR] Please run this script from the apex_ai_desktop_app directory
    pause
    exit /b 1
)

echo [INFO] Setting up Apex AI Desktop Monitor for demo...
echo.

REM Check Node.js installation
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% == 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo [SUCCESS] Node.js found: %NODE_VERSION%
) else (
    echo [ERROR] Node.js not found. Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)

REM Check Python installation
echo [INFO] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% == 0 (
    for /f "tokens=*" %%i in ('python --version') do set PYTHON_VERSION=%%i
    echo [SUCCESS] Python found: %PYTHON_VERSION%
    set PYTHON_CMD=python
) else (
    python3 --version >nul 2>&1
    if %errorlevel% == 0 (
        for /f "tokens=*" %%i in ('python3 --version') do set PYTHON_VERSION=%%i
        echo [SUCCESS] Python found: %PYTHON_VERSION%
        set PYTHON_CMD=python3
    ) else (
        echo [ERROR] Python not found. Please install Python 3.8+ from https://python.org
        pause
        exit /b 1
    )
)

REM Install Node.js dependencies
echo [INFO] Installing Node.js dependencies...
call npm install
if %errorlevel% == 0 (
    echo [SUCCESS] Node.js dependencies installed
) else (
    echo [ERROR] Failed to install Node.js dependencies
    pause
    exit /b 1
)

REM Install Python dependencies for AI engine
echo [INFO] Installing Python AI engine dependencies...
cd ..\apex_ai_engine

if exist "requirements.txt" (
    %PYTHON_CMD% -m pip install -r requirements.txt
    if %errorlevel% == 0 (
        echo [SUCCESS] Python dependencies installed
    ) else (
        echo [WARNING] Some Python dependencies may have failed to install
        echo [INFO] Continuing with setup...
    )
) else (
    echo [WARNING] requirements.txt not found, skipping Python dependencies
)

cd ..\apex_ai_desktop_app

REM Create necessary directories
echo [INFO] Creating necessary directories...
if not exist "..\apex_ai_engine\models" mkdir "..\apex_ai_engine\models"
if not exist "..\apex_ai_engine\snapshots" mkdir "..\apex_ai_engine\snapshots"
if not exist "..\apex_ai_engine\clips" mkdir "..\apex_ai_engine\clips"
echo [SUCCESS] Directories created

REM Check for AI model
echo [INFO] Checking for AI model...
if not exist "..\apex_ai_engine\yolov8n.pt" (
    echo [INFO] YOLOv8 model will be downloaded automatically on first run
) else (
    echo [SUCCESS] YOLOv8 model already exists
)

REM Test backend AI services (if available)
echo [INFO] Testing backend AI services integration...
cd ..\backend
if exist "test-ai-services.mjs" (
    call npm run test:ai >nul 2>&1
    if %errorlevel% == 0 (
        echo [SUCCESS] Backend AI services test passed
    ) else (
        echo [WARNING] Backend AI services test failed or not available
    )
)

cd ..\apex_ai_desktop_app

echo.
echo [SUCCESS] 🎉 Setup complete! Ready for demo.
echo.
echo ========================================
echo 📋 QUICK START COMMANDS:
echo ========================================
echo.
echo 1. Start Python AI Engine:
echo    cd ..\apex_ai_engine
echo    %PYTHON_CMD% inference.py
echo.
echo 2. Start Desktop App (in new command prompt):
echo    cd apex_ai_desktop_app
echo    npm run dev
echo.
echo 3. Or start everything with:
echo    npm run dev (will start both automatically)
echo.
echo ========================================
echo 🎬 DEMO CHECKLIST:
echo ========================================
echo □ Test camera connections
echo □ Verify AI detection overlays  
echo □ Test voice response feature
echo □ Check alert system
echo □ Practice CTO Console demo
echo □ Ensure stable network for RTSP streams
echo.
echo 🎯 Ready for July 28th demo!
echo.
pause
