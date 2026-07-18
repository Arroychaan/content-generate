-- Eksekusi Prosedur Pembersihan SQL pada Supabase Database untuk Siklus TTL 3 Hari
CREATE OR REPLACE PROCEDURE execute_daily_janitor_cleanup()
LANGUAGE plpgsql AS $$
BEGIN
 -- 1. Hapus catatan log aktivitas sistem yang berumur lebih dari 3 hari
 DELETE FROM system_activity_logs WHERE timestamp < NOW() - INTERVAL '3 days';

 -- 2. Hapus draf konten lama yang berstatus 'READY' namun tidak dieksekusi pengguna dalam 3 hari
 -- Catatan: URL Berkas gambar yang terhapus akan memicu webhook penghapusan objek di Cloudflare R2
 DELETE FROM content_drafts_registry WHERE created_at < NOW() - INTERVAL '3 days' AND status = 'READY';
END;
$$;
