import { renderProgrammaticImage } from '../services/layout/ProgrammaticRenderEngine';

export async function execute(draftContext = {}) {
  console.log('Executing 10_ProgrammaticRenderEngine...');
  
  const { drafts, stockImage, layoutParams } = draftContext;
  
  if (!drafts || !stockImage) {
    throw new Error('Data draf atau gambar tidak lengkap untuk proses render.');
  }

  try {
    // Memanggil Satori Engine dengan parameter dari Layout Coordinator
    // (Dalam implementasi ini, Satori sudah dibungkus dengan default mask/font di servicenya, 
    // tetapi bisa diperluas untuk menerima layoutParams secara penuh)
    const imageBuffer = await renderProgrammaticImage(
      drafts.image_text || drafts.title,
      stockImage
    );
    
    console.log(`ProgrammaticRenderEngine berhasil mencetak buffer gambar PNG (${imageBuffer.length} bytes).`);
    return imageBuffer;
  } catch (e) {
    console.error('ProgrammaticRenderEngine Error:', e);
    throw new Error(`Gagal merender gambar infografis: ${e.message}`);
  }
}
