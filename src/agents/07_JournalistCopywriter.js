import { generateTextWithRotation } from '../services/llm/TokenRotator';
import { withExponentialBackoff } from '../services/resilience/ExponentialBackoff';

export async function execute(draftContext = {}) {
  console.log('Executing 07_JournalistCopywriter...');
  
  const { topic, researchData, angle, qaFeedback } = draftContext;

  const prompt = `
    Anda adalah Admin Sosmed Tech yang To-The-Point, Sedikit Sinis/Skeptis, dan Organik. Anda menulis untuk audiens anak muda (Gen Z / Milenial).
    Tugas: Tulis naskah berita singkat berdasarkan data berikut.
    
    Data Topik: ${topic.title}
    Riset: ${researchData}
    Angle Berita: ${angle}
    ${qaFeedback ? `PERHATIAN (Revisi dari QA): ${qaFeedback}` : ''}
    
    Instruksi:
    1. Judul Utama (title): Maks 60 karakter, punchy, memancing perhatian. WAJIB BAHASA INDONESIA.
    2. Subjudul (subtitle): Maks 90 karakter, pelengkap judul, memberikan konteks. WAJIB BAHASA INDONESIA.
    3. Teks Gambar (image_text): MINIMAL 80 KARAKTER dan MAKSIMAL 110 KARAKTER. WAJIB BAHASA INDONESIA. Ini akan dicetak melayang di atas gambar. Rangkum inti berita dengan gaya bahasa kasual.
    4. Caption (caption): Naskah berita bergaya piramida terbalik (fakta paling penting di paragraf 1). Panjang 3-4 paragraf. Bahasa Indonesia baku namun mengalir (seperti gaya tulisan kumparan/Narasi). Jangan gunakan kata-kata AI generatif (seperti "Menariknya", "Kesimpulannya", "Mari kita").
    5. Kueri Gambar (image_search_query): 1 kalimat singkat dan spesifik (maksimal 5 kata) berisi NAMA ASLI TOKOH atau PERISTIWA untuk mencari foto aslinya di Google Images (misal: "Jokowi pidato", "Fajar Fikri Japan Open", "Kecelakaan tol"). JANGAN gunakan kata kunci bahasa Inggris generik!

    ATURAN ANTI-AI SANGAT KETAT (CRITICAL): 
    - DILARANG KERAS menggunakan kata-kata basi khas AI berikut: "Di era digital saat ini", "Penting untuk diingat", "Mari kita bahas", "Kesimpulannya", "Tidak bisa dipungkiri", "Revolusi digital", "Mengubah lanskap".
    - DILARANG memaksakan kata "Gini loh" atau "Kebayang nggak" jika konteksnya tidak pas. Jadilah organik.
    - SELURUH OUTPUT (kecuali image_search_query) WAJIB 100% BAHASA INDONESIA murni tanpa campuran bahasa Inggris (kecuali nama merek/istilah IT).
    - DILARANG KERAS BERHALUSINASI! Anda HANYA boleh menuliskan fakta yang secara eksplisit ada di dalam teks riset mentah.
    - DILARANG menambahkan kutipan palsu, angka, statistik, atau nama entitas yang tidak disebutkan di dalam riset.
    - Jika teks riset ambigu, gunakan bahasa netral tanpa menebak-nebak detailnya. Pelanggaran terhadap aturan ini akan membuat sistem QA GAGAL!

    Format balasan WAJIB dalam bentuk JSON murni seperti ini (tanpa backticks markdown):
    {
      "title": "...",
      "subtitle": "...",
      "caption": "...",
      "image_search_query": "..."
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
