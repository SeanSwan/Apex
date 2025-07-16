@echo off
echo.
echo ================================================
echo APEX AI STYLED COMPONENTS PROP CHECKER
echo ================================================
echo.
echo Checking frontend for styled-components DOM prop issues...
echo.

REM Navigate to frontend directory
cd "C:\Users\APEX AI\Desktop\defense\frontend\src"

echo [1/5] Checking for 'active' prop usage...
findstr /r /n "active=" . /s *.tsx *.ts | findstr -v "transient" | findstr -v "\$active"

echo.
echo [2/5] Checking for 'status' prop usage...
findstr /r /n "status=" . /s *.tsx *.ts | findstr -v "transient" | findstr -v "\$status"

echo.
echo [3/5] Checking for 'layout' prop usage...
findstr /r /n "layout=" . /s *.tsx *.ts | findstr -v "transient" | findstr -v "\$layout"

echo.
echo [4/5] Checking for 'isSelected' prop usage...
findstr /r /n "isSelected=" . /s *.tsx *.ts | findstr -v "transient" | findstr -v "\$isSelected"

echo.
echo [5/5] Checking for 'type' prop usage on styled components...
findstr /r /n "type=" . /s *.tsx *.ts | findstr -v "input" | findstr -v "button" | findstr -v "transient" | findstr -v "\$type"

echo.
echo ================================================
echo PROP CHECK COMPLETE
echo ================================================
echo.
echo If any results appear above, those props need to be converted
echo to transient props (prefix with $) in styled-components.
echo.
pause
