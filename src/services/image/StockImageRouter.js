export async function fetchStockImage(queryText = '') {
  const serperKey = process.env.SERPER_API_KEY;
  
  if (!serperKey) {
    console.warn("SERPER_API_KEY belum diset! Menggunakan gambar fallback.");
    return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1080&auto=format&fit=crop';
  }

  const query = queryText || 'breaking news';

  try {
    const res = await fetch('https://google.serper.dev/images', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: query })
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Serper API error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    
    if (data.images && data.images.length > 0) {
      // Ambil link gambar pertama
      return data.images[0].imageUrl;
    }

    console.warn("Serper tidak menemukan hasil untuk query:", queryText);
    return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1080&auto=format&fit=crop';
  } catch (err) {
    console.error('StockImageRouter Error:', err.message);
    return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1080&auto=format&fit=crop';
  }
}
