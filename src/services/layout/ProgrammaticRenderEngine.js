import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { robotoBoldBase64, robotoRegularBase64 } from './fonts.js';

let robotoBoldBuffer = Buffer.from(robotoBoldBase64, 'base64');
let robotoRegularBuffer = Buffer.from(robotoRegularBase64, 'base64');

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

  // Satori HTML to SVG template (React elements equivalent structure)
  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end', // Align text to bottom
          width: '1080px',
          height: '1080px',
          backgroundImage: `url(${finalBgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          fontFamily: 'Roboto, sans-serif',
          color: '#ffffff', // Solid white text for safety
        },
        children: [
          // Overlay Mask 40%
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
              },
              children: finalBgImage ? [
                // Vintage/Retro tint overlay
                {
                  type: 'div',
                  props: {
                    style: {
                      position: 'absolute',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: 'rgba(120, 60, 20, 0.3)', // Warm vintage sepia tint
                      zIndex: 1,
                    }
                  }
                }
              ] : null
            }
          },
          // Overlay and Content Wrapper
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                padding: '60px',
                position: 'relative',
                zIndex: 10,
                alignItems: 'center', // Center content horizontally
                justifyContent: 'center', // Center content vertically
                height: '100%',
              },
              children: [
                // Top micro logo / category
                {
                  type: 'div',
                  props: {
                    style: {
                      position: 'absolute',
                      top: '60px',
                      left: '60px',
                      fontSize: '32px',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      borderBottom: '4px solid #ffffff',
                      paddingBottom: '8px'
                    },
                    children: "Sector One"
                  }
                },
                // Folkative-style Text Box
                {
                  type: 'div',
                  props: {
                    style: {
                      backgroundColor: 'rgba(255, 140, 0, 0.8)', // 80% Opacity Orange
                      padding: '40px 60px',
                      borderRadius: '16px',
                      fontSize: '64px',
                      fontWeight: 'bold',
                      lineHeight: 1.3,
                      textAlign: 'center',
                      maxWidth: '900px',
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
          name: 'Roboto',
          data: robotoBoldBuffer || new ArrayBuffer(0),
          weight: 700,
          style: 'normal',
        },
        {
          name: 'Roboto',
          data: robotoRegularBuffer || new ArrayBuffer(0),
          weight: 400,
          style: 'normal',
        }
      ],
    }
  );

  // Convert SVG to PNG using Resvg
  const resvg = new Resvg(svg, {
    background: 'rgba(0,0,0,1)',
    fitTo: { mode: 'original' }
  });
  
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return pngBuffer;
}
