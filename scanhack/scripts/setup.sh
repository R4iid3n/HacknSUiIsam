#!/bin/bash

# ScanHack Setup Script
# Installs dependencies and sets up the project

set -e

echo "🚀 Setting up ScanHack..."

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "📦 Installing DFX SDK..."
    sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"
    echo "✅ DFX SDK installed"
else
    echo "✅ DFX SDK already installed"
fi

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start local ICP network: dfx start"
echo "2. Deploy canisters: ./scripts/deploy.sh"
echo "3. Update frontend/.env.local with canister IDs"
echo "4. Start frontend: cd frontend && npm run dev"

