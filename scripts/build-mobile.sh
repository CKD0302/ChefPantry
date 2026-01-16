#!/bin/bash

# Chef Pantry Mobile Build Script
# This script builds the web app and syncs it with native platforms

set -e

echo "Chef Pantry Mobile Build Script"
echo "=================================="

# Check if native platforms are initialized
if [ ! -d "ios/App/App" ] && [ ! -d "android/app/src/main/java" ]; then
    echo ""
    echo "Native platforms not initialized!"
    echo "Run the following commands first:"
    echo "  npx cap add ios     # (requires macOS with Xcode)"
    echo "  npx cap add android"
    echo ""
    echo "See MOBILE_APP_GUIDE.md for detailed setup instructions."
    exit 1
fi

# Step 1: Build the web app
echo "Building web app..."
npm run build

# Step 2: Sync with Capacitor
echo "Syncing with Capacitor..."
npx cap sync

echo ""
echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo ""
echo "For iOS (requires Mac with Xcode):"
echo "  npx cap open ios"
echo "  Then build and run from Xcode"
echo ""
echo "For Android (requires Android Studio):"
echo "  npx cap open android"
echo "  Then build and run from Android Studio"
echo ""
echo "📱 App Store Submission Checklist:"
echo "  - Update version numbers in capacitor.config.ts"
echo "  - Add app icons to ios/App/App/Assets.xcassets and android/app/src/main/res"
echo "  - Configure signing certificates"
echo "  - Test on physical devices before submission"
