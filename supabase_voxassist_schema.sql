-- SQL Migration for VoxAssist (HIPAA Hardened)

-- 1. Recordings Table
CREATE TABLE IF NOT EXISTS recordings (
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

-- 2. Report Templates Table
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE, -- NULL for global defaults
  name TEXT NOT NULL,
  fields TEXT[] NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Row Level Security (RLS)
ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

-- Recordings Policies
CREATE POLICY "Doctors can view their own recordings" ON recordings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Doctors can insert their own recordings" ON recordings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can update their own recordings" ON recordings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Doctors can delete their own recordings" ON recordings
  FOR DELETE USING (auth.uid() = user_id);

-- Report Templates Policies
CREATE POLICY "Anyone can view global default templates" ON report_templates
  FOR SELECT USING (user_id IS NULL AND is_default = true);

CREATE POLICY "Doctors can view their own templates" ON report_templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Doctors can insert their own templates" ON report_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Doctors can update their own templates" ON report_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Doctors can delete their own templates" ON report_templates
  FOR DELETE USING (auth.uid() = user_id);
