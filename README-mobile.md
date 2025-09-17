# Chef Pantry - Mobile App Setup

This document explains how to set up and build the mobile versions of Chef Pantry for iOS and Android using Capacitor.

## Prerequisites

- Node.js and npm
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

## Getting Started

### Opening Projects

#### Android
To open the Android project in Android Studio:
```bash
npm run cap:open:android
```

#### iOS
To open the iOS project in Xcode:
```bash
npm run cap:open:ios
```

## Configuration

### App Details
- **Bundle ID**: `co.thechefpantry.app`
- **App Name**: Chef Pantry
- **Remote URL**: https://thechefpantry.co

The app loads the remote web application from the live Chef Pantry site.

## Deep Links Setup

### Android
Deep linking has been configured in `android/app/src/main/AndroidManifest.xml` to handle `https://thechefpantry.co` URLs.

### iOS
An Associated Domains file has been created at `client/public/.well-known/apple-app-site-association` with a placeholder TEAMID.

## TODOs

### Required Before App Store Deployment

1. **Replace TEAMID** in the Associated Domains configuration:
   - Update `client/public/.well-known/apple-app-site-association` 
   - Replace `TEAMID` with your actual Apple Developer Team ID

2. **Generate App Icons and Splash Screens**:
   ```bash
   npx @capacitor/assets generate
   ```
   - Place your app icon (1024x1024) at `mobile/assets/app-icon.png`
   - Place your splash screen (2732x2732) at `mobile/assets/splash.png`

3. **Set Store Metadata**:
   - App descriptions
   - Keywords
   - Screenshots
   - Privacy policy URLs
   - App category classification

4. **Code Signing** (iOS):
   - Configure provisioning profiles in Xcode
   - Set up distribution certificates

5. **Testing**:
   - Test deep link functionality on physical devices
   - Test app store review guidelines compliance
   - Verify all user flows work in mobile context

## Available Scripts

- `npm run cap:add` - Add a new platform
- `npm run cap:sync` - Sync web app changes to native projects
- `npm run cap:open:android` - Open Android project in Android Studio
- `npm run cap:open:ios` - Open iOS project in Xcode

## Architecture

The mobile app is a wrapper around the web application. All business logic, API calls, and UI rendering happens in the web layer. The native layer primarily handles:
- App lifecycle
- Deep linking
- Native device features (when needed)
- App store distribution

## Support

For issues related to:
- **Web app functionality**: Check the main Chef Pantry repository
- **Mobile-specific issues**: Check Capacitor documentation
- **Platform-specific builds**: Check Android Studio / Xcode documentation