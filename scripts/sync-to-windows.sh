#!/bin/bash

# =============================================================================
# Sync Android Project to Windows
# 
# This script copies the Android project from WSL to Windows so Android Studio
# can build and run it without Gradle/JDK path issues.
#
# Usage:
#   ./scripts/sync-to-windows.sh          # Sync assets only (fast)
#   ./scripts/sync-to-windows.sh --full   # Full sync (first time or after native changes)
# =============================================================================

set -e

# ============ CONFIGURATION ============
# Change this to your preferred Windows location
WINDOWS_PROJECT_NAME="zavoia-android"
WINDOWS_BASE_PATH="/mnt/c/projects"
WINDOWS_ANDROID_PATH="$WINDOWS_BASE_PATH/$WINDOWS_PROJECT_NAME"
# =======================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo -e "${GREEN}📱 Android Sync to Windows${NC}"
echo "================================"
echo ""

# Check if --full flag is passed
FULL_SYNC=false
if [ "$1" == "--full" ]; then
    FULL_SYNC=true
fi

# Check if android folder exists in WSL
if [ ! -d "android" ]; then
    echo -e "${RED}❌ No android folder found in current directory${NC}"
    echo "   Run 'yarn android:dev' first to build the project"
    exit 1
fi

# Check if capacitor-android exists in node_modules
if [ ! -d "node_modules/@capacitor/android/capacitor" ]; then
    echo -e "${RED}❌ Capacitor Android library not found${NC}"
    echo "   Run 'yarn install' first"
    exit 1
fi

# Create Windows base path if it doesn't exist
if [ ! -d "$WINDOWS_BASE_PATH" ]; then
    echo "Creating $WINDOWS_BASE_PATH..."
    mkdir -p "$WINDOWS_BASE_PATH"
fi

# Check if this is first time setup or full sync requested
if [ ! -d "$WINDOWS_ANDROID_PATH" ] || [ "$FULL_SYNC" == true ]; then
    echo -e "${YELLOW}🔄 Full sync: Copying entire Android project...${NC}"
    echo ""
    
    # Remove old folder if exists (for clean full sync)
    if [ -d "$WINDOWS_ANDROID_PATH" ]; then
        echo "   Removing old project folder..."
        rm -rf "$WINDOWS_ANDROID_PATH"
    fi
    
    # Copy entire android folder
    echo "   Copying android project..."
    cp -r android "$WINDOWS_ANDROID_PATH"
    
    # Copy Capacitor Android library
    echo "   Copying Capacitor Android library..."
    mkdir -p "$WINDOWS_ANDROID_PATH/capacitor-android"
    cp -r node_modules/@capacitor/android/capacitor/* "$WINDOWS_ANDROID_PATH/capacitor-android/"

    # Build capacitor.settings.gradle dynamically — include every installed Capacitor plugin
    echo "   Fixing Capacitor paths..."
    SETTINGS_FILE="$WINDOWS_ANDROID_PATH/capacitor.settings.gradle"
    cat > "$SETTINGS_FILE" << 'EOF'
// Modified for Windows standalone build
include ':capacitor-android'
project(':capacitor-android').projectDir = new File('./capacitor-android')
EOF

    # Copy each Capacitor plugin that has an android/ folder.
    # Covers both @capacitor/* (core plugins) and @capacitor-community/* (community plugins).
    for SCOPE in capacitor capacitor-community; do
        for PLUGIN_DIR in node_modules/@$SCOPE/*/; do
            # Skip if glob didn't match anything
            [ -d "$PLUGIN_DIR" ] || continue
            PLUGIN_NAME=$(basename "$PLUGIN_DIR")
            # Skip @capacitor core packages (android, cli, core) — these aren't plugins
            if [ "$SCOPE" == "capacitor" ]; then
                if [ "$PLUGIN_NAME" == "android" ] || [ "$PLUGIN_NAME" == "cli" ] || [ "$PLUGIN_NAME" == "core" ]; then
                    continue
                fi
            fi
            # Plugin must have an android/ subfolder
            if [ -d "$PLUGIN_DIR/android" ]; then
                # Gradle module naming: @capacitor/foo → capacitor-foo, @capacitor-community/foo → capacitor-community-foo
                MODULE_NAME="$SCOPE-$PLUGIN_NAME"
                echo "   Copying plugin: @$SCOPE/$PLUGIN_NAME → $MODULE_NAME"
                mkdir -p "$WINDOWS_ANDROID_PATH/$MODULE_NAME"
                cp -r "$PLUGIN_DIR/android/"* "$WINDOWS_ANDROID_PATH/$MODULE_NAME/"
                cat >> "$SETTINGS_FILE" << EOF

include ':$MODULE_NAME'
project(':$MODULE_NAME').projectDir = new File('./$MODULE_NAME')
EOF
            fi
        done
    done
    
    echo ""
    echo -e "${GREEN}✅ Full sync complete!${NC}"
    echo ""
    echo "   Project location: C:\\projects\\$WINDOWS_PROJECT_NAME"
    echo ""
    echo "   Next steps:"
    echo "   1. Open Android Studio on Windows"
    echo "   2. File → Open → C:\\projects\\$WINDOWS_PROJECT_NAME"
    echo "   3. Wait for Gradle sync to complete"
    echo "   4. Click Run ▶️"
    echo ""
else
    # Quick sync - only copy web assets
    echo -e "${YELLOW}⚡ Quick sync: Copying web assets only...${NC}"
    echo ""
    
    # Copy web assets
    echo "   Syncing public assets..."
    rm -rf "$WINDOWS_ANDROID_PATH/app/src/main/assets/public"
    cp -r android/app/src/main/assets/public "$WINDOWS_ANDROID_PATH/app/src/main/assets/"
    
    # Copy capacitor config files
    echo "   Syncing capacitor config..."
    cp android/app/src/main/assets/capacitor.config.json "$WINDOWS_ANDROID_PATH/app/src/main/assets/"
    cp android/app/src/main/assets/capacitor.plugins.json "$WINDOWS_ANDROID_PATH/app/src/main/assets/" 2>/dev/null || true
    
    echo ""
    echo -e "${GREEN}✅ Quick sync complete!${NC}"
    echo ""
    echo "   Android Studio should auto-reload, or just hit Run ▶️"
    echo ""
fi

echo "================================"
echo ""
