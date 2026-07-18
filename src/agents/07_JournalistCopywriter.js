import { generateTextWithRotation } from '../services/llm/TokenRotator';
import { withExponentialBackoff } from '../services/resilience/ExponentialBackoff';

export async function execute(draftContext = {}) {
  console.log('Executing 07_JournalistCopywriter...');
  
  const { topic, researchData, angle, qaFeedback } = draftContext;

  const prompt = `
    Anda adalah Jurnalis Senior dan Copywriter Profesional.
    Tugas: Tulis berita berdasarkan data berikut.
    
    Data Topik: ${topic.title}
    Riset: ${researchData}
    Angle Berita: ${angle}
    ${qaFeedback ? `PERHATIAN (Revisi dari QA): ${qaFeedback}` : ''}
    
    Instruksi:
    1. Judul Utama (title): Maks 60 karakter, punchy, memancing perhatian. Terjemahkan ke Bahasa Indonesia.
    2. Subjudul (subtitle): Maks 90 karakter, pelengkap judul, memberikan konteks. Terjemahkan ke Bahasa Indonesia.
    3. Caption (caption): Naskah berita gaya piramida terbalik. Panjang 3-4 paragraf. WAJIB DITULIS DALAM BAHASA INDONESIA baku namun mengalir. Jangan gunakan kata-kata AI generatif (seperti "Menariknya", "Kesimpulannya").
    4. Kata Kunci Visual (visual_keywords): 3 kata kunci BAHASA INGGRIS untuk mencari gambar stok HD (misal: "technology", "circuit", "smartphone").

    ATURAN SANGAT KETAT (CRITICAL): 
    - DILARANG KERAS BERHALUSINASI! Anda HANYA boleh menuliskan fakta yang secara eksplisit ada di dalam teks riset mentah.
    - DILARANG menambahkan kutipan palsu, angka, statistik, atau nama entitas yang tidak disebutkan di dalam riset.
    - Jika teks riset ambigu, gunakan bahasa netral tanpa menebak-nebak detailnya. Pelanggaran terhadap aturan ini akan membuat sistem QA GAGAL!

    Format balasan WAJIB dalam bentuk JSON murni seperti ini (tanpa backticks markdown):
    {
      "title": "...",
      "subtitle": "...",
      "caption": "...",
      "visual_keywords": ["keyword1", "keyword2", "keyword3"]
    }
  `;

  try {
    const jsonString = await withExponentialBackoff(
      () => generateTextWithRotation(prompt, 'llama-3.3-70b-versatile', 2000)
    );
    
    // Membersihkan markdown JSON jika model tetap menambahkannya
    const cleanJsonStr = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    const drafts = JSON.parse(cleanJsonStr);
    
    console.log(`Copywriter berhasil menyusun naskah untuk: ${drafts.title}`);
    return drafts;
  } catch (e) {
    console.warn('Gagal memproses JSON dari Copywriter, fallback menggunakan data awal.', e.message);
    return {
      title: topic.title,
      subtitle: "Berita Terkini",
      caption: researchData || topic.combined_description || "Informasi lebih lanjut belum tersedia saat ini.",
      visual_keywords: ["news", "breaking", "update"]
    };
  }
}
