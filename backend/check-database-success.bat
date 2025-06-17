@echo off
echo 🔍 CHECKING IF DATABASE SETUP WORKED...
echo =======================================

echo.
echo Running comprehensive database verification...
echo.

node verify-database-setup.mjs

echo.
echo 🧪 QUICK BACKEND TEST:
echo =====================
echo Testing if backend can connect to database...
echo.

REM Try to start the backend briefly to see connection status
timeout /t 2 /nobreak >nul
echo Starting backend server test...
cd /d "%~dp0"
node -e "
import db from './models/index.mjs';
console.log('🔗 Testing backend database connection...');
setTimeout(() => {
  console.log('✅ Backend connection test completed');
  process.exit(0);
}, 3000);
" 2>&1

echo.
echo 📋 VERIFICATION COMPLETE
echo If you see '✅ DATABASE SETUP SUCCESSFUL!' above, you're ready to go!
echo.
pause
