import { Recording } from "./types";
import { getSupabase } from "./supabase";

export async function getAllRecordings(): Promise<Recording[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('recordings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Supabase Error:", error);
    return [];
  }

  return (data || []).map(mapSupabaseRecording);
}

export async function getRecordingById(id: string): Promise<Recording | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('recordings')
    .select('*')
    .eq('external_id', id)
    .single();

  if (error) {
    console.error("Supabase Error:", error);
    return null;
  }

  return data ? mapSupabaseRecording(data) : null;
}

export async function searchRecordings(params: {
  patientName?: string;
  doctorName?: string;
  query?: string;
  limit?: number;
}): Promise<Recording[]> {
  const supabase = getSupabase();
  let query = supabase.from('recordings').select('*');

  if (params.patientName) {
    query = query.ilike('patient_name', `%${params.patientName}%`);
  }
  if (params.doctorName) {
    query = query.ilike('doctor_name', `%${params.doctorName}%`);
  }
  if (params.query) {
    // Basic text search on title and transcript
    query = query.or(`title.ilike.%${params.query}%,transcript.ilike.%${params.query}%`);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(params.limit || 5);

  if (error) {
    console.error("Supabase Search Error:", error);
    return [];
  }

  return (data || []).map(mapSupabaseRecording);
}

export async function saveRecording(recording: Recording): Promise<void> {
  const supabase = getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  
  const payload = {
    external_id: recording.id,
    title: recording.title,
    patient_name: recording.patientName,
    doctor_name: recording.doctorName,
    medical_specialty: recording.medicalSpecialty,
    date: recording.date,
    status: recording.status,
    audio_file_name: recording.audioFileName,
    audio_storage_key: recording.audioStorageKey,
    audio_mime_type: recording.audioMimeType,
    duration: recording.duration,
    transcript: recording.transcript,
    report: recording.report as any,
    error_message: recording.errorMessage,
    updated_at: new Date().toISOString(),
    user_id: recording.userId || session?.user.id // Prefer explicitly provided userId
  };

  const { error } = await supabase
    .from('recordings')
    .upsert(payload, { onConflict: 'external_id' });

  if (error) {
    throw new Error(`Failed to save recording to Supabase: ${error.message}`);
  }
}

export async function deleteRecording(id: string): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('recordings')
    .delete()
    .eq('external_id', id);

  return !error;
}

function mapSupabaseRecording(raw: any): Recording {
  return {
    id: raw.external_id,
    userId: raw.user_id,
    title: raw.title,
    patientName: raw.patient_name,
    doctorName: raw.doctor_name,
    medicalSpecialty: raw.medical_specialty,
    date: raw.date,
    status: raw.status,
    audioFileName: raw.audio_file_name,
    audioStorageKey: raw.audio_storage_key,
    audioMimeType: raw.audio_mime_type,
    duration: raw.duration,
    transcript: raw.transcript,
    report: raw.report,
    errorMessage: raw.error_message,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at
  };
}
