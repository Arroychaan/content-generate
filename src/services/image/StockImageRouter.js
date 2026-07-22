const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1080&auto=format&fit=crop';

async function validateImageUrl(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });
    clearTimeout(timeout);

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('image') || contentType.includes('octet-stream')) {
        return true;
      }
    }
  } catch (e) {
    // Ignore validation errors (timeout/network)
  }
  return false;
}

export async function fetchStockImage(queryText = '') {
  let searchQuery = queryText.trim();
  if (!searchQuery) searchQuery = 'news headline';

  const encodedQuery = encodeURIComponent(searchQuery);

  try {
    // Filter Bing Images:
    // +filterui:photo-photo (hanya foto nyata, mengabaikan logo, vektor, clipart, transparansi)
    // +filterui:imagesize-large (hanya gambar resolusi tinggi)
    const url = `https://www.bing.com/images/search?q=${encodedQuery}&qft=+filterui:photo-photo+filterui:imagesize-large&form=HDRSC2&first=1`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!res.ok) {
      throw new Error(`Bing Images error: ${res.status}`);
    }

    const html = await res.text();
    const murlMatches = html.match(/murl&quot;:&quot;(https?:\/\/[^&]+)/g);
    
    if (murlMatches && murlMatches.length > 0) {
      // Periksa hingga 6 gambar teratas untuk memastikan link bisa diunduh (tidak terblokir hotlink/403/timeout)
      const candidateUrls = murlMatches.slice(0, 6).map(m => m.replace('murl&quot;:&quot;', ''));
      
      for (const candidate of candidateUrls) {
        if (candidate.endsWith('.svg') || candidate.endsWith('.gif')) continue;
        
        const isValid = await validateImageUrl(candidate);
        if (isValid) {
          console.log(`Bing Images menemukan foto terverifikasi untuk "${searchQuery}": ${candidate}`);
          return candidate;
        } else {
          console.warn(`Foto kandidat tidak dapat diunduh (hotlink blocked/403/timeout): ${candidate}`);
        }
      }
    }

    console.warn('Bing Images tidak menemukan foto terverifikasi untuk query:', searchQuery);
    return FALLBACK_IMAGE;
  } catch (err) {
    console.error('StockImageRouter Error:', err.message);
    return FALLBACK_IMAGE;
  }
}
