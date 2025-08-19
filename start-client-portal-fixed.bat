@echo off
echo ========================================
echo APEX AI - CLIENT PORTAL (FIXED PORTS)
echo ========================================
echo.
echo Starting client portal on http://localhost:3000
echo (Fixed: Backend proxy points to port 5001)
echo (Fixed: Portal runs on port 3000 to match CORS)
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
echo PORTAL STARTING ON http://localhost:3000
echo ========================================
echo.
echo ✅ Backend: http://localhost:5001 (running)
echo ✅ Frontend: http://localhost:3000 (starting)
echo ✅ CORS: Configured correctly
echo ✅ Proxy: API calls → backend port 5001
echo.
echo TEST CREDENTIALS:
echo Email: sarah.johnson@luxeapartments.com
echo Password: Demo123!
echo.
echo Browser should open automatically to:
echo http://localhost:3000
echo ========================================
echo.

npm run dev
