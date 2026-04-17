-- SQL Migration for VoxAssist (HIPAA Hardened)

-- 1. Recordings Table
CREATE TABLE recordings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  external_id TEXT UNIQUE, -- Compatibility with existing ID system
  title TEXT NOT NULL,
  patient_name TEXT,
  doctor_name TEXT,
  medical_specialty TEXT,
  date DATE NOT NULL,
  status TEXT NOT NULL,
  audio_file_name TEXT,
  audio_storage_key TEXT,
  audio_mime_type TEXT,
  duration INTEGER,
  transcript TEXT,
  report JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Row Level Security (RLS)
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can view their own recordings" ON recordings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Doctors can insert their own recordings" ON recordings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can update their own recordings" ON recordings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Doctors can delete their own recordings" ON recordings
  FOR DELETE USING (auth.uid() = user_id);
