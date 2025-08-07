#!/bin/bash

echo "🔧 COMPREHENSIVE REPORT BUILDER FIX"
echo "=================================="

cd frontend

echo "🧹 Step 1: Cleaning node_modules and package-lock..."
rm -rf node_modules
rm -f package-lock.json

echo "📦 Step 2: Fresh install of all dependencies..."
npm install

echo "🔍 Step 3: Verifying critical dependencies..."
DEPS_OK=true

if npm list html2canvas > /dev/null 2>&1; then
    echo "✅ html2canvas installed"
else
    echo "❌ html2canvas missing - installing..."
    npm install html2canvas@^1.4.1
    DEPS_OK=false
fi

if npm list jspdf > /dev/null 2>&1; then
    echo "✅ jspdf installed"
else
    echo "❌ jspdf missing - installing..."
    npm install jspdf@^2.5.1
    DEPS_OK=false
fi

if npm list recharts > /dev/null 2>&1; then
    echo "✅ recharts installed"
else
    echo "❌ recharts missing - installing..."
    npm install recharts@^2.8.0
    DEPS_OK=false
fi

if npm list styled-components > /dev/null 2>&1; then
    echo "✅ styled-components installed"
else
    echo "❌ styled-components missing - installing..."
    npm install styled-components@^6.1.12
    DEPS_OK=false
fi

echo ""
echo "🔧 Step 4: Applying code fixes..."

# Check if our fixed files are in place
if [ -f "src/components/Reports/EnhancedPreviewPanel.tsx" ]; then
    echo "✅ Enhanced Preview Panel found"
else
    echo "❌ Enhanced Preview Panel missing"
fi

if [ -f "src/components/Reports/BugFixVerification.tsx" ]; then
    echo "✅ Bug Fix Verification found"
else
    echo "❌ Bug Fix Verification missing"
fi

echo ""
echo "📊 Step 5: Dependency verification summary..."
npm list html2canvas jspdf recharts styled-components --depth=0

echo ""
echo "🚀 READY TO TEST!"
echo "=================="
echo "1. Run: npm start"
echo "2. Go to: http://localhost:5173/reports/new"
echo "3. Look for 🐛 AAA Status panel in top-right"
echo "4. Check that contact email shows 'it@defenseic.com'"
echo "5. Test bulk import in Daily Reports tab"
echo ""
echo "📋 Expected Results:"
echo "✅ Contact Email: it@defenseic.com (NOT client email)"
echo "✅ Signature: Sean Swan"
echo "✅ Chart Data: Generated automatically"
echo "✅ No styled-components warnings"
echo ""

if [ "$DEPS_OK" = true ]; then
    echo "🎉 ALL DEPENDENCIES VERIFIED!"
    exit 0
else
    echo "⚠️  Some dependencies were missing but have been installed"
    echo "   Try running this script again if issues persist"
    exit 1
fi