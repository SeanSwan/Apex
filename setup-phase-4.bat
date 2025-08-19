@echo off
echo ========================================
echo APEX AI - CLIENT PORTAL SETUP
echo ========================================
echo.
echo Phase 4: Starting Client Portal
echo ---------------------------------
echo.

cd /d "C:\Users\APEX AI\Desktop\defense\client-portal"

echo Installing client portal dependencies...
call npm install

echo.
echo Starting client portal on http://localhost:3000
echo (Fixed: Port 3000 matches backend CORS configuration)
echo.
echo IMPORTANT: Make sure Phase 3 (backend on port 5001) is still running!
echo.
echo ========================================
echo TEST CREDENTIALS:
echo ========================================
echo Email: sarah.johnson@luxeapartments.com
echo Password: Demo123!
echo Role: Client Admin (Full Access)
echo.
echo Email: michael.chen@luxeapartments.com  
echo Password: Demo123!
echo Role: Client User (Limited Access)
echo ========================================
echo.
echo Client portal starting...
echo Navigate to: http://localhost:3000
echo ========================================
echo.

npm run dev
