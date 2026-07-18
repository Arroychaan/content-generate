import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';
import path from 'path';

const robotoBoldPath = path.join(process.cwd(), 'public/fonts/Roboto-Bold.ttf');
const robotoRegularPath = path.join(process.cwd(), 'public/fonts/Roboto-Regular.ttf');

let robotoBoldBuffer = null;
let robotoRegularBuffer = null;

try {
  robotoBoldBuffer = fs.readFileSync(robotoBoldPath);
  robotoRegularBuffer = fs.readFileSync(robotoRegularPath);
} catch (e) {
  console.warn("Fonts not found locally, Satori might fail or use system defaults if not handled.");
}

export async function renderProgrammaticImage(title, subtitle, backgroundImageUrl) {
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
          backgroundImage: `url(${backgroundImageUrl})`,
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
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
              }
            }
          },
          // Content Container
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                padding: '60px', // Minimum padding
                position: 'relative',
                zIndex: 10,
              },
              children: [
                // Top micro logo / category
                {
                  type: 'div',
                  props: {
                    style: {
                      position: 'absolute',
                      top: '-700px', // Pushed to top visually
                      left: '60px',
                      fontSize: '32px',
                      fontWeight: 'bold',
                      color: '#ffffff',
                      borderBottom: '4px solid #ffffff',
                      paddingBottom: '8px'
                    },
                    children: "ARproject"
                  }
                },
                // Title (Dynamic sizing logic handled externally or by Satori flex)
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: title.length > 50 ? '72px' : '96px',
                      fontWeight: 'bold',
                      lineHeight: 1.2,
                      marginBottom: '24px',
                    },
                    children: title
                  }
                },
                // Subtitle
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: '48px',
                      fontFamily: 'Roboto, sans-serif',
                      lineHeight: 1.4,
                      opacity: 0.9
                    },
                    children: subtitle
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
