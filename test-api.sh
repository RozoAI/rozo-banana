#!/bin/bash

echo "Testing API endpoints..."
echo ""

SUPABASE_URL="https://rsofmvjfesaphwyaonsd.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzb2ZtdmpmZXNhcGh3eWFvbnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwOTU0NTQsImV4cCI6MjA1ODY3MTQ1NH0.NedP2G4O8W6_dcf5_vRxoXjMckMzBl56vn4MQZd6ltc"

echo "1. Testing auth-wallet endpoint (should return error without proper auth):"
curl -s "${SUPABASE_URL}/functions/v1/auth-wallet" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  --data '{}' | head -c 100
echo ""
echo ""

echo "2. Testing points-balance endpoint (should return unauthorized):"
curl -s "${SUPABASE_URL}/functions/v1/points-balance" \
  -H "apikey: ${ANON_KEY}" \
  -H "Content-Type: application/json" | head -c 100
echo ""
echo ""

echo "✅ If you see JSON responses above, the endpoints are accessible!"
echo "Visit http://localhost:3002 to test the frontend"