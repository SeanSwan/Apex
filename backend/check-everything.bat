@echo off
echo 🔍 APEX AI Platform - Comprehensive Status Check
echo ================================================
echo.

echo 📊 Step 1: Checking system files and configuration...
node quick-status-check.mjs
echo.

echo 🌐 Step 2: Testing server endpoints (if server is running)...
echo Checking if server is running on port 5000...

curl -s http://localhost:5000/api/health >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Server is running!
    echo.
    echo 🧪 Running comprehensive integration test...
    node test-integration-improved.mjs
) else (
    echo ⚠️ Server is not running
    echo.
    echo 💡 To start the server:
    echo    npm start
    echo.
    echo 📋 Current system status ^(without server^):
    echo    - Files and configuration checked above
    echo    - Database tables checked above  
    echo    - Ready for server testing once started
)

echo.
echo 🎯 Quick Commands Summary:
echo =========================
echo • Start server: npm start
echo • Test system: node test-integration-improved.mjs
echo • Check status: node quick-status-check.mjs
echo • Run repairs: repair-all.bat
echo.
pause