# APEX AI - Modal System Test (PowerShell Version)
# ==============================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "APEX AI - MODAL SYSTEM TEST (PowerShell)" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get current directory
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Write-Host "Project directory: $ProjectDir" -ForegroundColor Green

# Check if directories exist
$BackendPath = Join-Path $ProjectDir "backend"
$ClientPath = Join-Path $ProjectDir "client-portal"

if (!(Test-Path $BackendPath)) {
    Write-Host "ERROR: Backend directory not found at $BackendPath" -ForegroundColor Red
    Write-Host "Please make sure you're running this from the defense folder" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

if (!(Test-Path $ClientPath)) {
    Write-Host "ERROR: Client portal directory not found at $ClientPath" -ForegroundColor Red
    Write-Host "Please make sure you're running this from the defense folder" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "SUCCESS: Found both backend and client-portal directories" -ForegroundColor Green
Write-Host ""

# Start backend server
Write-Host "Starting backend server..." -ForegroundColor Yellow
$BackendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$BackendPath'; Write-Host 'APEX AI Backend Server (Port 5001)' -ForegroundColor Cyan; Write-Host '=============================' -ForegroundColor Cyan; npm start" -PassThru

# Wait a bit for backend to start
Start-Sleep -Seconds 3

# Start client portal
Write-Host "Starting client portal..." -ForegroundColor Yellow
Set-Location $ClientPath

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MODAL SYSTEM TESTING CHECKLIST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "WHEN BROWSER OPENS, VERIFY:" -ForegroundColor Yellow
Write-Host "1. Homepage loads with 'Enter Platform' button" -ForegroundColor White
Write-Host "2. Click button -> Role selection modal appears" -ForegroundColor White
Write-Host "3. Video background blurs during modal" -ForegroundColor White
Write-Host "4. Select 'Client Portal' -> Login modal appears" -ForegroundColor White
Write-Host "5. Enter credentials:" -ForegroundColor White
Write-Host "   Email: sarah.johnson@luxeapartments.com" -ForegroundColor Cyan
Write-Host "   Password: Demo123!" -ForegroundColor Cyan
Write-Host "6. Should redirect to dashboard" -ForegroundColor White
Write-Host ""
Write-Host "TROUBLESHOOTING:" -ForegroundColor Yellow
Write-Host "- If button doesn't work: Check browser console (F12)" -ForegroundColor White
Write-Host "- If modal doesn't appear: Try hard refresh (Ctrl+F5)" -ForegroundColor White
Write-Host "- If auth fails: Verify backend is running on port 5001" -ForegroundColor White
Write-Host ""
Write-Host "Backend: http://localhost:5001 (separate window)" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173 (starting now)" -ForegroundColor Green
Write-Host ""

# Start the development server
npm run dev
