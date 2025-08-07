@echo off
echo.
echo ================================================
echo APEX AI QUICK SERVER STATUS CHECK
echo ================================================
echo.

echo [1/3] Port Status Check...
echo Backend (Port 5000):
netstat -an | findstr :5000 | findstr LISTENING >nul
if errorlevel 1 (
    echo   ❌ Port 5000 not listening - Backend NOT running
    set backend_status=FAILED
) else (
    echo   ✅ Port 5000 listening - Backend running
    set backend_status=OK
)

echo Frontend (Port 5173):
netstat -an | findstr :5173 | findstr LISTENING >nul
if errorlevel 1 (
    echo   ❌ Port 5173 not listening - Frontend NOT running
    set frontend_status=FAILED
) else (
    echo   ✅ Port 5173 listening - Frontend running
    set frontend_status=OK
)

echo.
echo [2/3] HTTP Response Check...
echo Backend HTTP Test:
curl -s -o nul -w "  Status: %%{http_code} | Time: %%{time_total}s\n" --max-time 5 http://localhost:5000 2>nul
if errorlevel 1 (
    echo   ❌ Backend HTTP failed
) else (
    echo   ✅ Backend HTTP responding
)

echo Frontend HTTP Test:
curl -s -o nul -w "  Status: %%{http_code} | Time: %%{time_total}s\n" --max-time 5 http://localhost:5173 2>nul
if errorlevel 1 (
    echo   ❌ Frontend HTTP failed
) else (
    echo   ✅ Frontend HTTP responding
)

echo.
echo [3/3] Integration Test Readiness...
if "%backend_status%"=="OK" if "%frontend_status%"=="OK" (
    echo ✅ READY FOR INTEGRATION TESTING
    echo.
    echo Run integration tests with:
    echo   node test-integration.mjs
    echo.
    echo Or open browser to:
    echo   http://localhost:5173
) else (
    echo ❌ NOT READY - Fix server issues first
    echo.
    echo Troubleshooting:
    if "%backend_status%"=="FAILED" echo   - Start backend: cd backend && npm run dev
    if "%frontend_status%"=="FAILED" echo   - Start frontend: cd frontend && npm run dev
)

echo.
echo ================================================
pause
