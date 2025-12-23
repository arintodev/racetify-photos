/**
 * SETUP INSTRUCTIONS
 * 
 * File ini berisi instruksi setup untuk Supabase Storage Policies.
 * Jalankan script ini di Supabase Dashboard > Storage > Policies
 */

-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================

-- 1. Buat bucket "event-photos" di Supabase Dashboard > Storage
--    Settings:
--    - Name: event-photos
--    - Public: false (private)
--    - File size limit: 10MB
--    - Allowed MIME types: image/jpeg, image/png, image/webp

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Policy 1: Photographers dapat upload foto ke folder mereka sendiri
-- Path structure: event_{event_id}/{photographer_id}/{filename}
CREATE POLICY "Photographers can upload to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-photos' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 2: Photographers dapat melihat foto di folder mereka sendiri
CREATE POLICY "Photographers can view their photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'event-photos' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 3: Photographers dapat menghapus foto di folder mereka sendiri
CREATE POLICY "Photographers can delete their photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-photos' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy 4: Photographers dapat update foto di folder mereka sendiri
CREATE POLICY "Photographers can update their photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-photos' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- ============================================
-- OPTIONAL: Admin policies
-- ============================================

-- Jika Anda memiliki role admin, tambahkan policy ini
-- Uncomment jika diperlukan

-- CREATE POLICY "Admins have full access"
-- ON storage.objects
-- FOR ALL
-- TO authenticated
-- USING (
--   bucket_id = 'event-photos' AND
--   auth.jwt() ->> 'role' = 'admin'
-- );

-- ============================================
-- TESTING
-- ============================================

-- Test upload dari aplikasi:
-- 1. Login sebagai photographer
-- 2. Pilih event
-- 3. Upload foto
-- 4. Verify di Storage > event-photos

-- Test security:
-- 1. Login sebagai photographer A
-- 2. Coba akses foto photographer B (harus gagal)
-- 3. Coba upload ke folder photographer B (harus gagal)
