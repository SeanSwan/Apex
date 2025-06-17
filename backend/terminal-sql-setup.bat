@echo off
echo 🛡️ APEX AI - TERMINAL SQL EXECUTION
echo ===================================

echo.
echo This will find PostgreSQL and execute the SQL script via terminal...
echo.

REM First check if SQL file exists
if not exist "COMPLETE_SETUP.sql" (
    echo ❌ SQL file not found! Generating it now...
    node generate-pgadmin-script.mjs
    echo.
)

echo 🔍 Searching for PostgreSQL installation...
echo.

REM Try different PostgreSQL paths
set FOUND_PSQL=

if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
    set FOUND_PSQL="C:\Program Files\PostgreSQL\16\bin\psql.exe"
    echo ✅ Found PostgreSQL 16
)
if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
    set FOUND_PSQL="C:\Program Files\PostgreSQL\15\bin\psql.exe"
    echo ✅ Found PostgreSQL 15
)
if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" (
    set FOUND_PSQL="C:\Program Files\PostgreSQL\14\bin\psql.exe"
    echo ✅ Found PostgreSQL 14
)
if exist "C:\Program Files\PostgreSQL\13\bin\psql.exe" (
    set FOUND_PSQL="C:\Program Files\PostgreSQL\13\bin\psql.exe"
    echo ✅ Found PostgreSQL 13
)

REM Try x86 versions
if exist "C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe" (
    set FOUND_PSQL="C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe"
    echo ✅ Found PostgreSQL 15 (x86)
)
if exist "C:\Program Files (x86)\PostgreSQL\14\bin\psql.exe" (
    set FOUND_PSQL="C:\Program Files (x86)\PostgreSQL\14\bin\psql.exe"
    echo ✅ Found PostgreSQL 14 (x86)
)

if "%FOUND_PSQL%"=="" (
    echo ❌ PostgreSQL not found in common locations
    echo.
    echo 💡 ALTERNATIVE METHODS:
    echo 1. Try Node.js method: node execute-sql-nodejs.mjs
    echo 2. Add PostgreSQL to PATH and try: psql -U postgres -d apex -f COMPLETE_SETUP.sql
    echo 3. Find your PostgreSQL installation manually
    echo.
    set /p continue="Try Node.js alternative? (y/N): "
    if /i "%continue%"=="y" (
        echo.
        echo Running Node.js SQL execution...
        node execute-sql-nodejs.mjs
    )
    pause
    exit /b 1
)

echo.
echo 🔧 Executing SQL script with PostgreSQL...
echo Command: %FOUND_PSQL% -U postgres -d apex -f COMPLETE_SETUP.sql
echo.
echo 💡 You may be prompted for postgres password...
echo    Try empty password first (just press Enter)
echo    Common passwords: postgres, admin, 123456
echo.

%FOUND_PSQL% -U postgres -d apex -f COMPLETE_SETUP.sql

if %errorlevel% == 0 (
    echo.
    echo ✅ SQL execution completed!
    echo.
    echo 🧪 Verifying database setup...
    node verify-database-setup.mjs
    echo.
    echo 🚀 If verification shows SUCCESS, you can now start your servers:
    echo    Backend: npm run dev
    echo    Frontend: cd ../frontend && npm run dev
) else (
    echo.
    echo ❌ SQL execution failed!
    echo.
    echo 💡 ALTERNATIVE: Try Node.js method...
    set /p trynode="Try Node.js authentication method? (y/N): "
    if /i "%trynode%"=="y" (
        echo.
        node execute-sql-nodejs.mjs
    )
)

echo.
pause
