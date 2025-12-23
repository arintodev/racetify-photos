-- Migration: Add photos and photo_bibs tables
-- This migration creates the photos table (replacing photo_jobs as main photo storage)
-- and photo_bibs table for bib number tagging

-- 1. Create photos table (similar to photo_jobs but more flexible)
CREATE TABLE IF NOT EXISTS photos (
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

-- 2. Create photo_bibs table for bib number associations
CREATE TABLE IF NOT EXISTS photo_bibs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  bib_number TEXT NOT NULL,
  confidence DECIMAL(3,2), -- Optional: confidence score dari AI detection (0.00-1.00)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_photos_event_id ON photos(event_id);
CREATE INDEX IF NOT EXISTS idx_photos_photographer_id ON photos(photographer_id);
CREATE INDEX IF NOT EXISTS idx_photos_location_id ON photos(location_id);
CREATE INDEX IF NOT EXISTS idx_photos_status ON photos(status);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_photo_bibs_photo_id ON photo_bibs(photo_id);
CREATE INDEX IF NOT EXISTS idx_photo_bibs_bib_number ON photo_bibs(bib_number);

-- 4. Enable RLS for photos
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_bibs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for photos

-- Photographers can view their own photos
CREATE POLICY "Photographers can view their own photos"
  ON photos FOR SELECT
  TO authenticated
  USING (auth.uid() = photographer_id);

-- Photographers can insert their own photos
CREATE POLICY "Photographers can insert their own photos"
  ON photos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = photographer_id);

-- Photographers can update their own photos
CREATE POLICY "Photographers can update their own photos"
  ON photos FOR UPDATE
  TO authenticated
  USING (auth.uid() = photographer_id);

-- Public can view completed photos (for public search)
CREATE POLICY "Public can view completed photos"
  ON photos FOR SELECT
  TO anon
  USING (status = 'completed');

-- 6. RLS Policies for photo_bibs

-- Photographers can view bibs for their own photos
CREATE POLICY "Photographers can view bibs for their photos"
  ON photo_bibs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM photos
      WHERE photos.id = photo_bibs.photo_id
      AND photos.photographer_id = auth.uid()
    )
  );

-- Photographers can insert bibs for their own photos
CREATE POLICY "Photographers can insert bibs for their photos"
  ON photo_bibs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM photos
      WHERE photos.id = photo_bibs.photo_id
      AND photos.photographer_id = auth.uid()
    )
  );

-- Photographers can update bibs for their own photos
CREATE POLICY "Photographers can update bibs for their photos"
  ON photo_bibs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM photos
      WHERE photos.id = photo_bibs.photo_id
      AND photos.photographer_id = auth.uid()
    )
  );

-- Photographers can delete bibs for their own photos
CREATE POLICY "Photographers can delete bibs for their photos"
  ON photo_bibs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM photos
      WHERE photos.id = photo_bibs.photo_id
      AND photos.photographer_id = auth.uid()
    )
  );

-- Public can view bibs for completed photos
CREATE POLICY "Public can view bibs for completed photos"
  ON photo_bibs FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM photos
      WHERE photos.id = photo_bibs.photo_id
      AND photos.status = 'completed'
    )
  );

-- 7. Create triggers for auto-update updated_at
CREATE TRIGGER update_photos_updated_at
  BEFORE UPDATE ON photos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_photo_bibs_updated_at
  BEFORE UPDATE ON photo_bibs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8. Optional: Migrate data from photo_jobs to photos (if needed)
-- Uncomment if you want to migrate existing data:
/*
INSERT INTO photos (
  id, event_id, photographer_id, photo_path, location_id, 
  status, error_message, processed_at, created_at, updated_at
)
SELECT 
  id, event_id, photographer_id, photo_path, location_id,
  status, error_message, processed_at, created_at, updated_at
FROM photo_jobs
ON CONFLICT (id) DO NOTHING;
*/

-- 9. Sample data for testing (optional - uncomment to use)
/*
-- Insert sample bib numbers for testing
-- Replace 'your-photo-id-here' with actual photo IDs from your photos table
INSERT INTO photo_bibs (photo_id, bib_number, confidence) VALUES
('your-photo-id-here', '1234', 0.95),
('your-photo-id-here', '5678', 0.92);
*/
