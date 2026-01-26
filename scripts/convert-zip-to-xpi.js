const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = path.join(__dirname, '..');
const artifactsDir = path.join(__dirname, '..', 'tests', 'playwright', '.web-ext-artifacts');
const manifestPath = path.join(root, 'manifest.json');

function ensureArtifactsDir() {
  if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });
}

function loadManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

function saveManifest(manifest) {
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

// If manifest contains `applications.gecko`, move it to `browser_specific_settings.gecko`
function preferBrowserSpecificSettings() {
  const manifest = loadManifest();
  if (manifest.browser_specific_settings && manifest.browser_specific_settings.gecko) return false; // already present
  if (manifest.applications && manifest.applications.gecko) {
    manifest.browser_specific_settings = manifest.browser_specific_settings || {};
    manifest.browser_specific_settings.gecko = manifest.applications.gecko;
    delete manifest.applications;
    saveManifest(manifest);
    return true;
  }
  return false;
}

function buildWithWebExt() {
  ensureArtifactsDir();
  try {
    console.log('Running web-ext build (overwrite dest)...');
    cp.execSync(`npx web-ext build --source-dir . --artifacts-dir "${artifactsDir}" --overwrite-dest`, { cwd: root, stdio: 'inherit' });
  } catch (e) {
    console.error('web-ext build failed:', e && e.message);
    process.exit(3);
  }
}

function copyZipToXpi() {
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
}

// Main
ensureArtifactsDir();
const manifestBackedUp = fs.existsSync(manifestPath);
let backedUpContent = null;
if (manifestBackedUp) backedUpContent = fs.readFileSync(manifestPath, 'utf8');

let modified = false;
try {
  modified = preferBrowserSpecificSettings();
  buildWithWebExt();
  copyZipToXpi();
} finally {
  if (modified && backedUpContent !== null) {
    // restore original manifest
    fs.writeFileSync(manifestPath, backedUpContent, 'utf8');
    console.log('Restored original manifest.json');
  }
}
