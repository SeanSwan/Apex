#!/bin/bash

echo "🔧 Installing missing dependencies..."

cd frontend

# Install missing dependencies
npm install html2canvas jspdf recharts

echo "✅ Dependencies installed!"
echo "📦 Installed: html2canvas, jspdf, recharts"

# Check if installation was successful
echo "🔍 Verifying installation..."
if npm list html2canvas > /dev/null 2>&1; then
    echo "✅ html2canvas installed"
else
    echo "❌ html2canvas failed to install"
fi

if npm list jspdf > /dev/null 2>&1; then
    echo "✅ jspdf installed"
else
    echo "❌ jspdf failed to install"
fi

if npm list recharts > /dev/null 2>&1; then
    echo "✅ recharts installed"
else
    echo "❌ recharts failed to install"
fi

echo "🚀 Ready to test! Run 'npm start' to launch the application."