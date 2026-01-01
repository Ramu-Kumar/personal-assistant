#!/bin/bash

# Define paths
PROJECT_ROOT=$(pwd)
ANDROID_DIR="$PROJECT_ROOT/frontend/android"
OUTPUT_DIR="$PROJECT_ROOT/apk_builds"
APK_SOURCE="$ANDROID_DIR/app/build/outputs/apk/release/app-release.apk"
APK_DEST="$OUTPUT_DIR/personal-assistant.apk"

echo "🚀 Starting APK Build Process..."

# Ensure output directory exists
if [ ! -d "$OUTPUT_DIR" ]; then
    echo "📂 Creating apk_builds directory..."
    mkdir -p "$OUTPUT_DIR"
fi

# Navigate to android directory
cd "$ANDROID_DIR" || { echo "❌ Failed to find Android directory"; exit 1; }

# Cleaning previous build to ensure fresh assets (like icons) are picked up
echo "🧹 Cleaning previous build..."
./gradlew clean

# Build Release APK
echo "🔨 Building Release APK..."
./gradlew assembleRelease

# Check if build was successful
if [ $? -eq 0 ] && [ -f "$APK_SOURCE" ]; then
    echo "✅ Build Successful!"
    
    # Copy to destination
    cp "$APK_SOURCE" "$APK_DEST"
    echo "📦 Copied APK to: $APK_DEST"
    
    # Reveal in Finder
    open "$OUTPUT_DIR"
else
    echo "❌ Build Failed or APK not found at $APK_SOURCE"
    exit 1
fi
