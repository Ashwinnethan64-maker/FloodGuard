import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[NEERPATH Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY is not configured. Realtime/Auth will run in local fallback mode.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

/**
 * Upload an incident photograph directly to Supabase Storage 'incident-photos'
 * Returns the public URL if successful, or null on failure.
 */
export async function uploadIncidentPhoto(file: File): Promise<string | null> {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[NEERPATH Supabase] Storage not available, using backend upload fallback');
    return null;
  }

  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `reports/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('incident-photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('[NEERPATH Supabase] Upload error:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from('incident-photos').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (err) {
    console.error('[NEERPATH Supabase] Unexpected upload error:', err);
    return null;
  }
}

