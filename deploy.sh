#!/bin/bash

# Deployment script for Strato VPS
echo "🚀 Deploying Rathaus Trainer to Strato VPS..."

# Update dependencies
npm install

# Build/compile if needed (for production)
# npm run build

# Restart PM2 process
pm2 restart rathaus-trainer

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "🌐 App available at: https://rathaustrainer.familiebiela.de"
