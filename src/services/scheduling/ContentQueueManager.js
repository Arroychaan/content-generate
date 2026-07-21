import { supabaseAdmin } from '../../lib/supabase';

export async function checkNextContentType() {
  // Query the last 2 published or ready drafts to determine the 2:1 ratio (2 Text : 1 Image)
  const { data, error } = await supabaseAdmin
    .from('content_drafts_registry')
    .select('content_type')
    .order('created_at', { ascending: false })
    .limit(2);

  // Jika data kurang dari 2, mulai dengan IMAGE
  if (error || !data || data.length === 0) {
    return 'IMAGE'; // Default start
  }

  // Jika konten terakhir adalah TEXT_ONLY, 2 konten berikutnya wajib IMAGE
  if (data[0].content_type === 'TEXT_ONLY') {
    return 'IMAGE';
  }
  
  // Jika konten terakhir IMAGE, cek konten sebelumnya
  if (data[0].content_type === 'IMAGE' && data.length > 1 && data[1].content_type === 'TEXT_ONLY') {
    return 'IMAGE';
  }

  // Jika dua konten terakhir sudah IMAGE, maka giliran TEXT_ONLY (X/Threads)
  return 'TEXT_ONLY';
}
