import { fetchStockImage } from '../services/image/StockImageRouter';

export async function execute(draftContext = {}) {
  console.log('Executing 08_ImageStockRouter...');
  
  const { drafts } = draftContext;
  
  if (!drafts || !drafts.visual_keywords) {
    throw new Error('Tidak ada kata kunci visual dari Copywriter');
  }

  try {
    const imageUrl = await fetchStockImage(drafts.visual_keywords);
    console.log(`ImageStockRouter menemukan gambar: ${imageUrl}`);
    return imageUrl;
  } catch (e) {
    console.warn('Gagal mencari gambar stok, menggunakan gambar placeholder.', e.message);
    return 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1080&auto=format&fit=crop';
  }
}
