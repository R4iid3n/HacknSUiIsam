#!/bin/bash

# ScanHack Reset Script
# Resets all canisters (WARNING: Deletes all data)

set -e

echo "⚠️  WARNING: This will delete all canister data!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Reset cancelled"
    exit 1
fi

echo "🔄 Resetting canisters..."

dfx canister uninstall-code registry || true
dfx canister uninstall-code missions || true
dfx canister uninstall-code grantvault || true
dfx canister uninstall-code backend || true
dfx canister uninstall-code frontend || true

echo "✅ Reset complete!"
echo "💡 Run ./scripts/deploy.sh to redeploy"

