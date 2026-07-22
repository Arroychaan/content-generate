import { generateTextWithRotation } from '../services/llm/TokenRotator';
import { withExponentialBackoff } from '../services/resilience/ExponentialBackoff';

export async function execute(draftContext = {}) {
  console.log('Executing 07_JournalistCopywriter...');
  
  const { topic, researchData, angle, qaFeedback } = draftContext;

  // Bangun daftar fakta eksplisit dari sumber agar LLM tidak bisa mengarang
  const sourceText = researchData || topic.combined_description || '';

  const prompt = `
    Anda adalah Admin Sosmed Tech yang To-The-Point, Sedikit Sinis/Skeptis, dan Organik. Anda menulis untuk audiens anak muda (Gen Z / Milenial).
    Tugas: Tulis naskah berita singkat berdasarkan data berikut.
    
    Data Topik: ${topic.title}
    Angle Berita: ${angle}
    ${qaFeedback ? `REVISI WAJIB DARI EDITOR (QA): ${qaFeedback}. ANDA WAJIB MEMPERBAIKI KESALAHAN INI. JANGAN ULANGI KESALAHAN YANG SAMA.` : ''}
    
    === SUMBER FAKTA RESMI (HANYA GUNAKAN INFORMASI DARI BLOK INI) ===
    ${sourceText}
    === AKHIR SUMBER FAKTA ===
    
    Instruksi:
    1. Judul Utama (title): Maks 60 karakter, punchy, memancing perhatian. WAJIB BAHASA INDONESIA.
    2. Subjudul (subtitle): Maks 90 karakter, pelengkap judul, memberikan konteks. WAJIB BAHASA INDONESIA.
    3. Teks Gambar (image_text): MINIMAL 80 KARAKTER dan MAKSIMAL 110 KARAKTER. WAJIB BAHASA INDONESIA. Ini akan dicetak melayang di atas gambar. Rangkum inti berita dengan gaya bahasa kasual.
    4. Caption (caption): Naskah berita bergaya piramida terbalik (fakta paling penting di paragraf 1). Panjang 3-4 paragraf. Bahasa Indonesia baku namun mengalir (seperti gaya tulisan kumparan/Narasi). Jangan gunakan kata-kata AI generatif (seperti "Menariknya", "Kesimpulannya", "Mari kita").
    5. Kueri Pencarian Foto (image_search_query): 1 kalimat spesifik (maksimal 5 kata) untuk mencari FOTO JURNALISTIK DOKUMENTER NYATA di mesin pencari gambar (misal: "Sam Altman OpenAI press conference", "Gedung OpenAI San Francisco", "Presiden Jokowi pidato", "Fajar Fikri pertandingan Japan Open").
       - DILARANG KERAS hanya menuliskan nama merek/logo saja (misal "OpenAI" atau "Apple" atau "Google").
       - WAJIB menambahkan kata kontekstual foto fisik seperti "headquarters", "building", "office", "press conference", "portrait", "stadium", "event", atau nama tokoh spesifik terkait berita.
       - Ini bertujuan agar mesin mengambil FOTO DOKUMENTER FISIK BERESOLUSI TINGGI, BUKAN LOGO ATAU IKON YANG DI-ZOOM!

    ██████████████████████████████████████████████████
    █  ATURAN ANTI-HALUSINASI — PELANGGARAN = GAGAL  █
    ██████████████████████████████████████████████████
    
    1. Anda HANYA BOLEH menyebutkan nama orang, nama produk, nama perusahaan, angka, skor, dan kutipan yang TERTULIS EKSPLISIT di dalam blok "SUMBER FAKTA RESMI" di atas.
    2. Jika sumber menyebut "model AI baru" tanpa nama spesifik, tulis saja "model AI baru". JANGAN PERNAH mengarang nama model seperti "GPT-5.6 Sol" atau "Qwen3.8" atau nama apapun yang tidak ada di sumber.
    3. Jika sumber menyebut "mengalahkan kompetitor" tanpa menyebut skor, tulis saja "mengalahkan kompetitor". JANGAN mengarang skor atau angka benchmark.
    4. Jika sumber ambigu atau tidak lengkap, GUNAKAN BAHASA UMUM. Contoh: "sejumlah perusahaan teknologi" bukan mengarang nama perusahaan.
    5. DILARANG menambahkan kutipan langsung (tanda kutip "...") kecuali kutipan tersebut ada persis di sumber.
    
    ATURAN BAHASA:
    - DILARANG KERAS menggunakan kata-kata basi khas AI: "Di era digital saat ini", "Penting untuk diingat", "Mari kita bahas", "Kesimpulannya", "Tidak bisa dipungkiri", "Revolusi digital", "Mengubah lanskap".
    - SELURUH OUTPUT (kecuali image_search_query) WAJIB 100% BAHASA INDONESIA murni tanpa campuran bahasa Inggris (kecuali nama merek/istilah IT).

    Format balasan WAJIB dalam bentuk JSON murni seperti ini (tanpa backticks markdown):
    {
      "title": "...",
      "subtitle": "...",
      "image_text": "...",
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
      image_text: topic.title.substring(0, 110),
      caption: sourceText || "Informasi lebih lanjut belum tersedia saat ini.",
      image_search_query: topic.title.split(' ').slice(0, 4).join(' ')
    };
  }
}
