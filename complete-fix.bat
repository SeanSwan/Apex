@echo off
echo === Defense Project: Complete Dependencies Fix ===
echo Fixing all frontend and backend dependency issues...

echo.
echo Phase 1: Frontend Dependencies Fix
echo ================================

echo 1. Clearing npm cache...
npm cache clean --force

echo.
echo 2. Navigating to frontend directory...
cd /d "C:\Users\ogpsw\Desktop\defense\frontend"

echo.
echo 3. Installing frontend dependencies...
npm install --verbose

echo.
echo 4. Verifying critical packages...
echo Checking lucide-react...
npm list lucide-react
echo Checking @radix-ui/react-toast...
npm list @radix-ui/react-toast
echo Checking tailwind-merge...
npm list tailwind-merge

echo.
echo Phase 2: Backend Dependencies Fix
echo ===============================

echo 5. Navigating to backend directory...
cd /d "C:\Users\ogpsw\Desktop\defense\backend"

echo.
echo 6. Installing missing backend packages...
npm install jsdom --save-dev

echo.
echo 7. Verifying jsdom installation...
npm list jsdom

echo.
echo Phase 3: Database Setup Check
echo ============================

echo 8. Returning to project root...
cd /d "C:\Users\ogpsw\Desktop\defense"

echo.
echo 9. Checking PostgreSQL service status...
sc query postgresql-x64-16 2>nul || echo PostgreSQL service not found or not running

echo.
echo === Fix Complete ===
echo Now testing application startup...
echo.

echo Starting application (press Ctrl+C to stop after verification)...
timeout /t 3
npm start

pause
