import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { robotoBoldBase64 } from './fonts.js';

let robotoBoldBuffer = Buffer.from(robotoBoldBase64, 'base64');
let interFontBuffer = null;

async function getInterFont() {
  if (interFontBuffer) return interFontBuffer;
  try {
    const res = await fetch('https://fonts.gstatic.com/s/inter/v20/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZg.ttf');
    const arrayBuffer = await res.arrayBuffer();
    interFontBuffer = Buffer.from(arrayBuffer);
    return interFontBuffer;
  } catch (e) {
    console.warn('Failed to load Inter font, falling back to Roboto', e.message);
    return robotoBoldBuffer;
  }
}

async function getBgImageBase64(primaryUrl) {
  const fallbackUrl = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1080&auto=format&fit=crop';
  
  const tryFetchBase64 = async (url) => {
    if (!url || !url.startsWith('http')) return null;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      clearTimeout(timeout);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        return `data:${contentType};base64,${buffer.toString('base64')}`;
      }
    } catch (e) {
      console.warn(`Failed to fetch image as base64 from ${url}:`, e.message);
    }
    return null;
  };

  if (primaryUrl && primaryUrl.startsWith('data:image/')) {
    return primaryUrl;
  }

  let base64 = await tryFetchBase64(primaryUrl);
  if (base64) return base64;

  console.warn('Primary background image failed, falling back to guaranteed Unsplash news photo.');
  base64 = await tryFetchBase64(fallbackUrl);
  if (base64) return base64;

  // Ultimate fallback neutral dark background (NEVER pure white)
  return 'data:image/svg+xml;base64,' + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080"><rect width="1080" height="1080" fill="#0f172a"/></svg>').toString('base64');
}

export async function renderProgrammaticImage(imageText, backgroundImageUrl) {
  const finalBgImage = await getBgImageBase64(backgroundImageUrl);

  const fontData = await getInterFont();

  // Satori HTML to SVG template (Minimalist Elegance Design)
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end', // Align card to bottom
          width: '1080px',
          height: '1080px',
          backgroundImage: `url(${finalBgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          fontFamily: 'Inter, sans-serif',
          paddingBottom: '240px', // Lift the card slightly up towards the center
        },
        children: [
          // Aesthetic Filter: Very subtle dark overlay to make the photo pop and look premium
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                backgroundColor: 'rgba(10, 10, 15, 0.25)', // Subtle cool-dark filter
              }
            }
          },
          // Elegant Floating White Card
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'rgba(15, 23, 42, 0.95)', // Biru Dongker (Navy Blue)
                padding: '64px',
                borderRadius: '36px',
                border: '2px solid rgba(255, 255, 255, 0.15)', // Minimalist clean border
                width: '920px',
                boxShadow: '0 30px 80px rgba(0, 0, 0, 0.4)', // Rich deep shadow
              },
              children: [
                // Editorial Badge
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '24px',
                    },
                    children: [
                      {
                        type: 'div',
                        props: {
                          style: {
                            width: '4px',
                            height: '20px',
                            backgroundColor: '#38BDF8', // Light blue accent (kontras)
                            marginRight: '12px',
                            borderRadius: '2px',
                          }
                        }
                      },
                      {
                        type: 'span',
                        props: {
                          style: {
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: '#94A3B8', // Light slate gray untuk sub-teks
                            letterSpacing: '3px',
                            textTransform: 'uppercase',
                          },
                          children: "SECTOR ONE"
                        }
                      }
                    ]
                  }
                },
                // Headline Text
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '64px',
                      fontWeight: 600,
                      color: '#F8FAFC', // Putih terang untuk kontras maksimal
                      lineHeight: 1.35,
                      letterSpacing: '-0.5px',
                    },
                    children: imageText
                  }
                }
              ]
            }
          }
        ]
      }
    },
    {
      width: 1080,
      height: 1080,
      fonts: [
        {
          name: 'Inter',
          data: fontData,
          weight: 600,
          style: 'normal',
        }
      ],
    }
  );

  // Convert SVG to PNG using Resvg
  const resvg = new Resvg(svg, {
    background: 'rgba(255,255,255,1)',
    fitTo: { mode: 'original' }
  });
  
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return pngBuffer;
}
