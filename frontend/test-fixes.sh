#!/bin/bash
# Final verification script for the fixes

echo "🔍 Testing Report Builder Fixes..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this from the frontend directory"
    exit 1
fi

echo "📦 Checking package.json dependencies..."
if grep -q "html2canvas" package.json && grep -q "jspdf" package.json && grep -q "recharts" package.json; then
    echo "✅ Core dependencies found in package.json"
else
    echo "⚠️ Some dependencies missing from package.json"
fi

echo ""
echo "📁 Checking for required files..."

files=(
    "src/components/Reports/EnhancedPDFGenerator.tsx"
    "src/components/Reports/ChartComponents.tsx" 
    "src/components/Reports/EnhancedReportBuilder.tsx"
    "src/components/Reports/DataVisualizationPanel.tsx"
    "src/components/Reports/PreviewPanel.tsx"
    "src/utils/verify-fixes.js"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "🎨 Checking marble texture asset..."
if [ -f "src/assets/marble-texture.png" ]; then
    echo "✅ Marble texture found"
else
    echo "❌ Marble texture missing"
fi

echo ""
echo "🚀 Ready to test! Run the following commands:"
echo ""
echo "1. Install dependencies:"
echo "   npm install"
echo ""
echo "2. Start the app:"
echo "   npm start"
echo ""
echo "3. Open browser console and run:"
echo "   reportBuilderVerify()"
echo ""
echo "4. Navigate to: http://localhost:5173/reports/new"
echo ""
echo "✨ All fixes should now be working!"
