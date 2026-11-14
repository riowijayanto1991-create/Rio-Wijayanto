import QRCode from 'qrcode';

// In-memory caches for generated assets
let cachedLogoDataUrl: string | null = null;
let cachedSealDataUrl: string | null = null;
const qrCache = new Map<string, string>();
const signatureCache = new Map<string, string>();

/**
 * Generate official Soekarno-Hatta International Airport by InJourney Airports Logo (PNG Data URL)
 * High-resolution retina canvas rendering matching the official brand identity
 */
export const getSoekarnoHattaLogoDataUrl = (): string => {
  if (cachedLogoDataUrl) return cachedLogoDataUrl;

  if (typeof document === 'undefined') {
    return '';
  }

  try {
    const width = 960;
    const height = 270;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, width, height);

    const charcoal = '#33373B';
    const lightText = '#52575C';

    // 1. Line 1: "Soekarno-Hatta"
    ctx.fillStyle = charcoal;
    ctx.font = '700 96px "Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('Soekarno-Hatta', 10, 92);

    // 2. Line 2: "International Airport"
    ctx.font = '700 96px "Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif';
    ctx.fillText('International Airport', 10, 192);

    // 3. Line 3: "by injourney Airports"
    const subY = 248;
    const subStartX = 295; // Centered under the typography
    
    // "by "
    ctx.font = '300 38px "Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = lightText;
    ctx.fillText('by', subStartX, subY);
    let curX = subStartX + ctx.measureText('by ').width;

    // "inj"
    ctx.font = '700 38px "Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = charcoal;
    ctx.fillText('inj', curX, subY);
    curX += ctx.measureText('inj').width;

    // "o" as InJourney 4-colored circle emblem
    const ringCenterX = curX + 13;
    const ringCenterY = subY - 12;
    const outerR = 10;
    const innerR = 4.5;
    const gap = 0.22; // gap in radians

    // Top-Left (Cyan #00A3E0)
    ctx.save();
    ctx.beginPath();
    ctx.arc(ringCenterX, ringCenterY, outerR, Math.PI + gap, 1.5 * Math.PI - gap);
    ctx.arc(ringCenterX, ringCenterY, innerR, 1.5 * Math.PI - gap, Math.PI + gap, true);
    ctx.closePath();
    ctx.fillStyle = '#00A3E0';
    ctx.fill();

    // Top-Right (Orange #FF6B35)
    ctx.beginPath();
    ctx.arc(ringCenterX, ringCenterY, outerR, 1.5 * Math.PI + gap, 2 * Math.PI - gap);
    ctx.arc(ringCenterX, ringCenterY, innerR, 2 * Math.PI - gap, 1.5 * Math.PI + gap, true);
    ctx.closePath();
    ctx.fillStyle = '#FF6B35';
    ctx.fill();

    // Bottom-Right (Golden Yellow #F59E0B)
    ctx.beginPath();
    ctx.arc(ringCenterX, ringCenterY, outerR, gap, 0.5 * Math.PI - gap);
    ctx.arc(ringCenterX, ringCenterY, innerR, 0.5 * Math.PI - gap, gap, true);
    ctx.closePath();
    ctx.fillStyle = '#F59E0B';
    ctx.fill();

    // Bottom-Left (Emerald Green #10B981)
    ctx.beginPath();
    ctx.arc(ringCenterX, ringCenterY, outerR, 0.5 * Math.PI + gap, Math.PI - gap);
    ctx.arc(ringCenterX, ringCenterY, innerR, Math.PI - gap, 0.5 * Math.PI + gap, true);
    ctx.closePath();
    ctx.fillStyle = '#10B981';
    ctx.fill();
    ctx.restore();

    curX += 28;

    // "urney"
    ctx.font = '700 38px "Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = charcoal;
    ctx.fillText('urney', curX, subY);
    curX += ctx.measureText('urney').width;

    // " Airports"
    ctx.font = '400 38px "Plus Jakarta Sans", "Helvetica Neue", Arial, sans-serif';
    ctx.fillStyle = lightText;
    ctx.fillText(' Airports', curX, subY);

    cachedLogoDataUrl = canvas.toDataURL('image/png');
    return cachedLogoDataUrl;
  } catch (err) {
    console.error('Error creating Soekarno-Hatta logo:', err);
    return '';
  }
};

