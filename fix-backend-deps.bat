@echo off
echo === Backend Dependencies Installation ===
echo.

cd /d "C:\Users\ogpsw\Desktop\defense\backend"

echo 1. Installing missing jsdom package...
npm install

echo.
echo 2. Verifying jsdom installation...
npm list jsdom 2>nul && echo "✓ jsdom installed successfully" || echo "✗ jsdom installation failed"

echo.
echo 3. Testing backend startup (without database)...
echo Starting backend for 5 seconds to test...
timeout /t 2
start /b npm run dev
timeout /t 5
taskkill /f /im node.exe 2>nul

echo.
echo === Backend Dependencies Fix Complete ===
cd /d "C:\Users\ogpsw\Desktop\defense"
pause
