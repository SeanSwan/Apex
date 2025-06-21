#!/bin/bash

echo
echo "==============================================="
echo "GEMINI'S INFINITE LOOP FIX - HARD CACHE CLEAR"  
echo "==============================================="
echo

# Step 1: Stop any running development servers
echo "[1/5] Stopping any running development servers..."
pkill -f "node.*vite" 2>/dev/null || echo "No Vite processes to kill"
pkill -f "npm run dev" 2>/dev/null || echo "No npm dev processes to kill"
sleep 2

# Step 2: Delete Vite's cache directory
echo "[2/5] Deleting Vite cache directory..."
if [ -d "node_modules/.vite" ]; then
    rm -rf "node_modules/.vite"
    echo "✅ Vite cache cleared successfully"
else
    echo "⚠️ Vite cache directory not found (already clean)"
fi

# Step 3: Clean npm cache (extra safety)
echo "[3/5] Cleaning npm cache..."
npm cache clean --force

# Step 4: Reinstall dependencies (Gemini's recommendation)
echo "[4/5] Reinstalling dependencies for clean state..."
npm install

echo "[5/5] Starting fresh development server..."
echo
echo "==============================================="
echo "🚨 IMPORTANT: After server starts:"
echo "1. In your browser, press Ctrl+Shift+R (hard refresh)"
echo "2. Check console for 'Maximum update depth exceeded' error"
echo "3. If error is gone, the infinite loop is FIXED!"
echo "==============================================="
echo

# Start the development server
npm run dev