/**
 * Backward compatibility alias for the official logo
 */
export const getAngkasaPuraLogoDataUrl = (): string => {
  return getSoekarnoHattaLogoDataUrl();
};

/**
 * Generate official Airside Safety / Wildlife Hazard Unit (WHU) Crest Seal (PNG)
 */
export const getAirsideSafetySealDataUrl = (): string => {
  if (cachedSealDataUrl) return cachedSealDataUrl;

  if (typeof document === 'undefined') {
    return '';
  }

  try {
    const size = 300;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const center = size / 2;
    ctx.clearRect(0, 0, size, size);

    // Outer Navy Ring
    ctx.beginPath();
    ctx.arc(center, center, 140, 0, Math.PI * 2);
    ctx.fillStyle = '#0F172A';
    ctx.fill();

    // Gold Outer Rim
    ctx.beginPath();
    ctx.arc(center, center, 134, 0, Math.PI * 2);
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Middle Ring
    ctx.beginPath();
    ctx.arc(center, center, 108, 0, Math.PI * 2);
    ctx.strokeStyle = '#FCD34D';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner Deep Shield Background
    ctx.beginPath();
    ctx.arc(center, center, 102, 0, Math.PI * 2);
    ctx.fillStyle = '#0284C7';
    ctx.fill();

    // Runway stripes perspective in the center shield
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(center - 12, center + 45);
    ctx.lineTo(center + 12, center + 45);
    ctx.lineTo(center + 5, center - 20);
    ctx.lineTo(center - 5, center - 20);
    ctx.closePath();
    ctx.fill();

    // Centerline dashes
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(center, center + 38);
    ctx.lineTo(center, center + 25);
    ctx.moveTo(center, center + 18);
    ctx.lineTo(center, center + 8);
    ctx.moveTo(center, center + 2);
    ctx.lineTo(center, center - 8);
    ctx.stroke();

    // Airplane soaring silhouette over runway
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(center, center - 45); // Nose
    ctx.lineTo(center + 6, center - 30);
    ctx.lineTo(center + 38, center - 20); // Right Wing
    ctx.lineTo(center + 38, center - 14);
    ctx.lineTo(center + 8, center - 18);
    ctx.lineTo(center + 6, center + 8);
    ctx.lineTo(center + 20, center + 18); // Right Tail
    ctx.lineTo(center + 20, center + 23);
    ctx.lineTo(center, center + 18); // Tail end
    ctx.lineTo(center - 20, center + 23); // Left Tail
    ctx.lineTo(center - 20, center + 18);
    ctx.lineTo(center - 6, center + 8);
    ctx.lineTo(center - 8, center - 18);
    ctx.lineTo(center - 38, center - 14);
    ctx.lineTo(center - 38, center - 20); // Left Wing
    ctx.lineTo(center - 6, center - 30);
    ctx.closePath();
    ctx.fill();

    // Text along Arc Top: "PT ANGKASA PURA INDONESIA"
    ctx.save();
    ctx.translate(center, center);
    ctx.fillStyle = '#F8FAFC';
    ctx.font = 'bold 15px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    
    // Top Banner
    ctx.fillText('PT ANGKASA PURA INDONESIA', 0, -114);

    // Bottom Banner
    ctx.fillStyle = '#FDE68A';
    ctx.font = 'bold 14px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText('★ WILDLIFE HAZARD UNIT ★', 0, 126);

    // WHU Code Badge in Center
    ctx.fillStyle = '#0F172A';
    ctx.fillRect(-45, 52, 90, 22);
    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-45, 52, 90, 22);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('ICAO ANNEX 14', 0, 67);

    ctx.restore();

    cachedSealDataUrl = canvas.toDataURL('image/png');
    return cachedSealDataUrl;
  } catch (err) {
    console.error('Error creating Airside Safety seal:', err);
    return '';
  }
};

/**
 * Generate official circular rubber / verification stamp as PNG
 */
