import { supabaseAdmin } from '../lib/supabase';

export async function execute(scoredTopics = [], batchSize = 3) {
  console.log('Executing 04_TopicSelector...');
  
  if (!scoredTopics || scoredTopics.length === 0) return [];

  // Urutkan berdasarkan skor tertinggi
  const sortedTopics = scoredTopics.sort((a, b) => b.quality_score - a.quality_score);
  
  const selectedTopics = [];
  
  for (const topic of sortedTopics) {
    if (selectedTopics.length >= batchSize) break;

    // Cek di database apakah topik dengan judul serupa sudah pernah diproses hari ini
    // Untuk menghindari spamming topik yang sama dalam 24 jam
    try {
      const { data, error } = await supabaseAdmin
        .from('content_drafts_registry')
        .select('id')
        .eq('topic_title', topic.title)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (!error && (!data || data.length === 0)) {
        selectedTopics.push(topic);
      }
    } catch (e) {
      console.warn('Gagal memeriksa duplikasi historis di Supabase', e.message);
      // Fallback: tetap proses jika Supabase error parsial
      selectedTopics.push(topic);
    }
  }

  console.log(`TopicSelector selesai. Terpilih ${selectedTopics.length} topik untuk diteruskan ke Pipeline inti.`);
  return selectedTopics;
}
