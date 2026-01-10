# Build Guide

## Quick Reference

| Command | Platform | Environment | API Target |
|---------|----------|-------------|------------|
| `yarn dev` | Web | Development | Local (via proxy) |
| `yarn build` | Web | Production | Production API |
| `yarn android` | Android | Development | Local backend |
| `yarn android:prod` | Android | Production | Production API |
| `yarn android:live` | Android | Development | Local (live reload) |
| `yarn ios` | iOS | Development | Local backend |
| `yarn ios:prod` | iOS | Production | Production API |

---

## Environment Files

Create these `.env` files in the project root:

### `.env` (Web Development)
```env
VITE_API_PROXY_TARGET=http://localhost:3000
```

### `.env.production` (Web Production)
```env
VITE_API_URL=https://api.zavoia.com
```

### `.env.mobile` (Mobile Development)
```env
# For Android Emulator:
VITE_API_URL=http://10.0.2.2:3000

# For Physical Device (use your machine's IP):
# VITE_API_URL=http://192.168.1.100:3000
```

### `.env.mobile-prod` (Mobile Production)
```env
VITE_API_URL=https://api.zavoia.com
```

---

## Web Development

### Start Development Server

```bash
yarn dev
```

Opens at `http://localhost:5173`. API calls to `/api/*` are proxied to your local backend.

### Build for Production

```bash
yarn build
```

Output goes to `dist/` folder.

### Preview Production Build

```bash
yarn preview
```

---

## Android Development

### Prerequisites

1. Android Studio installed on Windows
2. WSL with Node.js
3. Backend running on `localhost:3000`

### Build & Run (Development)

```bash
# 1. Build the app (uses .env.mobile)
# this command will:
# - run vite build in mobile mode, sing .env.mobile
# - run capacitor sync android, basically sync the mobile build with android build through capacitor
# - run a bash script we have named "sync-to-windows"
# - sync-to-windows actually copies the android build generated in wsl, to a windows path so we can run the android build on android studio in windows (running android studio on wsl is hell)
yarn android

# 2. Open in Android Studio (Windows)
#    File → Open → C:\projects\zavoia-android

# 3. Click Run ▶️
```

### Build & Run (Production)

```bash
# Uses .env.mobile-prod
yarn android:prod
```

### Live Reload (Hot Reload on Device)

For instant code changes without rebuilding:

**Terminal 1 (WSL):**
```bash
yarn android:live
```

**Terminal 2 (WSL):**
```bash
# Get your WSL IP and sync
LIVE_RELOAD_IP=$(hostname -I | cut -d' ' -f1) npx cap sync android
yarn android:sync
```

**Then in Android Studio:** Run the app. Code changes will hot reload!

### Quick Sync (After Code Changes)

If you only changed web code (not native):

```bash
yarn android:sync
```

### Full Sync (After Native Changes)

If you changed Capacitor plugins or native code:

```bash
yarn android:sync:full
```

---

## iOS Development

### Prerequisites

1. macOS with Xcode installed
2. Node.js
3. Backend running on `localhost:3000`

### Build & Run (Development)

```bash
# 1. Build the app (uses .env.mobile)
yarn ios

# 2. Open Xcode
open ios/App/App.xcworkspace

# 3. Select simulator/device and click Run ▶️
```

### Build & Run (Production)

```bash
yarn ios:prod
```

---

## Troubleshooting

### API not connecting on Android Emulator

Make sure `.env.mobile` has:
```env
VITE_API_URL=http://10.0.2.2:3000
```

`10.0.2.2` is the Android Emulator's alias for the host machine's localhost.

### API not connecting on Physical Device

1. Find your machine's IP: `hostname -I` (Linux/WSL) or `ipconfig` (Windows)
2. Update `.env.mobile`:
   ```env
   VITE_API_URL=http://YOUR_IP:3000
   ```
3. Make sure your phone is on the same WiFi network
4. Make sure your backend allows connections from that IP

### CORS Errors

If you see CORS errors in the mobile app:
- Check that `VITE_API_URL` is set correctly in your `.env.mobile` file
- Verify your backend allows requests from the app's origin

### Changes Not Showing on Android

```bash
# Quick sync (web changes only)
yarn android:sync

# Full sync (if that doesn't work)
yarn android:sync:full
```

### Gradle Errors in Android Studio

Make sure you opened the project from `C:\projects\zavoia-android`, not from the WSL path.

