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

export async function renderProgrammaticImage(imageText, backgroundImageUrl) {
  let finalBgImage = backgroundImageUrl;
  if (backgroundImageUrl && backgroundImageUrl.startsWith('http')) {
    try {
      const res = await fetch(backgroundImageUrl);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = res.headers.get('content-type') || 'image/jpeg';
        finalBgImage = `data:${contentType};base64,${buffer.toString('base64')}`;
      }
    } catch (e) {
      console.warn('Failed to pre-fetch background image:', e.message);
    }
  }

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
                backgroundColor: 'rgba(255, 255, 255, 0.98)', // Premium frosted white
                padding: '64px',
                borderRadius: '36px',
                width: '920px',
                boxShadow: '0 30px 80px rgba(0, 0, 0, 0.25)', // Rich deep shadow
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
                            backgroundColor: '#000000',
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
                            color: '#555555',
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
                      color: '#111111', // Jet black for contrast
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
