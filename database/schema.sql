-- SQL Schema untuk Racetify Photos

-- Table: events
-- Menyimpan data event lari
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: photo_locations
-- Menyimpan lokasi-lokasi foto dalam event
CREATE TABLE IF NOT EXISTS photo_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: photo_jobs
-- Queue untuk processing foto dengan AI (YOLO)
CREATE TABLE IF NOT EXISTS photo_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  photographer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  photo_path TEXT NOT NULL,
  location_id UUID REFERENCES photo_locations(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_photo_jobs_status ON photo_jobs(status);
CREATE INDEX IF NOT EXISTS idx_photo_jobs_event_id ON photo_jobs(event_id);
CREATE INDEX IF NOT EXISTS idx_photo_jobs_photographer_id ON photo_jobs(photographer_id);
CREATE INDEX IF NOT EXISTS idx_photo_jobs_created_at ON photo_jobs(created_at DESC);

-- RLS (Row Level Security) Policies
-- Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Events dapat dibaca oleh authenticated users
CREATE POLICY "Events are viewable by authenticated users"
  ON events FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Photo locations dapat dibaca oleh authenticated users
CREATE POLICY "Photo locations are viewable by authenticated users"
  ON photo_locations FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Photo jobs dapat dibaca oleh photographer yang membuat atau admin
CREATE POLICY "Users can view their own photo jobs"
  ON photo_jobs FOR SELECT
  TO authenticated
  USING (auth.uid() = photographer_id);

-- Policy: Photo jobs dapat dibuat oleh photographer
CREATE POLICY "Photographers can insert their own photo jobs"
  ON photo_jobs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = photographer_id);

-- Policy: Photo jobs dapat diupdate oleh photographer atau system
CREATE POLICY "Photographers can update their own photo jobs"
  ON photo_jobs FOR UPDATE
  TO authenticated
  USING (auth.uid() = photographer_id);

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers untuk auto-update updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photo_locations_updated_at
  BEFORE UPDATE ON photo_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photo_jobs_updated_at
  BEFORE UPDATE ON photo_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Storage Bucket Configuration
-- Jalankan di Supabase Dashboard > Storage > Create Bucket
-- Bucket name: event-photos
-- Public: false (private untuk keamanan)
-- File size limit: 10MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- Storage Policies (jalankan di Supabase Dashboard > Storage > Policies)
-- 1. Photographers can upload to their own folder
-- INSERT policy:
-- CREATE POLICY "Photographers can upload photos"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (
--     bucket_id = 'event-photos' AND
--     (storage.foldername(name))[2] = auth.uid()::text
--   );

-- 2. Photographers can read their own photos
-- SELECT policy:
-- CREATE POLICY "Photographers can view their photos"
--   ON storage.objects FOR SELECT
--   TO authenticated
--   USING (
--     bucket_id = 'event-photos' AND
--     (storage.foldername(name))[2] = auth.uid()::text
--   );

-- 3. Photographers can delete their own photos
-- DELETE policy:
-- CREATE POLICY "Photographers can delete their photos"
--   ON storage.objects FOR DELETE
--   TO authenticated
--   USING (
--     bucket_id = 'event-photos' AND
--     (storage.foldername(name))[2] = auth.uid()::text
--   );
