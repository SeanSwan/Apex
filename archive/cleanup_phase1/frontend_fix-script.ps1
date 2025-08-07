# PowerShell Fix Script for Defense Frontend
Write-Host "🎯 APEX AI DEFENSE - PowerShell Fix Script" -ForegroundColor Yellow
Write-Host ""

Write-Host "🧹 Cleaning old installations..." -ForegroundColor Blue
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force "node_modules"
    Write-Host "✅ Removed node_modules" -ForegroundColor Green
}

if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json"
    Write-Host "✅ Removed package-lock.json" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
npm install

Write-Host ""
Write-Host "🔍 Verifying critical dependencies..." -ForegroundColor Blue
npm list html2canvas --depth=0
npm list jspdf --depth=0
npm list recharts --depth=0

Write-Host ""
Write-Host "🚀 Starting development server..." -ForegroundColor Blue
Write-Host "✨ All fixes applied! Check for 🐛 AAA Status panel." -ForegroundColor Green
npm run dev
