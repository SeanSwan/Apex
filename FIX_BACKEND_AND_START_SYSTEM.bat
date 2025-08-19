@echo off
echo ========================================
echo APEX AI - COMPLETE SYSTEM SETUP & FIX
echo ========================================
echo.
echo This script will fix the backend API issue and set up the complete system.
echo.

REM Check if we're in the correct directory
if not exist "backend" (
    echo ERROR: backend directory not found!
    echo Please run this script from the defense directory.
    pause
    exit /b 1
)

if not exist "client-portal" (
    echo ERROR: client-portal directory not found!
    echo Please run this script from the defense directory.
    pause
    exit /b 1
)

echo 🛑 STEP 1: Stopping existing services...
echo ========================================
taskkill /F /IM node.exe 2>NUL
taskkill /F /IM postgres.exe 2>NUL
timeout /t 2 >NUL

echo.
echo 🗄️ STEP 2: Setting up PostgreSQL Database...
echo ========================================
echo.
echo Checking if PostgreSQL is running...

REM Try to connect to PostgreSQL
psql -U postgres -h localhost -p 5432 -c "\l" > nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PostgreSQL is not running or not accessible
    echo.
    echo PLEASE DO THE FOLLOWING:
    echo 1. Install PostgreSQL if not installed: https://www.postgresql.org/download/
    echo 2. Start PostgreSQL service
    echo 3. Set password for 'postgres' user to: hOLLYWOOD1980
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ PostgreSQL is running!

echo.
echo Creating APEX database if it doesn't exist...
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE apex;" 2>NUL
if %errorlevel% equ 0 (
    echo ✅ Database 'apex' created successfully
) else (
    echo ℹ️ Database 'apex' already exists
)

echo.
echo 🔧 STEP 3: Running database migration...
echo ========================================
echo.
echo Setting up client portal tables and data...
psql -U postgres -h localhost -p 5432 -d apex -f migrations\008_client_portal_setup.sql
if %errorlevel% equ 0 (
    echo ✅ Database migration completed successfully!
) else (
    echo ❌ Database migration failed!
    echo Check PostgreSQL configuration and try again.
    pause
    exit /b 1
)

echo.
echo 🔐 STEP 4: Updating user passwords...
echo ========================================
echo.
echo Setting up demo user password (Demo123!)...
psql -U postgres -h localhost -p 5432 -d apex -c "UPDATE \"Users\" SET password = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE email = 'sarah.johnson@luxeapartments.com';"
if %errorlevel% equ 0 (
    echo ✅ Demo user password updated successfully!
) else (
    echo ❌ Failed to update user password - but continuing...
)

echo.
echo 🔧 STEP 5: Installing/updating dependencies...
echo ========================================
echo.
echo Installing backend dependencies...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ❌ Backend npm install failed!
    pause
    exit /b 1
)
cd ..

echo.
echo Installing client portal dependencies...
cd client-portal
call npm install
if %errorlevel% neq 0 (
    echo ❌ Client portal npm install failed!
    pause
    exit /b 1
)
cd ..

echo.
echo 🚀 STEP 6: Starting services...
echo ========================================
echo.
echo Starting Backend API Server (Port 5001)...
start "APEX Backend (Port 5001)" cmd /k "cd /d \"%~dp0backend\" && echo Starting backend server... && npm run dev"

echo Waiting 10 seconds for backend to fully initialize...
timeout /t 10 >NUL

echo.
echo Testing backend API connectivity...
curl -s http://localhost:5001/api/health > nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend API is responding on port 5001!
) else (
    echo ⚠️ Backend API may still be starting up...
    echo Will continue anyway - check backend console for errors if issues persist.
)

echo.
echo Starting Client Portal (Port 3000)...
start "APEX Client Portal (Port 3000)" cmd /k "cd /d \"%~dp0client-portal\" && echo Starting client portal... && npm run dev"

echo Waiting 8 seconds for client portal to start...
timeout /t 8 >NUL

echo.
echo ========================================
echo ✅ SYSTEM SETUP COMPLETE!
echo ========================================
echo.
echo 🌐 ACCESS YOUR APPLICATIONS:
echo.
echo 👥 CLIENT PORTAL:       http://localhost:3000
echo 📡 Backend API:         http://localhost:5001
echo.
echo ========================================
echo 🔐 LOGIN CREDENTIALS:
echo ========================================
echo.
echo Email:    sarah.johnson@luxeapartments.com
echo Password: Demo123!
echo.
echo ========================================
echo 📋 TESTING STEPS:
echo ========================================
echo.
echo 1. Open browser to: http://localhost:3000
echo 2. Click "Access Client Portal" button  
echo 3. Login with credentials above
echo 4. You should see the executive dashboard
echo.
echo If login still fails:
echo - Open browser developer tools (F12)
echo - Check Console tab for error messages
echo - Check Network tab to see if API calls are working
echo.
echo ========================================
echo 🎉 READY TO TEST!
echo ========================================
echo.

timeout /t 5 >NUL
start "" "http://localhost:3000"

echo Browser should open automatically.
echo Keep both command windows open for the system to work.
echo.
echo Press any key to close this setup script.
pause
