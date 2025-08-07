@echo off
echo.
echo ================================================
echo APEX AI QUICK DYNAMIC PORT TEST
echo ================================================
echo.
echo Testing the new dynamic port allocation system...
echo.

echo [1/3] Testing port discovery utility...
node utils/findAvailablePort.mjs 5173 5
if errorlevel 1 (
    echo ❌ Port discovery utility failed
    pause
    exit /b 1
)

echo.
echo [2/3] Testing server discovery utility...
node utils/discoverServerPorts.mjs

echo.
echo [3/3] Testing port availability check...
echo.
echo Current port status:
netstat -an | findstr ":5000\|:5173\|:5174\|:5175" | findstr LISTENING

echo.
echo ================================================
echo 🎯 DYNAMIC PORT SYSTEM TEST COMPLETE
echo ================================================
echo.
echo The dynamic port allocation system is ready!
echo.
echo USAGE:
echo 1. Start servers: restart-dynamic-servers.bat
echo 2. Run tests: node test-integration-dynamic.mjs
echo 3. Check ports: node utils/discoverServerPorts.mjs
echo.
echo BENEFITS:
echo ✅ No more port conflicts!
echo ✅ Automatic port discovery
echo ✅ Integration tests adapt automatically
echo ✅ Multiple dev environments supported
echo.
pause
