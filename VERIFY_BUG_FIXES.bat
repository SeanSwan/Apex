@echo off
echo.
echo =====================================================
echo 🔍 QUICK BUG FIX VERIFICATION
echo =====================================================
echo.
cd /d "C:\Users\APEX AI\Desktop\defense\backend"
node final-verification.mjs
echo.
if %ERRORLEVEL% EQU 0 (
    echo ✅ ALL BUG FIXES VERIFIED SUCCESSFULLY!
    echo.
    echo 🚀 Ready to execute: EXECUTE_BUG_FREE_DEPLOYMENT.bat
) else (
    echo ❌ Some issues detected. Please review the output above.
)
echo.
pause
