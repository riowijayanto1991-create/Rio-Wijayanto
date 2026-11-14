import jsPDF from 'jspdf';
import autoTable, { CellDef, RowInput } from 'jspdf-autotable';
import { PatrolReport, OccurrenceReport, WildlifeStrikeReport, VehicleCheckReport, ReportSignatures } from '../types';
import { 
  getSoekarnoHattaLogoDataUrl, 
  getAirsideSafetySealDataUrl, 
  getQrCodeDataUrl, 
  generateRealisticSignatureDataUrl 
} from './airportAssets';
import { lookupPersonnelNip } from './personnelHelper';

// Theme color definitions for reports
interface ReportTheme {
  primary: [number, number, number];
  secondary: [number, number, number];
  tint: [number, number, number];
  border: [number, number, number];
  badgeBg: [number, number, number];
  badgeText: [number, number, number];
}

const THEMES: Record<'strike' | 'occurrence' | 'patrol' | 'vehicle', ReportTheme> = {
  strike: {
    primary: [185, 28, 28],      // Red 700
    secondary: [153, 27, 27],    // Red 800
    tint: [254, 242, 242],       // Red 50
    border: [252, 165, 165],     // Red 300
    badgeBg: [254, 226, 226],    // Red 100
    badgeText: [153, 27, 27]     // Red 800
  },
  occurrence: {
    primary: [180, 83, 9],       // Amber 700
    secondary: [146, 64, 14],    // Amber 800
    tint: [255, 251, 235],       // Amber 50
    border: [252, 211, 77],      // Amber 300
    badgeBg: [254, 243, 199],    // Amber 100
    badgeText: [146, 64, 14]     // Amber 800
  },
  patrol: {
    primary: [2, 132, 199],      // Sky 600
    secondary: [3, 105, 161],    // Sky 700
    tint: [240, 249, 255],       // Sky 50
    border: [186, 230, 253],     // Sky 200
    badgeBg: [224, 242, 254],    // Sky 100
    badgeText: [3, 105, 161]     // Sky 700
  },
  vehicle: {
    primary: [15, 118, 110],     // Teal 700
    secondary: [19, 78, 74],     // Teal 900
    tint: [240, 253, 250],       // Teal 50
    border: [153, 246, 228],     // Teal 200
    badgeBg: [204, 251, 241],    // Teal 100
    badgeText: [17, 94, 89]      // Teal 800
  }
};

/**
 * Format string options safely without unicode symbols that cause corrupted glyphs in standard jsPDF fonts
 */
const formatSafeCheck = (checked: boolean, label: string): string => {
  return `${checked ? '[X]' : '[  ]'} ${label}`;
};

/**
 * Clean helpers for autoTable cells with strict TypeScript styling
 */
const labelCell = (content: string, colSpan = 1, width?: number): CellDef => ({
  content: content || '',
  colSpan,
  styles: {
    fontStyle: 'bold',
    fillColor: [248, 250, 252],
    textColor: [51, 65, 85],
    ...(width ? { cellWidth: width } : {})
  }
});

const valueCell = (
  content: string,
  colSpan = 1,
  isBold = false,
  textColor?: [number, number, number]
): CellDef => ({
  content: content && content.trim().length > 0 ? content : '-',
  colSpan,
  styles: {
    fontStyle: isBold ? 'bold' : 'normal',
    textColor: textColor || [15, 23, 42]
  }
});

/**
 * Helper to ensure vertical room before printing a block, adding a new page if necessary
 */
const ensureSpace = (doc: jsPDF, currentY: number, neededHeight: number, topMargin = 22): number => {
  if (currentY + neededHeight > 272) {
    doc.addPage();
    return topMargin;
  }
  return currentY;
};

/**
 * Draw official letterhead / Kop Surat PT Angkasa Pura Indonesia
 */
