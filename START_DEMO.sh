#!/bin/bash

# 🚀 Script de Démarrage Rapide - LémanFlow Demo
# Ce script lance le backend et le frontend pour la démo

set -e

echo "🌊 LémanFlow - Démarrage de la Démo"
echo "===================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier Node.js
echo -e "${BLUE}🔍 Vérification de Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js n'est pas installé${NC}"
    echo "Installez Node.js depuis https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✓ Node.js $NODE_VERSION détecté${NC}"
echo ""

# Vérifier npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm n'est pas installé${NC}"
    exit 1
fi

# Fonction pour tuer les processus sur les ports
kill_port() {
    local port=$1
    echo -e "${YELLOW}🔍 Vérification du port $port...${NC}"
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}⚠️  Port $port occupé, nettoyage...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
        echo -e "${GREEN}✓ Port $port libéré${NC}"
    else
        echo -e "${GREEN}✓ Port $port disponible${NC}"
    fi
}

# Nettoyer les ports
echo -e "${BLUE}🧹 Nettoyage des ports...${NC}"
kill_port 4000  # Backend
kill_port 5173  # Frontend
echo ""

# Installer les dépendances backend
echo -e "${BLUE}📦 Installation des dépendances backend...${NC}"
cd backend
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installation en cours...${NC}"
    npm install
    echo -e "${GREEN}✓ Dépendances backend installées${NC}"
else
    echo -e "${GREEN}✓ Dépendances backend déjà installées${NC}"
fi
cd ..
echo ""

# Installer les dépendances frontend
echo -e "${BLUE}📦 Installation des dépendances frontend...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installation en cours...${NC}"
    npm install
    echo -e "${GREEN}✓ Dépendances frontend installées${NC}"
else
    echo -e "${GREEN}✓ Dépendances frontend déjà installées${NC}"
fi
cd ..
echo ""

# Vérifier les variables d'environnement
echo -e "${BLUE}🔧 Vérification de la configuration...${NC}"

# Backend .env
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Fichier backend/.env manquant${NC}"
    echo -e "${YELLOW}Création d'un fichier .env de démo...${NC}"
    cat > backend/.env << EOF
# Mode démo (pas de vraies transactions blockchain)
MOCK_MODE=true

# Configuration Sui
SUI_NETWORK=testnet
PACKAGE_ID=0x0000000000000000000000000000000000000000000000000000000000000000

# Sponsor (non utilisé en mode mock)
SPONSOR_PRIVATE_KEY=mock
SPONSOR_ADDRESS=0x0000000000000000000000000000000000000000000000000000000000000000

# API
PORT=4000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:5173

# Session
SESSION_SECRET=demo-secret-change-in-production
EOF
    echo -e "${GREEN}✓ Fichier .env créé (mode MOCK)${NC}"
else
    echo -e "${GREEN}✓ Fichier backend/.env existe${NC}"
fi

# Frontend .env
if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}⚠️  Fichier frontend/.env manquant${NC}"
    echo -e "${YELLOW}Création d'un fichier .env de démo...${NC}"
    cat > frontend/.env << EOF
VITE_API_BASE=http://localhost:4000
VITE_SUI_NETWORK=testnet
EOF
    echo -e "${GREEN}✓ Fichier .env créé${NC}"
else
    echo -e "${GREEN}✓ Fichier frontend/.env existe${NC}"
fi
echo ""

# Lancer le backend
echo -e "${BLUE}🚀 Démarrage du backend...${NC}"
cd backend
npm run dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Attendre que le backend soit prêt
echo -e "${YELLOW}⏳ Attente du backend (max 30s)...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:4000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend prêt !${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Timeout : le backend n'a pas démarré${NC}"
        echo -e "${YELLOW}Logs du backend :${NC}"
        tail -n 20 backend.log
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
    echo -n "."
done
echo ""

# Lancer le frontend
echo -e "${BLUE}🚀 Démarrage du frontend...${NC}"
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Attendre que le frontend soit prêt
echo -e "${YELLOW}⏳ Attente du frontend (max 30s)...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend prêt !${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Timeout : le frontend n'a pas démarré${NC}"
        echo -e "${YELLOW}Logs du frontend :${NC}"
        tail -n 20 frontend.log
        kill $BACKEND_PID 2>/dev/null || true
        kill $FRONTEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
    echo -n "."
done
echo ""

# Afficher les informations
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✨ LémanFlow est prêt pour la démo ! ✨${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📍 URLs :${NC}"
echo -e "   Frontend : ${GREEN}http://localhost:5173${NC}"
echo -e "   Backend  : ${GREEN}http://localhost:4000${NC}"
echo -e "   Health   : ${GREEN}http://localhost:4000/health${NC}"
echo ""
echo -e "${BLUE}🤖 Mode :${NC}"
echo -e "   ${YELLOW}MOCK MODE${NC} (pas de vraies transactions blockchain)"
echo -e "   Pour le mode production, modifiez backend/.env"
echo ""
echo -e "${BLUE}📝 Logs :${NC}"
echo -e "   Backend  : tail -f backend.log"
echo -e "   Frontend : tail -f frontend.log"
echo ""
echo -e "${BLUE}🛑 Arrêter :${NC}"
echo -e "   Ctrl+C ou ./STOP_DEMO.sh"
echo ""
echo -e "${BLUE}📚 Documentation :${NC}"
echo -e "   Hackfolio : ${GREEN}HACKFOLIO_GUIDE.md${NC}"
echo -e "   Agents IA : ${GREEN}AI_AGENTS_GUIDE.md${NC}"
echo -e "   Démo      : ${GREEN}DEMO_FINALE.md${NC}"
echo ""
echo -e "${YELLOW}⏳ Ouverture du navigateur dans 3 secondes...${NC}"
sleep 3

# Ouvrir le navigateur
if command -v open &> /dev/null; then
    # macOS
    open http://localhost:5173
elif command -v xdg-open &> /dev/null; then
    # Linux
    xdg-open http://localhost:5173
elif command -v start &> /dev/null; then
    # Windows
    start http://localhost:5173
else
    echo -e "${YELLOW}⚠️  Impossible d'ouvrir le navigateur automatiquement${NC}"
    echo -e "   Ouvrez manuellement : ${GREEN}http://localhost:5173${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Bonne démo !${NC}"
echo ""

# Garder le script actif
echo -e "${BLUE}Appuyez sur Ctrl+C pour arrêter...${NC}"
trap "echo ''; echo -e '${YELLOW}🛑 Arrêt de LémanFlow...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; echo -e '${GREEN}✓ Arrêté${NC}'; exit 0" INT

# Attendre indéfiniment
wait

