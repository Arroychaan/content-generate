import { generateTextWithRotation } from '../services/llm/TokenRotator';
import { withExponentialBackoff } from '../services/resilience/ExponentialBackoff';

export async function execute(rawArticles = []) {
  console.log('Executing 02_DeduplicationAgent...');
  
  if (!rawArticles || rawArticles.length === 0) return [];

  // 1. Pre-filter berdasarkan string kemiripan ringan (Jaccard / Keyword overlap sederhana)
  // Untuk efisiensi biaya, kita batasi pemanggilan LLM.
  const uniqueTopicsMap = new Map(); // key: topic ID, value: array of related articles
  
  // Fungsi sederhana menghitung kata yang sama dari judul
  const getWordSet = (text) => new Set(text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/));
  const getJaccardSimilarity = (setA, setB) => {
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  };

  for (const article of rawArticles) {
    let foundMatch = false;
    const articleWords = getWordSet(article.title);

    for (const [key, groupedArticles] of uniqueTopicsMap.entries()) {
      const representative = groupedArticles[0];
      const repWords = getWordSet(representative.title);
      
      const similarity = getJaccardSimilarity(articleWords, repWords);
      
      if (similarity > 0.4) { // Angka empiris untuk teks judul bahasa Indonesia
        // Kemungkinan kembar. Verifikasi dengan Gemini 2.5 Flash
        const prompt = `
          Tugas: Verifikasi apakah dua berita berikut membahas topik / insiden yang SAMA PERSIS.
          Berita 1: ${representative.title} - ${representative.description.substring(0, 200)}
          Berita 2: ${article.title} - ${article.description.substring(0, 200)}
          
          Balas HANYA dengan kata "YA" atau "TIDAK".
        `;

        try {
          const llmCheck = await withExponentialBackoff(
            () => generateTextWithRotation(prompt, 'gemini-3.5-flash', 10)
          );
          
          if (llmCheck.trim().toUpperCase().includes('YA')) {
            groupedArticles.push(article);
            foundMatch = true;
            break;
          }
        } catch (e) {
          console.warn('Gagal memverifikasi duplikasi dengan LLM, menganggap tidak duplikat.', e.message);
        }
      }
    }

    if (!foundMatch) {
      // Topik baru
      uniqueTopicsMap.set(article.link, [article]);
    }
  }

  // 2. Format hasil ke dalam uniqueTopics
  const uniqueTopics = [];
  for (const [key, group] of uniqueTopicsMap.entries()) {
    // Gabungkan konten
    const combinedDesc = group.map(a => a.description).join('\n\n--- \n\n');
    const sourceUrls = group.map(a => a.link);

    uniqueTopics.push({
      title: group[0].title,
      combined_description: combinedDesc,
      source_urls: sourceUrls,
      main_source: group[0].source,
      pubDate: group[0].pubDate
    });
  }

  console.log(`DeduplicationAgent selesai. Menyusut dari ${rawArticles.length} menjadi ${uniqueTopics.length} topik unik.`);
  return uniqueTopics;
}
