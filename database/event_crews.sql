-- Table: event_crews
-- Menyimpan data crew yang terlibat dalam event
CREATE TABLE IF NOT EXISTS event_crews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('photographer', 'organizer', 'admin', 'volunteer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(event_id, user_id, role)
);

-- Indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_event_crews_event_id ON event_crews(event_id);
CREATE INDEX IF NOT EXISTS idx_event_crews_user_id ON event_crews(user_id);
CREATE INDEX IF NOT EXISTS idx_event_crews_role ON event_crews(role);

-- Enable RLS
ALTER TABLE event_crews ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view crews where they are a member
CREATE POLICY "Users can view event crews where they are members"
  ON event_crews FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM event_crews ec
      WHERE ec.event_id = event_crews.event_id
      AND ec.user_id = auth.uid()
    )
  );

-- Policy: Only organizers and admins can insert crews
CREATE POLICY "Organizers can add event crews"
  ON event_crews FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM event_crews
      WHERE event_id = event_crews.event_id
      AND user_id = auth.uid()
      AND role IN ('organizer', 'admin')
    )
  );

-- Trigger untuk auto-update updated_at
CREATE TRIGGER update_event_crews_updated_at
  BEFORE UPDATE ON event_crews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Example: Insert sample data (uncomment and modify as needed)
-- INSERT INTO event_crews (event_id, user_id, role) VALUES
-- ('event-uuid-here', 'user-uuid-here', 'photographer'),
-- ('event-uuid-here', 'user-uuid-here', 'organizer');
