@echo off
echo 🔧 APEX AI Platform - One-Click Repair
echo =====================================
echo.

echo 📊 Step 1: Creating missing database tables...
node setup-missing-tables.mjs
echo.

echo 🔧 Step 2: Running comprehensive repairs...  
node comprehensive-repair.mjs
echo.

echo ✅ Repairs completed!
echo.
echo 🚀 Next steps:
echo    1. Restart your server: Ctrl+C then 'npm start' 
echo    2. Test: 'node test-integration-improved.mjs'
echo.
pause