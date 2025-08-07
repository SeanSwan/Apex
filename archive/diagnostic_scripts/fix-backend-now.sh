#!/bin/bash
# Immediate Backend Dependencies Fix

echo "=== Fixing Backend Dependencies ==="
echo "1. Navigating to backend directory..."
cd "C:/Users/ogpsw/Desktop/defense/backend"

echo "2. Installing backend dependencies (including jsdom)..."
npm install

echo "3. Verifying jsdom installation..."
if npm list jsdom > /dev/null 2>&1; then
    echo "✓ jsdom installed successfully"
else
    echo "✗ jsdom missing - installing manually"
    npm install jsdom@^24.0.0 --save-dev
fi

echo "=== Backend Dependencies Fix Complete ==="
