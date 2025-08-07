@echo off
echo.
echo 🚀 APEX AI FACE RECOGNITION - SYSTEM STARTUP GUIDE
echo =================================================
echo.

echo 📋 STEP 1: Install Required Dependencies
echo ----------------------------------------
echo Installing PostgreSQL module...
npm install pg @types/pg
echo.

echo 📋 STEP 2: Check System Status
echo ------------------------------
echo Running system status check...
node check_system_status.mjs
echo.

echo 📋 STEP 3: Backend Server Instructions
echo -------------------------------------
echo.
echo ⚠️  IMPORTANT: You need to start the backend server in a separate terminal
echo.
echo 💡 Open a NEW Command Prompt or Git Bash window and run:
echo    cd backend
echo    npm install
echo    npm run dev
echo.
echo ⚠️  Keep that terminal window open - the server needs to stay running
echo.

echo 📋 STEP 4: Continue After Backend Starts
echo ----------------------------------------
echo Once your backend server is running, come back here and run:
echo.
echo    node setup_face_recognition_database.mjs
echo    node test_face_recognition_integration.mjs
echo.

echo 📋 STEP 5: Access Face Management
echo --------------------------------
echo Open your browser and go to:
echo    http://localhost:3000/face-management
echo.

echo 🎉 Your Face Recognition system is ready to use!
echo.
pause
