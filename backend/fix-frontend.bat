@echo off
echo 🔧 APEX AI FRONTEND - COMPREHENSIVE TYPESCRIPT FIX
echo ================================================

echo.
echo ✅ Step 1: App.jsx has been rewritten with clean JavaScript
echo ✅ Step 2: Clearing frontend cache...

cd ..\frontend

echo.
echo 🧹 Clearing Vite cache...
if exist node_modules\.vite rmdir /s /q node_modules\.vite
if exist dist rmdir /s /q dist
if exist .vite rmdir /s /q .vite

echo.
echo 🔄 Reinstalling dependencies...
call npm install

echo.
echo 🚀 Starting development server...
echo If you see TypeScript errors, press Ctrl+C and restart with:
echo npm run dev

call npm run dev

pause
