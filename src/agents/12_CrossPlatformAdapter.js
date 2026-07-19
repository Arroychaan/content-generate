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
    - Pecah menjadi array of string. WAJIB MINIMAL 3 CUITAN.
    - Setiap item adalah 1 cuitan (maks 270 karakter per cuitan).
    - Cuitan pertama WAJIB berupa Hook yang memancing rasa penasaran, diakhiri dengan emoji benang 🧵 atau 👇.
    - Cuitan tengah dilarang berupa wall-of-text. Gunakan poin-poin (bullet points) singkat dan spasi antar kalimat agar mudah dibaca cepat.
    - Cuitan terakhir WAJIB berisi opini singkat atau pertanyaan memancing diskusi (Call to Action/Discussion).
    - Gaya bahasa: KASUAL & TAJAM (seperti Folkative / USS Feed, gunakan "Gini loh..", "Kebayang nggak?", "Gokil!"). WAJIB 100% BAHASA INDONESIA. Jelaskan istilah teknis dengan sederhana.
    
    ATURAN THREADS (META):
    - Pecah menjadi array of string. WAJIB MINIMAL 3 POSTINGAN.
    - Setiap item adalah 1 postingan (maks 480 karakter per postingan).
    - Postingan pertama harus Hook yang memancing interaksi.
    - Gunakan formatting kasual tapi informatif, banyak spasi agar enak di-skim.
    - Gaya bahasa: KASUAL & TAJAM (Folkative / USS Feed style). WAJIB 100% BAHASA INDONESIA. Jelaskan istilah teknis dengan sederhana.
    - WAJIB buat minimal 3 postingan (pembuka, isi, penutup).

    ATURAN SANGAT KETAT:
    - Seluruh cuitan WAJIB BAHASA INDONESIA murni, meskipun berita asli dari luar negeri.
    - Jangan pernah mengubah FAKTA dari teks dasar.
    - PENTING: Jika menggunakan enter/spasi kosong, pastikan Anda menuliskannya sebagai \\n di dalam format JSON.`;

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
