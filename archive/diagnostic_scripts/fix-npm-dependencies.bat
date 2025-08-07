@echo off
echo === Defense Project: npm Dependencies Fix ===
echo Fixing esbuild/Vite dependency issues...

echo.
echo 1. Clearing npm cache...
npm cache clean --force

echo.
echo 2. Navigating to frontend directory...
cd /d "C:\Users\ogpsw\Desktop\defense\frontend"

echo.
echo 3. Installing frontend dependencies...
npm install

echo.
echo 4. Verifying Vite installation...
npx vite --version

echo.
echo 5. Returning to project root...
cd /d "C:\Users\ogpsw\Desktop\defense"

echo.
echo === Fix Complete ===
echo You can now run 'npm start' to launch the application.
pause
