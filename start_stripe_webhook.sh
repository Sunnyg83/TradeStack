#!/bin/bash

# Start Stripe webhook listener
# This script starts the Stripe webhook listener for local development

export PATH="$HOME/bin:$PATH"

echo "Starting Stripe webhook listener..."
echo "Press Ctrl+C to stop"
echo ""

stripe listen --forward-to localhost:3000/api/invoices/webhook

