export async function fetchStockImage(keywords = []) {
  const pixabayKey = process.env.PIXABAY_API_KEY;
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;
  
  const query = encodeURIComponent(keywords.join(' ') || 'news abstract');

  try {
    // Parallel fetch from Pixabay and Unsplash
    const [pixabayRes, unsplashRes] = await Promise.allSettled([
      fetch(`https://pixabay.com/api/?key=${pixabayKey}&q=${query}&image_type=photo&orientation=vertical&per_page=3`),
      fetch(`https://api.unsplash.com/search/photos?query=${query}&orientation=portrait&per_page=1`, {
        headers: { Authorization: `Client-ID ${unsplashKey}` }
      })
    ]);

    let imageUrl = null;

    if (unsplashRes.status === 'fulfilled' && unsplashRes.value.ok) {
      const data = await unsplashRes.value.json();
      if (data.results && data.results.length > 0) {
        imageUrl = data.results[0].urls.raw + '&w=1080&q=80&fit=crop';
      }
    }

    if (!imageUrl && pixabayRes.status === 'fulfilled' && pixabayRes.value.ok) {
      const data = await pixabayRes.value.json();
      if (data.hits && data.hits.length > 0) {
        imageUrl = data.hits[0].largeImageURL; // HD resolution up to 1280px
      }
    }

    if (!imageUrl) {
      // Fallback placeholder if APIs fail or return empty
      return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1080&auto=format&fit=crop';
    }

    return imageUrl;
  } catch (err) {
    console.error('StockImageRouter Error:', err);
    return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1080&auto=format&fit=crop';
  }
}
