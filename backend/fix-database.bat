@echo off
echo 🛡️ APEX AI - DATABASE SETUP
echo ===========================

echo.
echo This will fix all database connectivity issues by:
echo   - Creating the apex database with proper permissions
echo   - Setting up all required tables  
echo   - Inserting sample data
echo.

echo ⚠️  WARNING: This will DROP the existing apex database!
echo.
set /p confirm="Continue? (y/N): "

if /i "%confirm%"=="y" (
    echo.
    echo 🔧 Running comprehensive database setup...
    node scripts/setup-database-comprehensive.mjs
    echo.
    echo 🎯 Database setup complete! Try starting your backend now.
    pause
) else (
    echo.
    echo ❌ Setup cancelled.
    pause
)
