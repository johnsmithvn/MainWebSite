#!/bin/bash

# 🚀 MainWebSite React App - Quick Start Script
# This script helps you quickly start the React version of MainWebSite

echo "🚀 MainWebSite React App - Quick Start"
echo "======================================"

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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js version: $(node --version)"

# Check if we're in the react-app directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the react-app directory"
    exit 1
fi

# Check if backend server is running
print_status "Checking backend server..."
if curl -s http://localhost:3000/api/source-keys.js > /dev/null; then
    print_success "Backend server is running on port 3000"
else
    print_warning "Backend server is not running on port 3000"
    print_status "Please start the backend server first:"
    echo "  cd .. && npm run dev"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        print_success "Dependencies installed successfully"
    else
        print_error "Failed to install dependencies"
        exit 1
    fi
else
    print_success "Dependencies already installed"
fi

# Ask user what they want to do
echo ""
echo "What would you like to do?"
echo "1) Start development server (recommended)"
echo "2) Build for production"
echo "3) Preview production build"
echo "4) Run tests (if available)"
echo "5) Clean install (remove node_modules and reinstall)"

read -p "Choose an option (1-5): " choice

case $choice in
    1)
        print_status "Starting development server..."
        print_status "React app will be available at: http://localhost:3001"
        print_status "Press Ctrl+C to stop the server"
        npm run dev
        ;;
    2)
        print_status "Building for production..."
        npm run build
        if [ $? -eq 0 ]; then
            print_success "Build completed successfully"
            print_status "Build files are in the 'dist' directory"
        else
            print_error "Build failed"
            exit 1
        fi
        ;;
    3)
        print_status "Building and previewing production build..."
        npm run build && npm run preview
        ;;
    4)
        if npm run test --silent > /dev/null 2>&1; then
            print_status "Running tests..."
            npm run test
        else
            print_warning "No test script found in package.json"
        fi
        ;;
    5)
        print_status "Cleaning and reinstalling dependencies..."
        rm -rf node_modules package-lock.json
        npm install
        if [ $? -eq 0 ]; then
            print_success "Clean install completed"
        else
            print_error "Clean install failed"
            exit 1
        fi
        ;;
    *)
        print_error "Invalid option. Please choose 1-5."
        exit 1
        ;;
esac

print_success "Done! 🎉"
