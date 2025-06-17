@echo off
echo 🔍 SEARCHING FOR POSTGRESQL INSTALLATION...
echo ============================================

echo.
echo Checking common PostgreSQL installation paths:
echo.

REM Check Program Files
if exist "C:\Program Files\PostgreSQL" (
    echo ✅ Found PostgreSQL in Program Files
    for /d %%i in ("C:\Program Files\PostgreSQL\*") do (
        echo    Version folder: %%i
        if exist "%%i\bin\psql.exe" (
            echo    ✅ psql.exe found at: %%i\bin\psql.exe
            set PSQL_PATH=%%i\bin\psql.exe
        )
    )
)

REM Check Program Files (x86)
if exist "C:\Program Files (x86)\PostgreSQL" (
    echo ✅ Found PostgreSQL in Program Files (x86)
    for /d %%i in ("C:\Program Files (x86)\PostgreSQL\*") do (
        echo    Version folder: %%i
        if exist "%%i\bin\psql.exe" (
            echo    ✅ psql.exe found at: %%i\bin\psql.exe
            set PSQL_PATH=%%i\bin\psql.exe
        )
    )
)

REM Check if PostgreSQL is in PATH
where psql >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ PostgreSQL is already in PATH
    where psql
) else (
    echo ❌ PostgreSQL is NOT in PATH
)

echo.
echo 💡 SOLUTION OPTIONS:
echo ===================
echo 1. Use full path method (recommended)
echo 2. Add PostgreSQL to PATH
echo 3. Use pgAdmin SQL tool
echo.
echo To run database setup with full path:
echo 1. Copy the full path shown above
echo 2. Run: "FULL_PATH_TO_PSQL" -U postgres -f "scripts\fix-database-complete.sql"
echo.
echo Example:
echo "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres -f "scripts\fix-database-complete.sql"

pause
