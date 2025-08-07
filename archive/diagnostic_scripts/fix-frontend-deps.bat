@echo off
echo === Frontend Dependencies Installation ===
echo.

cd /d "C:\Users\ogpsw\Desktop\defense\frontend"

echo 1. Clearing npm cache...
npm cache clean --force

echo.
echo 2. Installing all frontend dependencies...
npm install

echo.
echo 3. Verifying critical missing packages...
echo.
echo Checking lucide-react:
npm list lucide-react 2>nul && echo "✓ lucide-react installed" || echo "✗ lucide-react missing"

echo.
echo Checking @radix-ui packages:
npm list @radix-ui/react-toast 2>nul && echo "✓ @radix-ui/react-toast installed" || echo "✗ @radix-ui/react-toast missing"
npm list @radix-ui/react-slot 2>nul && echo "✓ @radix-ui/react-slot installed" || echo "✗ @radix-ui/react-slot missing"
npm list @radix-ui/react-switch 2>nul && echo "✓ @radix-ui/react-switch installed" || echo "✗ @radix-ui/react-switch missing"
npm list @radix-ui/react-label 2>nul && echo "✓ @radix-ui/react-label installed" || echo "✗ @radix-ui/react-label missing"
npm list @radix-ui/react-tabs 2>nul && echo "✓ @radix-ui/react-tabs installed" || echo "✗ @radix-ui/react-tabs missing"

echo.
echo Checking utility packages:
npm list class-variance-authority 2>nul && echo "✓ class-variance-authority installed" || echo "✗ class-variance-authority missing"
npm list tailwind-merge 2>nul && echo "✓ tailwind-merge installed" || echo "✗ tailwind-merge missing"

echo.
echo 4. Testing Vite startup...
echo Starting Vite for 5 seconds to test...
timeout /t 2
start /b npm run dev
timeout /t 5
taskkill /f /im node.exe 2>nul

echo.
echo === Frontend Dependencies Fix Complete ===
cd /d "C:\Users\ogpsw\Desktop\defense"
pause
