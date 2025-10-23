#!/bin/bash

# Deployment script for Strato VPS
echo "🚀 Deploying Rathaus Trainer to Strato VPS..."

# Update dependencies
npm install

# Start with PM2
pm2 restart rathaus-trainer || pm2 start server.js --name rathaus-trainer

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "🌐 App available at: https://rathaustrainer.familiebiela.de"
