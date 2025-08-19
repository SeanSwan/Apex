@echo off
cls
echo =====================================================
echo APEX AI - AUTOMATED BEST JUDGMENT EXECUTION
echo =====================================================
echo.
echo 🎯 Executing based on Master Prompt requirements:
echo    1. Fix broken database foundation IMMEDIATELY
echo    2. Build critical missing components
echo    3. Ensure job security through working system
echo.
echo ⚡ PHASE 1: Database Foundation (EXECUTING NOW)
echo =====================================================

cd /d "C:\Users\APEX AI\Desktop\defense\backend"

echo 🔍 Running readiness check...
node final-readiness-check.mjs
if %ERRORLEVEL% NEQ 0 (
    echo ❌ System not ready. Please check the issues above.
    pause
    exit /b 1
)

echo.
echo ✅ System ready! Proceeding with unified setup...
echo.

cd /d "C:\Users\APEX AI\Desktop\defense"
call MASTER_UNIFIED_SETUP.bat

echo.
echo =====================================================
echo ⚡ PHASE 2: Component Development (NEXT)
echo =====================================================
echo Ready to build critical components immediately after database success.
pause
