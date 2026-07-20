import Parser from 'rss-parser';

export async function execute(context = {}) {
  console.log('Executing 01_IngestionWorker...');
  const parser = new Parser({
    customFields: {
      item: ['description', 'content:encoded', 'pubDate']
    },
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  const feeds = [
    // === INTERNASIONAL (Terverifikasi 200 OK) ===
    'https://techcrunch.com/feed/',
    'https://www.theverge.com/rss/index.xml',
    'https://feeds.bbci.co.uk/news/technology/rss.xml',
    // === INDONESIA (Terverifikasi 200 OK pada 2026-07-20) ===
    'https://www.jpnn.com/index.php?mib=rss',
    'https://www.republika.co.id/rss',
    'https://www.cnbcindonesia.com/tech/rss',
    'https://sindikasi.okezone.com/index.php/rss/0/RSS2.0/1/0/tekno',
  ];

  let rawArticles = [];

  for (const url of feeds) {
    try {
      console.log(`Fetching RSS from ${url}...`);
      const feed = await parser.parseURL(url);
      feed.items.forEach(item => {
        // Gabungkan description & content:encoded untuk mendapatkan summary terpanjang
        const desc = item.contentSnippet || item['content:encoded'] || item.description || '';
        
        // Cek umur berita dalam jam
        const pubDateObj = new Date(item.pubDate || new Date().toISOString());
        const hoursAgo = (Date.now() - pubDateObj.getTime()) / (1000 * 60 * 60);
        
        // Filter: Tolak berita jika deskripsi kurang dari 100 karakter ATAU lebih tua dari 3 jam (Real-time strict)
        if (desc.length >= 100 && hoursAgo <= 3) {
          rawArticles.push({
            title: item.title,
            link: item.link,
            pubDate: item.pubDate || new Date().toISOString(),
            description: desc,
            source: feed.title || new URL(url).hostname
          });
        }
      });
    } catch (e) {
      console.warn(`Gagal mengambil RSS dari ${url}:`, e.message);
    }
  }

  // Batasi agar tidak terlalu berat di memory, misal ambil 50 teratas yang terbaru
  rawArticles = rawArticles
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, 50);

  console.log(`IngestionWorker selesai. Menemukan ${rawArticles.length} artikel potensial.`);
  return rawArticles; // Meneruskan rawArticles ke pipeline berikutnya
}
