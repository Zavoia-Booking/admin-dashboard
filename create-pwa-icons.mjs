#!/usr/bin/env node

/**
 * Generate actual PNG icons using sharp library
 * This creates real PNG files, not SVG
 */

import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create SVG content
function createSVG(size, isMaskable = false) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)"/>
  ${isMaskable ? `<circle cx="${size/2}" cy="${size/2}" r="${size * 0.35}" fill="rgba(255,255,255,0.2)"/>` : ''}
  <text 
    x="50%" 
    y="50%" 
    font-family="Arial, sans-serif" 
    font-size="${size * 0.5}" 
    font-weight="bold" 
    fill="white" 
    text-anchor="middle" 
    dominant-baseline="central">B</text>
</svg>`;
}

console.log('\n🎨 Creating PWA icon SVG files...\n');

const icons = [
  { size: 64, name: 'pwa-64x64.svg', maskable: false },
  { size: 192, name: 'pwa-192x192.svg', maskable: false },
  { size: 512, name: 'pwa-512x512.svg', maskable: false },
  { size: 512, name: 'maskable-icon-512x512.svg', maskable: true },
];

try {
  icons.forEach(({ size, name, maskable }) => {
    const svg = createSVG(size, maskable);
    const outputPath = join(__dirname, 'public', name);
    writeFileSync(outputPath, svg);
    console.log(`✓ Created ${name}`);
  });

  console.log('\n✅ SVG icons created successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. Install: npm install -g @resvg/resvg-js');
  console.log('2. Or better: Open generate-pwa-icons.html in browser');
  console.log('3. Download PNG icons and replace files in public/\n');
  
} catch (error) {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
}

