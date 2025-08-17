#!/bin/bash

# Test SMS Verification Flow
# Usage: ./scripts/test-sms.sh

API_BASE="http://localhost:8080/api"
PHONE="+821012345678"  # Using predefined mock code 123456

echo "🧪 Testing SMS Verification Flow"
echo "================================"
echo "Phone: $PHONE"
echo "Expected Code: 123456"
echo ""

# Step 1: Send verification code
echo "📱 Step 1: Sending verification code..."
SEND_RESPONSE=$(curl -s -X POST "$API_BASE/auth/send-verification-code" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"$PHONE\"}")

echo "Response: $SEND_RESPONSE"
echo ""

# Extract code from response (in development mode)
CODE=$(echo "$SEND_RESPONSE" | grep -o '"code":"[^"]*"' | cut -d'"' -f4)

if [ -z "$CODE" ]; then
  CODE="123456"  # Use predefined mock code
fi

echo "💬 Step 2: Verifying with code: $CODE"

# Step 2: Verify the code
VERIFY_RESPONSE=$(curl -s -X POST "$API_BASE/auth/verify-phone" \
  -H "Content-Type: application/json" \
  -d "{\"phone\": \"$PHONE\", \"code\": \"$CODE\"}")

echo "Response: $VERIFY_RESPONSE"
echo ""

if echo "$VERIFY_RESPONSE" | grep -q '"verified":true'; then
  echo "✅ Phone verification successful!"
else
  echo "❌ Phone verification failed!"
fi

echo ""
echo "📋 Available test phone numbers:"
echo "+821012345678 -> 123456"
echo "+821087654321 -> 654321" 
echo "+821033334444 -> 111111"
echo "+821055556666 -> 999999"
echo "+821077778888 -> 555555"