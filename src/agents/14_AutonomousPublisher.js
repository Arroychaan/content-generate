import { publishToInstagram } from '../services/social/InstagramGraphClient.js';
import { supabaseAdmin } from '../lib/supabase.js';

export async function execute(draftContext = {}) {
  console.log('Executing 14_AutonomousPublisher...');

  const isAutoPostEnabled = process.env.AUTO_POST_INSTAGRAM === 'true';
  
  if (!isAutoPostEnabled) {
    console.log('AUTO_POST_INSTAGRAM tidak aktif. Melewati proses auto-publish.');
    return { published: false, reason: 'DISABLED' };
  }

  const { dbRecordId, drafts, imageR2Url } = draftContext;

  if (!dbRecordId || !imageR2Url || !drafts?.caption) {
    throw new Error('Data tidak lengkap (dbRecordId, imageR2Url, caption) untuk auto-publish.');
  }

  try {
    // Jalankan publikasi ke IG
    const postId = await publishToInstagram(imageR2Url, drafts.caption);

    // Update status di database menjadi PUBLISHED
    const { error } = await supabaseAdmin
      .from('content_drafts_registry')
      .update({ status: 'PUBLISHED', published_at: new Date().toISOString() })
      .eq('id', dbRecordId);

    if (error) {
      console.warn(`Post berhasil di-publish ke IG (ID: ${postId}) tapi gagal update status di Supabase:`, error);
    } else {
      console.log(`Status draf ${dbRecordId} berhasil diubah menjadi PUBLISHED.`);
    }

    return { published: true, platform: 'instagram', postId };
  } catch (err) {
    console.error('AutonomousPublisher gagal:', err);
    throw new Error(`Gagal mempublikasikan secara otomatis: ${err.message}`);
  }
}
