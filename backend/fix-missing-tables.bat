@echo off
echo 🛡️ APEX AI - QUICK TABLE FIX
echo ============================

echo.
echo Since your database connection works, let's just create the missing tables...
echo.

node create-missing-tables.mjs

echo.
echo 🧪 Testing the fix...
echo.
node verify-database-setup.mjs

echo.
echo 📋 Table creation complete!
echo If you see "✅ ALL TABLES CREATED SUCCESSFULLY!" above, you're ready to start your servers!
echo.
pause
