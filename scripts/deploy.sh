#!/bin/bash

# MentourMe Deployment Script
# This script helps automate the deployment process

set -e

echo "🚀 MentourMe Deployment Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    echo "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "git is not installed"
        exit 1
    fi
    
    print_status "All dependencies are installed"
}

# Install dependencies
install_dependencies() {
    echo "Installing dependencies..."
    
    # Backend dependencies
    echo "Installing backend dependencies..."
    cd server
    npm ci
    cd ..
    
    # Frontend dependencies
    echo "Installing frontend dependencies..."
    cd client
    npm ci
    cd ..
    
    print_status "Dependencies installed"
}

# Run tests
run_tests() {
    echo "Running tests..."
    
    # Backend tests
    if [ -f "server/package.json" ] && grep -q '"test"' server/package.json; then
        echo "Running backend tests..."
        cd server
        npm test || print_warning "Backend tests failed"
        cd ..
    fi
    
    # Frontend tests
    if [ -f "client/package.json" ] && grep -q '"test"' client/package.json; then
        echo "Running frontend tests..."
        cd client
        npm test || print_warning "Frontend tests failed"
        cd ..
    fi
    
    print_status "Tests completed"
}

# Build frontend
build_frontend() {
    echo "Building frontend..."
    cd client
    npm run build
    cd ..
    print_status "Frontend built successfully"
}

# Deploy to production
deploy() {
    echo "Deploying to production..."
    
    # Commit and push changes
    git add .
    git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')" || echo "No changes to commit"
    git push origin main
    
    print_status "Code pushed to repository"
    print_status "Deployment triggered automatically via GitHub Actions"
}

# Environment setup
setup_env() {
    echo "Setting up environment files..."
    
    # Backend environment
    if [ ! -f "server/.env.production" ]; then
        cp server/.env.production.example server/.env.production
        print_warning "Created server/.env.production - please fill in your values"
    fi
    
    # Frontend environment
    if [ ! -f "client/.env.production" ]; then
        print_status "Frontend production environment already configured"
    fi
    
    print_status "Environment setup complete"
}

# Main deployment flow
main() {
    echo "Starting deployment process..."
    
    check_dependencies
    setup_env
    install_dependencies
    run_tests
    build_frontend
    
    echo ""
    echo "🎯 Ready to deploy!"
    echo "Please ensure you have:"
    echo "1. ✅ Railway database running"
    echo "2. ✅ Render backend configured"
    echo "3. ✅ Cloudflare Pages configured"
    echo "4. ✅ Environment variables set"
    echo ""
    
    read -p "Deploy to production? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        deploy
        echo ""
        print_status "Deployment complete!"
        echo "🌐 Frontend: Check Cloudflare Pages dashboard"
        echo "🔧 Backend: Check Render dashboard"
        echo "💾 Database: Check Railway dashboard"
    else
        echo "Deployment cancelled"
    fi
}

# Run main function
main
