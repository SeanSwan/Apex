#!/bin/bash

# APEX AI DESKTOP MONITOR - QUICK SETUP SCRIPT
# ============================================
# Automated setup for demo environment

echo "🚀 APEX AI DESKTOP MONITOR - QUICK SETUP"
echo "========================================"
echo ""

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

# Check if running in correct directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the apex_ai_desktop_app directory"
    exit 1
fi

print_status "Setting up Apex AI Desktop Monitor for demo..."
echo ""

# Check Node.js installation
print_status "Checking Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

# Check Python installation
print_status "Checking Python installation..."
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python found: $PYTHON_VERSION"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    PYTHON_VERSION=$(python --version)
    print_success "Python found: $PYTHON_VERSION"
    PYTHON_CMD="python"
else
    print_error "Python not found. Please install Python 3.8+ from https://python.org"
    exit 1
fi

# Install Node.js dependencies
print_status "Installing Node.js dependencies..."
if npm install; then
    print_success "Node.js dependencies installed"
else
    print_error "Failed to install Node.js dependencies"
    exit 1
fi

# Install Python dependencies for AI engine
print_status "Installing Python AI engine dependencies..."
cd ../apex_ai_engine

if [ -f "requirements.txt" ]; then
    if $PYTHON_CMD -m pip install -r requirements.txt; then
        print_success "Python dependencies installed"
    else
        print_warning "Some Python dependencies may have failed to install"
        print_status "Continuing with setup..."
    fi
else
    print_warning "requirements.txt not found, skipping Python dependencies"
fi

cd ../apex_ai_desktop_app

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p ../apex_ai_engine/models
mkdir -p ../apex_ai_engine/snapshots
mkdir -p ../apex_ai_engine/clips
print_success "Directories created"

# Download YOLOv8 model (optional)
print_status "Checking for AI model..."
if [ ! -f "../apex_ai_engine/yolov8n.pt" ]; then
    print_status "YOLOv8 model will be downloaded automatically on first run"
else
    print_success "YOLOv8 model already exists"
fi

# Test backend AI services (if available)
print_status "Testing backend AI services integration..."
cd ../backend
if [ -f "test-ai-services.mjs" ]; then
    if npm run test:ai &> /dev/null; then
        print_success "Backend AI services test passed"
    else
        print_warning "Backend AI services test failed or not available"
    fi
fi

cd ../apex_ai_desktop_app

echo ""
print_success "🎉 Setup complete! Ready for demo."
echo ""
echo "📋 QUICK START COMMANDS:"
echo "========================"
echo ""
echo "1. Start Python AI Engine:"
echo "   cd ../apex_ai_engine"
echo "   $PYTHON_CMD inference.py"
echo ""
echo "2. Start Desktop App (in new terminal):"
echo "   cd apex_ai_desktop_app"
echo "   npm run dev"
echo ""
echo "3. Or start everything with:"
echo "   npm run dev (will start both automatically)"
echo ""
echo "🎬 DEMO CHECKLIST:"
echo "=================="
echo "□ Test camera connections"
echo "□ Verify AI detection overlays"
echo "□ Test voice response feature"
echo "□ Check alert system"
echo "□ Practice CTO Console demo"
echo "□ Ensure stable network for RTSP streams"
echo ""
echo "🎯 Ready for July 28th demo!"
