import { callDeepSeek } from '../services/llm/DeepSeekClient';
import { withExponentialBackoff } from '../services/resilience/ExponentialBackoff';

// Fungsi helper untuk mengambil teks dasar dari halaman web secara sederhana
async function scrapeWebText(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const html = await res.text();
    // Ekstrak teks dasar dari tag p menggunakan regex sederhana
    const pMatches = html.match(/<p[^>]*>(.*?)<\/p>/gi);
    if (pMatches) {
      return pMatches
        .map(p => p.replace(/<[^>]+>/g, '').trim())
        .filter(p => p.length > 50)
        .join('\n')
        .substring(0, 3000); // Batasi hingga 3000 karakter pertama
    }
  } catch (e) {
    console.warn(`Scraping gagal untuk ${url}:`, e.message);
  }
  return '';
}

export async function execute(draftContext = {}) {
  console.log('Executing 05_DeepResearchInvestigator...');
  
  const topic = draftContext.topic;
  let scrapedContent = '';

  // Coba scrape URL sumber untuk data tambahan
  if (topic.source_urls && topic.source_urls.length > 0) {
    scrapedContent = await scrapeWebText(topic.source_urls[0]);
  }

  const prompt = `
    Anda adalah Peneliti Berita Senior (Deep Researcher).
    Tugas: Analisis berita berikut dan gali fakta-fakta spesifik, statistik, serta latar belakang historis atau konteks penting yang mungkin terlewat.
    
    Judul Berita Utama: ${topic.title}
    Deskripsi Singkat: ${topic.combined_description}
    Konten Scraped (jika ada): ${scrapedContent}
    
    Instruksi:
    1. Ekstrak minimal 3 fakta utama.
    2. Identifikasi angka/statistik jika ada.
    3. Pastikan keakuratan dan netralitas.
    4. Rangkum menjadi paragraf riset mendalam.
    
    Berikan output langsung berupa teks riset (tanpa basa-basi).
  `;

  try {
    const researchData = await withExponentialBackoff(
      () => callDeepSeek(prompt)
    );
    console.log(`Deep Research berhasil untuk topik: ${topic.title}`);
    return researchData;
  } catch (e) {
    console.warn('DeepSeek gagal, fallback menggunakan data deskripsi awal saja.', e.message);
    return topic.combined_description; // Fallback jika LLM error
  }
}
