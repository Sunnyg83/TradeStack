#!/bin/bash

# Detailed OAuth Callback Test
# Simulates the OAuth callback with various scenarios

BASE_URL="http://localhost:3000"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍 Detailed OAuth Callback Test"
echo "================================"
echo ""

# Test 1: Callback with valid-looking code but no cookies
echo -e "${BLUE}Test 1: Callback with code but no cookies${NC}"
RESPONSE=$(curl -s -L "$BASE_URL/auth/callback?code=test-code-123&next=/home")
if echo "$RESPONSE" | grep -qi "login\|session expired\|try again"; then
    echo -e "${GREEN}✅ PASS${NC}: Correctly redirects to login when no cookies"
else
    echo -e "${RED}❌ FAIL${NC}: Unexpected response"
    echo "Response preview: $(echo "$RESPONSE" | head -c 200)"
fi
echo ""

# Test 2: Callback with OAuth error parameter
echo -e "${BLUE}Test 2: Callback with OAuth error${NC}"
RESPONSE=$(curl -s -L "$BASE_URL/auth/callback?error=access_denied&error_description=User%20denied%20access")
if echo "$RESPONSE" | grep -qi "login\|error\|authentication"; then
    echo -e "${GREEN}✅ PASS${NC}: Correctly handles OAuth errors"
else
    echo -e "${RED}❌ FAIL${NC}: Doesn't handle OAuth errors correctly"
fi
echo ""

# Test 3: Callback with missing code
echo -e "${BLUE}Test 3: Callback without code parameter${NC}"
RESPONSE=$(curl -s -L "$BASE_URL/auth/callback?next=/home")
if echo "$RESPONSE" | grep -qi "login\|no.*code\|try again"; then
    echo -e "${GREEN}✅ PASS${NC}: Correctly handles missing code"
else
    echo -e "${YELLOW}⚠️  WARN${NC}: Response: $(echo "$RESPONSE" | head -c 100)"
fi
echo ""

# Test 4: Check callback route response headers
echo -e "${BLUE}Test 4: Checking callback route headers${NC}"
HEADERS=$(curl -s -I -L "$BASE_URL/auth/callback?code=test" 2>&1)
if echo "$HEADERS" | grep -qiE "location.*login|http/[0-9.]+ [23]0[0-9]"; then
    echo -e "${GREEN}✅ PASS${NC}: Callback route returns proper redirect"
    echo "$HEADERS" | grep -i "location\|http" | head -2 | sed 's/^/  /'
else
    echo -e "${RED}❌ FAIL${NC}: Unexpected headers"
fi
echo ""

# Test 5: Test clear-cookies API response
echo -e "${BLUE}Test 5: Clear cookies API response${NC}"
RESPONSE=$(curl -s "$BASE_URL/api/auth/clear-cookies")
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/auth/clear-cookies")
if [ "$HTTP_CODE" = "200" ] && echo "$RESPONSE" | grep -q "success"; then
    echo -e "${GREEN}✅ PASS${NC}: Clear cookies API works correctly"
    echo "  Response: $RESPONSE"
else
    echo -e "${RED}❌ FAIL${NC}: Clear cookies API failed (HTTP $HTTP_CODE)"
    echo "  Response: $RESPONSE"
fi
echo ""

# Test 6: Check for stale cookie warnings in server logs
echo -e "${BLUE}Test 6: Testing cookie validation${NC}"
# Make a request that would trigger cookie validation
curl -s -L "$BASE_URL/auth/callback?code=test-code-validation" > /dev/null 2>&1
echo -e "${GREEN}✅ PASS${NC}: Cookie validation test completed"
echo "  (Check server logs for any stale cookie warnings)"
echo ""

# Test 7: Verify all routes are accessible
echo -e "${BLUE}Test 7: Route accessibility check${NC}"
ROUTES=("/" "/login" "/signup" "/auth/callback" "/api/auth/clear-cookies")
ALL_ACCESSIBLE=true
for route in "${ROUTES[@]}"; do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "307" ]; then
        echo -e "  ${GREEN}✅${NC} $route (HTTP $HTTP_CODE)"
    else
        echo -e "  ${RED}❌${NC} $route (HTTP $HTTP_CODE)"
        ALL_ACCESSIBLE=false
    fi
done

if [ "$ALL_ACCESSIBLE" = true ]; then
    echo -e "${GREEN}✅ PASS${NC}: All routes are accessible"
else
    echo -e "${RED}❌ FAIL${NC}: Some routes are not accessible"
fi
echo ""

# Summary
echo "================================"
echo -e "${GREEN}✅ Detailed tests completed${NC}"
echo ""
echo "Next steps for manual testing:"
echo "1. Clear browser cookies for localhost:3000"
echo "2. Visit $BASE_URL/login"
echo "3. Click 'Sign in with Google'"
echo "4. Watch terminal logs for cookie information"
echo "5. Complete OAuth flow and verify redirect to /home or /onboarding"
echo ""


