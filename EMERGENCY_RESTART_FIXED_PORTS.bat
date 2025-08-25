@echo off
echo 🚨 EMERGENCY RESTART - FIXED PORTS
echo ===============================================
echo Killing any existing processes...

REM Kill any processes on these ports
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a 2>NUL
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5001') do taskkill /f /pid %%a 2>NUL  
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /f /pid %%a 2>NUL

echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo 🚀 Starting APEX AI Platform with CORRECT PORTS...
echo ===============================================
echo CLIENT PORTAL: http://localhost:5173/
echo FRONTEND (Defense): http://localhost:3000/  
echo BACKEND API: http://localhost:5001/
echo ===============================================

REM Start the applications
npm start

pause
