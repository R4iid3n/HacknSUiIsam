#!/bin/bash

# ============================================
# LémanFlow Deployment Script
# ============================================
# This script deploys Move contracts to Sui blockchain
# ============================================

set -e

echo "🚀 LémanFlow Deployment Script"
echo "================================"
echo ""

# Check if sui CLI is installed
if ! command -v sui &> /dev/null; then
    echo "❌ Error: sui CLI not found"
    echo "Please install SUI CLI: https://docs.sui.io/build/install"
    exit 1
fi

# Network selection
echo "Select network:"
echo "1) testnet"
echo "2) devnet"
echo "3) mainnet"
echo "4) localnet"
read -p "Enter choice [1-4]: " network_choice

case $network_choice in
    1) NETWORK="testnet" ;;
    2) NETWORK="devnet" ;;
    3) NETWORK="mainnet" ;;
    4) NETWORK="localnet" ;;
    *) echo "Invalid choice"; exit 1 ;;
esac

echo "📡 Network: $NETWORK"

# Switch to network
echo ""
echo "🔄 Switching to $NETWORK..."
sui client switch --env $NETWORK

# Check active address
ACTIVE_ADDRESS=$(sui client active-address)
echo "📍 Active address: $ACTIVE_ADDRESS"

# Check balance
echo ""
echo "💰 Checking balance..."
sui client balance

# Confirm deployment
echo ""
read -p "❓ Deploy to $NETWORK? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "❌ Deployment cancelled"
    exit 0
fi

# Build Move package
echo ""
echo "🔨 Building Move package..."
cd move
sui move build

# Run tests
echo ""
echo "🧪 Running tests..."
sui move test

# Deploy
echo ""
echo "📦 Deploying to $NETWORK..."
DEPLOY_OUTPUT=$(sui client publish --gas-budget 100000000 --json)

# Parse output
PACKAGE_ID=$(echo $DEPLOY_OUTPUT | jq -r '.objectChanges[] | select(.type == "published") | .packageId')
UPGRADE_CAP=$(echo $DEPLOY_OUTPUT | jq -r '.objectChanges[] | select(.objectType | contains("UpgradeCap")) | .objectId')

echo ""
echo "✅ Deployment successful!"
echo "================================"
echo ""
echo "📦 Package ID: $PACKAGE_ID"
echo "🔑 Upgrade Cap: $UPGRADE_CAP"
echo ""
echo "⚠️  IMPORTANT: Save these values!"
echo ""
echo "Next steps:"
echo "1. Update .env file with PACKAGE_ID=$PACKAGE_ID"
echo "2. Create sponsor account: sui keytool generate ed25519"
echo "3. Fund sponsor account: sui client faucet (testnet)"
echo "4. Update .env with sponsor private key"
echo "5. Start backend: cd backend && npm run dev"
echo ""
