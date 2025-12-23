/**
 * QUICK START GUIDE
 * 
 * Panduan cepat untuk memulai development
 */

# ==========================================
# QUICK START - RACETIFY PHOTOS
# ==========================================

## 1. Install Dependencies
npm install

## 2. Setup Environment Variables
# Copy .env.example ke .env
cp .env.example .env

# Edit .env dan isi dengan credentials Supabase Anda:
# SUPABASE_URL=https://xxxxx.supabase.co
# SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

## 3. Setup Database
# Buka Supabase Dashboard > SQL Editor
# Copy paste isi dari database/schema.sql
# Execute query

## 4. Setup Storage
# Buka Supabase Dashboard > Storage
# Create new bucket: "event-photos" (private)
# Copy paste isi dari database/storage-policies.sql ke SQL Editor
# Execute query

## 5. Setup Authentication
# Buka Supabase Dashboard > Authentication > Providers
# Enable provider yang Anda inginkan (Google, Email, etc.)
# Set redirect URL:
#   - Development: http://localhost:3000/upload
#   - Production: https://yourdomain.com/upload

## 6. Create Sample Data (Optional)
# Di SQL Editor, jalankan database/seed.sql

## 7. Create Photographer User
# Buka Authentication > Users > Invite User
# Masukkan email photographer
# Photographer akan menerima email untuk set password

## 8. Run Development Server
npm run dev

## 9. Test Upload
# Buka http://localhost:3000/login
# Login dengan photographer account
# Upload foto dan lihat progress

# ==========================================
# TROUBLESHOOTING
# ==========================================

## Error: "No active session"
# - Pastikan sudah login
# - Cek redirect URL di Supabase Auth settings
# - Clear browser cookies dan login ulang

## Error: "Failed to upload photo"
# - Cek Storage bucket name: harus "event-photos"
# - Verify Storage policies sudah dibuat
# - Cek file size (max 10MB)
# - Cek MIME type (harus image/jpeg, image/png, atau image/webp)

## Error: "Failed to create job"
# - Verify table photo_jobs sudah dibuat
# - Cek RLS policies
# - Verify event_id valid (event exists)

## Error: "Unauthorized"
# - Verify environment variables (.env) sudah benar
# - Cek token di browser DevTools > Network tab
# - Pastikan RLS policies sudah di-enable

# ==========================================
# NEXT STEPS
# ==========================================

1. Customize UI sesuai brand Anda
2. Tambah toast notifications untuk better UX
3. Implement image preview sebelum upload
4. Tambah filter/sort untuk events
5. Buat dashboard untuk melihat upload history
6. Setup worker untuk AI processing (YOLO)

# ==========================================
# PRODUCTION CHECKLIST
# ==========================================

☐ Update environment variables di hosting platform
☐ Update redirect URLs di Supabase Auth
☐ Enable RLS policies di production database
☐ Setup storage policies di production
☐ Test upload flow di production
☐ Setup monitoring (Sentry, LogRocket, etc.)
☐ Setup error tracking
☐ Setup analytics
☐ Create backup strategy
☐ Document API for AI worker team
