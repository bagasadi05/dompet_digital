# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Cara Testing di HP (Support Voice Input)

Untuk menggunakan fitur Input Suara di HP saat development lokal:

1. Pastikan HP dan Laptop terhubung ke **WiFi yang sama**.
2. Jalankan perintah: `npm run dev --host`
3. Lihat IP address yang muncul di terminal (contoh: `https://192.168.1.5:5173`).
4. Buka URL tersebut di Chrome pada HP Android Anda.
5. Jika muncul peringatan keamanan ("Your connection is not private"):
   - Klik **Advanced** (Lanjutan).
   - Klik **Proceed to ... (unsafe)** (Lanjutkan ke ...).
6. Izinkan akses mikrofon saat diminta.

*Catatan: HTTPS diperlukan karena browser memblokir akses mikrofon pada koneksi HTTP biasa.*
