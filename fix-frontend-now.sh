#!/bin/bash
# Immediate Frontend Dependencies Fix

echo "=== Fixing Frontend Dependencies ==="
echo "1. Navigating to frontend directory..."
cd "C:/Users/ogpsw/Desktop/defense/frontend"

echo "2. Clearing npm cache..."
npm cache clean --force

echo "3. Installing all frontend dependencies..."
npm install --no-package-lock

echo "4. Generating new package-lock.json..."
npm install

echo "5. Verifying critical packages..."
echo "Checking lucide-react:"
if npm list lucide-react > /dev/null 2>&1; then
    echo "✓ lucide-react installed"
else
    echo "✗ lucide-react missing - installing manually"
    npm install lucide-react@^0.445.0
fi

echo "Checking @radix-ui/react-toast:"
if npm list @radix-ui/react-toast > /dev/null 2>&1; then
    echo "✓ @radix-ui/react-toast installed"
else
    echo "✗ @radix-ui/react-toast missing - installing manually"
    npm install @radix-ui/react-toast@^1.2.1
fi

echo "Checking tailwind-merge:"
if npm list tailwind-merge > /dev/null 2>&1; then
    echo "✓ tailwind-merge installed"
else
    echo "✗ tailwind-merge missing - installing manually"
    npm install tailwind-merge@^2.5.2
fi

echo "=== Frontend Dependencies Fix Complete ==="
