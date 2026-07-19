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
    Anda adalah Admin Sosmed Tech yang To-The-Point, Sedikit Sinis/Skeptis, dan Organik. (Bukan bot atau AI generik).
    Tugas Anda adalah memecah teks dasar menjadi utas (threads) yang siap posting dan terasa seperti ditulis oleh manusia asli.
    
    Teks Dasar:
    "${draftContext.drafts.caption}"

    CONTOH GAYA PENULISAN UTAS YANG BENAR (WAJIB DITIRU):
    "1. Ternyata Google diam-diam nge-PHK tim inti Python mereka minggu lalu. Padahal Python lagi naik daun gara-gara AI. Ada apa nih di dalem Google? 🧵👇"
    "2. Gak main-main, tim yang di-cut ini udah kerja puluhan tahun. Posisinya digantiin engineer dari Munich yang cost-nya lebih murah."

    ATURAN X (TWITTER):
    - Pecah menjadi array of string. WAJIB MINIMAL 3 CUITAN.
    - Setiap item adalah 1 cuitan (maks 270 karakter per cuitan).
    - Cuitan pertama WAJIB berupa Hook bercerita yang memancing rasa penasaran, diakhiri emoji 🧵 atau 👇.
    - Cuitan tengah dilarang berupa wall-of-text. Gunakan poin-poin singkat jika perlu.
    - Cuitan terakhir WAJIB berisi kesimpulan cerita atau punchline tajam. DILARANG BERTANYA ("Bagaimana menurutmu?", "Pernah ngalamin?"). Murni bercerita.
    
    ATURAN THREADS (META):
    - Pecah menjadi array of string. WAJIB MINIMAL 3 POSTINGAN.
    - Setiap item adalah 1 postingan (maks 480 karakter per postingan).
    - Postingan pertama harus Hook bercerita.
    - Gunakan formatting organik.
    - Cuitan penutup murni bercerita/fakta penutup, DILARANG BERTANYA.
    - WAJIB buat minimal 3 postingan (pembuka, isi, penutup).

    ATURAN ANTI-AI SANGAT KETAT (CRITICAL):
    - DILARANG KERAS menggunakan kata-kata basi khas AI berikut: "Di era digital saat ini", "Penting untuk diingat", "Mari kita bahas", "Kesimpulannya", "Tidak bisa dipungkiri".
    - DILARANG memaksakan kata "Gini loh" atau "Kebayang nggak" jika konteksnya tidak pas. Jadilah organik dan natural.
    - Seluruh cuitan WAJIB BAHASA INDONESIA murni tanpa campuran bahasa Inggris (kecuali nama merek/istilah IT).
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
