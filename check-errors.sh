#!/bin/bash

echo "🔍 Checking for common OAuth errors..."
echo "======================================"
echo ""

# Check if server is running
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "❌ Server is not running!"
    echo "   Run: npm run dev"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Check callback route
echo "Testing callback route..."
response=$(curl -s -w "\n%{http_code}" http://localhost:3000/auth/callback?code=test123 2>&1)
http_code=$(echo "$response" | tail -1)
body=$(echo "$response" | head -n -1)

if echo "$body" | grep -qi "error\|failed\|invalid"; then
    echo "⚠️  Callback route returned error content"
    echo "   HTTP Code: $http_code"
    echo "   Response preview: $(echo "$body" | head -c 200)"
else
    echo "✅ Callback route responding (HTTP $http_code)"
fi

echo ""
echo "📋 Next steps:"
echo "1. Clear browser cookies for localhost:3000"
echo "2. Try signing in with Google again"
echo "3. Check terminal for any error messages"
echo ""
echo "If you see 'stale cookie' or 'PKCE' errors, the browser"
echo "may have old corrupted cookies. Clear them and try again."


