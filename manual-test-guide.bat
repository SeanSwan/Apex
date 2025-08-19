@echo off
echo ========================================
echo APEX AI - SIMPLE MODAL TEST
echo ========================================
echo.
echo MANUAL TESTING INSTRUCTIONS:
echo.
echo 1. FIRST: Start the backend server
echo    - Open Command Prompt or PowerShell
echo    - Navigate to: backend folder
echo    - Run: npm start
echo    - Wait for "Server running on port 5001" message
echo.
echo 2. SECOND: Start the client portal  
echo    - Open another Command Prompt or PowerShell
echo    - Navigate to: client-portal folder
echo    - Run: npm run dev
echo    - Browser should open to http://localhost:5173
echo.
echo 3. THIRD: Test the modal system
echo    - Click the "Enter Platform" button on homepage
echo    - Role selection modal should appear
echo    - Select "Client Portal"
echo    - Login modal should appear
echo    - Use credentials:
echo      Email: sarah.johnson@luxeapartments.com
echo      Password: Demo123!
echo.
echo ========================================
echo QUICK START COMMANDS:
echo ========================================
echo.
echo Backend Terminal:
echo   cd backend
echo   npm start
echo.
echo Client Portal Terminal:
echo   cd client-portal  
echo   npm run dev
echo.
echo ========================================
echo EXPECTED MODAL BEHAVIOR:
echo ========================================
echo.
echo Homepage -> Click Button -> Role Modal Opens
echo Role Modal -> Select Client -> Login Modal Opens  
echo Login Modal -> Enter Creds -> Dashboard Loads
echo.
echo If modal doesn't appear:
echo - Check browser console (F12) for errors
echo - Verify button has onClick attribute
echo - Try refreshing the page
echo.
pause
