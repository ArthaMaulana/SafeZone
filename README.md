# SafeZone: Aplikasi Pelaporan Titik Rawan Berbasis Komunitas

![SafeZone Map](public/screens/screenshot-map.png) <!-- Ganti dengan path screenshot Anda -->

## Latar Belakang & Tujuan Proyek

SafeZone adalah aplikasi web yang dirancang untuk meningkatkan keamanan dan kenyamanan lingkungan perkotaan melalui partisipasi komunitas. Proyek ini bertujuan untuk mengatasi tantangan kota modern seperti kriminalitas, infrastruktur yang buruk (jalan rusak, lampu mati), dan bencana alam (banjir) dengan menyediakan platform terpusat bagi warga untuk melaporkan dan memvalidasi titik-titik rawan secara *real-time*.

Dengan memetakan insiden ini, SafeZone membantu warga menjadi lebih waspada terhadap lingkungan sekitar mereka dan menyediakan data berharga yang dapat digunakan untuk advokasi kepada pihak berwenang. Proyek ini secara langsung mendukung **SDG 11 (Kota & Komunitas Berkelanjutan)** dan **SDG 16 (Perdamaian, Keadilan, dan Institusi yang Tangguh)**.

## Teknologi yang Digunakan

Stack teknologi dipilih untuk kecepatan pengembangan, skalabilitas, dan fitur *real-time* yang kuat, dengan tetap menjaga biaya operasional yang rendah.

*   **Frontend**: **React** dengan **Next.js** - Memberikan pengalaman pengguna yang cepat dan responsif dengan Server-Side Rendering (SSR) untuk halaman detail dan kemudahan routing.
*   **Backend & Database**: **Supabase** - Alternatif open-source untuk Firebase yang menyediakan database Postgres, otentikasi, *storage*, dan *edge functions* dalam satu platform. Fitur **Supabase Realtime** menjadi tulang punggung untuk pembaruan peta dan voting secara langsung.
*   **Peta**: **Leaflet.js** & **OpenStreetMap** - Pustaka peta interaktif yang ringan dan gratis, sangat ideal untuk menampilkan data geospasial tanpa biaya API yang mahal.
*   **Styling**: **Tailwind CSS** - Kerangka kerja CSS utility-first untuk membangun antarmuka kustom dengan cepat.
*   **Deployment**: **Vercel** (Frontend) & **Supabase** (Backend/Functions) - Kombinasi yang mulus untuk CI/CD, deployment otomatis, dan skalabilitas global.

## Fitur Utama

1.  **Pelaporan Insiden**: Pengguna yang sudah login dapat membuat laporan baru dengan memilih kategori (kriminalitas, jalan rusak, dll.), menambahkan deskripsi, melampirkan foto (opsional), dan menandai lokasi akurat menggunakan GPS perangkat.
2.  **Peta Interaktif**: Semua laporan ditampilkan sebagai *marker* pada peta. Pengguna dapat mengklik *marker* untuk melihat detail singkat dan menavigasi ke halaman detail laporan.
3.  **Validasi Komunitas (Voting)**: Setiap laporan memiliki sistem *upvote/downvote* untuk memvalidasi keakuratan dan urgensi laporan. Skor ini diperbarui secara *real-time* untuk semua pengguna.
4.  **Notifikasi Berbasis Radius**: Pengguna dapat mengatur area langganan (pusat lokasi + radius) di halaman pengaturan. Jika ada laporan baru yang masuk dalam radius tersebut, sebuah *Edge Function* akan dipicu untuk mengirim notifikasi (saat ini disimulasikan).
5.  **Otentikasi Aman**: Sistem otentikasi terintegrasi dengan Supabase Auth, mendukung login via email atau penyedia OAuth lainnya.
6.  **Keamanan Data**: Implementasi **Row Level Security (RLS)** di Postgres memastikan bahwa pengguna hanya dapat mengakses dan memodifikasi data yang mereka miliki.

## Instruksi Setup & Instalasi

Ikuti langkah-langkah berikut untuk menjalankan proyek ini secara lokal.

### 1. Prasyarat

