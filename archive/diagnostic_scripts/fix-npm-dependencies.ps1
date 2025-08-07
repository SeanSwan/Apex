# Fix npm dependencies script for Defense project
# This script cleans npm cache and reinstalls frontend dependencies

Write-Host "=== Defense Project: npm Dependencies Fix ===" -ForegroundColor Green
Write-Host "Fixing esbuild/Vite dependency issues..." -ForegroundColor Yellow

# Step 1: Clear npm cache
Write-Host "`n1. Clearing npm cache..." -ForegroundColor Cyan
npm cache clean --force

# Step 2: Navigate to frontend directory
Write-Host "`n2. Navigating to frontend directory..." -ForegroundColor Cyan
Set-Location "C:\Users\ogpsw\Desktop\defense\frontend"

# Step 3: Install dependencies
Write-Host "`n3. Installing frontend dependencies..." -ForegroundColor Cyan
npm install

# Step 4: Verify Vite installation
Write-Host "`n4. Verifying Vite installation..." -ForegroundColor Cyan
npx vite --version

# Step 5: Return to project root
Write-Host "`n5. Returning to project root..." -ForegroundColor Cyan
Set-Location "C:\Users\ogpsw\Desktop\defense"

Write-Host "`n=== Fix Complete ===" -ForegroundColor Green
Write-Host "You can now run 'npm start' to launch the application." -ForegroundColor Yellow
