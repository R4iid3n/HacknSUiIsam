#!/bin/bash

# LémanFlow - Demo Setup Script
# Creates demo event + missions for hackathon judges
# Run this 30 minutes before demo

set -e

API_BASE="${API_BASE:-http://localhost:4000}"
WALLET_ADDRESS="${WALLET_ADDRESS:-0x0}"

echo "🎬 LémanFlow Demo Setup"
echo "======================="
echo ""
echo "API Base: $API_BASE"
echo "Wallet: $WALLET_ADDRESS"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if backend is running
echo "📡 Checking backend..."
if curl -s "$API_BASE/health" > /dev/null; then
    echo -e "${GREEN}✓${NC} Backend is running"
else
    echo -e "${RED}✗${NC} Backend is not running!"
    echo "   Start it with: cd backend && npm run dev"
    exit 1
fi

echo ""
echo "🎯 Creating demo event..."

# Create Event
EVENT_RESPONSE=$(curl -s -X POST "$API_BASE/api/admin/init" \
  -H "Content-Type: application/json" \
  -H "Cookie: lemanflow_session=demo-session" \
  -d '{
    "name": "SUI Hackathon 2025 - DEMO",
    "description": "Gasless rewards demonstration for judges",
    "startTime": '$(date +%s000)',
    "endTime": '$(($(date +%s) + 604800))000',
    "initialFunding": 10000000000
  }')

EVENT_ID=$(echo "$EVENT_RESPONSE" | jq -r '.eventId // empty')
ADMIN_CAP_ID=$(echo "$EVENT_RESPONSE" | jq -r '.adminCapId // empty')

if [ -z "$EVENT_ID" ] || [ "$EVENT_ID" = "null" ]; then
    echo -e "${RED}✗${NC} Failed to create event"
    echo "   Response: $EVENT_RESPONSE"
    echo ""
    echo "💡 TIP: Make sure you're authenticated with the backend"
    echo "   OR set MOCK_MODE=true in backend/.env for demo mode"
    exit 1
fi

echo -e "${GREEN}✓${NC} Event created!"
echo "   Event ID: $EVENT_ID"
echo "   Admin Cap: $ADMIN_CAP_ID"

# Save to .env
echo ""
echo "💾 Saving to frontend/.env..."
echo "VITE_EVENT_ID=$EVENT_ID" > frontend/.env
echo "VITE_API_BASE=$API_BASE" >> frontend/.env
echo -e "${GREEN}✓${NC} Configuration saved"

echo ""
echo "🎯 Creating demo missions..."

# Mission 1: Check-in
echo "   Creating: Check-in Mission..."
MISSION_1=$(curl -s -X POST "$API_BASE/api/admin/missions" \
  -H "Content-Type: application/json" \
  -H "Cookie: lemanflow_session=demo-session" \
  -d "{
    \"eventId\": \"$EVENT_ID\",
    \"adminCapId\": \"$ADMIN_CAP_ID\",
    \"title\": \"Check-in Mission\",
    \"description\": \"Scan QR code at event entrance\",
    \"rewardAmount\": 100000000
  }")

MISSION_1_ID=$(echo "$MISSION_1" | jq -r '.missionId // empty')
if [ -n "$MISSION_1_ID" ] && [ "$MISSION_1_ID" != "null" ]; then
    echo -e "   ${GREEN}✓${NC} Mission 1 created (ID: $MISSION_1_ID)"
else
    echo -e "   ${YELLOW}⚠${NC} Mission 1 failed"
fi

# Mission 2: Workshop
echo "   Creating: Workshop Mission..."
MISSION_2=$(curl -s -X POST "$API_BASE/api/admin/missions" \
  -H "Content-Type: application/json" \
  -H "Cookie: lemanflow_session=demo-session" \
  -d "{
    \"eventId\": \"$EVENT_ID\",
    \"adminCapId\": \"$ADMIN_CAP_ID\",
    \"title\": \"Workshop Attendance\",
    \"description\": \"Attend the Move programming workshop\",
    \"rewardAmount\": 200000000
  }")

MISSION_2_ID=$(echo "$MISSION_2" | jq -r '.missionId // empty')
if [ -n "$MISSION_2_ID" ] && [ "$MISSION_2_ID" != "null" ]; then
    echo -e "   ${GREEN}✓${NC} Mission 2 created (ID: $MISSION_2_ID)"
else
    echo -e "   ${YELLOW}⚠${NC} Mission 2 failed"
fi

# Mission 3: Project Submission
echo "   Creating: Project Submission..."
MISSION_3=$(curl -s -X POST "$API_BASE/api/admin/missions" \
  -H "Content-Type: application/json" \
  -H "Cookie: lemanflow_session=demo-session" \
  -d "{
    \"eventId\": \"$EVENT_ID\",
    \"adminCapId\": \"$ADMIN_CAP_ID\",
    \"title\": \"Project Submission\",
    \"description\": \"Submit your hackathon project\",
    \"rewardAmount\": 500000000
  }")

MISSION_3_ID=$(echo "$MISSION_3" | jq -r '.missionId // empty')
if [ -n "$MISSION_3_ID" ] && [ "$MISSION_3_ID" != "null" ]; then
    echo -e "   ${GREEN}✓${NC} Mission 3 created (ID: $MISSION_3_ID)"
else
    echo -e "   ${YELLOW}⚠${NC} Mission 3 failed"
fi

echo ""
echo "📝 Generating QR codes..."

# Generate QR codes for each mission
for MISSION_ID in "$MISSION_1_ID" "$MISSION_2_ID" "$MISSION_3_ID"; do
    if [ -n "$MISSION_ID" ] && [ "$MISSION_ID" != "null" ]; then
        QR_URL="$API_BASE/api/missions/$MISSION_ID/qr?eventId=$EVENT_ID"
        echo "   Mission $MISSION_ID: $QR_URL"
    fi
done

echo ""
echo -e "${GREEN}✅ Demo setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Visit http://localhost:5173/demo-helper to verify setup"
echo "  2. Connect your wallet and register a passport"
echo "  3. Print or display QR codes for the demo"
echo "  4. Review DEMO_GUIDE.md for the demo script"
echo ""
echo "Quick links:"
echo "  Dashboard: http://localhost:5173/dashboard"
echo "  Scanner:   http://localhost:5173/scan"
echo "  Passport:  http://localhost:5173/passport"
echo "  Helper:    http://localhost:5173/demo-helper"
echo ""
echo "Good luck with your demo! 🚀"
