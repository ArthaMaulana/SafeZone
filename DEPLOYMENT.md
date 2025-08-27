# Panduan Deployment Proyek SafeZone

Dokumen ini berisi instruksi lengkap untuk mendeploy frontend ke Vercel dan mengkonfigurasi backend di Supabase.

## Bagian 1: Deployment Frontend (Vercel)

Vercel adalah platform yang ideal untuk mendeploy aplikasi Next.js karena integrasinya yang mulus.

### Langkah 1: Push Kode ke Repository Git

Pastikan proyek Anda sudah berada di repository GitHub, GitLab, atau Bitbucket.

### Langkah 2: Impor Proyek ke Vercel

1.  Login ke akun [Vercel](https://vercel.com/) Anda.
2.  Dari dashboard, klik **"Add New..." > "Project"**.
3.  Pilih repository Git yang berisi proyek SafeZone Anda dan klik **"Import"**.
4.  Vercel akan secara otomatis mendeteksi bahwa ini adalah proyek Next.js dan mengisi pengaturan build secara default. Anda tidak perlu mengubahnya.

### Langkah 3: Konfigurasi Environment Variables

Ini adalah langkah paling penting. Vercel perlu mengetahui cara terhubung ke Supabase.

1.  Di halaman konfigurasi proyek, buka bagian **"Environment Variables"**.
2.  Tambahkan dua variabel berikut:

    *   **Name**: `NEXT_PUBLIC_SUPABASE_URL`
    *   **Value**: `https://<ID-PROYEK-ANDA>.supabase.co` (Salin dari Supabase Dashboard > Settings > API)

    *   **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    *   **Value**: Kunci `anon (public)` Anda (Salin dari Supabase Dashboard > Settings > API)

3.  Klik **"Deploy"**.

Vercel akan memulai proses build dan deployment. Setelah beberapa saat, aplikasi Anda akan live!

---

## Bagian 2: Konfigurasi & Deployment Supabase

Pastikan semua aset backend Anda sudah siap.

### Langkah 1: Terapkan Skema Database

Jika Anda belum melakukannya, terapkan skema database ke proyek Supabase Anda.

*   **Cara Cepat**: Buka **SQL Editor** di dashboard Supabase, salin seluruh konten dari `supabase/schema.sql`, dan klik **"Run"**.
*   **Cara Direkomendasikan (CLI)**: Gunakan Supabase CLI untuk menerapkan migrasi. Ini lebih baik untuk manajemen perubahan skema di masa depan.

    ```bash
    # Hubungkan ke proyek Anda
    supabase link --project-ref <ID-PROYEK-ANDA>

    # Terapkan semua migrasi lokal ke database remote
    supabase db push
    ```

### Langkah 2: Buat Storage Bucket

1.  Di dashboard Supabase, pergi ke **Storage**.
2.  Klik **"New Bucket"**.
3.  Beri nama bucket `reports`.
4.  Pastikan bucket ini adalah **Public**. Anda bisa mengaturnya melalui kebijakan bucket setelah dibuat.

### Langkah 3: Deploy Edge Function `notify_subscribers`

Deployment fungsi memerlukan Supabase CLI.

1.  **Login ke CLI:**

    ```bash
    supabase login
    ```

2.  **Set Secrets (Variabel Rahasia):**

    Fungsi ini memerlukan akses admin ke database Anda. Jangan simpan kunci ini di dalam kode.

    ```bash
    # Ganti dengan URL dan Service Role Key dari Supabase > Settings > API
    supabase secrets set SUPABASE_URL=https://<ID-PROYEK-ANDA>.supabase.co
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY_ANDA>
    ```

3.  **Deploy Fungsi:**

    ```bash
    supabase functions deploy notify_subscribers --no-verify-jwt
    ```

    Fungsi Anda sekarang sudah live dan siap dipanggil.

---

## Bagian 3: Troubleshooting Umum

*   **Masalah CORS**: Jika Anda mendapatkan error CORS saat memanggil Edge Function, pastikan Anda menyertakan `corsHeaders` di response dari fungsi tersebut, seperti yang sudah ada di kode `index.ts`.

*   **Environment Variables Tidak Terbaca**: Jika aplikasi Vercel tidak bisa terhubung ke Supabase, pastikan nama variabel di Vercel **persis** sama dengan yang ada di `.env.local` (`NEXT_PUBLIC_...`). Jika Anda baru saja menambahkannya, Anda mungkin perlu me-redeploy aplikasi.

*   **Error RLS atau 401 Unauthorized**: Jika pengguna tidak bisa membuat laporan atau melakukan voting, ini hampir selalu masalah RLS atau otentikasi.
    *   Pastikan pengguna sudah **login**.
    *   Periksa kembali kebijakan RLS di **Supabase > Auth > Policies**. Pastikan kebijakan `INSERT` untuk `reports` dan `votes` aktif untuk peran `authenticated`.
    *   Pastikan `handle_new_user` trigger berfungsi dan membuat entri di tabel `profiles` saat pengguna baru mendaftar.
