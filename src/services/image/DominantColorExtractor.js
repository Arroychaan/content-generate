import sharp from 'sharp';

// Minimalistic dominant color extractor by resizing to 1x1 pixel using Sharp
export async function extractDominantColor(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();
    
    const { dominant } = await sharp(Buffer.from(buffer)).stats();
    
    // Returns r, g, b
    return {
      r: dominant.r,
      g: dominant.g,
      b: dominant.b,
      // Simple brightness calculation
      brightness: (dominant.r * 299 + dominant.g * 587 + dominant.b * 114) / 1000
    };
  } catch (error) {
    console.error('Failed to extract dominant color', error);
    return { r: 0, g: 0, b: 0, brightness: 0 };
  }
}
