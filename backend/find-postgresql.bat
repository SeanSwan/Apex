@echo off
echo 🔍 APEX AI - POSTGRESQL PATH FINDER
echo ===================================

echo.
echo Searching for PostgreSQL installation...

REM Common PostgreSQL installation paths
set "POSSIBLE_PATHS=C:\Program Files\PostgreSQL\15\bin;C:\Program Files\PostgreSQL\14\bin;C:\Program Files\PostgreSQL\13\bin;C:\Program Files\PostgreSQL\12\bin;C:\Program Files (x86)\PostgreSQL\15\bin;C:\Program Files (x86)\PostgreSQL\14\bin;C:\Program Files (x86)\PostgreSQL\13\bin;C:\Program Files (x86)\PostgreSQL\12\bin"

for %%P in (%POSSIBLE_PATHS%) do (
    if exist "%%P\psql.exe" (
        echo ✅ Found PostgreSQL at: %%P
        echo.
        echo 🔧 Running database setup with full path...
        "%%P\psql.exe" -U postgres -f "scripts\fix-database-complete.sql"
        if %ERRORLEVEL% == 0 (
            echo.
            echo ✅ Database setup completed successfully!
            echo 🎯 Your APEX AI database is ready!
        ) else (
            echo.
            echo ❌ Setup failed. Check if:
            echo    1. PostgreSQL service is running
            echo    2. postgres user password is correct
            echo    3. PostgreSQL allows local connections
            echo.
            echo 💡 Manual command to try:
            echo    "%%P\psql.exe" -U postgres -f "scripts\fix-database-complete.sql"
        )
        goto :found
    )
)

echo ❌ PostgreSQL not found in common locations.
echo.
echo 🔍 Please check if PostgreSQL is installed:
echo    1. Download from: https://www.postgresql.org/download/windows/
echo    2. Or check your installation directory
echo.
echo 📂 Common paths to check manually:
echo    - C:\Program Files\PostgreSQL\[version]\bin\psql.exe
echo    - C:\Program Files (x86)\PostgreSQL\[version]\bin\psql.exe
echo.
echo 💡 If you find psql.exe, run this command:
echo    "[full-path-to-psql.exe]" -U postgres -f "scripts\fix-database-complete.sql"

:found
pause
