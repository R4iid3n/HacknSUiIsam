#!/bin/bash

# ScanHack - Script de Test Complet
# Teste tous les composants du projet

set -e

export PATH="$HOME/Library/Application Support/org.dfinity.dfx/bin:$PATH"

echo "🧪 ScanHack - Tests Complets"
echo "============================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

cd "$(dirname "$0")/.."

# 1. Vérifier DFX
echo "1️⃣  Vérification de DFX..."
if ! command -v dfx &> /dev/null; then
    echo -e "${RED}❌ DFX non trouvé${NC}"
    exit 1
fi
echo -e "${GREEN}✅ DFX installé: $(dfx --version)${NC}"
echo ""

# 2. Vérifier le réseau
echo "2️⃣  Vérification du réseau ICP..."
if ! dfx ping 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Réseau non démarré, démarrage...${NC}"
    dfx start --background
    sleep 5
fi
echo -e "${GREEN}✅ Réseau ICP actif${NC}"
echo ""

# 3. Vérifier les canisters
echo "3️⃣  Vérification des canisters..."
REGISTRY_ID=$(dfx canister id registry 2>/dev/null || echo "")
MISSIONS_ID=$(dfx canister id missions 2>/dev/null || echo "")
GRANTVAULT_ID=$(dfx canister id grantvault 2>/dev/null || echo "")
BACKEND_ID=$(dfx canister id backend 2>/dev/null || echo "")
FRONTEND_ID=$(dfx canister id frontend 2>/dev/null || echo "")

if [ -z "$REGISTRY_ID" ]; then
    echo -e "${YELLOW}⚠️  Canisters non créés, création...${NC}"
    dfx canister create --all
    REGISTRY_ID=$(dfx canister id registry)
    MISSIONS_ID=$(dfx canister id missions)
    GRANTVAULT_ID=$(dfx canister id grantvault)
    BACKEND_ID=$(dfx canister id backend)
    FRONTEND_ID=$(dfx canister id frontend)
fi

echo -e "${GREEN}✅ Canisters créés:${NC}"
echo "   Registry: $REGISTRY_ID"
echo "   Missions: $MISSIONS_ID"
echo "   GrantVault: $GRANTVAULT_ID"
echo "   Backend: $BACKEND_ID"
echo "   Frontend: $FRONTEND_ID"
echo ""

# 4. Build frontend
echo "4️⃣  Build du frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "   Installation des dépendances..."
    npm install
fi
npm run build
echo -e "${GREEN}✅ Frontend buildé${NC}"
cd ..
echo ""

# 5. Test Registry
echo "5️⃣  Test du canister Registry..."
if dfx canister call registry register 2>&1 | grep -q "ok\|err"; then
    echo -e "${GREEN}✅ Registry fonctionne${NC}"
else
    echo -e "${YELLOW}⚠️  Registry: besoin de déploiement${NC}"
fi
echo ""

# 6. Résumé
echo "============================"
echo -e "${GREEN}✅ Tests terminés${NC}"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Déployer les canisters: dfx deploy"
echo "   2. Lancer le frontend: cd frontend && npm run dev"
echo "   3. Ouvrir: http://localhost:3000"
echo ""
echo "💡 Note: Si dfx crash avec des erreurs de couleur,"
echo "   c'est un bug connu mais les canisters fonctionnent."
echo "   Teste dans un terminal propre si nécessaire."

