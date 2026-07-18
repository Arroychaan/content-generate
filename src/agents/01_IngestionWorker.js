import Parser from 'rss-parser';

export async function execute(context = {}) {
  console.log('Executing 01_IngestionWorker...');
  const parser = new Parser({
    customFields: {
      item: ['description', 'content:encoded', 'pubDate']
    }
  });

  const feeds = [
    'https://news.google.com/rss?hl=id&gl=ID&ceid=ID:id',
    'https://news.kompas.com/rss/news.xml',
    'https://rss.tempo.co/nasional',
    'https://tirto.id/rss'
  ];

  let rawArticles = [];

  for (const url of feeds) {
    try {
      console.log(`Fetching RSS from ${url}...`);
      const feed = await parser.parseURL(url);
      feed.items.forEach(item => {
        // Gabungkan description & content:encoded untuk mendapatkan summary terpanjang
        const desc = item.contentSnippet || item['content:encoded'] || item.description || '';
        
        // Filter: Tolak berita jika deskripsi kurang dari 100 karakter
        if (desc.length >= 100) {
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
