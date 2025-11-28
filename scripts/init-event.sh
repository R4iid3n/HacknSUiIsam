#!/bin/bash

# ============================================
# LémanFlow Event Initialization Script
# ============================================
# Creates a new event via API
# ============================================

set -e

API_URL=${API_URL:-http://localhost:4000}

echo "🎉 LémanFlow Event Initialization"
echo "=================================="
echo ""

# Get event details
read -p "Event name: " EVENT_NAME
read -p "Event description: " EVENT_DESCRIPTION
read -p "Start time (leave empty for now): " START_TIME
read -p "End time (leave empty for +24h): " END_TIME
read -p "Initial funding in SUI (optional): " INITIAL_FUNDING

# Calculate timestamps
if [ -z "$START_TIME" ]; then
    START_TIME=$(date +%s)000
fi

if [ -z "$END_TIME" ]; then
    END_TIME=$(($(date +%s)000 + 86400000))
fi

# Convert funding to MIST
if [ -n "$INITIAL_FUNDING" ]; then
    INITIAL_FUNDING_MIST=$(echo "$INITIAL_FUNDING * 1000000000" | bc)
else
    INITIAL_FUNDING_MIST=0
fi

echo ""
echo "📋 Event Summary:"
echo "  Name: $EVENT_NAME"
echo "  Description: $EVENT_DESCRIPTION"
echo "  Start: $(date -d @$((START_TIME / 1000)) 2>/dev/null || date -r $((START_TIME / 1000)))"
echo "  End: $(date -d @$((END_TIME / 1000)) 2>/dev/null || date -r $((END_TIME / 1000)))"
echo "  Funding: $INITIAL_FUNDING SUI"
echo ""

read -p "Create event? (y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "❌ Cancelled"
    exit 0
fi

# Create event via API
echo ""
echo "🚀 Creating event..."

RESPONSE=$(curl -s -X POST "$API_URL/api/admin/init" \
  -H "Content-Type: application/json" \
  -b "lemanflow_session=mock_session" \
  -d "{
    \"name\": \"$EVENT_NAME\",
    \"description\": \"$EVENT_DESCRIPTION\",
    \"startTime\": $START_TIME,
    \"endTime\": $END_TIME,
    \"initialFunding\": $INITIAL_FUNDING_MIST
  }")

# Check if successful
if echo "$RESPONSE" | jq -e '.success' > /dev/null; then
    EVENT_ID=$(echo "$RESPONSE" | jq -r '.eventId')
    ADMIN_CAP_ID=$(echo "$RESPONSE" | jq -r '.adminCapId')
    DIGEST=$(echo "$RESPONSE" | jq -r '.digest // "N/A"')

    echo ""
    echo "✅ Event created successfully!"
    echo "================================"
    echo ""
    echo "🎉 Event ID: $EVENT_ID"
    echo "🔑 Admin Cap ID: $ADMIN_CAP_ID"
    echo "📝 TX Digest: $DIGEST"
    echo ""
    echo "Next steps:"
    echo "1. Save these IDs!"
    echo "2. Create missions: ./scripts/create-mission.sh"
    echo "3. Fund event: ./scripts/fund-event.sh"
    echo ""
else
    ERROR=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
    echo ""
    echo "❌ Failed to create event: $ERROR"
    exit 1
fi
