@echo off
echo.
echo ================================================
echo APEX AI SERVER STATUS DIAGNOSTIC
echo ================================================
echo.

echo [1/4] Checking if Backend Server is running (Port 5000)...
netstat -an | findstr :5000
if errorlevel 1 (
    echo ❌ No process found on port 5000 - BACKEND NOT RUNNING
) else (
    echo ✅ Process found on port 5000
)

echo.
echo [2/4] Checking if Frontend Server is running (Port 5173)...
netstat -an | findstr :5173
if errorlevel 1 (
    echo ❌ No process found on port 5173 - FRONTEND NOT RUNNING
) else (
    echo ✅ Process found on port 5173
)

echo.
echo [3/4] Testing Backend HTTP connectivity...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:5000 2>nul
if errorlevel 1 (
    echo ❌ Backend HTTP request failed - Server not accessible
) else (
    echo ✅ Backend HTTP request successful
)

echo.
echo [4/4] Testing Frontend HTTP connectivity...
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:5173 2>nul
if errorlevel 1 (
    echo ❌ Frontend HTTP request failed - Server not accessible
) else (
    echo ✅ Frontend HTTP request successful
)

echo.
echo ================================================
echo DIAGNOSIS COMPLETE
echo ================================================
echo.
echo NEXT STEPS:
echo 1. If servers not running: Start them manually
echo 2. If port conflicts: Kill conflicting processes
echo 3. If HTTP fails: Check firewall/antivirus
echo.
pause
