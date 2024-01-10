#!/bin/sh
# This script should be executed on the deployment server
export PATH=/opt/plesk/node/20/bin

npm run clean --workspaces
mpm ci
npm run build --workspaces
npm run db:migrate --workspace @camp-registration/api

# Restart Node.JS on Plesk
touch tmp/restart.txt
