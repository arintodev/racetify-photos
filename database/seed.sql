-- Seed data untuk testing

-- Insert sample events
INSERT INTO events (name, date, location, description) VALUES
  ('Marathon Jakarta 2025', '2025-03-15', 'Jakarta', 'Marathon tahunan di Jakarta dengan berbagai kategori'),
  ('Borobudur Marathon', '2025-04-20', 'Magelang, Jawa Tengah', 'Marathon dengan view Candi Borobudur'),
  ('Bali Marathon', '2025-05-10', 'Bali', 'Marathon di pulau dewata dengan pemandangan pantai');

-- Catatan: Photographer users harus dibuat melalui Supabase Auth
-- Gunakan Supabase Dashboard > Authentication > Users > Create User
-- atau implementasi sign up di aplikasi
