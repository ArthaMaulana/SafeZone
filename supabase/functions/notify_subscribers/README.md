# Edge Function: `notify_subscribers`

Fungsi ini dipicu setelah sebuah laporan baru dibuat untuk memberitahu pengguna yang berlangganan pada area tersebut.

## Cara Deploy

1.  **Pastikan Anda sudah login ke Supabase CLI:**

    ```bash
    supabase login
    ```

2.  **Hubungkan direktori lokal dengan proyek Supabase Anda:**

    ```bash
    supabase link --project-ref <YOUR-PROJECT-ID>
    ```

3.  **Set variabel environment yang dibutuhkan:**

    Fungsi ini memerlukan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`. Kunci ini bersifat rahasia dan tidak boleh diekspos di sisi klien.

    ```bash
    supabase secrets set SUPABASE_URL=https://<your-project-ref>.supabase.co
    supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
    ```

4.  **Deploy fungsi:**

    ```bash
    supabase functions deploy notify_subscribers --no-verify-jwt
    ```

    Flag `--no-verify-jwt` digunakan karena fungsi ini akan dipanggil dari server lain (misalnya, dari trigger database atau *webhook*) dan tidak memerlukan JWT pengguna. Jika Anda ingin melindunginya, gunakan *function secret*.

## Cara Memanggil (Invoke)

Anda bisa memanggil fungsi ini menggunakan Supabase client dari sisi server atau melalui `curl`:

```bash
curl -X POST 'https://<your-project-ref>.supabase.co/functions/v1/notify_subscribers' \
  -H 'Authorization: Bearer <SUPABASE_ANON_KEY>' \
  -H 'Content-Type: application/json' \
  -d '{"report_id": 123}'
```
