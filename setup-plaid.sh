#!/bin/bash

# Plaid Configuration Setup Script
# This script helps you add Plaid configuration to your .env.local file

echo "🔧 Plaid Configuration Setup"
echo "============================"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ Error: .env.local file not found!"
    echo "   Please make sure you're in the tradestack directory"
    exit 1
fi

# Check if Plaid is already configured
if grep -q "PLAID_CLIENT_ID" .env.local; then
    echo "⚠️  Plaid is already configured in .env.local"
    echo ""
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Cancelled."
        exit 0
    fi
    # Remove existing Plaid configuration
    sed -i.bak '/^PLAID_CLIENT_ID=/d' .env.local
    sed -i.bak '/^PLAID_SECRET=/d' .env.local
    sed -i.bak '/^PLAID_ENV=/d' .env.local
    rm -f .env.local.bak
fi

echo ""
echo "📋 Please enter your Plaid credentials:"
echo ""

# Get Client ID
read -p "Enter your Plaid Client ID: " PLAID_CLIENT_ID
if [ -z "$PLAID_CLIENT_ID" ]; then
    echo "❌ Error: Client ID cannot be empty"
    exit 1
fi

# Get Secret
read -p "Enter your Plaid Secret (Sandbox for testing): " PLAID_SECRET
if [ -z "$PLAID_SECRET" ]; then
    echo "❌ Error: Secret cannot be empty"
    exit 1
fi

# Get Environment
echo ""
echo "Select environment:"
echo "1) Sandbox (for testing - recommended)"
echo "2) Production (for live site)"
read -p "Enter choice (1 or 2): " env_choice

if [ "$env_choice" = "2" ]; then
    PLAID_ENV="production"
else
    PLAID_ENV="sandbox"
fi

# Add to .env.local
echo "" >> .env.local
echo "# Plaid Configuration" >> .env.local
echo "PLAID_CLIENT_ID=$PLAID_CLIENT_ID" >> .env.local
echo "PLAID_SECRET=$PLAID_SECRET" >> .env.local
echo "PLAID_ENV=$PLAID_ENV" >> .env.local

echo ""
echo "✅ Plaid configuration added to .env.local!"
echo ""
echo "📝 Added:"
echo "   PLAID_CLIENT_ID=$PLAID_CLIENT_ID"
echo "   PLAID_SECRET=$PLAID_SECRET"
echo "   PLAID_ENV=$PLAID_ENV"
echo ""
echo "🔄 Next steps:"
echo "   1. Restart your dev server: npm run dev"
echo "   2. Go to Settings and test 'Connect Bank Account'"
echo ""

