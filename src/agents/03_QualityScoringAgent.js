import { generateTextWithRotation } from '../services/llm/TokenRotator';
import { withExponentialBackoff } from '../services/resilience/ExponentialBackoff';

export async function execute(uniqueTopics = []) {
  console.log('Executing 03_QualityScoringAgent...');
  
  if (!uniqueTopics || uniqueTopics.length === 0) return [];

  const scoredTopics = [];

  for (const topic of uniqueTopics) {
    const prompt = `
      Anda adalah seorang Pimpinan Redaksi Berita Nasional.
      Tugas: Evaluasi kelayakan berita berikut untuk dipublikasikan di media sosial, 
      berdasarkan: Aktualitas, Urgensi, Dampak Sosial, dan Potensi Engagement.
      
      Judul: ${topic.title}
      Deskripsi: ${topic.combined_description.substring(0, 500)}...
      
      Berikan skor absolut berupa angka desimal dari 1.0 hingga 10.0 (misalnya: 7.5).
      HANYA BALAS DENGAN ANGKA SKOR. TIDAK ADA TEKS LAIN.
    `;

    try {
      const result = await withExponentialBackoff(
        () => generateTextWithRotation(prompt, 'llama-3.3-70b-versatile', 10)
      );

      const scoreMatch = result.match(/(\d+\.\d+|\d+)/);
      const score = scoreMatch ? parseFloat(scoreMatch[0]) : 0;
      
      console.log(`Skor berita "${topic.title}": ${score}`);

      if (score >= 7.0) {
        scoredTopics.push({
          ...topic,
          quality_score: score
        });
      }
    } catch (e) {
      console.warn('Gagal menilai berita dengan LLM, skip topik ini.', e.message);
    }
  }

  console.log(`QualityScoringAgent selesai. Meloloskan ${scoredTopics.length} dari ${uniqueTopics.length} topik.`);
  return scoredTopics;
}
