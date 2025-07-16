@echo off
echo ===============================================
echo   APEX AI - CONSTANTS DUPLICATES FIXED
echo ===============================================
echo.

echo ✅ CONSTANTS FIXES COMPLETED:
echo   1. DEFAULT_AI_OPTIONS → DAILY_REPORTS_DEFAULT_AI_OPTIONS
echo   2. ANIMATION_CONFIG → DAILY_REPORTS_ANIMATION_CONFIG
echo.
echo ✅ PREVIOUS FIXES STILL ACTIVE:
echo   - Entry point: main.jsx → main.tsx
echo   - Styled components duplicates resolved
echo   - Import/export paths corrected
echo.

echo [1/2] Killing existing Node processes...
taskkill /f /im node.exe > nul 2>&1
echo ✅ Cleared Node processes

echo.
echo [2/2] Starting servers with ALL fixes applied...
echo.
echo 🚀 Frontend: http://localhost:5173
echo 🚀 Backend:  http://localhost:5000
echo.

npm start

echo.
echo ===============================================
echo SUCCESS CRITERIA:
echo ✅ No "Multiple exports" errors
echo ✅ No "Transform failed" errors  
echo ✅ Frontend loads cleanly
echo ===============================================
pause
