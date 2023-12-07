#!/bin/sh
# This script should be executed on the deployment server
export PATH=/opt/plesk/node/21/bin

# common
#cd ./common/ || exit
#npm install
#npm build

# frontend
cd ../frontend/ || exit
npm install
npm build

# backend
cd ../backend/ || exit
npm install
npx prisma migrate deploy
npm build
cp -R ../frontend/dist/ ./public

# Restart Node.JS on Plesk
# TODO This file might be in ../tmp/restart.txt
touch tmp/restart.txt