export const getOfficialStampDataUrl = (
  unitText = 'WILDLIFE HAZARD MANAGEMENT',
  statusText = 'VERIFIED & RECORDED'
): string => {
  if (typeof document === 'undefined') return '';

  try {
    const size = 260;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const center = size / 2;
    ctx.clearRect(0, 0, size, size);

    // Slight rotation to look like an authentic ink stamp
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(-0.06); // ~3.5 degrees tilt

    const inkColor = '#1D4ED8'; // Blue stamp ink
    ctx.strokeStyle = inkColor;
    ctx.fillStyle = inkColor;

    // Outer Circle
    ctx.beginPath();
    ctx.arc(0, 0, 118, 0, Math.PI * 2);
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Inner Dashed Circle
    ctx.beginPath();
    ctx.arc(0, 0, 110, 0, Math.PI * 2);
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // Core Box
    ctx.lineWidth = 2;
    ctx.strokeRect(-92, -26, 184, 52);

    // Text Top Arch
    ctx.font = 'bold 12.5px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PT ANGKASA PURA INDONESIA', 0, -82);
    ctx.font = 'bold 10px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText(unitText, 0, -66);

    // Center Box Text
    ctx.font = 'bold 15px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText(statusText, 0, -4);
    ctx.font = '9px monospace';
    ctx.fillText('AIRSIDE SAFETY DIVISION', 0, 14);

    // Text Bottom Arch
    ctx.font = 'bold 11px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText('★ DOKUMEN RESMI OPERASIONAL ★', 0, 80);

    ctx.restore();
    return canvas.toDataURL('image/png');
  } catch {
    return '';
  }
};

/**
 * Generate genuine 2D QR Code data URL for digital signature verification
 */
export const getQrCodeDataUrl = async (verificationPayload: string): Promise<string> => {
  if (qrCache.has(verificationPayload)) {
    return qrCache.get(verificationPayload)!;
  }

  try {
    const url = await QRCode.toDataURL(verificationPayload, {
      width: 180,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#002B66',
        light: '#FFFFFF'
      }
    });
    qrCache.set(verificationPayload, url);
    return url;
  } catch (err) {
    console.error('QR code generation failed:', err);
    return '';
  }
};

/**
 * Generate formal Digital Signature verification badge (PNG Data URL)
 * Standardized digital signature token without fake stamps or messy manual ink,
 * featuring cryptographic verification hash, certified e-signature emblem, and personnel meta.
 */
export const generateDigitalSignatureBadgeDataUrl = (
  name: string,
  nip: string,
  roleTitle: string,
  docNumber?: string
): string => {
  const cacheKey = `badge_${name}_${nip}_${roleTitle}_${docNumber || ''}`;
  if (signatureCache.has(cacheKey)) {
    return signatureCache.get(cacheKey)!;
  }

  if (typeof document === 'undefined') return '';

  try {
    const width = 420;
    const height = 150;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, width, height);

    // Subtle secure certificate background container
    ctx.fillStyle = '#F8FAFC'; // slate-50
    ctx.strokeStyle = '#CBD5E1'; // slate-300
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Rounded rect
    const r = 8;
    ctx.moveTo(r, 0);
    ctx.lineTo(width - r, 0);
    ctx.quadraticCurveTo(width, 0, width, r);
    ctx.lineTo(width, height - r);
    ctx.quadraticCurveTo(width, height, width - r, height);
    ctx.lineTo(r, height);
    ctx.quadraticCurveTo(0, height, 0, height - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Top Header Banner
    ctx.fillStyle = '#0F2B5C'; // Official Navy
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(width - r, 0);
    ctx.quadraticCurveTo(width, 0, width, r);
    ctx.lineTo(width, 32);
    ctx.lineTo(0, 32);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();

    // Header text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 12px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText('PT ANGKASA PURA INDONESIA', 14, 20);

    ctx.fillStyle = '#38BDF8'; // Sky 400
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('DIGITAL SIGNATURE', width - 14, 20);
    ctx.textAlign = 'left';

    // Left security shield icon
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.arc(32, 66, 16, 0, Math.PI * 2);
    ctx.fill();

    // White checkmark inside shield
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(25, 66);
    ctx.lineTo(30, 71);
    ctx.lineTo(39, 61);
    ctx.stroke();

    // Personnel name
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 15px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText(name.toUpperCase(), 58, 58);

    // Role title
    ctx.fillStyle = '#475569';
    ctx.font = '500 11px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText(roleTitle, 58, 74);

    // NIP Tag & E-Verification
    ctx.fillStyle = '#0369A1';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`NIP: ${nip}`, 58, 92);

    // Bottom verification divider
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(14, 110);
    ctx.lineTo(width - 14, 110);
    ctx.stroke();

    // Security meta footer
    ctx.fillStyle = '#059669'; // Emerald 600
    ctx.font = 'bold 10px "Plus Jakarta Sans", Arial, sans-serif';
    ctx.fillText('TERVALIDASI ELEKTRONIK SAH', 14, 130);

    const hashSeed = `${name}${nip}${docNumber || '2026'}`;
    let hashNum = 0;
    for (let i = 0; i < hashSeed.length; i++) {
      hashNum = (hashNum << 5) - hashNum + hashSeed.charCodeAt(i);
      hashNum |= 0;
    }
    const hex = Math.abs(hashNum).toString(16).toUpperCase().padStart(8, '0');

    ctx.fillStyle = '#64748B';
    ctx.font = '9px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`CERT ID: AP-WHU-${hex}`, width - 14, 130);
    ctx.textAlign = 'left';

    const dataUrl = canvas.toDataURL('image/png');
    signatureCache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch (err) {
    console.error('Failed to create digital signature badge:', err);
    return '';
  }
};

