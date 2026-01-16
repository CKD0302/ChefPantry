# Chef Pantry Mobile App Build Guide

This guide explains how to build native iOS and Android apps from the Chef Pantry web application using Capacitor.

## Overview

Chef Pantry uses Capacitor to wrap the React web app as native iOS and Android applications. This approach:
- Shares 100% of the codebase between web and mobile
- Uses html5-qrcode for QR scanning (works in both web and native WebView)
- Provides native app store distribution

**Note**: The html5-qrcode library is used for QR scanning across all platforms. Native Capacitor barcode plugins (like @capacitor-mlkit/barcode-scanning) require Capacitor 8+ which is not yet compatible with this project's dependencies. The html5-qrcode library works reliably in Capacitor's WebView on both iOS and Android.

## Prerequisites

### For iOS Development (requires Mac)
- macOS with Xcode 15+ installed
- Apple Developer Account ($99/year for App Store distribution)
- CocoaPods (`sudo gem install cocoapods`)

### For Android Development
- Android Studio with SDK 26+
- Java Development Kit (JDK) 17+
- Google Play Developer Account ($25 one-time for Play Store distribution)

## Project Structure

```
/
├── ios/                    # iOS native project (Xcode)
│   └── App/
│       ├── Info.plist     # iOS permissions & app config
│       └── Assets.xcassets # App icons & splash screens
├── android/                # Android native project
│   └── app/
│       ├── src/main/
│       │   ├── AndroidManifest.xml  # Android permissions
│       │   └── res/                 # Icons & resources
├── capacitor.config.ts     # Capacitor configuration
├── client/                 # React web app (shared code)
└── scripts/
    └── build-mobile.sh     # Build script
```

## Initial Setup (First Time Only)

Before building mobile apps, you need to initialize the native projects. This must be done on a machine with Xcode (for iOS) or Android Studio (for Android) installed.

### Step 1: Initialize Native Platforms

```bash
# Add iOS platform (requires macOS with Xcode)
npx cap add ios

# Add Android platform
npx cap add android
```

This creates the full native project structure in the `ios/` and `android/` directories.

### Step 2: Copy Configuration Files

After initialization, the custom permission configurations in `ios/App/Info.plist` and `android/app/src/main/AndroidManifest.xml` may be overwritten. You may need to re-add the camera permissions:

**iOS** - Add to `ios/App/App/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Chef Pantry needs camera access to scan QR codes for clocking in and out at venues.</string>
```

**Android** - Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

## Building the Mobile Apps

### Step 1: Build the Web App

```bash
npm run build
```

This creates the production build in `dist/public/`.

### Step 2: Sync with Native Projects

```bash
npx cap sync
```

This copies web assets to iOS/Android and installs native dependencies.

### Step 3: Open in Native IDE

**For iOS:**
```bash
npx cap open ios
```

**For Android:**
```bash
npx cap open android
```

## App Store Submission Checklist

### iOS (App Store)

1. **App Icons**: Add to `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - Required sizes: 20, 29, 40, 60, 76, 83.5, 1024 points

2. **Splash Screen**: Customize `ios/App/App/Assets.xcassets/Splash.imageset/`

3. **Privacy**: Update `ios/App/Info.plist`
   - Camera usage already configured for QR scanning

4. **Signing**: Configure in Xcode
   - Team (Apple Developer Account)
   - Bundle Identifier: `co.thechefpantry.app`
   - Provisioning Profiles

5. **App Store Connect**:
   - Create app listing
   - Add screenshots (6.5" and 5.5" required)
   - Complete App Privacy questionnaire
   - Submit for review

### Android (Google Play)

1. **App Icons**: Add to `android/app/src/main/res/`
   - mipmap-hdpi (72x72)
   - mipmap-mdpi (48x48)
   - mipmap-xhdpi (96x96)
   - mipmap-xxhdpi (144x144)
   - mipmap-xxxhdpi (192x192)

2. **Signing**: Create release keystore
   ```bash
   keytool -genkey -v -keystore chef-pantry.keystore -alias chefpantry -keyalg RSA -keysize 2048 -validity 10000
   ```

3. **Build Release APK/Bundle**:
   - In Android Studio: Build > Generate Signed Bundle/APK

4. **Google Play Console**:
   - Create app listing
   - Add screenshots and feature graphic
   - Complete Data Safety questionnaire
   - Submit for review

## Camera Permissions

Both iOS and Android are pre-configured for camera access:

**iOS** (`ios/App/Info.plist`):
```xml
<key>NSCameraUsageDescription</key>
<string>Chef Pantry needs camera access to scan QR codes for clocking in and out at venues.</string>
```

**Android** (`android/app/src/main/AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-feature android:name="android.hardware.camera" android:required="false" />
```

## Version Management

Update version numbers before each release:

**In `capacitor.config.ts`:**
- The app version is managed in the native projects

**iOS** (`ios/App/Info.plist`):
```xml
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundleVersion</key>
<string>1</string>
```

**Android** (`android/app/build.gradle`):
```gradle
versionCode 1
versionName "1.0.0"
```

## Testing on Devices

### iOS Simulator
```bash
npx cap run ios
```

### Android Emulator
```bash
npx cap run android
```

### Physical Device Testing
- iOS: Connect device, select in Xcode, and run
- Android: Enable USB debugging, connect device, run from Android Studio

## Troubleshooting

### Camera not working in iOS Simulator
The iOS Simulator doesn't support camera. Test on a physical device.

### White screen on app launch
Ensure web build completed successfully and run `npx cap sync` again.

### Android build fails
Check that JAVA_HOME points to JDK 17+.

## Quick Commands Reference

```bash
# Full build and sync
./scripts/build-mobile.sh

# Just sync (after code changes)
npx cap sync

# Open iOS project
npx cap open ios

# Open Android project  
npx cap open android

# Run on iOS simulator
npx cap run ios

# Run on Android emulator
npx cap run android
```

## Support

For issues with the mobile build process, ensure:
1. All prerequisites are installed
2. Web build completes without errors
3. Native project dependencies are up to date (`npx cap sync`)
