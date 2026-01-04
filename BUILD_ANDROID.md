# 📱 Panduan Build APK Dompet Digital

## Persyaratan Sistem

### Software yang Diperlukan:
1. **Node.js** (v18+) - [Download](https://nodejs.org/)
2. **JDK 17+** - [Download AdoptOpenJDK](https://adoptium.net/)
3. **Android Studio** (opsional tapi disarankan) - [Download](https://developer.android.com/studio)
4. **Android SDK** dengan:
   - Android SDK Build-Tools 34
   - Android SDK Platform 34 (API 34)
   - Android Emulator (opsional)

### Environment Variables (Windows):
```powershell
# Tambahkan ke System Environment Variables:
JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-17.x.x
ANDROID_SDK_ROOT = C:\Users\<username>\AppData\Local\Android\Sdk

# Tambahkan ke PATH:
%JAVA_HOME%\bin
%ANDROID_SDK_ROOT%\platform-tools
%ANDROID_SDK_ROOT%\tools
```

---

## 🚀 Cara Build APK

### Metode 1: Quick Build (Debug APK)

```bash
# 1. Install dependencies
npm install

# 2. Build dan sync ke Android
npm run build:android

# 3. Build Debug APK
npm run android:debug
```

APK akan berada di:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Metode 2: Build via Android Studio

```bash
# 1. Build web dan sync
npm run build:android

# 2. Buka di Android Studio
npm run android:open
```

Di Android Studio:
1. Tunggu Gradle sync selesai
2. Menu **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. APK ada di `android/app/build/outputs/apk/`

### Metode 3: Release APK (Signed)

#### A. Buat Keystore (hanya sekali)
```bash
cd android/app
keytool -genkey -v -keystore dompet-digital.keystore -alias dompet-digital -keyalg RSA -keysize 2048 -validity 10000
```

Simpan password dengan aman!

#### B. Konfigurasi Signing

Edit `android/app/build.gradle`, tambahkan sebelum `buildTypes`:

```gradle
signingConfigs {
    release {
        storeFile file('dompet-digital.keystore')
        storePassword 'PASSWORD_ANDA'
        keyAlias 'dompet-digital'
        keyPassword 'PASSWORD_ANDA'
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

#### C. Build Release APK
```bash
npm run android:release
```

APK ada di:
```
android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔧 Troubleshooting

### Error: "Android SDK not found"
- Pastikan `ANDROID_SDK_ROOT` sudah diset di environment variables
- Install Android SDK via Android Studio SDK Manager

### Error: "JAVA_HOME not set"
```powershell
# Check Java version
java -version

# Set JAVA_HOME (PowerShell admin)
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.x.x", "Machine")
```

### Error: "Gradle sync failed"
```bash
cd android
gradlew.bat clean
gradlew.bat build --info
```

### Error: "SDK Build Tools missing"
Buka Android Studio → SDK Manager → Install Build Tools 34+

### APK Install Error: "App not installed"
- Pastikan **USB Debugging** aktif di HP
- Uninstall versi lama terlebih dahulu
- Untuk app-debug.apk, aktifkan **Install from Unknown Sources**

---

## 📁 Struktur File APK

```
android/
├── app/
│   ├── build/
│   │   └── outputs/
│   │       └── apk/
│   │           ├── debug/
│   │           │   └── app-debug.apk      ← Debug APK
│   │           └── release/
│   │               └── app-release.apk    ← Release APK
│   ├── src/main/
│   │   ├── res/                           ← Icons & Splash
│   │   ├── AndroidManifest.xml
│   │   └── java/                          ← Native code
│   └── build.gradle
└── build.gradle
```

---

## 🎨 Mengganti Icon & Splash Screen

### App Icon
Ganti file-file berikut dengan icon Anda:
```
android/app/src/main/res/
├── mipmap-hdpi/ic_launcher.png      (72x72)
├── mipmap-mdpi/ic_launcher.png      (48x48)
├── mipmap-xhdpi/ic_launcher.png     (96x96)
├── mipmap-xxhdpi/ic_launcher.png    (144x144)
├── mipmap-xxxhdpi/ic_launcher.png   (192x192)
```

### Splash Screen
```
android/app/src/main/res/
├── drawable-land-hdpi/splash.png
├── drawable-land-mdpi/splash.png
├── drawable-land-xhdpi/splash.png
├── drawable-land-xxhdpi/splash.png
├── drawable-land-xxxhdpi/splash.png
├── drawable-port-hdpi/splash.png
├── drawable-port-mdpi/splash.png
├── drawable-port-xhdpi/splash.png
├── drawable-port-xxhdpi/splash.png
└── drawable-port-xxxhdpi/splash.png
```

---

## ⚡ Quick Commands

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Jalankan development server |
| `npm run build` | Build web assets ke dist/ |
| `npm run build:android` | Build + sync ke Android |
| `npm run android:open` | Buka di Android Studio |
| `npm run android:debug` | Build Debug APK |
| `npm run android:release` | Build Release APK |
| `npm run sync` | Sync web ke native |

---

## 📋 Checklist Sebelum Publish

- [ ] Ganti icon aplikasi dengan logo asli
- [ ] Update splash screen
- [ ] Buat signed release APK
- [ ] Test di beberapa device berbeda
- [ ] Pastikan semua fitur berfungsi offline
- [ ] Update versionCode dan versionName di `android/app/build.gradle`
- [ ] Hapus debug logs
- [ ] Test deep links (jika ada)

---

## 💡 Tips

1. **Debug di HP langsung**: Connect HP via USB → Enable USB Debugging → Run dari Android Studio
2. **Ukuran APK**: Release APK dengan minify akan lebih kecil (~20-30% lebih kecil)
3. **AAB vs APK**: Untuk Play Store, gunakan Android App Bundle (.aab) bukan APK
4. **ProGuard**: Aktifkan untuk release build agar kode lebih aman

---

*Dibuat untuk Dompet Digital - Manajer Keuangan Pribadi*
