# **Panduan Lengkap Aplikasi Dompet Digital**

Selamat datang di panduan lengkap untuk aplikasi **Dompet Digital**. Dokumen ini terbagi menjadi dua bagian utama:
1.  **Panduan Konfigurasi & Instalasi:** Ditujukan untuk developer yang ingin menjalankan aplikasi ini secara lokal.
2.  **Panduan Pengguna:** Menjelaskan cara menggunakan setiap fitur yang ada di dalam aplikasi.

---

## **Bagian 1: Konfigurasi & Instalasi (Untuk Developer)**

Bagian ini menjelaskan langkah-langkah teknis untuk menyiapkan dan menjalankan proyek aplikasi Dompet Digital di lingkungan pengembangan Anda.

### **Prasyarat**

*   **Node.js dan npm/yarn:** Pastikan terinstal di komputer Anda.
*   **Akun Supabase:** Anda memerlukan akun (bisa gratis) di [supabase.com](https://supabase.com/).
*   **Kunci API Google Gemini:** Diperlukan untuk fitur Asisten AI. Dapatkan dari [Google AI Studio](https://aistudio.google.com/).

### **Langkah 1: Konfigurasi Backend (Supabase)**

Backend aplikasi ini sepenuhnya berjalan di Supabase, memanfaatkan Database Postgres, Otentikasi, dan Edge Functions.

1.  **Buat Proyek Supabase:**
    *   Masuk ke akun Supabase Anda.
    *   Buat proyek baru (misalnya, "Dompet Digital").
    *   Simpan **Database Password** Anda di tempat yang aman.

2.  **Jalankan Skrip SQL:**
    *   Setelah proyek dibuat, buka **SQL Editor** dari menu di sebelah kiri.
    *   Buka file `PANDUAN_KONFIGURASI_SUPABASE.md` yang ada di dalam proyek ini.
    *   Salin **SELURUH ISI** dari bagian "Skrip SQL Lengkap" dan "Buat Fungsi RPC" di file tersebut.
    *   Tempelkan ke SQL Editor di Supabase, lalu klik **"Run"**. Ini akan membuat semua tabel (`transactions`, `budgets`, `goals`, `bills`), kebijakan keamanan (RLS), dan fungsi `pay_bill_and_update` yang krusial untuk aplikasi.

3.  **Konfigurasi URL Situs:**
    *   Agar tautan verifikasi email berfungsi saat mendaftar, Anda perlu mengatur URL aplikasi.
    *   Pergi ke **Authentication -> URL Configuration**.
    *   Isi **Site URL** dengan `http://localhost:5173` (atau port lain yang akan Anda gunakan). Jika Anda hosting aplikasi ini, ganti dengan URL produksi Anda.
    *   Klik **Save**.

### **Langkah 2: Konfigurasi Frontend (Aplikasi React)**

Sekarang, kita hubungkan kode aplikasi React dengan backend Supabase yang baru saja Anda buat.

1.  **Dapatkan Kunci API Supabase:**
    *   Di dasbor Supabase, pergi ke **Project Settings** (ikon roda gigi) -> **API**.
    *   Anda akan memerlukan dua hal dari sini:
        *   **Project URL**
        *   **Project API Keys** -> `anon` `public` key.

2.  **Hubungkan Aplikasi ke Supabase:**
    *   Buka file `services/supabaseClient.ts`.
    *   Ganti nilai `supabaseUrl` dan `supabaseAnonKey` dengan nilai yang Anda dapatkan dari dasbor Supabase. File ini sudah memiliki nilai *placeholder* yang benar, Anda hanya perlu memastikan nilainya sesuai dengan proyek Anda.

3.  **Siapkan Kunci API Gemini (Untuk Fitur AI):**
    *   Fitur **Asisten AI** memerlukan kunci API dari Google Gemini.
    *   Di folder utama proyek Anda, buat file baru bernama `.env`.
    *   Isi file tersebut dengan format berikut, ganti `your_gemini_api_key_here` dengan kunci API Anda.
        ```
        API_KEY=your_gemini_api_key_here
        ```
    *   Aplikasi akan secara otomatis memuat variabel ini. Jika Anda tidak menyediakan kunci ini, aplikasi akan tetap berjalan, tetapi halaman Asisten AI akan menampilkan pesan error.

### **Langkah 3: Menjalankan Aplikasi**

1.  **Instal Dependensi:**
    *   Buka terminal di folder root proyek.
    *   Jalankan perintah: `npm install`

2.  **Jalankan Server Pengembangan:**
    *   Setelah instalasi selesai, jalankan perintah: `npm run dev` atau `npm start` (sesuai konfigurasi di `package.json`).
    *   Buka browser dan akses `http://localhost:5173` (atau URL yang ditampilkan di terminal).

Sekarang aplikasi Anda sudah berjalan secara lokal dan terhubung ke backend Supabase!

---

## **Bagian 2: Panduan Pengguna (Cara Menggunakan Aplikasi)**

### **1. Mendaftar & Masuk (`/auth`)**

*   **Pendaftaran:** Gunakan formulir "Buat Akun Baru". Masukkan email dan kata sandi (minimal 6 karakter). Anda akan menerima email verifikasi dari Supabase. Klik tautan di email tersebut untuk mengaktifkan akun Anda.
*   **Masuk:** Setelah akun aktif, gunakan formulir "Selamat Datang Kembali" untuk masuk.

### **2. Dasbor Utama (`/`)**

Ini adalah pusat kendali keuangan Anda.
*   **Kartu Sambutan:** Untuk pengguna baru, kartu ini memberikan pintasan untuk memulai (tambah transaksi, buat anggaran).
*   **Kartu Salam & Wawasan AI:** Menampilkan ringkasan status keuangan bulan ini (surplus/defisit) dan wawasan cerdas dari AI, seperti perbandingan pengeluaran dengan bulan lalu.
*   **Filter Waktu:** Ganti periode data yang ditampilkan antara "Bulan Ini", "Bulan Lalu", atau "Semua".
*   **Kartu Ringkasan:** Menampilkan total Pemasukan, Pengeluaran, Tabungan, dan Aliran Kas.
*   **Transaksi Terkini & Ringkasan Pengeluaran:** Lihat 5 transaksi terakhir dan ringkasan visual pengeluaran Anda dalam bentuk diagram pai.
*   **Tagihan Berikutnya & Progres Impian:** Dapatkan pengingat tagihan terdekat dan lacak progres tabungan untuk setiap tujuan finansial Anda.
*   **Tombol Aksi (FAB):**
    *   Tombol `+` (kanan bawah) untuk menambah transaksi baru.
    *   Tombol `✨` (kiri bawah dari tombol `+`) untuk membuka Asisten Keuangan AI.

### **3. Mengelola Transaksi (`/transactions`)**

Ini adalah buku kas digital Anda.
*   **Menambah Transaksi:** Klik tombol `+`. Isi formulir:
    *   **Tipe:** Pemasukan atau Pengeluaran.
    *   **Jumlah:** Nominal transaksi.
    *   **Deskripsi & Kategori:** Detail transaksi.
    *   **Alokasikan ke Impian:** Jika Anda memilih kategori "Tabungan & Investasi", Anda bisa langsung mengalokasikan dana tersebut ke salah satu impian Anda.
*   **Filter & Pencarian:** Gunakan filter di bagian atas untuk mencari transaksi berdasarkan deskripsi, tipe, kategori, atau bulan.
*   **Ekspor ke CSV:** Klik tombol "Ekspor ke CSV" untuk mengunduh data transaksi yang sudah difilter.
*   **Mengedit/Menghapus:** Klik ikon tiga titik pada setiap transaksi untuk mengubah atau menghapusnya.

### **4. Perencanaan Keuangan (`/planning`)**

Halaman ini memiliki tiga tab untuk merencanakan masa depan finansial Anda.

*   **Tab Anggaran:**
    *   **Fungsi:** Mengontrol pengeluaran dengan menetapkan batas untuk setiap kategori.
    *   **Cara Menggunakan:** Klik tombol `+` untuk membuat anggaran baru. Pilih kategori dan tentukan batasnya. Progress bar akan menunjukkan seberapa banyak yang sudah Anda habiskan dari anggaran tersebut untuk bulan berjalan.

*   **Tab Impian:**
    *   **Fungsi:** Menabung untuk tujuan spesifik (misal: dana darurat, liburan).
    *   **Cara Menggunakan:** Klik `+` untuk membuat impian baru. Beri nama, tentukan target jumlah, dan tanggal target. Progres tabungan akan terisi secara otomatis setiap kali Anda mencatat transaksi tabungan yang dialokasikan ke impian tersebut.

*   **Tab Tagihan & Rutin:**
    *   **Fungsi:** Mengelola pembayaran rutin agar tidak ada yang terlewat.
    *   **Cara Menggunakan:** Klik `+` untuk menambahkan tagihan baru. Isi nama, jumlah, frekuensi (sekali, bulanan, dll.), dan tanggal jatuh tempo berikutnya.
    *   **Tombol "Bayar":** Saat Anda mengklik "Bayar", aplikasi akan secara otomatis membuat transaksi pengeluaran baru dan memperbarui tanggal jatuh tempo tagihan ke periode berikutnya (jika rutin).

### **5. Laporan Keuangan (`/reports`)**

*   **Fungsi:** Memberikan gambaran visual tentang kondisi keuangan Anda per bulan.
*   **Cara Menggunakan:** Pilih bulan yang ingin Anda analisis.
    *   **Bagan Batang:** Membandingkan total pemasukan dan pengeluaran.
    *   **Bagan Pai:** Memecah persentase pengeluaran berdasarkan kategori.

### **6. Asisten Keuangan AI (`/ai-chat`)**

*   **Fungsi:** Berinteraksi dengan model AI Gemini yang telah diberi konteks tentang data keuangan Anda.
*   **Cara Menggunakan:**
    *   Buka halaman "Asisten AI" dari menu atau tombol `✨` di dasbor.
    *   AI akan menyapa Anda. Anda bisa langsung mengetik pertanyaan seperti:
        *   "Analisis pengeluaranku bulan ini."
        *   "Pengeluaran terbesarku di mana ya?"
        *   "Bantu aku buat anggaran untuk kategori Transportasi."
        *   "Beri aku tips untuk berhemat."
    *   AI akan memberikan jawaban yang relevan berdasarkan data transaksi, anggaran, dan impian Anda.

### **7. Notifikasi & Pengaturan**

*   **Lonceng Notifikasi (Header):** Klik ikon lonceng untuk melihat pengingat penting seperti tagihan jatuh tempo, peringatan anggaran, atau pencapaian impian.
*   **Menu Pengguna (Header):** Klik inisial nama Anda untuk membuka menu. Dari sini Anda bisa **mengubah mode tema (terang/gelap)** dan **Logout**.

---

Semoga panduan ini bermanfaat!