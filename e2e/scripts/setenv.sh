#!/usr/bin/env bash

# Export env vars
DIR="$(cd "$(dirname "$0")" && pwd)"

export $(grep -v '^#' $DIR/../../backend/.env.e2e | xargs)
