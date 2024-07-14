#!/bin/sh
# This script should be executed on the deployment server
export PATH=/opt/plesk/node/20/bin

npm -ws run clean
npm ci
npm -ws run build
npm run db:migrate -w backend

# Restart Node.JS on Plesk
touch tmp/restart.txt
