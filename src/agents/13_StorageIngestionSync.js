import { uploadToR2 } from '../services/storage/CloudflareR2Client';
import { supabaseAdmin } from '../lib/supabase';

export async function execute(draftContext = {}) {
  console.log('Executing 13_StorageIngestionSync...');
  
  const { topic, drafts, contentType, renderedImageBuffer, platformVariants } = draftContext;
  
  let r2Url = null;
  let r2Key = null;

  try {
    // 1. Upload ke Cloudflare R2 (jika berupa gambar)
    if (contentType === 'IMAGE' && renderedImageBuffer) {
      const fileName = `content-${Date.now()}.png`;
      const uploadResult = await uploadToR2(renderedImageBuffer, fileName);
      r2Url = uploadResult.url;
      r2Key = uploadResult.key;
      console.log(`Gambar berhasil diunggah ke R2: ${r2Url}`);
    }

    // 2. Simpan draf ke Supabase
    const { data, error } = await supabaseAdmin.from('content_drafts_registry').insert([
      {
        topic_title: drafts.title,
        source_urls: topic.source_urls,
        quality_score: topic.quality_score,
        main_caption: drafts.caption,
        thread_posts: platformVariants.x?.posts || [],
        platform_variants: platformVariants,
        image_r2_url: r2Url,
        image_r2_key: r2Key,
        content_type: contentType,
        status: 'READY'
      }
    ]).select();

    if (error) {
      throw error;
    }

    console.log(`Draf untuk "${drafts.title}" berhasil disimpan di database dan siap dipublikasikan.`);
    return { dbRecordId: data[0].id, imageR2Url: r2Url };

  } catch (e) {
    console.error('StorageIngestionSync gagal:', e);
    throw new Error(`Gagal menyimpan data akhir: ${e.message}`);
  }
}
