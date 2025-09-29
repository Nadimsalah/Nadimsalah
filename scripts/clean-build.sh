#!/bin/bash

# Clean Next.js build artifacts and cache
echo "Cleaning Next.js build cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .vercel

# Clear any potential route conflicts
echo "Clearing route cache..."
find . -name "*.tsbuildinfo" -delete
find . -name ".DS_Store" -delete

echo "Build cleanup complete. Ready for fresh deployment."
