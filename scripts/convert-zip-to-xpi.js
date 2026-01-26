const fs = require('fs');
const path = require('path');
const artifactsDir = path.join(__dirname, '..', 'tests', 'playwright', '.web-ext-artifacts');

if (!fs.existsSync(artifactsDir)) {
  console.error('Artifacts dir not found:', artifactsDir);
  process.exit(1);
}

const files = fs.readdirSync(artifactsDir).filter(f => f.endsWith('.zip'));
if (files.length === 0) {
  console.error('No .zip artifacts found in', artifactsDir);
  process.exit(1);
}

const zipFile = files[0];
const zipPath = path.join(artifactsDir, zipFile);
const xpiName = zipFile.replace(/\.zip$/i, '.xpi');
const xpiPath = path.join(artifactsDir, xpiName);

try {
  fs.copyFileSync(zipPath, xpiPath);
  console.log('Created XPI at', xpiPath);
} catch (err) {
  console.error('Failed to copy zip to xpi:', err);
  process.exit(2);
}