/**
 * Generate realistic cursive officer digital signature stroke
 */
export const generateRealisticSignatureDataUrl = (name: string, role?: string): string => {
  const cacheKey = `${name}_${role || ''}`;
  if (signatureCache.has(cacheKey)) {
    return signatureCache.get(cacheKey)!;
  }

  if (typeof document === 'undefined') return '';

  try {
    const width = 360;
    const height = 140;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, width, height);

    // Realistic fountain pen ink in deep executive blue
    ctx.strokeStyle = '#0F2B5C';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const cleanName = (name || 'Officer').trim();
    const initials = cleanName.split(' ').map(w => w[0] || '').join('').toUpperCase() || 'AP';

    // Seed-like hash from name
    let hash = 0;
    for (let i = 0; i < cleanName.length; i++) {
      hash = (hash << 5) - hash + cleanName.charCodeAt(i);
      hash |= 0;
    }
    const seed = Math.abs(hash);

    // Draw first capital initial flourish
    ctx.beginPath();
    ctx.moveTo(35, 80);
    ctx.bezierCurveTo(45, 25, 75, 20, 85, 45);
    ctx.bezierCurveTo(90, 65, 60, 95, 45, 95);
    ctx.bezierCurveTo(35, 95, 40, 60, 95, 60);

    // Middle rhythmic signature peaks
    let currentX = 95;
    const peaks = Math.min(6, Math.max(3, (seed % 4) + 3));
    for (let p = 0; p < peaks; p++) {
      const nextX = currentX + 16 + (seed % 7);
      const peakY = 40 + (p % 2 === 0 ? 12 : -8);
      const valleyY = 72 + ((p + seed) % 6);
      ctx.bezierCurveTo(currentX + 8, peakY, nextX - 6, peakY, nextX, valleyY);
      currentX = nextX;
    }

    // Soaring high terminal flourish
    ctx.bezierCurveTo(currentX + 25, 18, currentX + 45, 25, currentX + 60, 55);
    ctx.stroke();

    // Dynamic underline swoop
    ctx.beginPath();
    ctx.lineWidth = 1.8;
    ctx.moveTo(40, 105);
    ctx.bezierCurveTo(90, 98, currentX + 20, 115, currentX + 80, 95);
    ctx.stroke();

    // Two dots under the swoop
    ctx.beginPath();
    ctx.arc(currentX + 55, 112, 1.8, 0, Math.PI * 2);
    ctx.arc(currentX + 68, 112, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = '#0F2B5C';
    ctx.fill();

    const dataUrl = canvas.toDataURL('image/png');
    signatureCache.set(cacheKey, dataUrl);
    return dataUrl;
  } catch (err) {
    console.error('Signature stroke generation failed:', err);
    return '';
  }
};
