import { generateTextWithRotation } from '../services/llm/TokenRotator';
import { withExponentialBackoff } from '../services/resilience/ExponentialBackoff';
import { generateDeepThread } from '../services/content/ThreadGenerator';

export async function execute(draftContext = {}) {
  console.log('Executing 12_CrossPlatformAdapter...');
  
  const { drafts, topic } = draftContext;
  
  // Platform Variants Base
  const platformVariants = {
    instagram: drafts.caption,
    facebook: drafts.caption,
    x: ''
  };

  try {
    // Menghasilkan Deep Thread untuk X (Twitter) jika berita dinilai cukup kompleks
    // Kita gunakan fallback sederhana jika ThreadGenerator gagal
    const threadData = await generateDeepThread(topic, drafts);
    platformVariants.x = threadData;
    console.log(`CrossPlatformAdapter berhasil menyusun varian platform.`);
  } catch (e) {
    console.warn('Thread generator gagal, menggunakan fallback X ringan.', e.message);
    const fallbackX = drafts.title + '\n\n' + drafts.caption.substring(0, 200) + '...\n\nBaca selengkapnya di utas berikut.';
    platformVariants.x = { posts: [fallbackX] };
  }

  return platformVariants;
}
