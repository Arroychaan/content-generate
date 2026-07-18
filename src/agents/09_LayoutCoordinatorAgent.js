import { extractDominantColor } from '../services/image/DominantColorExtractor';
import { generateTextWithRotation } from '../services/llm/TokenRotator';
import { withExponentialBackoff } from '../services/resilience/ExponentialBackoff';

export async function execute(draftContext = {}) {
  console.log('Executing 09_LayoutCoordinatorAgent...');
  
  const { stockImage, drafts } = draftContext;
  
  // Ekstrak warna dominan
  const colorData = await extractDominantColor(stockImage);
  
  const prompt = `
    Anda adalah Desainer Grafis AI.
    Tugas: Tentukan parameter layout (tata letak) untuk judul berita ini di atas poster.
    
    Data:
    Judul: ${drafts.title} (Panjang: ${drafts.title.length} karakter)
    Kecerahan Gambar Latar (0-255): ${colorData.brightness}
    
    Instruksi:
    Jika judul panjang (>50 karakter), disarankan fontSize judul 72. Jika pendek, fontSize 96.
    Jika gambar terang (brightness > 130), gunakan overlay mask yang lebih pekat (0.6). Jika gelap, cukup (0.4).
    
    Balas HANYA dengan format JSON murni:
    {
      "titleFontSize": "...", 
      "overlayOpacity": 0.4
    }
  `;

  try {
    const jsonString = await withExponentialBackoff(
      () => generateTextWithRotation(prompt, 'gemini-2.5-flash', 10)
    );
    
    const cleanJsonStr = jsonString.replace(/```json/g, '').replace(/```/g, '').trim();
    const layoutParams = JSON.parse(cleanJsonStr);
    
    console.log(`LayoutCoordinatorAgent merumuskan parameter:`, layoutParams);
    return {
      ...layoutParams,
      dominantColor: colorData
    };
  } catch (e) {
    console.warn('Gagal merumuskan layout via LLM, menggunakan default.', e.message);
    return {
      titleFontSize: drafts.title.length > 50 ? '72px' : '96px',
      overlayOpacity: colorData.brightness > 130 ? 0.6 : 0.4,
      dominantColor: colorData
    };
  }
}
