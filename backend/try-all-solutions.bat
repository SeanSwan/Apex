@echo off
echo 🛡️ APEX AI - MULTIPLE SOLUTION ATTEMPT
echo ======================================

echo.
echo Permission issue detected. Trying multiple approaches...
echo.

echo 💡 APPROACH 1: Using postgres superuser...
echo ==========================================
echo This will prompt for postgres password (try empty password first if needed)
echo.
set /p continue1="Try postgres superuser approach? (y/N): "

if /i "%continue1%"=="y" (
    echo.
    echo Running superuser table creation...
    node create-tables-superuser.mjs
    echo.
    echo Verifying results...
    node verify-database-setup.mjs
    echo.
    echo If you see "SUCCESS!" above, you're done! Otherwise, continue to manual setup.
    echo.
)

echo.
echo 💡 APPROACH 2: Generate pgAdmin script...
echo =========================================
echo This creates a complete SQL script for manual copy/paste
echo.
set /p continue2="Generate pgAdmin script? (y/N): "

if /i "%continue2%"=="y" (
    echo.
    echo Generating complete SQL script...
    node generate-pgadmin-script.mjs
    echo.
    echo ✅ SQL script generated!
    echo.
    echo 📋 MANUAL STEPS:
    echo 1. Open pgAdmin 4
    echo 2. Connect to PostgreSQL server
    echo 3. Navigate to apex database
    echo 4. Open Query Tool
    echo 5. Copy the SQL script shown above
    echo 6. Paste and execute in pgAdmin
    echo.
)

echo.
echo 🔧 FINAL RECOMMENDATION:
echo ========================
echo If automatic methods fail, the pgAdmin manual approach is most reliable.
echo The complete SQL script has been generated for you to copy/paste.
echo.
pause
