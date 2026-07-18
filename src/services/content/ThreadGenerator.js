import { generateTextWithRotation } from '../llm/TokenRotator';
import { withExponentialBackoff } from '../resilience/ExponentialBackoff';

export async function generateDeepThread(topic, drafts) {
  const prompt = `
    Anda adalah Pakar Media Sosial di platform X (Twitter).
    Tugas: Ubah berita ini menjadi utas (thread) 6 post yang menarik.
    
    Topik: ${drafts.title}
    Isi: ${drafts.caption}
    
    Instruksi:
    - Post 1: Hook yang memancing perhatian (max 250 char). Akhiri dengan 🧵👇
    - Post 2-4: Fakta inti dan data statistik (masing-masing max 250 char).
    - Post 5: Analisis dampak atau "Kenapa ini penting?" (max 250 char).
    - Post 6: CTA (Call to Action) bertanya pendapat audiens (max 250 char).
    
    Balas HANYA dengan format JSON array berisi 6 string, contoh:
    ["teks 1", "teks 2", "teks 3", "teks 4", "teks 5", "teks 6"]
  `;

  try {
    const jsonString = await withExponentialBackoff(
      () => generateTextWithRotation(prompt, 'llama3-70b-8192', 10)
    );
    
    const cleanJsonStr = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    const threadArray = JSON.parse(cleanJsonStr);
    
    if (Array.isArray(threadArray) && threadArray.length > 0) {
      return { posts: threadArray };
    }
    throw new Error('Hasil bukan array valid');
  } catch (e) {
    console.warn('Gagal generate thread via LLM, menggunakan fallback.', e.message);
    const fallbackX = drafts.title + '\\n\\n' + drafts.caption.substring(0, 200) + '...\\n\\nBaca selengkapnya di utas berikut.';
    return { posts: [fallbackX] };
  }
}
