export async function fetchStockImage(queryText = '') {
  const query = encodeURIComponent(queryText || 'breaking news Indonesia');

  try {
    const url = `https://www.bing.com/images/search?q=${query}&form=HDRSC2&first=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      throw new Error(`Bing Images error: ${res.status}`);
    }

    const html = await res.text();

    // Ekstrak URL gambar asli dari atribut murl (media URL) Bing
    const murlMatches = html.match(/murl&quot;:&quot;(https?:\/\/[^&]+)/g);
    
    if (murlMatches && murlMatches.length > 0) {
      // Ambil gambar pertama (paling relevan)
      const imageUrl = murlMatches[0].replace('murl&quot;:&quot;', '');
      console.log(`Bing Images menemukan gambar untuk "${queryText}": ${imageUrl}`);
      return imageUrl;
    }

    console.warn('Bing Images tidak menemukan hasil untuk query:', queryText);
    return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1080&auto=format&fit=crop';
  } catch (err) {
    console.error('StockImageRouter Error:', err.message);
    return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1080&auto=format&fit=crop';
  }
}
