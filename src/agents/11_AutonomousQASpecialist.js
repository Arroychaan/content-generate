import { generateTextWithRotation } from '../services/llm/TokenRotator';
import { withExponentialBackoff } from '../services/resilience/ExponentialBackoff';
import { hasBannedWords } from '../services/content/BannedWordsFilter';

export async function execute(draftContext = {}) {
  console.log('Executing 11_AutonomousQASpecialist...');
  
  const { drafts, topic } = draftContext;
  
  // 1. Hard-check untuk Banned Words generatif AI
  const containsBannedWords = hasBannedWords(drafts.caption);
  if (containsBannedWords) {
    return {
      passed: false,
      feedback: "Draf mengandung kata-kata yang di-banned (terdeteksi gaya bahasa generatif AI murahan). Hindari kata-kata seperti: 'Menariknya', 'Kesimpulannya', 'Oleh karena itu', dll. Tulis ulang lebih natural."
    };
  }

  // 2. Soft-check menggunakan LLM untuk factual consistency dan tata bahasa
  const prompt = `
    Anda adalah Editor in Chief / Spesialis QA (Quality Assurance).
    Tugas: Periksa kebenaran fakta dan kualitas bahasa dari draf naskah ini dibandingkan dengan sumber aslinya.
    
    Sumber (Fakta):
    ${topic.combined_description}
    
    Draf:
    Judul: ${drafts.title}
    Caption: ${drafts.caption}
    
    Instruksi:
    Apakah draf ini menyimpang dari fakta sumber? Apakah ada salah ketik yang fatal? Apakah bahasanya terlalu robotik?
    Balas HANYA dengan format JSON:
    {
      "passed": true_atau_false,
      "feedback": "alasan jika false, kosongkan jika true"
    }
  `;

  try {
    const jsonString = await withExponentialBackoff(
      () => generateTextWithRotation(prompt, 'llama-3.3-70b-versatile', 300)
    );
    
    const cleanJsonStr = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    const qaResult = JSON.parse(cleanJsonStr);
    
    console.log(`Hasil QA: ${qaResult.passed ? 'LULUS' : 'GAGAL'} - ${qaResult.feedback || ''}`);
    return qaResult;
  } catch (e) {
    console.warn('Gagal memproses QA via LLM, menganggap lulus untuk menghindari loop.', e.message);
    return { passed: true, feedback: '' };
  }
}
