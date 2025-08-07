#!/bin/bash

# APEX AI FACE RECOGNITION - ONE-COMMAND STARTUP
# ==============================================
# Starts backend server and runs all setup in one command

echo "🚀 APEX AI FACE RECOGNITION - ONE-COMMAND STARTUP"
echo "=================================================="
echo

echo "📁 Navigating to backend directory..."
cd backend

echo "📦 Installing backend dependencies..."
npm install

echo "🚀 Starting backend server in background..."
# Start backend server in background
npm run dev &
BACKEND_PID=$!

echo "✅ Backend server started (PID: $BACKEND_PID)"
echo "⏳ Waiting for server to initialize..."
sleep 8

echo "🔄 Returning to main directory..."
cd ..

echo "🔍 Checking system status..."
node check_system_status.mjs

echo
echo "🗄️ Setting up database..."
node setup_face_recognition_database.mjs

echo
echo "🧪 Running integration tests..."
node test_face_recognition_integration.mjs

echo
echo "🎉 SETUP COMPLETE!"
echo "=================="
echo
echo "✅ Face Recognition system is ready!"
echo "🌐 Access it at: http://localhost:3000/face-management"
echo
echo "⚠️  Backend server is running in background (PID: $BACKEND_PID)"
echo "💡 To stop the server later, run: kill $BACKEND_PID"
echo

# Keep the script running so backend doesn't stop
echo "🔄 Press Ctrl+C to stop the backend server and exit"
wait $BACKEND_PID
