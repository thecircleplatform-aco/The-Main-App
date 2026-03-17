# Circle Mobile App (Capacitor)

Circle runs as a native Android app via Capacitor. The app loads your live site: **https://www.thecircleplatform.org**.

---

## Where to get Android Studio

1. Go to: **https://developer.android.com/studio**
2. Click **Download Android Studio**.
3. Run the installer and follow the steps (include **Android SDK** and **Android Virtual Device** if asked).
4. First launch: complete the setup wizard and let it install the SDK. This can take a few minutes.

You need Android Studio to build and run the Android app (emulator or real device).

---

## What you need to do (step by step)

### Step 1: Install Android Studio (see above)

### Step 2: Sync the project and open it in Android Studio

In your project folder (the `circle` app), run:

```bash
cd circle
npm run mobile
```

Or manually:

```bash
npx cap sync android
npx cap open android
```

This copies the app config into the Android project and opens the `android` folder in Android Studio.

### Step 3: Run the app

- In Android Studio, wait until the project finishes loading (first time can take a few minutes).
- At the top, choose an **Android device** (e.g. **Pixel 6 API 34** or a connected phone).
- Click the green **Run** (play) button.

The app will open and load **https://www.thecircleplatform.org** inside the native shell (camera, notifications, share, etc. will work).

---

## Install on your Android phone

To put the app on your **physical Android phone**:

1. **On your phone:** Enable developer mode and USB debugging.
   - Open **Settings → About phone**, tap **Build number** 7 times (you'll see "You are now a developer").
   - Go back to **Settings → Developer options**, turn on **USB debugging**.

2. **Connect the phone** to your PC with a USB cable. On the phone, if it asks "Allow USB debugging?", tap **Allow**.

3. **In Android Studio:** After opening the project (`npm run mobile`), click the device dropdown at the top. Your phone should appear (e.g. "Samsung Galaxy …" or "Pixel …"). Select it.

4. Click the green **Run** button. The app will build and install on your phone. The first time can take 1–2 minutes.

**Alternative – install without Android Studio on the phone:**  
In Android Studio use **Build → Build Bundle(s) / APK(s) → Build APK(s)**. When it's done, copy the `.apk` from `android/app/build/outputs/apk/debug/` to your phone (email, cloud, or USB) and open it on the phone to install. You may need to allow "Install from unknown sources" for that app or browser.

---

## Install on your iPhone (iOS)

To run or install the app on an **iPhone or iPad** you need:

- A **Mac** (Apple does not allow building iOS apps on Windows).
- **Xcode** from the Mac App Store: https://apps.apple.com/app/xcode/id497799835  
- An **Apple ID** (free). For a **real device**, an **Apple Developer account** is required ($99/year) to install on your own iPhone/iPad.

**Steps (on the Mac):**

1. **Open the project on your Mac** (copy the `circle` project folder or clone the repo).

2. **Install dependencies and add iOS** (if not already done):
   ```bash
   cd circle
   npm install
   npx cap add ios    # only if ios folder doesn't exist yet
   npx cap sync ios
   ```

3. **Open in Xcode:**
   ```bash
   npx cap open ios
   ```
   Or run: `npm run mobile:ios`

4. **In Xcode:**  
   - Select your **iPhone** or **iPad** in the device dropdown (top left).  
   - The first time you use a real device: click the project name (e.g. "App") in the left sidebar → **Signing & Capabilities** → choose your **Team** (your Apple ID). Connect the device and tap **Trust** on the device if asked.  
   - Click the **Run** (play) button. The app will build and install on your iOS device.

**To publish on the App Store:** Use Xcode's **Product → Archive**, then **Distribute App** and follow the steps (Apple Developer account required).

---

### Optional: Use a different URL

To point the app at another URL (e.g. for testing), set it before syncing:

**Windows (PowerShell):**
```powershell
$env:CAPACITOR_SERVER_URL="https://www.thecircleplatform.org"
npm run cap:sync
```

**Development (load from your PC on emulator):**
```powershell
$env:CAPACITOR_SERVER_URL="http://10.0.2.2:3000"
npm run cap:sync
```
Then run `npm run dev` in another terminal so the app loads from your local server.

## Mobile Features

- **Camera** – Take photos or pick from gallery (profile, chat attachments)
- **Voice input** – Speech-to-text for chat (Web Speech API)
- **Push notifications** – Register for remote notifications
- **Local notifications** – Schedule reminders (AI check-ins, study reminders)
- **Haptic feedback** – Vibration on send, button press
- **Share** – Native share dialog for AI responses

## Build for Play Store

1. The app is already set to load **https://www.thecircleplatform.org** (see `capacitor.config.ts`).
2. In Android Studio: **Build → Generate Signed Bundle / APK**
3. Select **Android App Bundle (AAB)** for Play Store
4. Create or choose a keystore and build

## App Icon & Splash Screen

Replace the default icons in:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`
- `android/app/src/main/res/drawable/splash.png`

Use [Capacitor Assets](https://capacitorjs.com/docs/guides/splash-screens-and-icons) or [@capacitor/assets](https://www.npmjs.com/package/@capacitor/assets) to generate from source images.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run cap:sync` | Sync web assets and plugins to both Android and iOS |
| `npm run cap:sync:android` | Sync Android only |
| `npm run cap:sync:ios` | Sync iOS only |
| `npm run cap:open:android` | Open Android project in Android Studio |
| `npm run cap:open:ios` | Open iOS project in Xcode (Mac only) |
| `npm run mobile` | Sync Android and open Android Studio |
| `npm run mobile:ios` | Sync iOS and open Xcode (Mac only) |
