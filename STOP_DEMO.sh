#!/bin/bash

# 🛑 Script d'Arrêt - LémanFlow Demo

echo "🛑 Arrêt de LémanFlow..."

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Tuer les processus sur les ports
echo -e "${YELLOW}🔍 Recherche des processus...${NC}"

# Port 4000 (Backend)
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}Arrêt du backend (port 4000)...${NC}"
    lsof -ti:4000 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✓ Backend arrêté${NC}"
else
    echo -e "${GREEN}✓ Backend déjà arrêté${NC}"
fi

# Port 5173 (Frontend)
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}Arrêt du frontend (port 5173)...${NC}"
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    echo -e "${GREEN}✓ Frontend arrêté${NC}"
else
    echo -e "${GREEN}✓ Frontend déjà arrêté${NC}"
fi

# Nettoyer les fichiers de log
if [ -f "backend.log" ]; then
    rm backend.log
    echo -e "${GREEN}✓ Logs backend nettoyés${NC}"
fi

if [ -f "frontend.log" ]; then
    rm frontend.log
    echo -e "${GREEN}✓ Logs frontend nettoyés${NC}"
fi

echo ""
echo -e "${GREEN}✨ LémanFlow arrêté proprement${NC}"
echo ""