const drawOfficialHeader = (
  doc: jsPDF,
  title: string,
  docNumber: string,
  status: string,
  theme: ReportTheme,
  createdAt?: string,
  standardRef = 'ICAO ANNEX 14 & DOC 9137 PART 3'
): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 9.5;

  // 1. Draw Official Soekarno-Hatta International Airport Logo (Left)
  try {
    const logoUrl = getSoekarnoHattaLogoDataUrl();
    if (logoUrl) {
      doc.addImage(logoUrl, 'PNG', 14, y - 0.5, 44, 12.5);
    }
  } catch (e) {
    console.warn('Failed to draw Soekarno-Hatta logo:', e);
  }

  // 2. Draw Official Airside Safety / WHU Crest Seal (Right)
  try {
    const sealUrl = getAirsideSafetySealDataUrl();
    if (sealUrl) {
      doc.addImage(sealUrl, 'PNG', pageWidth - 14 - 15, y - 1, 15, 15);
    }
  } catch (e) {
    console.warn('Failed to draw Airside seal:', e);
  }

  // 3. Central Formal Airport Institution Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(0, 43, 102); // PT Angkasa Pura Navy #002B66
  doc.text('PT ANGKASA PURA INDONESIA', pageWidth / 2, y + 2.5, { align: 'center' });

  y += 5.5;
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text('AIRPORT OPERATION, SAFETY & ARFF DIVISION', pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFontSize(7.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
  doc.text('WILDLIFE HAZARD MANAGEMENT UNIT (WHU)', pageWidth / 2, y, { align: 'center' });

  y += 3.8;
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`STANDAR OPERASIONAL: ${standardRef} | KP 434 DIRJEN HUBUD`, pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  // 4. Document Title Banner Box
  doc.setFillColor(theme.tint[0], theme.tint[1], theme.tint[2]);
  doc.setDrawColor(theme.border[0], theme.border[1], theme.border[2]);
  doc.setLineWidth(0.4);
  const bannerWidth = 146;
  const bannerHeight = 7.5;
  doc.roundedRect((pageWidth - bannerWidth) / 2, y, bannerWidth, bannerHeight, 1.2, 1.2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
  doc.text(title, pageWidth / 2, y + 5.2, { align: 'center' });

  y += bannerHeight + 3.2;

  // 5. Document Info Bar with Chronological Metadata
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);

  let createdStr = '';
  if (createdAt) {
    const cd = new Date(createdAt);
    if (!isNaN(cd.getTime())) {
      createdStr = `${cd.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}, ${cd.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
    }
  }

  const printDateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const metaSegments: string[] = [
    `No. Dokumen: ${docNumber || '-'}`,
    createdStr ? `Waktu Laporan: ${createdStr}` : '',
    `Tgl Cetak: ${printDateStr}`,
    `Status: ${status || 'Tercatat & Sah'}`
  ].filter(Boolean);

  const infoText = metaSegments.join('   |   ');
  doc.text(infoText, pageWidth / 2, y, { align: 'center' });

  y += 3.2;
  // 6. Decorative Dual Line
  doc.setDrawColor(theme.primary[0], theme.primary[1], theme.primary[2]);
  doc.setLineWidth(0.9);
  doc.line(14, y, pageWidth - 14, y);

  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.25);
  doc.line(14, y + 1.2, pageWidth - 14, y + 1.2);

  return y + 5;
};

/**
 * Draw a clean section heading banner with an accent left strip
 */
const drawSectionBanner = (
  doc: jsPDF,
  currentY: number,
  title: string,
  theme: ReportTheme
): number => {
  const y = ensureSpace(doc, currentY, 14);
  const pageWidth = doc.internal.pageSize.getWidth();
  const bannerWidth = pageWidth - 28;
  const bannerHeight = 5.6;

  // Banner background
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.25);
  doc.rect(14, y, bannerWidth, bannerHeight, 'FD');

  // Left accent strip
  doc.setFillColor(theme.primary[0], theme.primary[1], theme.primary[2]);
  doc.rect(14, y, 2.5, bannerHeight, 'F');

  // Title text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(title, 19, y + 4);

  return y + bannerHeight + 2.5;
};

/**
 * Draw multi-line narrative card (for Kronologi, Catatan, Ringkasan)
 */
const drawNarrativeCard = (
  doc: jsPDF,
  startY: number,
  text: string,
  emptyPlaceholder = 'Tidak ada catatan narasi'
): number => {
  const content = text && text.trim().length > 0 ? text.trim() : emptyPlaceholder;
  
  autoTable(doc, {
    startY,
    theme: 'grid',
    body: [[content]],
    styles: {
      fontSize: 8.2,
      cellPadding: 3,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { fillColor: [255, 255, 255] }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable attaches lastAutoTable
  return doc.lastAutoTable.finalY + 3.5;
};

/**
 * Draw formal 2-column signature / validation box with digital signatures, stamp & QR code verification
 */
const drawSignatureBlock = async (
  doc: jsPDF,
  currentY: number,
  verifiedByTitle: string,
  verifiedByName: string,
  createdByTitle: string,
  createdByName: string,
  theme: ReportTheme,
  docNumber: string,
  signatures?: ReportSignatures
) => {
  const y = ensureSpace(doc, currentY, 46);

  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = (pageWidth - 28 - 6) / 2;
  const boxHeight = 38;

  // ==========================================
  // Box 1: Verifikasi / Supervisor
  // ==========================================
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, boxWidth, boxHeight, 1.2, 1.2, 'FD');

  // Header Box 1
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, boxWidth, 6.5, 1.2, 1.2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text('DIVERIFIKASI OLEH:', 18, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(verifiedByTitle, 18, y + 10.5);

  const supervisorSig = signatures?.supervisor;
  const supName = supervisorSig?.signerName || verifiedByName || 'RACHMADITYA';
  const supNipp = supervisorSig?.signerNipp || lookupPersonnelNip(supName, 'supervisor');
  const supSigImg = supervisorSig?.signatureDataUrl || generateRealisticSignatureDataUrl(supName, verifiedByTitle);

  // Draw Digital Signature stroke
  if (supSigImg) {
    try {
      doc.addImage(supSigImg, 'PNG', 18, y + 11, 36, 14);
    } catch {
      // ignore
    }
  }

  // Draw 2D QR Code Verification Matrix
  const supQrPayload = `PT ANGKASA PURA INDONESIA\nVERIFIED SUPERVISOR\nDoc: ${docNumber}\nSigner: ${supName}\nNIP: ${supNipp}\nSecurity: E-VERIFIED`;
  try {
    const qrUrl = await getQrCodeDataUrl(supQrPayload);
    if (qrUrl) {
      doc.addImage(qrUrl, 'PNG', 14 + boxWidth - 18, y + 8.5, 14, 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(30, 41, 59);
      doc.text('E-VERIFIED', 14 + boxWidth - 11, y + 24.5, { align: 'center' });
    }
  } catch {
    // ignore
  }

  // Supervisor Name & NIP (clean, without stamp)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${supName} )`, 18, y + 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIP: ${supNipp}`, 18, y + 33.5);

  // ==========================================
  // Box 2: Pelapor / Lead Investigator (POD)
  // ==========================================
  const box2X = 14 + boxWidth + 6;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(box2X, y, boxWidth, boxHeight, 1.2, 1.2, 'FD');

  // Header Box 2
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(box2X, y, boxWidth, 6.5, 1.2, 1.2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
  doc.text('PELAPOR / PETUGAS DINAS:', box2X + 4, y + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(createdByTitle, box2X + 4, y + 10.5);

  const officerSig = signatures?.officer;
  const offName = officerSig?.signerName || createdByName || 'RIO WIJAYANTO';
  const offNipp = officerSig?.signerNipp || lookupPersonnelNip(offName, 'officer');
  const offSigImg = officerSig?.signatureDataUrl || generateRealisticSignatureDataUrl(offName, createdByTitle);

  // Draw Digital Signature stroke
  if (offSigImg) {
    try {
      doc.addImage(offSigImg, 'PNG', box2X + 4, y + 11, 36, 14);
    } catch {
      // ignore
    }
  }

  // Draw 2D QR Code Verification Matrix Box 2
  const offQrPayload = `PT ANGKASA PURA INDONESIA\nOFFICER DIGITAL SIGNATURE\nDoc: ${docNumber}\nOfficer: ${offName}\nNIP: ${offNipp}\nRole: ${createdByTitle}`;
  try {
    const qrUrl2 = await getQrCodeDataUrl(offQrPayload);
    if (qrUrl2) {
      doc.addImage(qrUrl2, 'PNG', box2X + boxWidth - 18, y + 8.5, 14, 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
      doc.text('E-VERIFIED', box2X + boxWidth - 11, y + 24.5, { align: 'center' });
    }
  } catch {
    // ignore
  }

  // Officer Name & NIP (clean, without stamp)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${offName} )`, box2X + 4, y + 29);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIP: ${offNipp}`, box2X + 4, y + 33.5);
};

/**
 * Add running headers (on subsequent pages) and standardized footers to all pages
 */
const finalizeDocumentPages = (
  doc: jsPDF,
  docTitle: string,
  docNumber: string
) => {
  // @ts-expect-error internal pages array
  const totalPages = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // Running Header on pages > 1
    if (i > 1) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`PT ANGKASA PURA INDONESIA  |  ${docTitle}`, 14, 11);
      doc.text(`No. ${docNumber || '-'} (Hal. ${i})`, pageWidth - 14, 11, { align: 'right' });
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.25);
      doc.line(14, 13, pageWidth - 14, 13);
    }

    // Official Running Footer on all pages
    const footerY = pageHeight - 11;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(14, footerY - 2, pageWidth - 14, footerY - 2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text('Dokumen Resmi Airside Safety - Wildlife Hazard Management Program (ICAO Annex 14 / Doc 9137)', 14, footerY + 2);
    doc.setFont('helvetica', 'bold');
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, footerY + 2, { align: 'right' });
  }
};

/**
 * Draw up to 5 documentation photos and accompanying description
 */
const drawPhotoDocumentation = (
  doc: jsPDF,
  currentY: number,
  photos: string[] | undefined,
  keterangan: string | undefined,
  sectionTitle: string,
  theme: ReportTheme
): number => {
  const validPhotos = (photos || []).filter(p => typeof p === 'string' && p.trim().length > 0).slice(0, 5);
  const hasPhotos = validPhotos.length > 0;
  const hasKeterangan = !!(keterangan && keterangan.trim().length > 0);

  if (!hasPhotos && !hasKeterangan) {
    return currentY;
  }

  // Draw Section Banner
  let y = drawSectionBanner(doc, currentY, sectionTitle, theme);

  // If keterangan is provided, render description card
  if (hasKeterangan) {
    autoTable(doc, {
      startY: y,
      theme: 'grid',
      body: [
        [
          labelCell('Catatan / Keterangan Dokumentasi', 1, 44),
          valueCell(keterangan.trim())
        ]
      ],
      styles: { fontSize: 8, cellPadding: 2.2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
      columnStyles: {
        0: { cellWidth: 44, fontStyle: 'bold', fillColor: [248, 250, 252] },
        1: { cellWidth: 138 }
      },
      margin: { left: 14, right: 14 }
    });
    // @ts-expect-error autoTable adds lastAutoTable
    y = doc.lastAutoTable.finalY + 3.5;
  }

  // If photos exist, render the photo gallery cards
  if (hasPhotos) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const availableWidth = pageWidth - (margin * 2); // 182mm
    const gap = 6;
    const colWidth = (availableWidth - gap) / 2; // 88mm
    const cardHeight = 56;
    const imgHeight = 47;

    for (let i = 0; i < validPhotos.length; i += 2) {
      y = ensureSpace(doc, y, cardHeight + 6);

      const p1 = validPhotos[i];
      const p2 = i + 1 < validPhotos.length ? validPhotos[i + 1] : null;

      // Draw Photo 1 Card
      const p1X = margin;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(p1X, y, colWidth, cardHeight, 1.5, 1.5, 'FD');

      try {
        doc.addImage(p1, 'JPEG', p1X + 1.5, y + 1.5, colWidth - 3, imgHeight, undefined, 'FAST');
      } catch {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184);
        doc.text('[Dokumentasi Foto Terlampir]', p1X + (colWidth / 2), y + (imgHeight / 2), { align: 'center' });
      }

      // Caption bar 1
      doc.setFillColor(theme.tint[0], theme.tint[1], theme.tint[2]);
      doc.roundedRect(p1X + 1.5, y + imgHeight + 2, colWidth - 3, 4.5, 0.5, 0.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
      doc.text(`FOTO BUKTI ${i + 1}  •  DOKUMENTASI RESMI WHU`, p1X + 3, y + imgHeight + 5.2);

      // Draw Photo 2 Card (if exists)
      if (p2) {
        const p2X = margin + colWidth + gap;
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.3);
        doc.roundedRect(p2X, y, colWidth, cardHeight, 1.5, 1.5, 'FD');

        try {
          doc.addImage(p2, 'JPEG', p2X + 1.5, y + 1.5, colWidth - 3, imgHeight, undefined, 'FAST');
        } catch {
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          doc.setTextColor(148, 163, 184);
          doc.text('[Dokumentasi Foto Terlampir]', p2X + (colWidth / 2), y + (imgHeight / 2), { align: 'center' });
        }

        // Caption bar 2
        doc.setFillColor(theme.tint[0], theme.tint[1], theme.tint[2]);
        doc.roundedRect(p2X + 1.5, y + imgHeight + 2, colWidth - 3, 4.5, 0.5, 0.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
        doc.text(`FOTO BUKTI ${i + 2}  •  DOKUMENTASI RESMI WHU`, p2X + 3, y + imgHeight + 5.2);
      }

      y += cardHeight + 3.5;
    }
  }

  return y + 2;
};

// ==========================================
// 1. EXPORT LAPORAN PATROLI / INSPEKSI
// ==========================================
export const exportPatrolPDF = async (report: PatrolReport, sequentialDocNumber?: string, createdAtOverride?: string) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const theme = THEMES.patrol;
  const docNumber = sequentialDocNumber || report.reportNumber;
  const creationTime = createdAtOverride || report.createdAt;

  // Header
  let y = drawOfficialHeader(
    doc,
    'WOR — WILDLIFE OBSERVATION REPORT',
    docNumber,
    'Tervalidasi',
    theme,
    creationTime
  );

  // I. DATA KEGIATAN
  y = drawSectionBanner(doc, y, 'I. DATA KEGIATAN & OPERASIONAL', theme);
  const kegiatanData: RowInput[] = [
    [
      labelCell('Hari / Tanggal'),
      valueCell(report.hariTanggal),
      labelCell('Waktu Patroli'),
      valueCell(report.waktuPatroli)
    ],
    [
      labelCell('Pleton'),
      valueCell(report.pleton),
      labelCell('Durasi Patroli'),
      valueCell(report.durasi)
    ],
    [
      labelCell('Dinas Shift'),
      valueCell(report.dinas),
      labelCell('Cuaca / Suhu'),
      valueCell(`${report.cuaca || '-'} / ${report.suhu || '-'}`)
    ],
    [
      labelCell('Petugas POD'),
      valueCell(report.pod && report.pod.length > 0 ? report.pod.join(', ') : '-', 3)
    ],
    [
      labelCell('Situasi Operasional'),
      valueCell(report.situasiOperasional || 'Lalu lintas udara lancar, runway beroperasi normal', 3)
    ]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: kegiatanData,
    styles: { fontSize: 8, cellPadding: 2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 55 },
      2: { cellWidth: 36 },
      3: { cellWidth: 55 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 3.5;

  // II. RUTE PATROLI & GEOSPASIAL
  y = drawSectionBanner(doc, y, 'II. RUTE PATROLI & PEMERIKSAAN GEOSPASIAL', theme);
  const routeRows: RowInput[] = [
    [
      labelCell('Rute Area Patroli', 1, 36),
      valueCell(report.rutePatroli, 3)
    ],
    [
      labelCell('Fokus Grid'),
      valueCell(report.gridLocation, 3)
    ]
  ];

  if (report.coordinates) {
    const coords = report.coordinates;
    const isOk = coords.isWithinOperationalRadius;
    const statusText = isOk
      ? `TERVERIFIKASI: Berada di dalam radius operasional maks ${coords.maxRadiusAllowedKm} km`
      : `PERINGATAN: Di luar radius operasional batas ${coords.maxRadiusAllowedKm} km (${coords.confirmedOutsideReason || 'Konfirmasi petugas'})`;

    routeRows.push([
      labelCell('Koordinat'),
      valueCell(`Lat: ${coords.latitude.toFixed(5)}   |   Long: ${coords.longitude.toFixed(5)}`),
      labelCell('Jarak ARP'),
      valueCell(`${coords.distanceFromArpKm.toFixed(2)} km (${coords.cardinalDirection || 'Sektor Bandara'})`)
    ]);
    routeRows.push([
      labelCell('Status Radius'),
      valueCell(statusText, 3, true, isOk ? [3, 105, 161] : [185, 28, 28])
    ]);
  }

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: routeRows,
    styles: { fontSize: 8, cellPadding: 2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 55 },
      2: { cellWidth: 36 },
      3: { cellWidth: 55 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 3.5;

  // III. TEMUAN SATWA LIAR
  y = drawSectionBanner(doc, y, 'III. HASIL OBSERVASI TEMUAN SATWA LIAR', theme);
  const satwaRows = (report.temuanSatwa || []).map((item, idx) => [
    `${idx + 1}`,
    item.spesies,
    `${item.jumlah} ekor`,
    item.keterangan || '-'
  ]);

  if (satwaRows.length === 0) {
    satwaRows.push(['-', 'Nihil / Tidak ditemukan aktivitas satwa liar', '0 ekor', 'Area aman terkendali']);
  }

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    head: [['No.', 'Jenis / Nama Spesies Satwa', 'Jumlah', 'Keterangan & Lokasi Spesifik']],
    body: satwaRows,
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 2.2
    },
    bodyStyles: { fontSize: 8, cellPadding: 2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 70 },
      2: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 78 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 2;

  // Summary badge for total satwa
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(3, 105, 161);
  doc.text(`Total Populasi Satwa Teramati: ${report.totalPopulasiTeramati || 0} ekor`, 15, y + 2.5);
  y += 5.5;

  // IV. MONITORING HABITAT DAN VEGETASI
  y = drawSectionBanner(doc, y, 'IV. MONITORING HABITAT DAN VEGETASI', theme);
  const habitatRows: RowInput[] = [
    [labelCell('Kondisi Vegetasi / Rumput', 1, 44), valueCell(report.kondisiVegetasi)],
    [labelCell('Kondisi Drainase / Genangan'), valueCell(report.kondisiDrainase)],
    [labelCell('Potensi Wildlife Attractant'), valueCell(report.potensiAttractant)],
    [labelCell('Habitat Management'), valueCell(report.habitatManagement)],
    [labelCell('Area Perhatian Khusus'), valueCell(report.areaPerhatian)]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: habitatRows,
    styles: { fontSize: 8, cellPadding: 2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 44 },
      1: { cellWidth: 138 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 3.5;

  // V. TINDAKAN PENGENDALIAN
  y = drawSectionBanner(doc, y, 'V. TINDAKAN PENGENDALIAN SATWA', theme);
  const lethalText = report.selectiveLethal?.items && report.selectiveLethal.items.length > 0
    ? report.selectiveLethal.items.map(it => `• ${it.spesies}: ${it.jumlah} ekor`).join('\n') + `\n(Total: ${report.selectiveLethal.totalLethal || 0} ekor)`
    : 'Nihil / Tidak ada selective lethal control yang dilakukan';

  const pengendalianRows: RowInput[] = [
    [
      labelCell('5.1 Non-Lethal Control', 1, 44),
      valueCell(`Mobile Dispersal: ${report.nonLethal?.mobileDispersal || '-'}\nAuditory Deterrent: ${report.nonLethal?.auditoryDeterrent || '-'}\nVisual Deterrent: ${report.nonLethal?.visualDeterrent || '-'}\nFlyway Monitoring: ${report.nonLethal?.monitoringFlyway || '-'}`)
    ],
    [
      labelCell('5.2 Selective Lethal'),
      valueCell(lethalText)
    ]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: pengendalianRows,
    styles: { fontSize: 8, cellPadding: 2.2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 44 },
      1: { cellWidth: 138 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 3.5;

  // VI. KESIMPULAN & VII. MITIGASI
  y = drawSectionBanner(doc, y, 'VI. KESIMPULAN & REKOMENDASI MITIGASI', theme);
  const kesimpulanText = report.kesimpulan && report.kesimpulan.length > 0
    ? report.kesimpulan.map((k, i) => `${i + 1}. ${k}`).join('\n')
    : '-';
  const mitigasiText = report.mitigasi && report.mitigasi.length > 0
    ? report.mitigasi.map((m, i) => `${i + 1}. ${m}`).join('\n')
    : '-';

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: [
      [labelCell('Kesimpulan Shift', 1, 44), valueCell(kesimpulanText)],
      [labelCell('Rencana Mitigasi'), valueCell(mitigasiText)]
    ],
    styles: { fontSize: 8, cellPadding: 2.5, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 44 },
      1: { cellWidth: 138 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 5;

  // VIII. DOKUMENTASI FOTO & KETERANGAN
  y = drawPhotoDocumentation(
    doc,
    y,
    report.fotos,
    report.keteranganDokumentasi,
    'VIII. DOKUMENTASI FOTO LAPANGAN & BUKTI OPERASIONAL',
    theme
  );

  // Pengesahan
  await drawSignatureBlock(
    doc,
    y,
    'Wildlife Hazard Department Head',
    'RACHMADITYA',
    'Person on Duty (POD) Unit WHU',
    report.pod && report.pod.length > 0 ? report.pod.join(' & ') : 'Petugas WHU',
    theme,
    docNumber,
    report.signatures
  );

  finalizeDocumentPages(doc, 'WOR — WILDLIFE OBSERVATION REPORT', docNumber);
  doc.save(`${(docNumber || 'WHU_WOR').replace(/\//g, '_')}_WOR.pdf`);
};

// ==========================================
// 2. EXPORT LAPORAN WILDLIFE OCCURRENCE (WHR)
// ==========================================
export const exportOccurrencePDF = async (report: OccurrenceReport, sequentialDocNumber?: string, createdAtOverride?: string) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const theme = THEMES.occurrence;
  const docNumber = sequentialDocNumber || report.reportNumber;
  const creationTime = createdAtOverride || report.createdAt;

  // Header
  let y = drawOfficialHeader(
    doc,
    'WHR — WILDLIFE HAZARD REPORT',
    docNumber,
    report.status || 'Tercatat',
    theme,
    creationTime
  );

  // I. DATA OCCURRENCE
  y = drawSectionBanner(doc, y, 'I. DATA OCCURRENCE & LOKASI', theme);
  const dataOcc: RowInput[] = [
    [
      labelCell('Hari / Tanggal'),
      valueCell(report.hariTanggal),
      labelCell('Waktu Kejadian'),
      valueCell(report.waktuKejadian)
    ],
    [
      labelCell('Pleton / Dinas'),
      valueCell(`${report.pleton || '-'} / ${report.dinas || '-'}`),
      labelCell('Petugas POD'),
      valueCell(report.pod)
    ],
    [
      labelCell('Lokasi Kejadian'),
      valueCell(`${report.lokasi || '-'}${report.gridLocation ? ` (${report.gridLocation})` : ''}`),
      labelCell('Runway / Area'),
      valueCell(report.runwayTaxiwayArea)
    ],
    [
      labelCell('Jenis Occurrence'),
      valueCell(report.jenisOccurrence, 3)
    ]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: dataOcc,
    styles: { fontSize: 8, cellPadding: 2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 55 },
      2: { cellWidth: 36 },
      3: { cellWidth: 55 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 3.5;

  // II. KRONOLOGI KEJADIAN
  y = drawSectionBanner(doc, y, 'II. KRONOLOGI KEJADIAN (NARRATIVE REPORT)', theme);
  y = drawNarrativeCard(doc, y, report.kronologi);

  // III. IDENTIFIKASI SATWA & IV. KONDISI OPERASIONAL
  y = drawSectionBanner(doc, y, 'III. IDENTIFIKASI SATWA & KONDISI OPERASIONAL', theme);
  const ks = report.kondisiSatwa;
  const kondisiSatwaText = [
    formatSafeCheck(ks === 'Hidup', 'Hidup'),
    formatSafeCheck(ks === 'Mati', 'Mati'),
    formatSafeCheck(ks === 'Terluka', 'Terluka'),
    formatSafeCheck(ks === 'Tidak teridentifikasi', 'Tidak Teridentifikasi')
  ].join('    ');

  const satwaOperasional: RowInput[] = [
    [
      labelCell('Jenis Satwa'),
      valueCell(report.jenisSatwa),
      labelCell('Jumlah'),
      valueCell(`${report.jumlahSatwa || 0} ekor`)
    ],
    [
      labelCell('Kondisi Satwa'),
      valueCell(kondisiSatwaText, 3)
    ],
    [
      labelCell('Aktivitas / Pola'),
      valueCell(report.aktivitasPergerakan, 3)
    ],
    [
      labelCell('Cuaca / Suhu'),
      valueCell(`${report.cuaca || '-'} / ${report.suhu || '-'}`),
      labelCell('Jarak Pandang'),
      valueCell(report.visibility)
    ],
    [
      labelCell('Kondisi Runway'),
      valueCell(report.kondisiRunwayTaxiway),
      labelCell('Pergerakan Pesawat'),
      valueCell(report.aktivitasPergerakanPesawat)
    ]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: satwaOperasional,
    styles: { fontSize: 8, cellPadding: 2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 55 },
      2: { cellWidth: 36 },
      3: { cellWidth: 55 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 3.5;

  // V. POTENSI HAZARD & VI. TINDAKAN
  y = drawSectionBanner(doc, y, 'IV. ANALISIS HAZARD & TINDAKAN PENANGANAN', theme);
  const hazardTindakan: RowInput[] = [
    [
      labelCell('Potensi Hazard', 1, 42),
      valueCell(report.jenisPotensiHazard)
    ],
    [
      labelCell('Dampak Operasi'),
      valueCell(report.potensiDampakOperasi)
    ],
    [
      labelCell('Tindakan Dispersal'),
      valueCell(`• Monitoring: ${report.tindakan?.deteksiMonitoring || '-'}\n• Mobile Dispersal: ${report.tindakan?.mobileDispersal || '-'}\n• Deterrent: ${report.tindakan?.auditoryVisualDeterrent || '-'}\n• Koordinasi ATC/AMC: ${report.tindakan?.koordinasi || '-'}`)
    ]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: hazardTindakan,
    styles: { fontSize: 8, cellPadding: 2.2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 140 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 3.5;

  // VII. HASIL PENANGANAN & STATUS
  y = drawSectionBanner(doc, y, 'V. HASIL PENANGANAN & REKOMENDASI MITIGASI', theme);
  const st = report.status;
  const statusCheck = [
    formatSafeCheck(st === 'Selesai', 'Selesai'),
    formatSafeCheck(st === 'Dalam Monitoring', 'Dalam Monitoring'),
    formatSafeCheck(st === 'Perlu Tindak Lanjut', 'Perlu Tindak Lanjut')
  ].join('     ');

  const recoText = report.rekomendasiMitigasi && report.rekomendasiMitigasi.length > 0
    ? report.rekomendasiMitigasi.map((r, i) => `${i + 1}. ${r}`).join('\n')
    : '-';

  const hasilRows: RowInput[] = [
    [
      labelCell('Hasil Penanganan', 1, 42),
      valueCell(report.hasilPenanganan)
    ],
    [
      labelCell('Status Laporan'),
      valueCell(statusCheck, 1, true, theme.primary)
    ],
    [
      labelCell('Rekomendasi / Mitigasi'),
      valueCell(recoText)
    ],
    [
      labelCell('Dokumentasi / Bukti'),
      valueCell(`Foto/Video: ${report.fotoVideoAda ? '[X] Ada' : '[  ] Tidak Ada'}   |   Keterangan: ${report.keteranganDokumentasi || '-'}`)
    ]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: hasilRows,
    styles: { fontSize: 8, cellPadding: 2.2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 140 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 5;

  // IX. DOKUMENTASI FOTO BUKTI OCCURRENCE
  y = drawPhotoDocumentation(
    doc,
    y,
    report.fotos,
    report.keteranganDokumentasi,
    'IX. DOKUMENTASI FOTO BUKTI OCCURRENCE',
    theme
  );

  // Signatures
  await drawSignatureBlock(
    doc,
    y,
    'Wildlife Hazard Department Head',
    'RACHMADITYA',
    'Person on Duty (POD) Unit WHU',
    report.pod || 'Petugas WHU',
    theme,
    docNumber,
    report.signatures
  );

  finalizeDocumentPages(doc, 'WHR — WILDLIFE HAZARD REPORT', docNumber);
  doc.save(`${(docNumber || 'WHU_WHR').replace(/\//g, '_')}_WHR.pdf`);
};

// ==========================================
// 3. EXPORT LAPORAN WILDLIFE STRIKE (WSR)
// ==========================================
export const exportStrikePDF = async (report: WildlifeStrikeReport, sequentialDocNumber?: string, createdAtOverride?: string) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const theme = THEMES.strike;
  const docNumber = sequentialDocNumber || report.reportNumber;
  const creationTime = createdAtOverride || report.createdAt;

  // Official Letterhead
  let y = drawOfficialHeader(
    doc,
    'WSR — WILDLIFE STRIKE REPORT',
    docNumber,
    report.statusLaporan || 'Final Report',
    theme,
    creationTime
  );

  // I. DATA KEJADIAN
  y = drawSectionBanner(doc, y, 'I. DATA KEJADIAN (OCCURRENCE DETAILS)', theme);
  const dataKejadian: RowInput[] = [
    [
      labelCell('Hari / Tanggal'),
      valueCell(report.hariTanggal),
      labelCell('Waktu Kejadian'),
      valueCell(report.waktuKejadian)
    ],
    [
      labelCell('Pleton / Dinas'),
      valueCell(`${report.pleton || '-'} / ${report.dinas || '-'}`),
      labelCell('Petugas POD'),
      valueCell(report.pod)
    ],
    [
      labelCell('Lokasi Kejadian'),
      valueCell(`${report.lokasi || '-'}${report.gridLocation ? ` (${report.gridLocation})` : ''}`),
      labelCell('Runway / Taxiway'),
      valueCell(report.runwayTaxiway)
    ],
    [
      labelCell('Sumber Informasi'),
      valueCell(`[ ${report.sumberInformasi || 'ATC'} ]${report.sumberInformasiLainnya ? ` - ${report.sumberInformasiLainnya}` : ''}`, 3)
    ]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: dataKejadian,
    styles: { fontSize: 8, cellPadding: 2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 55 },
      2: { cellWidth: 36 },
      3: { cellWidth: 55 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 3.5;

  // II. DATA PESAWAT
  y = drawSectionBanner(doc, y, 'II. DATA PESAWAT (AIRCRAFT DETAILS)', theme);
  const dataPesawat: RowInput[] = [
    [
      labelCell('Operator / Airline'),
      valueCell(report.operatorAirline),
      labelCell('Flight Number'),
      valueCell(report.flightNumber)
    ],
    [
      labelCell('Tipe Pesawat'),
      valueCell(report.aircraftType),
      labelCell('Registrasi (PK)'),
      valueCell(report.registration)
    ],
    [
      labelCell('Origin / Dest.'),
      valueCell(`${report.origin || '-'} / ${report.destination || '-'}`),
      labelCell('Posisi Pesawat'),
      valueCell(report.posisiPesawat)
    ]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: dataPesawat,
    styles: { fontSize: 8, cellPadding: 2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 55 },
      2: { cellWidth: 36 },
      3: { cellWidth: 55 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 3.5;

  // III. DATA WILDLIFE
  y = drawSectionBanner(doc, y, 'III. IDENTIFIKASI SATWA LIAR (WILDLIFE DETAILS)', theme);
  const idStatus = report.identifikasi;
  const identifikasiBadges = [
    formatSafeCheck(idStatus === 'Teridentifikasi', 'Teridentifikasi'),
    formatSafeCheck(idStatus === 'Belum teridentifikasi', 'Belum Teridentifikasi')
  ].join('         ');

  const kw = report.kondisiWildlife;
  const kondisiBadges = [
    formatSafeCheck(kw === 'Hidup', 'Hidup'),
    formatSafeCheck(kw === 'Mati', 'Mati'),
    formatSafeCheck(kw === 'Terluka', 'Terluka'),
    formatSafeCheck(kw === 'Carcass/Sisa', 'Carcass / Sisa Bangkai'),
    formatSafeCheck(kw === 'Tidak ditemukan', 'Tidak Ditemukan')
  ].join('   ');

  const dataWildlife: RowInput[] = [
    [
      labelCell('Jenis Satwa'),
      valueCell(report.jenisWildlife),
      labelCell('Jumlah Terkena'),
      valueCell(`${report.jumlahWildlife || 1} ekor`)
    ],
    [
      labelCell('Status Identifikasi'),
      valueCell(identifikasiBadges, 3)
    ],
    [
      labelCell('Kondisi Satwa'),
      valueCell(kondisiBadges, 3)
    ]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: dataWildlife,
    styles: { fontSize: 8, cellPadding: 2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 36 },
      1: { cellWidth: 55 },
      2: { cellWidth: 36 },
      3: { cellWidth: 55 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 3.5;

  // IV. KRONOLOGI WILDLIFE STRIKE (NARRATIVE BOX - NO OVERLAPPING!)
  y = drawSectionBanner(doc, y, 'IV. KRONOLOGI WILDLIFE STRIKE & FASE PENERBANGAN', theme);
  y = drawNarrativeCard(doc, y, report.kronologiStrike);

  // Flight Phase & Impacted Area Table
  const fp = report.fasePenerbangan;
  const flightPhaseText = [
    formatSafeCheck(fp === 'Take-off roll', 'Take-off roll'),
    formatSafeCheck(fp === 'Initial climb', 'Initial climb'),
    formatSafeCheck(fp === 'Approach', 'Approach'),
    formatSafeCheck(fp === 'Landing roll', 'Landing roll'),
    formatSafeCheck(fp === 'Taxi', 'Taxi'),
    formatSafeCheck(fp === 'Lainnya', 'Lainnya')
  ].join('    ');

  const strikeDetails: RowInput[] = [
    [
      labelCell('Fase Penerbangan', 1, 44),
      valueCell(flightPhaseText)
    ],
    [
      labelCell('Bagian Pesawat Terdampak'),
      valueCell(report.bagianPesawatTerdampak || '-', 1, true, theme.primary)
    ]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: strikeDetails,
    styles: { fontSize: 8, cellPadding: 2.2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 44 },
      1: { cellWidth: 138 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 3.5;

  // V. DAMPAK TERHADAP PESAWAT
  y = drawSectionBanner(doc, y, 'V. DAMPAK TERHADAP PESAWAT & OPERASIONAL', theme);
  const ik = report.indikasiKerusakan;
  const indikasiBadges = [
    formatSafeCheck(ik === 'Tidak ada', 'Tidak Ada Kerusakan'),
    formatSafeCheck(ik === 'Ada', 'Ada Kerusakan'),
    formatSafeCheck(ik === 'Belum diketahui', 'Belum Diketahui')
  ].join('         ');

  const dampakRows: RowInput[] = [
    [
      labelCell('Indikasi Kerusakan', 1, 44),
      valueCell(indikasiBadges, 1, true)
    ],
    [
      labelCell('Bagian Kerusakan'),
      valueCell(report.bagianKerusakan)
    ],
    [
      labelCell('Dampak Penerbangan'),
      valueCell(report.dampakPenerbangan)
    ],
    [
      labelCell('Keterangan Teknisi'),
      valueCell(report.keteranganDampak)
    ]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: dampakRows,
    styles: { fontSize: 8, cellPadding: 2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 44 },
      1: { cellWidth: 138 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 3.5;

  // VI. TINDAKAN UNIT WHU
  y = drawSectionBanner(doc, y, 'VI. TINDAKAN WILDLIFE HAZARD UNIT DI LAPANGAN', theme);
  const t = report.tindakanUnit;
  const tindakanItems: RowInput[] = [
    [labelCell('1. Penerimaan Informasi', 1, 44), valueCell(t?.penerimaanInformasi)],
    [labelCell('2. Verifikasi Lokasi Runway'), valueCell(t?.verifikasiLokasi)],
    [labelCell('3. Pengumpulan Evidence'), valueCell(t?.pengumpulanEvidence)],
    [labelCell('4. Pengamanan & Sweeping'), valueCell(t?.pengamananPembersihan)],
    [labelCell('5. Dispersal / Pengusiran'), valueCell(t?.dispersalPengendalian)],
    [labelCell('6. Koordinasi Lintas Unit'), valueCell(t?.koordinasi)],
    [labelCell('7. Dokumentasi & Tagging'), valueCell(t?.dokumentasi)]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: tindakanItems,
    styles: { fontSize: 8, cellPadding: 2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 44 },
      1: { cellWidth: 138 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 3.5;

  // VII. HASIL INVESTIGASI AWAL
  y = drawSectionBanner(doc, y, 'VII. HASIL INVESTIGASI AWAL & ANALISIS HABITAT', theme);
  const inv = report.investigasiAwal;
  const invRows: RowInput[] = [
    [labelCell('Spesies Satwa', 1, 44), valueCell(inv?.spesies)],
    [labelCell('Lokasi / Hotspot'), valueCell(inv?.lokasiHotspot)],
    [labelCell('Kondisi Habitat'), valueCell(inv?.kondisiHabitat)],
    [labelCell('Potensi Attractant'), valueCell(inv?.potensiAttractant)],
    [labelCell('Pola Lintasan (Flyway)'), valueCell(inv?.polaFlyway)],
    [labelCell('Indikasi Penyebab'), valueCell(inv?.indikasiPenyebab)]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: invRows,
    styles: { fontSize: 8, cellPadding: 2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 44 },
      1: { cellWidth: 138 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 3.5;

  // VIII. MITIGASI & TINDAK LANJUT
  y = drawSectionBanner(doc, y, 'VIII. REKOMENDASI MITIGASI & TINDAK LANJUT', theme);
  const mitigasiText = report.mitigasi && report.mitigasi.length > 0
    ? report.mitigasi.map((m, i) => `${i + 1}. ${m}`).join('\n')
    : '-';

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: [
      [labelCell('Poin Mitigasi', 1, 44), valueCell(mitigasiText)],
      [labelCell('Rekomendasi Tambahan'), valueCell(report.rekomendasi)]
    ],
    styles: { fontSize: 8, cellPadding: 2.2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 44 },
      1: { cellWidth: 138 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 3.5;

  // IX. DOKUMENTASI / EVIDENCE & X. STATUS LAPORAN
  y = drawSectionBanner(doc, y, 'IX. EVIDENCE & STATUS PENUTUPAN LAPORAN', theme);
  const ev = report.evidence;
  const evidenceChecks = [
    formatSafeCheck(!!ev?.fotoSatwaCarcass, 'Foto Carcass'),
    formatSafeCheck(!!ev?.fotoLokasi, 'Foto Lokasi'),
    formatSafeCheck(!!ev?.fotoKerusakan, 'Foto Kerusakan'),
    formatSafeCheck(!!ev?.video, 'Rekaman Video')
  ].join('     ');

  const sl = report.statusLaporan;
  const statusReportCheck = [
    formatSafeCheck(sl === 'Initial Report', 'Initial Report'),
    formatSafeCheck(sl === 'Preliminary Report', 'Preliminary Report'),
    formatSafeCheck(sl === 'Final Report', 'Final Report')
  ].join('         ');

  const evidenceStatusRows: RowInput[] = [
    [
      labelCell('Dokumentasi Fisik', 1, 44),
      valueCell(evidenceChecks)
    ],
    [
      labelCell('Catatan Evidence'),
      valueCell(ev?.evidenceLain)
    ],
    [
      labelCell('Status Laporan'),
      valueCell(statusReportCheck, 1, true, theme.primary)
    ],
    [
      labelCell('Tindak Lanjut / Info'),
      valueCell(`Tindak Lanjut: ${report.tindakLanjut ? '[X] Perlu Tindak Lanjut' : '[  ] Selesai'}   |   Keterangan: ${report.keteranganStatus || '-'}`)
    ]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: evidenceStatusRows,
    styles: { fontSize: 8, cellPadding: 2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 44 },
      1: { cellWidth: 138 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 5;

  // IX.B BUKTI FOTO INVESTIGASI STRIKE
  y = drawPhotoDocumentation(
    doc,
    y,
    report.fotos,
    report.keteranganDokumentasi,
    'IX.B BUKTI FOTO INVESTIGASI STRIKE (EVIDENCE PHOTO)',
    theme
  );

  // Signatures
  await drawSignatureBlock(
    doc,
    y,
    'Wildlife Hazard Department Head',
    'RACHMADITYA',
    'Lead Investigator / Duty Officer WHU',
    report.pod || 'Petugas WHU',
    theme,
    docNumber,
    report.signatures
  );

  finalizeDocumentPages(doc, 'WSR — WILDLIFE STRIKE REPORT', docNumber);
  doc.save(`${(docNumber || 'WHU_WSR').replace(/\//g, '_')}_WSR.pdf`);
};

/**
 * EXPORT LAPORAN PENGECEKAN KENDARAAN OPERASIONAL & SERAH TERIMA TUGAS
 */
/**
 * Format status cell for vehicle inspection tables with crisp badge colors
 */
const statusBadgeCell = (status: string): CellDef => {
  const s = (status || '').trim();
  const lower = s.toLowerCase();
  
  let textColor: [number, number, number] = [15, 23, 42];
  let fillColor: [number, number, number] = [248, 250, 252];
  
  if (
    lower.includes('baik') || 
    lower.includes('normal') || 
    lower.includes('lengkap') || 
    lower.includes('siap')
  ) {
    textColor = [4, 120, 87];   // Emerald 700
    fillColor = [236, 253, 245]; // Emerald 50
  } else if (
    lower.includes('kurang') || 
    lower.includes('perhatian') || 
    lower.includes('kotor') || 
    lower.includes('catatan') ||
    lower.includes('tipis')
  ) {
    textColor = [180, 83, 9];   // Amber 700
    fillColor = [255, 251, 235]; // Amber 50
  } else if (
    lower.includes('rusak') || 
    lower.includes('bocor') || 
    lower.includes('tidak') || 
    lower.includes('habis') ||
    lower.includes('mati')
  ) {
    textColor = [185, 28, 28];   // Red 700
    fillColor = [254, 242, 242]; // Red 50
  }

  return {
    content: s || '-',
    styles: {
      fontStyle: 'bold',
      textColor,
      fillColor,
      halign: 'center'
    }
  };
};

/**
 * PDF Exporter for Vehicle Check & Shift Handover Report (PT Angkasa Pura Indonesia Official Format)
 */
export const exportVehiclePDF = async (report: VehicleCheckReport, sequentialDocNumber?: string, createdAtOverride?: string) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const theme = THEMES.vehicle;
  const docNumber = sequentialDocNumber || report.reportNumber;
  const creationTime = createdAtOverride || report.createdAt;

  // Header & Title
  let y = drawOfficialHeader(
    doc,
    'BERITA ACARA & FORMULIR PENGECEKAN KENDARAAN OPERASIONAL AIRSIDE',
    docNumber,
    report.statusKelayakan,
    theme,
    creationTime
  );

  // Meta bar (Hari/Tanggal, Waktu, Dinas, Pleton)
  y = drawSectionBanner(doc, y, 'DATA DINAS & WAKTU PEMERIKSAAN', theme);
  const metaRows: RowInput[] = [
    [
      labelCell('Hari / Tanggal'),
      valueCell(report.hariTanggal),
      labelCell('Waktu Pengecekan'),
      valueCell(`${report.waktuPengecekan} WIB`)
    ],
    [
      labelCell('Dinas Operasional'),
      valueCell(report.dinas, 1, true, theme.primary),
      labelCell('Pleton Petugas'),
      valueCell(report.pleton, 1, true)
    ]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: metaRows,
    styles: {
      fontSize: 8,
      cellPadding: 1.8,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 50 },
      2: { cellWidth: 42, fontStyle: 'bold', fillColor: [248, 250, 252] },
      3: { cellWidth: 48 }
    },
    margin: { left: 14, right: 14 }
  });

  // @ts-expect-error autoTable attaches lastAutoTable
  y = doc.lastAutoTable.finalY + 3.5;

  // Section 1: Identitas Armada Kendaraan
  y = drawSectionBanner(doc, y, '1. IDENTITAS ARMADA KENDARAAN OPERASIONAL & KELAYAKAN', theme);
  const isOk = report.statusKelayakan.includes('SERVICEABLE') && !report.statusKelayakan.includes('LIMITATION') && !report.statusKelayakan.includes('CATATAN');
  const isWarn = report.statusKelayakan.includes('LIMITATION') || report.statusKelayakan.includes('CATATAN');
  
  const fleetRows: RowInput[] = [
    [
      labelCell('No. Lambung Armada'),
      valueCell(report.nomorLambung, 1, true, theme.primary),
      labelCell('Plat Nomor Polisi'),
      valueCell(report.platNomor, 1, true)
    ],
    [
      labelCell('Merk & Model Kendaraan'),
      valueCell(report.merkModel),
      labelCell('Odometer Tercatat'),
      valueCell(`${Number(report.odometerKM || 0).toLocaleString('id-ID')} KM`, 1, true)
    ],
    [
      labelCell('Level Bahan Bakar (BBM)'),
      valueCell(report.levelBBM, 1, true),
      labelCell('Status Kelayakan'),
      {
        content: report.statusKelayakan,
        styles: {
          fontStyle: 'bold',
          halign: 'center',
          textColor: isOk ? [4, 120, 87] : isWarn ? [180, 83, 9] : [185, 28, 28],
          fillColor: isOk ? [209, 250, 229] : isWarn ? [254, 243, 199] : [254, 226, 226]
        }
      }
    ]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: fleetRows,
    styles: { fontSize: 8, cellPadding: 1.8, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 42, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 50 },
      2: { cellWidth: 42, fontStyle: 'bold', fillColor: [248, 250, 252] },
      3: { cellWidth: 48 }
    },
    margin: { left: 14, right: 14 }
  });
  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 3.5;

  // Section 2: Checklist Mekanikal & Fisik Kendaraan
  y = drawSectionBanner(doc, y, '2. PEMERIKSAAN KELAYAKAN MEKANIKAL, FISIK & KELISTRIKAN AIRSIDE', theme);
  const mechanicalRows: RowInput[] = [
    [
      labelCell('Oli Mesin & Coolant Radiator'),
      statusBadgeCell(report.oliMesinCoolant),
      labelCell('Sistem Rem Kaki & Handbrake'),
      statusBadgeCell(report.sistemRemTangan)
    ],
    [
      labelCell('Kondisi Ban (4 Roda + Serep)'),
      statusBadgeCell(report.kondisiBanTekanan),
      labelCell('Lampu Utama (Jauh / Dekat) & Fog'),
      statusBadgeCell(report.lampuUtamaJauhDekat)
    ],
    [
      labelCell('Lampu Rotary Strobo Amber (Airside)'),
      statusBadgeCell(report.lampuRotaryStroboAirside),
      labelCell('Lampu Sein, Hazard & Rem'),
      statusBadgeCell(report.lampuSeinHazardRem)
    ],
    [
      labelCell('Wiper & Air Washer Pembersih'),
      statusBadgeCell(report.wiperAirPembersih),
      labelCell('Klakson & Sirine Suara Airside'),
      statusBadgeCell(report.klaksonSirineAirside)
    ],
    [
      labelCell('AC Kabin & Kelistrikan 12V'),
      statusBadgeCell(report.acKabinKelistrikan),
      labelCell('Kebersihan Fisik Kendaraan'),
      statusBadgeCell(report.kebersihanKendaraan)
    ]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: mechanicalRows,
    styles: { fontSize: 7.8, cellPadding: 1.8, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 41 },
      2: { cellWidth: 50, fontStyle: 'bold', fillColor: [248, 250, 252] },
      3: { cellWidth: 41 }
    },
    margin: { left: 14, right: 14 }
  });
  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 3.5;

  // Section 3: Perlengkapan Halau Satwa Liar
  y = drawSectionBanner(doc, y, '3. INVENTARIS PERALATAN MITIGASI SATWA LIAR (WILDLIFE CONTROL TOOLS)', theme);
  const wildlifeToolRows: RowInput[] = [
    [
      labelCell('Radio Airside HT (VHF Bandara)'),
      statusBadgeCell(report.radioAirsideHT),
      labelCell('Bird Scarer Megaphone Sound System'),
      statusBadgeCell(report.birdScarerSoundMegaphone)
    ],
    [
      labelCell('Laser Pengusir Satwa (Bird Laser)'),
      statusBadgeCell(report.laserBirdDisperser),
      labelCell(`Pistol Suar (Flare Gun - ${report.amunisiFlareButir} Butir)`),
      statusBadgeCell(report.pyroFlareGun)
    ],
    [
      labelCell('Teropong / Binokular 10x50'),
      statusBadgeCell(report.binokularTeropong),
      labelCell('Senter Taktis High-Beam Searchlight'),
      statusBadgeCell(report.senterTaktisSearchlight)
    ],
    [
      labelCell('Jaring Tangkap Satwa & Gloves'),
      statusBadgeCell(report.jaringNetGunHandling),
      labelCell('APAR Kendaraan (Pemadam Api)'),
      statusBadgeCell(report.aparKendaraan)
    ],
    [
      labelCell('Kotak P3K Airside First Aid'),
      statusBadgeCell(report.kotakP3K),
      labelCell('Tool Kit, Kunci Roda & Dongkrak'),
      statusBadgeCell(report.toolKitDongkrak)
    ]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: wildlifeToolRows,
    styles: { fontSize: 7.8, cellPadding: 1.8, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 41 },
      2: { cellWidth: 50, fontStyle: 'bold', fillColor: [248, 250, 252] },
      3: { cellWidth: 41 }
    },
    margin: { left: 14, right: 14 }
  });
  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 3.5;

  // Section 4: Catatan & Berita Acara Serah Terima
  y = drawSectionBanner(doc, y, '4. CATATAN KENDALA OPERASIONAL & BERITA ACARA SERAH TERIMA', theme);
  const remarksRows: RowInput[] = [
    [
      labelCell('Catatan Kendala / Kerusakan'),
      valueCell(report.catatanKerusakanKendala || 'Nihil. Seluruh sistem kendaraan berfungsi normal dan aman untuk operasional airside.')
    ],
    [
      labelCell('Berita Acara Serah Terima'),
      valueCell(report.catatanSerahTerima || 'Kendaraan operasional dan seluruh inventaris halau satwa diserahterimakan dalam keadaan bersih, lengkap, dan siap operasi.')
    ]
  ];

  autoTable(doc, {
    startY: y,
    theme: 'grid',
    body: remarksRows,
    styles: { fontSize: 7.8, cellPadding: 2, textColor: [15, 23, 42], lineColor: [226, 232, 240], lineWidth: 0.2 },
    columnStyles: {
      0: { cellWidth: 46, fontStyle: 'bold', fillColor: [248, 250, 252] },
      1: { cellWidth: 136 }
    },
    margin: { left: 14, right: 14 }
  });
  // @ts-expect-error autoTable adds lastAutoTable
  y = doc.lastAutoTable.finalY + 4;

  // Section 5: Dokumentasi Foto Armada & Peralatan
  y = drawPhotoDocumentation(
    doc,
    y,
    report.fotos,
    report.keteranganDokumentasi,
    '5. DOKUMENTASI FOTO FISIK ARMADA & INVENTARIS PERALATAN',
    theme
  );

  // Ensure sufficient vertical space for signatures
  y = ensureSpace(doc, y, 44);

  // Section 6: 3-Column Handover Signatures: Menyerahkan, Menerima, Mengetahui (Supervisor)
  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = (pageWidth - 28 - 8) / 3;
  const boxHeight = 38;

  // Box 1: Menyerahkan (Petugas Dinas Sebelumnya)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(14, y, boxWidth, boxHeight, 1.2, 1.2, 'FD');
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, y, boxWidth, 6, 1.2, 1.2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text('YANG MENYERAHKAN:', 16, y + 4.2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Petugas Dinas Lepas', 16, y + 9.5);

  const offSig = report.signatures?.officer;
  const offName = offSig?.signerName || report.petugasMenyerahkan || 'NURJAYA';
  const offNipp = offSig?.signerNipp || lookupPersonnelNip(offName, 'officer');
  const offSigImg = offSig?.signatureDataUrl || generateRealisticSignatureDataUrl(offName, 'Dinas Lepas');
  if (offSigImg) {
    try { doc.addImage(offSigImg, 'PNG', 16, y + 10.5, 28, 12); } catch {}
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${offName} )`, 16, y + 27.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIP: ${offNipp}`, 16, y + 32);

  // Box 2: Menerima (Petugas Dinas Berjalan)
  const box2X = 14 + boxWidth + 4;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(box2X, y, boxWidth, boxHeight, 1.2, 1.2, 'FD');
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(box2X, y, boxWidth, 6, 1.2, 1.2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(theme.primary[0], theme.primary[1], theme.primary[2]);
  doc.text('YANG MENERIMA:', box2X + 2, y + 4.2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Petugas Dinas Berjalan (Driver)', box2X + 2, y + 9.5);

  const recSig = report.signatures?.receiver;
  const recName = recSig?.signerName || report.petugasMenerima || 'MOHAMAD DANIL';
  const recNipp = recSig?.signerNipp || lookupPersonnelNip(recName, 'receiver');
  const recSigImg = recSig?.signatureDataUrl || generateRealisticSignatureDataUrl(recName, 'Dinas Berjalan');
  if (recSigImg) {
    try { doc.addImage(recSigImg, 'PNG', box2X + 2, y + 10.5, 28, 12); } catch {}
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${recName} )`, box2X + 2, y + 27.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIP: ${recNipp}`, box2X + 2, y + 32);

  // Box 3: Mengetahui / Supervisor
  const box3X = box2X + boxWidth + 4;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(box3X, y, boxWidth, boxHeight, 1.2, 1.2, 'FD');
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(box3X, y, boxWidth, 6, 1.2, 1.2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(51, 65, 85);
  doc.text('MENGETAHUI / VERIFIKATOR:', box3X + 2, y + 4.2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text('Supervisor / Lead WHU', box3X + 2, y + 9.5);

  const supSig = report.signatures?.supervisor;
  const supName = supSig?.signerName || report.supervisorLead || 'RACHMADITYA';
  const supNipp = supSig?.signerNipp || lookupPersonnelNip(supName, 'supervisor');
  const supSigImg = supSig?.signatureDataUrl || generateRealisticSignatureDataUrl(supName, 'Lead WHU');
  if (supSigImg) {
    try { doc.addImage(supSigImg, 'PNG', box3X + 2, y + 10.5, 28, 12); } catch {}
  }

  // Draw QR Code in Box 3
  const vQrPayload = `PT ANGKASA PURA INDONESIA\nHANDOVER VERIFIED\nDoc: ${docNumber}\nVehicle: ${report.platNomor || report.nomorLambung || 'WHU-01'}\nSupervisor: ${supName}\nNIP: ${supNipp}`;
  try {
    const vQrUrl = await getQrCodeDataUrl(vQrPayload);
    if (vQrUrl) {
      doc.addImage(vQrUrl, 'PNG', box3X + boxWidth - 17, y + 7.5, 13, 13);
    }
  } catch {}

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`( ${supName} )`, box3X + 2, y + 27.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIP: ${supNipp}`, box3X + 2, y + 32);

  finalizeDocumentPages(doc, 'BERITA ACARA SERAH TERIMA KENDARAAN OPERASIONAL WHU', docNumber);
  doc.save(`${(docNumber || 'WHU_Vehicle').replace(/\//g, '_')}_Serah_Terima_Kendaraan.pdf`);
};
