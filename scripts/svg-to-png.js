const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function convertDir(dir) {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));
  for (const f of files) {
    const inPath = path.join(dir, f);
    const outName = f.replace(/\.svg$/i, '.png');
    const outPath = path.join(dir, outName);
    console.log('Converting', inPath, '->', outPath);
    try {
      // Render at 2x width for a crisp image
      await sharp(inPath)
        .png({ quality: 90 })
        .toFile(outPath);
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
