import { generateTextWithRotation } from '../llm/TokenRotator';
import { withExponentialBackoff } from '../resilience/ExponentialBackoff';

export async function generateThreadsForPlatforms(topic, drafts, customPrompt = null) {
  const prompt = customPrompt ? customPrompt + `
    
    Balas HANYA dengan format JSON murni:
    {
      "x": ["post 1", "post 2", "post 3", "post 4"],
      "threads": ["post 1", "post 2", "post 3"]
    }
  ` : `
    Anda adalah Pakar Media Sosial.
    Tugas: Ubah berita ini menjadi 2 utas (thread) terpisah untuk platform X (Twitter) dan Threads.
    
    Topik: ${drafts.title}
    Isi: ${drafts.caption}
    
    Instruksi Utas X (SANGAT KETAT: Maksimal 280 karakter per post, DILARANG LEBIH):
    - Buat 4-5 post.
    - Post 1 wajib diakhiri 🧵👇
    - WAJIB 100% BAHASA INDONESIA. Bahasa enak dibaca, berbobot.
    
    Instruksi Utas Threads (SANGAT KETAT: Maksimal 480 karakter per post, DILARANG LEBIH):
    - Buat 3-4 post yang lebih detail dan naratif.
    - Post 1 wajib diakhiri 🧵👇
    - WAJIB 100% BAHASA INDONESIA. Bahasa enak dibaca, berbobot.
    
    Balas HANYA dengan format JSON murni:
    {
      "x": ["post 1", "post 2", "post 3", "post 4"],
      "threads": ["post 1", "post 2", "post 3"]
    }
  `;

  try {
    const jsonString = await withExponentialBackoff(
      () => generateTextWithRotation(prompt, 'llama-3.3-70b-versatile', 1500)
    );
    
    const cleanJsonStr = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanJsonStr);
    
    if (result.x && result.threads) {
      return result;
    }
    throw new Error('Hasil bukan format X dan Threads yang valid');
  } catch (e) {
    console.warn('Gagal generate thread via LLM, menggunakan fallback.', e.message);
    const fallback = drafts.title + '\\n\\n' + drafts.caption.substring(0, 200) + '...\\n\\nBaca selengkapnya di utas berikut.';
    return { x: [fallback], threads: [fallback] };
  }
}
