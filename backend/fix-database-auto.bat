@echo off
echo 🛡️ APEX AI - AUTO PSQL DATABASE SETUP
echo =====================================

echo.
echo 🔍 Automatically searching for PostgreSQL and running setup...
echo.

REM Define common PostgreSQL paths
set PSQL15="C:\Program Files\PostgreSQL\15\bin\psql.exe"
set PSQL14="C:\Program Files\PostgreSQL\14\bin\psql.exe"
set PSQL13="C:\Program Files\PostgreSQL\13\bin\psql.exe"
set PSQL16="C:\Program Files\PostgreSQL\16\bin\psql.exe"
set PSQL15_x86="C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe"
set PSQL14_x86="C:\Program Files (x86)\PostgreSQL\14\bin\psql.exe"

REM Try each path
if exist %PSQL16% (
    echo ✅ Found PostgreSQL 16 - Running setup...
    %PSQL16% -U postgres -f "scripts\fix-database-complete.sql"
    goto :success
)

if exist %PSQL15% (
    echo ✅ Found PostgreSQL 15 - Running setup...
    %PSQL15% -U postgres -f "scripts\fix-database-complete.sql"
    goto :success
)

if exist %PSQL14% (
    echo ✅ Found PostgreSQL 14 - Running setup...
    %PSQL14% -U postgres -f "scripts\fix-database-complete.sql"
    goto :success
)

if exist %PSQL13% (
    echo ✅ Found PostgreSQL 13 - Running setup...
    %PSQL13% -U postgres -f "scripts\fix-database-complete.sql"
    goto :success
)

if exist %PSQL15_x86% (
    echo ✅ Found PostgreSQL 15 (x86) - Running setup...
    %PSQL15_x86% -U postgres -f "scripts\fix-database-complete.sql"
    goto :success
)

if exist %PSQL14_x86% (
    echo ✅ Found PostgreSQL 14 (x86) - Running setup...
    %PSQL14_x86% -U postgres -f "scripts\fix-database-complete.sql"
    goto :success
)

REM If no PostgreSQL found
echo ❌ PostgreSQL installation not found!
echo.
echo 💡 TRY THESE SOLUTIONS:
echo ======================
echo 1. Use Node.js alternative: node setup-database-nodejs.mjs
echo 2. Find PostgreSQL manually: find-psql.bat
echo 3. Use pgAdmin (see DATABASE_SETUP_GUIDE.md)
echo 4. Install PostgreSQL: https://www.postgresql.org/download/windows/
echo.
pause
exit /b 1

:success
echo.
echo ✅ Database setup completed!
echo.
echo 🎯 Next Steps:
echo   1. Start backend: npm run dev
echo   2. Start frontend: cd ../frontend && npm run dev
echo.
pause
