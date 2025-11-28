#!/bin/bash

# ============================================
# LémanFlow Mission Creation Script
# ============================================
# Creates a new mission for an event
# ============================================

set -e

API_URL=${API_URL:-http://localhost:4000}

echo "🎯 LémanFlow Mission Creation"
echo "=============================="
echo ""

# Get mission details
read -p "Event ID: " EVENT_ID
read -p "Admin Cap ID: " ADMIN_CAP_ID
read -p "Mission title: " MISSION_TITLE
read -p "Mission description: " MISSION_DESCRIPTION
read -p "Reward amount in SUI: " REWARD_SUI

# Convert to MIST
REWARD_MIST=$(echo "$REWARD_SUI * 1000000000" | bc)

echo ""
echo "📋 Mission Summary:"
echo "  Event ID: $EVENT_ID"
echo "  Title: $MISSION_TITLE"
echo "  Description: $MISSION_DESCRIPTION"
echo "  Reward: $REWARD_SUI SUI ($REWARD_MIST MIST)"
echo ""

read -p "Create mission? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "❌ Cancelled"
    exit 0
fi

# Create mission via API
echo ""
echo "🚀 Creating mission..."

RESPONSE=$(curl -s -X POST "$API_URL/api/admin/missions" \
  -H "Content-Type: application/json" \
  -b "lemanflow_session=mock_session" \
  -d "{
    \"eventId\": \"$EVENT_ID\",
    \"adminCapId\": \"$ADMIN_CAP_ID\",
    \"title\": \"$MISSION_TITLE\",
    \"description\": \"$MISSION_DESCRIPTION\",
    \"rewardAmount\": $REWARD_MIST
  }")

# Check if successful
if echo "$RESPONSE" | jq -e '.success' > /dev/null; then
    MISSION_ID=$(echo "$RESPONSE" | jq -r '.missionId')
    DIGEST=$(echo "$RESPONSE" | jq -r '.digest // "N/A"')
    QR_SECRET=$(echo "$RESPONSE" | jq -r '.qrSecret // "N/A"')

    echo ""
    echo "✅ Mission created successfully!"
    echo "================================"
    echo ""
    echo "🎯 Mission ID: $MISSION_ID"
    echo "📝 TX Digest: $DIGEST"
    echo "🔐 QR Secret: $QR_SECRET"
    echo ""
    echo "Next steps:"
    echo "1. Generate QR code: curl http://localhost:4000/api/missions/$MISSION_ID/qr?eventId=$EVENT_ID"
    echo "2. Print QR code for participants to scan"
    echo "3. Participants can claim via frontend"
    echo ""
else
    ERROR=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
    echo ""
    echo "❌ Failed to create mission: $ERROR"
    exit 1
fi