*   Node.js (v16 atau lebih baru)
*   npm / yarn / pnpm
*   Akun Supabase
*   Supabase CLI (opsional, tapi direkomendasikan)

### 2. Konfigurasi Supabase

1.  Buat proyek baru di [Supabase Dashboard](https://supabase.com/).
2.  Pergi ke **SQL Editor** dan jalankan seluruh skrip dari file `supabase/schema.sql` untuk membuat tabel, RLS, dan fungsi yang dibutuhkan.
3.  Pergi ke **Storage** dan buat *Bucket* baru dengan nama `reports`. Pastikan bucket ini bersifat publik.
4.  Pergi ke **Settings > API**. Salin `Project URL` dan `anon (public) key`.

### 3. Konfigurasi Lokal

1.  **Clone repository ini:**

    ```bash
    git clone https://github.com/your-username/safezone.git
    cd safezone
    ```

2.  **Install dependensi:**

    ```bash
    npm install
    ```

3.  **Buat file environment:**

    Salin `.env.example` menjadi `.env.local` dan isi dengan kunci Supabase Anda.

    ```
    NEXT_PUBLIC_SUPABASE_URL=URL_PROYEK_SUPABASE_ANDA
    NEXT_PUBLIC_SUPABASE_ANON_KEY=ANON_KEY_PROYEK_ANDA
    ```

4.  **Jalankan aplikasi:**

    ```bash
    npm run dev
    ```

    Aplikasi sekarang akan berjalan di `http://localhost:3000`.

## Penjelasan Pemanfaatan AI Selama Pengembangan

Sesuai dengan aturan proyek, **kecerdasan buatan (AI) tidak digunakan sebagai fitur dalam produk akhir yang di-deploy**. Sebaliknya, AI (dalam hal ini, model bahasa generatif) dimanfaatkan secara ekstensif sebagai **alat bantu produktivitas selama fase pengembangan**.

Peran AI sebagai *AI Engineer Assistant* adalah sebagai berikut:

1.  **Scaffolding & Boilerplate Code**: AI membantu menghasilkan kode awal untuk komponen React, struktur file, dan konfigurasi (ESLint, Prettier). Ini secara signifikan mengurangi waktu yang dihabiskan untuk tugas-tugas repetitif.
2.  **Generasi Skema SQL & RLS**: AI digunakan untuk merancang dan menulis skema database Postgres yang kompleks, termasuk tabel, relasi, tipe `ENUM`, dan yang terpenting, kebijakan *Row Level Security (RLS)* yang rumit. Ini memastikan fondasi keamanan data yang kuat sejak awal.
3.  **Penulisan Logika Kompleks**: AI membantu dalam menulis logika bisnis seperti fungsi geospasial (Haversine distance) dan implementasi Supabase Realtime, mempercepat proses pengembangan fitur inti.
4.  **Debugging & Optimasi**: AI bertindak sebagai *pair programmer*, membantu mengidentifikasi potensi bug, menyarankan perbaikan, dan memberikan ide untuk optimasi kode.
5.  **Dokumentasi**: AI menghasilkan sebagian besar dari `README.md` ini, termasuk deskripsi fitur dan instruksi setup, memastikan dokumentasi yang jelas dan lengkap.

Dengan memanfaatkan AI sebagai asisten pengembangan, proyek ini dapat diselesaikan dengan lebih cepat, dengan kualitas kode yang lebih tinggi, dan dengan fondasi keamanan yang lebih solid, memungkinkan pengembang untuk fokus pada arsitektur dan pengalaman pengguna.

## Screenshot Aplikasi

*(Sertakan beberapa tangkapan layar di sini)*

1.  **Tampilan Peta Utama**
    ![Tampilan Peta Utama](public/screens/screenshot-map.png)

2.  **Formulir Pembuatan Laporan**
    ![Formulir Laporan](public/screens/screenshot-form.png)

3.  **Halaman Detail Laporan**
    ![Detail Laporan](public/screens/screenshot-detail.png)

## Link Deployment

**Aplikasi dapat diakses di:** [**https://safezone-demo.vercel.app**](https://safezone-demo.vercel.app) <!-- Ganti dengan link Vercel Anda -->
