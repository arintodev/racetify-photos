-- Migration: Add photo_locations table and update photo_jobs
-- Jalankan script ini di Supabase SQL Editor

-- 1. Create photo_locations table
CREATE TABLE IF NOT EXISTS photo_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Add location_id column to photo_jobs (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'photo_jobs' AND column_name = 'location_id'
  ) THEN
    ALTER TABLE photo_jobs 
    ADD COLUMN location_id UUID REFERENCES photo_locations(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Enable RLS for photo_locations
ALTER TABLE photo_locations ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policy for photo_locations
CREATE POLICY "Photo locations are viewable by authenticated users"
  ON photo_locations FOR SELECT
  TO authenticated
  USING (true);

-- 5. Create trigger for auto-update updated_at
CREATE TRIGGER update_photo_locations_updated_at
  BEFORE UPDATE ON photo_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Create index for performance
CREATE INDEX IF NOT EXISTS idx_photo_locations_event_id ON photo_locations(event_id);

-- Example: Insert sample photo locations for testing
-- Uncomment and modify the event_id to match your actual event IDs
-- 
-- INSERT INTO photo_locations (event_id, name) VALUES
-- ('your-event-id-here', 'Start Line'),
-- ('your-event-id-here', 'Finish Line'),
-- ('your-event-id-here', 'Water Station 1'),
-- ('your-event-id-here', 'Water Station 2'),
-- ('your-event-id-here', 'KM 5'),
-- ('your-event-id-here', 'KM 10'),
-- ('your-event-id-here', 'Photo Booth');
