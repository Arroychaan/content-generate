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
    3. Teks Gambar (image_text): MINIMAL 60 KARAKTER dan MAKSIMAL 100 KARAKTER. WAJIB BAHASA INDONESIA. Ini akan dicetak melayang di atas gambar. Rangkum inti berita dengan gaya bahasa simpel/kasual ala media anak muda masa kini.
    4. Caption (caption): Naskah berita. WAJIB BAHASA INDONESIA. Gaya bahasa: KASUAL & TAJAM (seperti Folkative / USS Feed, gunakan frasa seperti "Gini loh..", "Kebayang nggak?", "Gokil!"). 
       - Paragraf 1: HOOK (Pertanyaan memancing atau fakta mengejutkan).
       - Paragraf 2-3: Isi berita utama. Jika ada istilah teknis, WAJIB jelaskan dengan analogi sehari-hari yang sangat sederhana.
       - Paragraf 4: Kesimpulan atau pertanyaan lemparan ke netizen. Naskah harus sangat enak dibaca dan berbobot.
    5. Kata Kunci Visual (visual_keywords): 3 kata kunci BAHASA INGGRIS. Jangan hanya menyebut nama perusahaan. Pikirkan VISUAL FISIK yang merepresentasikan berita tersebut secara akurat. Jika berita tentang Amazon AWS, gunakan "server room" atau "data center". Jika tentang baterai mobil listrik, gunakan "electric car battery". Jika tentang AI, gunakan "robotics" atau "futuristic technology". Ini bertujuan agar mesin pencari gambar dapat menemukan foto fisik yang sangat relevan.

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
