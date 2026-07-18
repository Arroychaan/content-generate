import { generateTextWithRotation } from '../services/llm/TokenRotator';
import { withExponentialBackoff } from '../services/resilience/ExponentialBackoff';
import { generateThreadsForPlatforms } from '../services/content/ThreadGenerator';

export async function execute(draftContext = {}) {
  console.log('Executing 12_CrossPlatformAdapter...');
  
  const { drafts, topic } = draftContext;
  
  // Platform Variants Base
  const platformVariants = {
    instagram: drafts.caption,
    x: { posts: [] },
    threads: { posts: [] }
  };

  try {
    const prompt = `
    Anda adalah Ahli Strategi Media Sosial (CrossPlatformAdapter).
    Tugas Anda adalah memecah teks dasar menjadi utas (threads) yang siap posting.
    
    Teks Dasar:
    "${draftContext.drafts.caption}"

    ATURAN X (TWITTER):
    - Pecah menjadi array of string.
    - Setiap item adalah 1 cuitan (maks 270 karakter per cuitan).
    - Cuitan pertama harus berupa Hook/Clickbait yang memancing rasa penasaran.
    - WAJIB 100% BAHASA INDONESIA. Jika ada istilah teknis, jelaskan secara singkat.
    - Bahasa harus enak dibaca, berbobot, dan mudah dipahami.
    
    ATURAN THREADS (META):
    - Pecah menjadi array of string.
    - Setiap item adalah 1 postingan (maks 480 karakter per postingan).
    - Postingan pertama harus Hook.
    - Gunakan formatting kasual tapi informatif.
    - WAJIB 100% BAHASA INDONESIA. Jelaskan istilah teknis dengan sederhana.
    - Bahasa harus enak dibaca, berbobot, dan mudah dipahami.

    ATURAN SANGAT KETAT:
    - Seluruh cuitan WAJIB BAHASA INDONESIA murni, meskipun berita asli dari luar negeri.
    - Jangan pernah mengubah FAKTA dari teks dasar.`;

    const threadData = await generateThreadsForPlatforms(topic, drafts, prompt);
    platformVariants.x = { posts: threadData.x };
    platformVariants.threads = { posts: threadData.threads };
    console.log(`CrossPlatformAdapter berhasil menyusun varian platform.`);
  } catch (e) {
    console.warn('Thread generator gagal, menggunakan fallback ringan.', e.message);
    const fallbackX = drafts.title + '\n\n' + drafts.caption.substring(0, 200) + '...\n\nBaca selengkapnya di utas berikut.';
    platformVariants.x = { posts: [fallbackX] };
    platformVariants.threads = { posts: [fallbackX] };
  }

  return platformVariants;
}
