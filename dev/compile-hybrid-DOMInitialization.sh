#!/bin/bash

# Compile hybird DOM initialization
# Use simple compilation without outFile for esnext module

cd /c/work/git/Weekly-Task-Board

./node_modules/.bin/tsc \
  --target ES2020 \
  --module esnext \
  --lib DOM,ES2020 \
  --outDir dist/hybrid \
  --allowJs \
  --skipLibCheck \
  --noEmitOnError \
  src/hybrid/DOMInitialization.ts

if [ $? -eq 0 ]; then
  echo "DOMInitialization compiled successfully"
else
  echo "DOMInitialization compilation failed with exit code $?"
  exit 1
fi
