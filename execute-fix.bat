@echo off
echo === EXECUTING IMMEDIATE DEPENDENCY FIX ===
echo.
echo This will fix all dependency issues in both frontend and backend.
echo Please wait while dependencies are installed...
echo.

node fix-dependencies-now.js

echo.
echo === FIX EXECUTION COMPLETE ===
echo.
echo To test the application:
echo   npm start
echo.
echo To check specific issues:
echo   npm run test-frontend
echo   npm run test-backend
echo.
pause
