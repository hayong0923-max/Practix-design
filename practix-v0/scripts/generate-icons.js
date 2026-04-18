const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_LOGO = path.join(__dirname, '..', 'public', 'logo.png');
const ANDROID_RES = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Android icon sizes
const ANDROID_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

// Foreground icon sizes (for adaptive icons, needs to be larger)
const ANDROID_FOREGROUND_SIZES = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

// Web icon sizes
const WEB_SIZES = {
  'favicon-16.png': 16,
  'favicon-32.png': 32,
  'icon-192.png': 192,
  'icon-512.png': 512,
};

async function generateIcons() {
  console.log('Generating icons from:', SOURCE_LOGO);

  // Generate Android icons
  for (const [folder, size] of Object.entries(ANDROID_SIZES)) {
    const outputPath = path.join(ANDROID_RES, folder, 'ic_launcher.png');
    const roundOutputPath = path.join(ANDROID_RES, folder, 'ic_launcher_round.png');

    // Create directory if not exists
    const dir = path.join(ANDROID_RES, folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Square icon
    await sharp(SOURCE_LOGO)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Created: ${outputPath}`);

    // Round icon (same as square for now, Android handles masking)
    await sharp(SOURCE_LOGO)
      .resize(size, size)
      .png()
      .toFile(roundOutputPath);
    console.log(`Created: ${roundOutputPath}`);
  }

  // Generate Android foreground icons (for adaptive icons)
  for (const [folder, size] of Object.entries(ANDROID_FOREGROUND_SIZES)) {
    const outputPath = path.join(ANDROID_RES, folder, 'ic_launcher_foreground.png');

    // For adaptive icons, we need padding around the logo
    // The safe zone is the inner 66% of the image
    const logoSize = Math.floor(size * 0.6); // 60% of total size for the logo
    const padding = Math.floor((size - logoSize) / 2);

    await sharp(SOURCE_LOGO)
      .resize(logoSize, logoSize)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(outputPath);
    console.log(`Created: ${outputPath}`);
  }

  // Generate Web icons
  for (const [filename, size] of Object.entries(WEB_SIZES)) {
    const outputPath = path.join(PUBLIC_DIR, filename);
    await sharp(SOURCE_LOGO)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Created: ${outputPath}`);
  }

  // Generate favicon.ico (use 32x32)
  const faviconPath = path.join(PUBLIC_DIR, 'favicon.ico');
  await sharp(SOURCE_LOGO)
    .resize(32, 32)
    .png()
    .toFile(faviconPath.replace('.ico', '.png'));

  // Copy as .ico (browsers can handle PNG as favicon)
  fs.copyFileSync(
    path.join(PUBLIC_DIR, 'favicon-32.png'),
    faviconPath
  );
  console.log(`Created: ${faviconPath}`);

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);
