@echo off
echo === Database Setup Options ===
echo.

echo Current database configuration from backend/.env:
echo Database: apex
echo User: swanadmin  
echo Host: localhost
echo Port: 5432
echo.

echo Option 1: Check if PostgreSQL is running
echo =========================================
sc query postgresql-x64-16 2>nul && (
    echo ✓ PostgreSQL service found and running
) || (
    sc query postgresql-x64-15 2>nul && (
        echo ✓ PostgreSQL 15 service found and running
    ) || (
        sc query postgresql-x64-14 2>nul && (
            echo ✓ PostgreSQL 14 service found and running
        ) || (
            echo ✗ PostgreSQL service not found or not running
            echo.
            echo Available options:
            echo 1. Install PostgreSQL: https://www.postgresql.org/download/
            echo 2. Start existing PostgreSQL service
            echo 3. Use Docker: docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=your_password postgres
            echo 4. Configure application to run without database ^(development mode^)
        )
    )
)

echo.
echo Option 2: Try to start PostgreSQL service
echo ========================================
echo Attempting to start PostgreSQL service...
net start postgresql-x64-16 2>nul && echo "✓ PostgreSQL started" || (
    net start postgresql-x64-15 2>nul && echo "✓ PostgreSQL 15 started" || (
        net start postgresql-x64-14 2>nul && echo "✓ PostgreSQL 14 started" || (
            echo "✗ Could not start PostgreSQL service"
            echo You may need to install PostgreSQL or run as administrator
        )
    )
)

echo.
echo Option 3: Test database connection
echo =================================
cd /d "C:\Users\ogpsw\Desktop\defense"

echo Testing database connection via backend health check...
timeout /t 2
start /b npm run start-backend
timeout /t 10
curl -s http://localhost:5000/api/health 2>nul && echo "✓ Backend responding" || echo "✗ Backend not responding"
taskkill /f /im node.exe 2>nul

echo.
echo === Database Setup Check Complete ===
echo.
echo If database is not available, the application will still start
echo but some features requiring database access will not work.
echo.
pause
