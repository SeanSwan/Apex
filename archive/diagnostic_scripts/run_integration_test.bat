@echo off
echo.
echo 🔗 APEX AI FACE RECOGNITION - INTEGRATION TEST RUNNER
echo ================================================================
echo.

echo ⏳ Running comprehensive integration tests...
echo.

cd /d "C:\Users\APEX AI\Desktop\defense"

REM Run the integration test
node run_integration_test.mjs

echo.
echo ✅ Integration testing completed. Check results above.
echo.
echo 📋 QUICK ACCESS COMMANDS:
echo - Start Backend: cd backend && npm run dev
echo - Start Frontend: cd frontend && npm run dev  
echo - Access Face Management: http://localhost:5173/face-management
echo.
pause
