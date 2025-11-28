#!/bin/bash

# ScanHack Deployment Script
# Deploys all canisters to ICP

set -e

echo "🚀 Starting ScanHack deployment..."

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ DFX SDK not found. Please install: https://sdk.dfinity.org/docs/quickstart/quickstart.html"
    exit 1
fi

# Start local network if not running
if ! dfx ping 2>/dev/null; then
    echo "📡 Starting local ICP network..."
    dfx start --background
    sleep 5
fi

# Create identities if needed
echo "🔐 Setting up identities..."
dfx identity use default || dfx identity new default

# Build frontend first
echo "🔨 Building frontend..."
cd frontend
npm run build
cd ..

# Deploy canisters
echo "📦 Deploying canisters..."
dfx deploy registry
dfx deploy missions
dfx deploy grantvault
dfx deploy backend
dfx deploy frontend

# Get canister IDs
echo ""
echo "📋 Canister IDs:"
echo "REGISTRY_CANISTER_ID=$(dfx canister id registry)"
echo "MISSIONS_CANISTER_ID=$(dfx canister id missions)"
echo "GRANTVAULT_CANISTER_ID=$(dfx canister id grantvault)"
echo "BACKEND_CANISTER_ID=$(dfx canister id backend)"
echo "FRONTEND_CANISTER_ID=$(dfx canister id frontend)"

# Generate .env.local file
echo ""
echo "📝 Generating frontend/.env.local..."
cat > frontend/.env.local << EOF
NEXT_PUBLIC_REGISTRY_CANISTER_ID=$(dfx canister id registry)
NEXT_PUBLIC_MISSIONS_CANISTER_ID=$(dfx canister id missions)
NEXT_PUBLIC_GRANTVAULT_CANISTER_ID=$(dfx canister id grantvault)
NEXT_PUBLIC_BACKEND_CANISTER_ID=$(dfx canister id backend)
NEXT_PUBLIC_IC_HOST=http://localhost:8000
NEXT_PUBLIC_IC_IDENTITY_PROVIDER=http://localhost:8080?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai
EOF

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Frontend URL: http://localhost:8000/?canisterId=$(dfx canister id frontend)"
echo ""
echo "💡 To start the frontend dev server:"
echo "   cd frontend && npm run dev"

