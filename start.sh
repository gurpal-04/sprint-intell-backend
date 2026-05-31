#!/bin/sh

echo "========================================="
echo "⚡ Starting Sprint Intelligence Backend..."
echo "========================================="

# Try to register Coral sources automatically using environment variables if they are present.
# Note: we use "|| true" so the startup doesn't fail if the credentials are not set yet or invalid.

if [ -n "$GITHUB_TOKEN" ]; then
  echo "Registering GitHub source..."
  coral source add github || echo "Warning: Failed to add GitHub source."
else
  echo "Skipped registering GitHub: GITHUB_TOKEN environment variable is not set."
fi

if [ -n "$LINEAR_API_KEY" ]; then
  echo "Registering Linear source..."
  coral source add linear || echo "Warning: Failed to add Linear source."
else
  echo "Skipped registering Linear: LINEAR_API_KEY environment variable is not set."
fi

if [ -n "$SLACK_TOKEN" ]; then
  echo "Registering Slack source..."
  coral source add slack || echo "Warning: Failed to add Slack source."
else
  echo "Skipped registering Slack: SLACK_TOKEN environment variable is not set."
fi

echo "-----------------------------------------"
echo "🚀 Starting Node server..."
echo "========================================="

exec node src/server.js
