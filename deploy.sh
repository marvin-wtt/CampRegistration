#!/bin/sh
# This script should be executed on the deployment server
export PATH=/opt/plesk/node/20/bin

# Enable maintenance mode to prevent request after build
export MAINTENANCE_MODE=true

npm -ws run clean --if-present
npm ci
npm -ws run build --if-presentAd
npm run db:migrate -w backend

# Restart Node.JS on Plesk
touch tmp/restart.txt

# Disable maintenance
export MAINTENANCE_MODE=false