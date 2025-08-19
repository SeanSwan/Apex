@echo off
echo ========================================
echo APEX AI - CLIENT PORTAL (FIXED)
echo ========================================
echo.
echo Starting client portal on http://localhost:5173
echo Backend proxy points to port 5001
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"

echo Installing dependencies if needed...
if not exist "node_modules" (
    call npm install
    echo.
)

echo Starting development server...
echo.
echo ========================================
echo PORTAL STARTING ON http://localhost:5173
echo ========================================
echo.
echo ✅ Backend: http://localhost:5001 (should be running)
echo ✅ Frontend: http://localhost:5173 (starting)
echo ✅ CORS: Configured correctly
echo ✅ Proxy: API calls → backend port 5001
echo.
echo TEST CREDENTIALS:
echo Email: sarah.johnson@luxeapartments.com
echo Password: Demo123!
echo.
echo Browser should open automatically to:
echo http://localhost:5173
echo ========================================
echo.

npm run dev
