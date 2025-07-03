@echo off
echo =========================================
echo      APEX AI DESKTOP DEMO LAUNCHER
echo =========================================
echo.

:: Set window title
title Apex AI Demo Launcher

:: Change to the defense directory
cd /d "%~dp0"

echo [1/5] Checking Python dependencies...
cd apex_ai_engine
pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Python dependencies!
    pause
    exit /b 1
)
echo ✓ Python dependencies ready

echo.
echo [2/5] Checking Desktop App dependencies...
cd ..\apex_ai_desktop_app
call npm install --silent
if %errorlevel% neq 0 (
    echo ERROR: Failed to install Desktop App dependencies!
    pause
    exit /b 1
)
echo ✓ Desktop App dependencies ready

echo.
echo [3/5] Starting Python AI Engine...
cd ..\apex_ai_engine
start "Apex AI Engine" cmd /k "echo Starting Apex AI Engine... & python inference.py"

:: Wait a moment for the AI engine to start
timeout /t 3 /nobreak >nul

echo ✓ AI Engine started in separate window

echo.
echo [4/5] Starting Desktop Application...
cd ..\apex_ai_desktop_app
start "Apex AI Desktop" cmd /k "echo Starting Apex AI Desktop App... & npm start"

echo.
echo [5/5] Demo Launch Complete!
echo.
echo =========================================
echo   APEX AI DEMO IS NOW RUNNING
echo =========================================
echo.
echo The demo consists of:
echo • Python AI Engine (WebSocket server on port 8765)
echo • Desktop App (Electron application)
echo.
echo Both components should be starting in separate windows.
echo.
echo DEMO TIPS:
echo • Switch between tabs: Live AI Monitor, AI Alert Log, CTO AI Console
echo • Test the Voice Response feature in Quick Actions
echo • Watch for simulated AI detections in the camera feeds
echo • Use the CTO Console to show technical sophistication
echo.
echo Press any key to close this launcher...
pause >nul
