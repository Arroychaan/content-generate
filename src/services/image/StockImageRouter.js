export async function fetchStockImage(queryText = '') {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX;
  
  if (!apiKey || !cx) {
    console.warn("GOOGLE_API_KEY atau GOOGLE_CX belum diset! Menggunakan gambar fallback.");
    return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1080&auto=format&fit=crop';
  }

  const query = encodeURIComponent(queryText || 'breaking news');

  try {
    const url = `https://customsearch.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}&searchType=image&num=1&safe=active`;
    const res = await fetch(url);
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Google Search API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    
    if (data.items && data.items.length > 0) {
      // Ambil link gambar pertama
      return data.items[0].link;
    }

    console.warn("Google Images tidak menemukan hasil untuk query:", queryText);
    return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1080&auto=format&fit=crop';
  } catch (err) {
    console.error('StockImageRouter Error:', err.message);
    return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1080&auto=format&fit=crop';
  }
}
