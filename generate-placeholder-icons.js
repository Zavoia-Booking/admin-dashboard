#!/usr/bin/env node

/**
 * Generate basic placeholder PWA icons
 * Run: node generate-placeholder-icons.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple function to create SVG-based placeholder icons
function createSVGIcon(size, filename) {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#4F46E5"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" fill="white" text-anchor="middle" dy=".35em">B</text>
</svg>`;

  const outputPath = path.join(__dirname, 'public', filename);
  fs.writeFileSync(outputPath, svg);
  console.log(`✓ Created ${filename}`);
}

// Create maskable icon with safe zone
function createMaskableSVGIcon(size, filename) {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#4F46E5"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.35}" fill="#6366F1"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.25}" font-weight="bold" fill="white" text-anchor="middle" dy=".35em">B</text>
</svg>`;

  const outputPath = path.join(__dirname, 'public', filename);
  fs.writeFileSync(outputPath, svg);
  console.log(`✓ Created ${filename} (maskable)`);
}

console.log('\n🎨 Generating placeholder PWA icons...\n');

try {
  // Check if public directory exists
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  // Generate standard icons
  createSVGIcon(64, 'pwa-64x64.png');
  createSVGIcon(192, 'pwa-192x192.png');
  createSVGIcon(512, 'pwa-512x512.png');
  
  // Generate maskable icon
  createMaskableSVGIcon(512, 'maskable-icon-512x512.png');

  console.log('\n✅ Placeholder icons generated successfully!');
  console.log('\n⚠️  Note: These are basic placeholder SVGs.');
  console.log('For production, replace them with proper PNG icons.');
  console.log('See public/PWA_ICONS_README.md for detailed instructions.\n');

} catch (error) {
  console.error('\n❌ Error generating icons:', error.message);
  process.exit(1);
}

