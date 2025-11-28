#!/bin/bash

# ScanHack Build Script
# Builds frontend and prepares for deployment

set -e

echo "🔨 Building ScanHack..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build
cd ..

echo "✅ Build complete!"
echo ""
echo "Frontend build output: frontend/out"
echo "Ready for deployment to ICP!"

