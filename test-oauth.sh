#!/bin/bash

# Test script for Google OAuth flow
# This script tests the OAuth endpoints and checks for errors

BASE_URL="http://localhost:3000"
MAX_RETRIES=10
RETRY_DELAY=2

echo "🧪 Testing Google OAuth Flow..."
echo "================================"
echo ""

# Function to check if server is running
check_server() {
    if curl -s "$BASE_URL" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to test login page
test_login_page() {
    echo "📄 Testing login page..."
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/login")
    if [ "$response" = "200" ]; then
        echo "✅ Login page accessible (HTTP $response)"
        return 0
    else
        echo "❌ Login page failed (HTTP $response)"
        return 1
    fi
}

# Function to test callback route (should redirect without code)
test_callback_route() {
    echo "📄 Testing callback route..."
    response=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE_URL/auth/callback")
    if [ "$response" = "200" ] || [ "$response" = "307" ] || [ "$response" = "302" ]; then
        echo "✅ Callback route accessible (HTTP $response)"
        return 0
    else
        echo "❌ Callback route failed (HTTP $response)"
        return 1
    fi
}

# Function to check for build errors
check_build() {
    echo "🔨 Checking build..."
    if npm run build > /tmp/build.log 2>&1; then
        echo "✅ Build successful"
        return 0
    else
        echo "❌ Build failed - checking errors..."
        grep -i "error" /tmp/build.log | head -5
        return 1
    fi
}

# Function to check for TypeScript errors
check_typescript() {
    echo "📝 Checking TypeScript..."
    if npx tsc --noEmit > /tmp/tsc.log 2>&1; then
        echo "✅ No TypeScript errors"
        return 0
    else
        echo "❌ TypeScript errors found:"
        grep -i "error" /tmp/tsc.log | head -5
        return 1
    fi
}

# Main test function
run_tests() {
    local success=true
    
    # Check if server is running
    if ! check_server; then
        echo "❌ Server is not running. Please start with 'npm run dev'"
        return 1
    fi
    echo "✅ Server is running"
    echo ""
    
    # Test login page
    if ! test_login_page; then
        success=false
    fi
    echo ""
    
    # Test callback route
    if ! test_callback_route; then
        success=false
    fi
    echo ""
    
    # Check build
    if ! check_build; then
        success=false
    fi
    echo ""
    
    return $([ "$success" = true ] && echo 0 || echo 1)
}

# Retry logic
attempt=1
while [ $attempt -le $MAX_RETRIES ]; do
    echo "🔄 Attempt $attempt of $MAX_RETRIES"
    echo ""
    
    if run_tests; then
        echo ""
        echo "🎉 All tests passed!"
        echo "✅ OAuth flow is ready to test manually"
        echo ""
        echo "To test manually:"
        echo "1. Go to http://localhost:3000/login"
        echo "2. Click 'Sign in with Google'"
        echo "3. Complete the OAuth flow"
        exit 0
    else
        echo ""
        echo "⚠️  Some tests failed. Retrying in $RETRY_DELAY seconds..."
        echo ""
        sleep $RETRY_DELAY
        attempt=$((attempt + 1))
    fi
done

echo ""
echo "❌ Tests failed after $MAX_RETRIES attempts"
echo "Please check the errors above and fix them"
exit 1


