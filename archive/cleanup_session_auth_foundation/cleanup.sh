#!/bin/bash

# 🧹 APEX AI PLATFORM - AUTOMATED DEPENDENCY CLEANUP SCRIPT
# This script will clean up conflicting dependencies and optimize the project

echo "🚀 Starting Apex AI Platform Dependency Cleanup..."
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    print_error "Please run this script from the project root directory (where package.json exists)"
    exit 1
fi

print_status "Found project root. Starting cleanup..."

# Backup package.json files
print_status "Creating backups..."
cp frontend/package.json frontend/package.json.backup
cp backend/package.json backend/package.json.backup
print_success "Backup files created"

# Clean up Frontend Dependencies
print_status "Cleaning up frontend dependencies..."
cd frontend

print_status "Removing conflicting UI libraries..."
npm uninstall @mui/material @mui/icons-material @emotion/react @emotion/styled 2>/dev/null || true

print_status "Removing conflicting state management..."
npm uninstall @reduxjs/toolkit react-redux redux swr 2>/dev/null || true

print_status "Removing deprecated packages..."
npm uninstall moment 2>/dev/null || true

print_status "Ensuring modern date library is installed..."
npm install date-fns

print_success "Frontend cleanup complete"

# Clean up Backend Dependencies
print_status "Cleaning up backend dependencies..."
cd ../backend

print_status "Removing frontend packages from backend..."
npm uninstall react-modal swr 2>/dev/null || true

print_status "Removing unused packages..."
npm uninstall llama-node mysql2 2>/dev/null || true

print_status "Removing deprecated packages..."
npm uninstall moment 2>/dev/null || true

print_status "Ensuring modern date library is installed..."
npm install date-fns

print_success "Backend cleanup complete"

# Return to project root
cd ..

# Run security audit
print_status "Running security audit..."
cd frontend && npm audit fix 2>/dev/null || true
cd ../backend && npm audit fix 2>/dev/null || true
cd ..

print_success "Security audit complete"

# Verify the cleanup
print_status "Verifying cleanup..."

echo ""
echo "📊 CLEANUP SUMMARY"
echo "=================="

# Check frontend bundle size (rough estimate)
if command -v du &> /dev/null; then
    frontend_size=$(du -sh frontend/node_modules 2>/dev/null | cut -f1 || echo "Unknown")
    backend_size=$(du -sh backend/node_modules 2>/dev/null | cut -f1 || echo "Unknown")
    echo "Frontend node_modules size: $frontend_size"
    echo "Backend node_modules size: $backend_size"
fi

echo ""
print_success "✅ Cleanup completed successfully!"
echo ""
echo "🎯 NEXT STEPS:"
echo "=============="
echo "1. Test the application: npm run start"
echo "2. Verify all modules load correctly"
echo "3. Check for any import errors"
echo "4. Run performance tests"
echo ""
echo "🔗 VERIFY THESE URLS WORK:"
echo "- http://localhost:3000/ (Platform Landing)"
echo "- http://localhost:3000/live-monitoring"
echo "- http://localhost:3000/guard-operations"
echo "- http://localhost:3000/admin"
echo "- http://localhost:3000/reports/new"
echo ""
print_warning "If you encounter any issues, restore from backup files:"
echo "- frontend/package.json.backup"
echo "- backend/package.json.backup"
echo ""
print_success "🚀 Your Apex AI Platform is now optimized!"
