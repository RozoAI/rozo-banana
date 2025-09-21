#!/bin/bash

echo "🧪 Testing Banana Frontend Pages..."
echo "=================================="

BASE_URL="http://localhost:3004"

# Function to test a page
test_page() {
    local path=$1
    local name=$2
    
    echo -n "Testing $name ($path): "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$path")
    
    if [ "$response" = "200" ]; then
        echo "✅ OK ($response)"
    else
        echo "❌ Failed ($response)"
    fi
}

# Test pages
test_page "/" "Homepage"
test_page "/generate" "Image Generator"
test_page "/history" "Image History"
test_page "/recharge" "Recharge/Payment"

echo ""
echo "🔍 Checking API Endpoints Configuration..."
echo "=================================="

# Check environment variables
if [ -f ".env.local" ]; then
    echo "✅ .env.local file exists"
    echo ""
    echo "📝 API Configuration:"
    grep "API_URL" .env.local | sed 's/^/  /'
else
    echo "❌ .env.local file not found"
fi

echo ""
echo "✅ Test complete!"