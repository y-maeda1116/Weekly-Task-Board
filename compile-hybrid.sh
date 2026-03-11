#!/bin/bash

# Compile hybrid bridge TypeScript module
# This avoids CLI project reference issues

cd /c/work/git/Weekly-Task-Board

./node_modules/.bin/tsc \
  --target ES2020 \
  --module esnext \
  --lib DOM,ES2020 \
  --outFile dist/hybrid/bridge.js \
  --sourceMap \
  --allowJs \
  --noEmit \
  src/hybrid/bridge.ts

if [ $? -eq 0 ]; then
  echo "Hybrid bridge compiled successfully"
else
  echo "Hybrid bridge compilation failed with exit code $?"
  exit 1
fi
