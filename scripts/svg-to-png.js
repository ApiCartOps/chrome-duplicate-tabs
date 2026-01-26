const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function parseSvgSize(svgContent) {
  // try viewBox first: viewBox="0 0 w h"
  const vb = svgContent.match(/viewBox=["']?0\s+0\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)["']?/i);
  if (vb) return { width: Math.round(Number(vb[1])), height: Math.round(Number(vb[2])) };

  // try width/height attributes
  const w = svgContent.match(/width=["']?(\d+(?:\.\d+)?)(px)?["']?/i);
  const h = svgContent.match(/height=["']?(\d+(?:\.\d+)?)(px)?["']?/i);
  if (w && h) return { width: Math.round(Number(w[1])), height: Math.round(Number(h[1])) };

  return null;
}

async function convertDir(dir) {
  const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.svg'));
  for (const f of files) {
    const inPath = path.join(dir, f);
    const svg = fs.readFileSync(inPath, 'utf8');
    const size = parseSvgSize(svg) || { width: 800, height: 480 };
    const outName = f.replace(/\.svg$/i, '.png');
    const outPath = path.join(dir, outName);
    const outPath2x = path.join(dir, f.replace(/\.svg$/i, '@2x.png'));
    console.log('Converting', inPath, '->', outPath, 'and', outPath2x, `(base ${size.width}x${size.height})`);
    try {
      // standard density
      await sharp(inPath)
        .resize({ width: size.width })
        .png({ quality: 90 })
        .toFile(outPath);

      // 2x (retina)
      await sharp(inPath)
        .resize({ width: Math.round(size.width * 2) })
        .png({ quality: 90 })
        .toFile(outPath2x);
    } catch (err) {
      console.error('Failed to convert', inPath, err);
    }
  }
}

(async function(){
  const dir = path.join(__dirname, '..', 'docs', 'screenshots');
  if (!fs.existsSync(dir)) {
    console.error('Screenshots dir not found:', dir);
    process.exit(1);
  }
  await convertDir(dir);
})();
