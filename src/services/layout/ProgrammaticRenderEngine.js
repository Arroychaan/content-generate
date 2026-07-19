import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { robotoBoldBase64 } from './fonts.js';

let robotoBoldBuffer = Buffer.from(robotoBoldBase64, 'base64');
let oswaldBoldBuffer = null;

async function getOswaldFont() {
  if (oswaldBoldBuffer) return oswaldBoldBuffer;
  try {
    const res = await fetch('https://fonts.gstatic.com/s/oswald/v57/TK3_WkUHHAIjg75cFRf3bXL8LICs1xZogUE.ttf');
    const arrayBuffer = await res.arrayBuffer();
    oswaldBoldBuffer = Buffer.from(arrayBuffer);
    return oswaldBoldBuffer;
  } catch (e) {
    console.warn('Failed to load Oswald font, falling back to Roboto', e.message);
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

  const fontData = await getOswaldFont();

  // Satori HTML to SVG template (React elements equivalent structure)
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          width: '1080px',
          height: '1080px',
          backgroundImage: `url(${finalBgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          fontFamily: 'Oswald, sans-serif',
          color: '#ffffff',
        },
        children: [
          // Cinematic dark gradient from bottom (0%) to top (100%)
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
                backgroundImage: 'linear-gradient(to top, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.6) 40%, rgba(0, 0, 0, 0) 100%)',
              },
            }
          },
          // Content Layout
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                padding: '80px',
                position: 'relative',
                zIndex: 10,
                alignItems: 'flex-start', // Left align
                justifyContent: 'flex-end', 
                height: '100%',
              },
              children: [
                // Minimalist Top Badge
                {
                  type: 'div',
                  props: {
                    style: {
                      position: 'absolute',
                      top: '60px',
                      left: '60px',
                      display: 'flex',
                      alignItems: 'center',
                      backgroundColor: '#ffffff',
                      padding: '10px 20px',
                      borderRadius: '4px',
                    },
                    children: [
                      {
                        type: 'span',
                        props: {
                          style: {
                            fontSize: '24px',
                            fontWeight: 'bold',
                            color: '#000000',
                            letterSpacing: '2px',
                            textTransform: 'uppercase'
                          },
                          children: "SECTOR ONE"
                        }
                      }
                    ]
                  }
                },
                // Typography / Headline
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '76px', // Massive text
                      fontWeight: 'bold',
                      lineHeight: 1.15,
                      textAlign: 'left',
                      textTransform: 'uppercase', // Hypebeast signature
                      letterSpacing: '-1px', // Tight letter spacing
                      textShadow: '0px 4px 20px rgba(0,0,0,0.8)', // Depth
                    },
                    children: imageText
                  }
                },
                // Accent Line
                {
                  type: 'div',
                  props: {
                    style: {
                      marginTop: '40px',
                      width: '120px',
                      height: '8px',
                      backgroundColor: '#ffffff',
                      boxShadow: '0px 2px 10px rgba(0,0,0,0.5)',
                    }
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
          name: 'Oswald',
          data: fontData,
          weight: 700,
          style: 'normal',
        }
      ],
    }
  );

  const resvg = new Resvg(svg, {
    background: 'rgba(0,0,0,1)',
    fitTo: { mode: 'original' }
  });
  
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return pngBuffer;
}
