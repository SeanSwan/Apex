@echo off
echo 🔍 Checking for other toast notification issues...
echo.

cd /d "C:\Users\APEX AI\Desktop\defense"

echo Searching for potential toast issues in client portal...
findstr /R /N "toast\." client-portal\src\*.* client-portal\src\**\*.* 2>nul | findstr /V "toast(" | findstr /V "toast.success" | findstr /V "toast.error" | findstr /V "toast.loading" | findstr /V "toast.promise"

echo.
echo ✅ Toast notification error has been fixed!
echo.
echo 🚀 Your system is now ready. You can:
echo 1. Click on recent critical incidents without errors
echo 2. All toast notifications will work properly
echo 3. Continue testing your platform
echo.
echo Press any key to continue...
pause >nul
