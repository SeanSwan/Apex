#!/bin/bash

# APEX AI FACE RECOGNITION - COMPLETE SYSTEM STARTUP GUIDE
# ========================================================

echo "🚀 APEX AI FACE RECOGNITION - SYSTEM STARTUP"
echo "=============================================="
echo

echo "📋 STEP 1: Install Required Dependencies"
echo "----------------------------------------"
echo "Installing PostgreSQL module..."
npm install pg @types/pg

echo
echo "📋 STEP 2: Start Backend Server (if not running)"
echo "-----------------------------------------------"
echo "💡 Open a new terminal and run:"
echo "   cd backend"
echo "   npm install"
echo "   npm run dev"
echo
echo "⚠️  Keep that terminal open - the backend server needs to stay running"
echo

echo "📋 STEP 3: Verify System Status"
echo "------------------------------"
node check_system_status.mjs

echo
echo "📋 STEP 4: Set Up Database (after backend is running)"
echo "---------------------------------------------------"
echo "💡 Run this command:"
echo "   node setup_face_recognition_database.mjs"

echo
echo "📋 STEP 5: Run Integration Tests"
echo "-------------------------------"
echo "💡 Run this command:"
echo "   node test_face_recognition_integration.mjs"

echo
echo "📋 STEP 6: Access Face Management System"
echo "---------------------------------------"
echo "💡 Open browser and go to:"
echo "   http://localhost:3000/face-management"

echo
echo "🎉 SYSTEM READY FOR USE!"
echo "========================"
