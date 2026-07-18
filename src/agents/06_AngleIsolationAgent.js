import { callDeepSeek } from '../services/llm/DeepSeekClient';
import { withExponentialBackoff } from '../services/resilience/ExponentialBackoff';

export async function execute(draftContext = {}) {
  console.log('Executing 06_AngleIsolationAgent...');
  
  const { topic, researchData } = draftContext;

  const prompt = `
    Anda adalah Redaktur Senior.
    Tugas: Tentukan SUDUT PANDANG (ANGLE) pemberitaan yang paling tajam, edukatif, dan bernilai berita tinggi dari topik ini.
    
    Judul: ${topic.title}
    Data Riset: ${researchData}
    
    Batasan Etik:
    - Hindari sensasionalisme (clickbait murahan).
    - Harus objektif, netral, dan informatif.
    - Fokus pada "Dampak bagi masyarakat" atau "Mengapa ini penting".
    
    Berikan output HANYA 1 kalimat tegas yang menjadi "Angle Pemberitaan".
  `;

  try {
    const angle = await withExponentialBackoff(
      () => callDeepSeek(prompt)
    );
    console.log(`Angle terpilih: ${angle}`);
    return angle;
  } catch (e) {
    console.warn('Angle isolation gagal, fallback menggunakan angle deskriptif.', e.message);
    return "Laporan kronologis kejadian dan dampak langsung bagi masyarakat.";
  }
}
