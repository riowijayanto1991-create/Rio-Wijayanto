import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, drawPixel) {
  // RGBA raw buffer with 1 filter byte per scanline
  const scanlineLength = 1 + width * 4;
  const rawData = Buffer.alloc(scanlineLength * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * scanlineLength;
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawPixel(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const deflated = zlib.deflateSync(rawData, { level: 9 });

  function createChunk(type, data) {
    const typeBuf = Buffer.from(type);
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const body = Buffer.concat([typeBuf, data]);
    const crc = zlib.crc32(body);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([lenBuf, body, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // Deflate
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Non-interlaced

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', deflated);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Drawing function for Wildlife Hazard Unit Icon
function renderWHUIcon(x, y, width, height, isMaskable = false) {
  // Normalize coordinates -1 to +1
  let nx = (x / width) * 2 - 1;
  let ny = (y / height) * 2 - 1;

  if (isMaskable) {
    // Scale inward to guarantee safe zone (Android maskable requirement: inside 80% circle)
    nx /= 0.76;
    ny /= 0.76;
  }

  const distCenter = Math.sqrt(nx * nx + ny * ny);

  // Background gradient: Deep aviation navy #0f172a to #1e293b
  const bgGrad = (ny + 1) / 2;
  let r = Math.round(15 + bgGrad * 15);
  let g = Math.round(23 + bgGrad * 18);
  let b = Math.round(42 + bgGrad * 24);
  let a = 255;

  // Radar circular rings
  const ring1 = Math.abs(distCenter - 0.72);
  const ring2 = Math.abs(distCenter - 0.52);
  const ring3 = Math.abs(distCenter - 0.32);

  if (ring1 < 0.025) {
    const alpha = (1 - ring1 / 0.025) * 0.45;
    r = Math.round(r * (1 - alpha) + 56 * alpha); // #38bdf8
    g = Math.round(g * (1 - alpha) + 189 * alpha);
    b = Math.round(b * (1 - alpha) + 248 * alpha);
  } else if (ring2 < 0.02) {
    const alpha = (1 - ring2 / 0.02) * 0.35;
    r = Math.round(r * (1 - alpha) + 56 * alpha);
    g = Math.round(g * (1 - alpha) + 189 * alpha);
    b = Math.round(b * (1 - alpha) + 248 * alpha);
  } else if (ring3 < 0.015) {
    const alpha = (1 - ring3 / 0.015) * 0.3;
    r = Math.round(r * (1 - alpha) + 14 * alpha);
    g = Math.round(g * (1 - alpha) + 165 * alpha);
    b = Math.round(b * (1 - alpha) + 233 * alpha);
  }

  // Radar sweep line (quarter line)
  if (Math.abs(nx) < 0.015 && Math.abs(ny) < 0.75) {
    const sweepAlpha = 0.25;
    r = Math.round(r * (1 - sweepAlpha) + 56 * sweepAlpha);
    g = Math.round(g * (1 - sweepAlpha) + 189 * sweepAlpha);
    b = Math.round(b * (1 - sweepAlpha) + 248 * sweepAlpha);
  }
  if (Math.abs(ny) < 0.015 && Math.abs(nx) < 0.75) {
    const sweepAlpha = 0.25;
    r = Math.round(r * (1 - sweepAlpha) + 56 * sweepAlpha);
    g = Math.round(g * (1 - sweepAlpha) + 189 * sweepAlpha);
    b = Math.round(b * (1 - sweepAlpha) + 248 * sweepAlpha);
  }

  // Aviation Shield contour in center
  // Shield shape: x between -0.58 and +0.58, top at -0.55, curves down to point at (0, 0.6)
  const shieldWidthAtY = 0.52 * (ny < 0.1 ? 1 : Math.max(0, 1 - Math.pow((ny - 0.1) / 0.65, 1.8)));
  const insideShield = ny >= -0.55 && ny <= 0.62 && Math.abs(nx) <= shieldWidthAtY;

  if (insideShield) {
    // Shield glow border
    const edgeDist = shieldWidthAtY - Math.abs(nx);
    const bottomDist = 0.62 - ny;
    const topDist = ny - (-0.55);
    const minEdge = Math.min(edgeDist, bottomDist, topDist);

    if (minEdge < 0.04) {
      // Golden/Cyan Shield Border
      const borderAlpha = Math.min(1, (0.04 - minEdge) / 0.04);
      r = Math.round(r * (1 - borderAlpha) + 245 * borderAlpha); // #f59e0b amber
      g = Math.round(g * (1 - borderAlpha) + 158 * borderAlpha);
      b = Math.round(b * (1 - borderAlpha) + 11 * borderAlpha);
    } else {
      // Shield inner gradient: rich navy blue
      const innerGrad = (ny + 0.5) / 1.1;
      const shR = 14 + Math.round(innerGrad * 12);
      const shG = 30 + Math.round(innerGrad * 24);
      const shB = 66 + Math.round(innerGrad * 40);
      r = Math.round(r * 0.2 + shR * 0.8);
      g = Math.round(g * 0.2 + shG * 0.8);
      b = Math.round(b * 0.2 + shB * 0.8);
    }
  }

  // Falcon Wings & Jet silhouette
  // Jet Fuselage: vertical line from ny = -0.35 to 0.25
  const isFuselage = Math.abs(nx) < 0.045 && ny >= -0.38 && ny <= 0.28;
  // Jet Nose Cone
  const isNose = ny < -0.38 && ny >= -0.45 && Math.abs(nx) < (0.45 + ny) * 0.6;
  // Swept Wings (representing both airplane and wildlife eagle)
  const wingY = ny - (-0.05);
  const wingSpan = Math.abs(nx);
  const isSweptWing = wingSpan >= 0.04 && wingSpan <= 0.44 && wingY >= (wingSpan * 0.45 - 0.06) && wingY <= (wingSpan * 0.45 + 0.06);
  // Tail Wings
  const tailY = ny - 0.20;
  const isTailWing = wingSpan >= 0.03 && wingSpan <= 0.22 && tailY >= (wingSpan * 0.5 - 0.04) && tailY <= (wingSpan * 0.5 + 0.04);

  if (isFuselage || isNose || isSweptWing || isTailWing) {
    // Pure vibrant cyan / white highlight for aircraft
    r = 255;
    g = 255;
    b = 255;
  }

  // Golden Alert Beacon / Radar Pulse Dot at center-top
  const beaconDist = Math.sqrt(nx * nx + (ny + 0.18) * (ny + 0.18));
  if (beaconDist < 0.05) {
    const pulseAlpha = Math.min(1, (0.05 - beaconDist) / 0.05);
    r = Math.round(r * (1 - pulseAlpha) + 245 * pulseAlpha);
    g = Math.round(g * (1 - pulseAlpha) + 158 * pulseAlpha);
    b = Math.round(b * (1 - pulseAlpha) + 11 * pulseAlpha);
  }

  // If outside 100% circle and not maskable, soften outer corner alpha slightly if desired, or keep rounded rect
  if (!isMaskable) {
    const cornerRadius = 0.88;
    const dx = Math.max(0, Math.abs(nx) - (1 - cornerRadius));
    const dy = Math.max(0, Math.abs(ny) - (1 - cornerRadius));
    const distCorner = Math.sqrt(dx * dx + dy * dy);
    if (distCorner > cornerRadius) {
      a = Math.max(0, Math.min(255, Math.round((1 - (distCorner - cornerRadius) / 0.08) * 255)));
    }
  }

  return [r, g, b, a];
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA PNG icons...');

// 1. 192x192
const pwa192 = createPng(192, 192, (x, y, w, h) => renderWHUIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);
console.log('Created pwa-192x192.png');

// 2. 512x512
const pwa512 = createPng(512, 512, (x, y, w, h) => renderWHUIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);
console.log('Created pwa-512x512.png');

// 3. 512x512 maskable (with 15% safe margin)
const pwaMaskable512 = createPng(512, 512, (x, y, w, h) => renderWHUIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable512);
console.log('Created pwa-maskable-512x512.png');

// 4. apple-touch-icon.png (180x180)
const appleIcon = createPng(180, 180, (x, y, w, h) => renderWHUIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleIcon);
console.log('Created apple-touch-icon.png');

// 5. favicon.ico / 64x64 png
const favIcon = createPng(64, 64, (x, y, w, h) => renderWHUIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favIcon);
console.log('Created favicon.ico');

// 6. Vector SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#1e293b" />
    </linearGradient>
    <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0369a1" />
      <stop offset="100%" stop-color="#0c4a6e" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24" />
      <stop offset="100%" stop-color="#f59e0b" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background with rounded squircle -->
  <rect width="512" height="512" rx="108" fill="url(#bgGrad)" />

  <!-- Radar Rings -->
  <circle cx="256" cy="256" r="190" fill="none" stroke="#38bdf8" stroke-width="2" stroke-opacity="0.3" stroke-dasharray="8 6" />
  <circle cx="256" cy="256" r="135" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-opacity="0.35" />
  <circle cx="256" cy="256" r="80" fill="none" stroke="#0284c7" stroke-width="1.5" stroke-opacity="0.4" />
  <line x1="256" y1="56" x2="256" y2="456" stroke="#38bdf8" stroke-width="1.5" stroke-opacity="0.25" />
  <line x1="56" y1="256" x2="456" y2="256" stroke="#38bdf8" stroke-width="1.5" stroke-opacity="0.25" />

  <!-- Shield Base -->
  <path d="M 126 120 L 386 120 C 386 280 290 380 256 410 C 222 380 126 280 126 120 Z" 
        fill="url(#shieldGrad)" 
        stroke="url(#goldGrad)" 
        stroke-width="7" 
        filter="url(#glow)" />

  <!-- Aircraft / Eagle Falcon Wings Silhouette -->
  <g transform="translate(256, 240)">
    <!-- Swept Wings -->
    <path d="M 0 -70 L 26 -20 L 110 32 L 85 45 L 24 22 L 20 85 L 45 105 L 35 110 L 0 98 L -35 110 L -45 105 L -20 85 L -24 22 L -85 45 L -110 32 L -26 -20 Z" 
          fill="#ffffff" />
    <!-- Fuselage Nose Needle -->
    <polygon points="0,-95 -12,-65 12,-65" fill="#38bdf8" />
    <!-- Radar Pulse Beacon -->
    <circle cx="0" cy="-20" r="14" fill="#fbbf24" stroke="#ffffff" stroke-width="3" />
  </g>

  <!-- Typography: WHU CGK -->
  <text x="256" y="462" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', sans-serif" font-size="34" font-weight="800" fill="#f8fafc" letter-spacing="4">
    WHU CGK
  </text>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);
console.log('Created icon.svg');
console.log('All PWA icon assets generated successfully!');
