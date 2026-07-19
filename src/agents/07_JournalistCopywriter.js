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
    1. Judul Utama (title): Maks 60 karakter, punchy, memancing perhatian. WAJIB BAHASA INDONESIA.
    2. Subjudul (subtitle): Maks 90 karakter, pelengkap judul, memberikan konteks. WAJIB BAHASA INDONESIA.
    3. Teks Gambar (image_text): MINIMAL 70 KARAKTER dan MAKSIMAL 100 KARAKTER. WAJIB BAHASA INDONESIA. Ini akan dicetak melayang di atas gambar. Rangkum inti berita dengan gaya bahasa simpel/kasual ala media anak muda masa kini.
    4. Caption (caption): Naskah berita gaya piramida terbalik. Panjang 3-4 paragraf. WAJIB BAHASA INDONESIA. Naskah harus sangat enak dibaca, berbobot, dan mudah dipahami. Jika ada istilah teknis atau bahasa asing, WAJIB jelaskan artinya dengan bahasa yang sangat sederhana.
    5. Kata Kunci Visual (visual_keywords): 3 kata kunci BAHASA INGGRIS. Kata kunci PERTAMA WAJIB merupakan entitas utama/subjek spesifik dari berita (misal: "Amazon logo", "Elon Musk", "Apple iPhone", "Delivery box"). Kata kunci kedua dan ketiga boleh menggunakan "aesthetic" atau "minimalist". Ini sangat penting agar gambar yang muncul relevan dan tidak melenceng.

    ATURAN SANGAT KETAT (CRITICAL): 
    - SELURUH OUTPUT (kecuali visual_keywords) WAJIB 100% BAHASA INDONESIA MESKIPUN SUMBER BERITA DARI LUAR NEGERI. Jangan gunakan bahasa campuran.
    - DILARANG KERAS BERHALUSINASI! Anda HANYA boleh menuliskan fakta yang secara eksplisit ada di dalam teks riset mentah.
    - DILARANG menambahkan kutipan palsu, angka, statistik, atau nama entitas yang tidak disebutkan di dalam riset.
    - Jika teks riset ambigu, gunakan bahasa netral tanpa menebak-nebak detailnya. Pelanggaran terhadap aturan ini akan membuat sistem QA GAGAL!

    Format balasan WAJIB dalam bentuk JSON murni seperti ini (tanpa backticks markdown):
    {
      "title": "...",
      "subtitle": "...",
      "image_text": "...",
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
      image_text: topic.title.substring(0, 70),
      caption: researchData || topic.combined_description || "Informasi lebih lanjut belum tersedia saat ini.",
      visual_keywords: ["news", "breaking", "update"]
    };
  }
}
