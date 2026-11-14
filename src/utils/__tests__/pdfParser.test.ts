import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  parseMonthlyReportPdf, 
  parseDutyRosterPdf, 
  parseCleanNumber, 
  detectMonthAndYear 
} from '../pdfParser';

async function runPdfTests() {
  console.log('--- Starting PDF Parser Tests ---');

  // Test 1: parseCleanNumber edge cases
  console.log('Testing parseCleanNumber...');
  if (parseCleanNumber('0') !== 0) throw new Error('Expected 0 for "0"');
  if (parseCleanNumber('nil') !== 0) throw new Error('Expected 0 for "nil"');
  if (parseCleanNumber('Nihil') !== 0) throw new Error('Expected 0 for "Nihil"');
  if (parseCleanNumber('Tidak Ada') !== 0) throw new Error('Expected 0 for "Tidak Ada"');
  if (parseCleanNumber('-') !== 0) throw new Error('Expected 0 for "-"');
  if (parseCleanNumber('0 kali') !== 0) throw new Error('Expected 0 for "0 kali"');
  if (parseCleanNumber('1.850 ekor') !== 1850) throw new Error('Expected 1850 for "1.850 ekor"');
  if (parseCleanNumber('2,140') !== 2140) throw new Error('Expected 2140 for "2,140"');
  if (parseCleanNumber('128 Kali') !== 128) throw new Error('Expected 128 for "128 Kali"');
  console.log('✓ parseCleanNumber passed all assertions!');

  // Test 2: detectMonthAndYear with underscores and headers
  console.log('Testing detectMonthAndYear...');
  const resFilename = detectMonthAndYear('', [], 'Laporan_Bulanan_WHMS_Februari_2026.pdf');
  if (resFilename.month !== 'Februari' || resFilename.year !== 2026) {
    throw new Error(`Filename detection failed: got ${resFilename.month} ${resFilename.year}`);
  }

  const resHeader = detectMonthAndYear(
    'UNIT AIRSIDE WHMS\nLAPORAN BULANAN WHMS - MARET 2026', 
    ['UNIT AIRSIDE WHMS', 'LAPORAN BULANAN WHMS - MARET 2026'], 
    'dokumen.pdf'
  );
  if (resHeader.month !== 'Maret' || resHeader.year !== 2026) {
    throw new Error(`Header detection failed: got ${resHeader.month} ${resHeader.year}`);
  }
  console.log('✓ detectMonthAndYear passed all assertions!');

  // Test 3: Generate Real PDF 1 - Single Month KPI Table
  console.log('Testing Single Month KPI Table PDF...');
  const doc1 = new jsPDF();
  doc1.text('UNIT AIRSIDE WILDLIFE HAZARD MANAGEMENT', 14, 15);
  doc1.text('LAPORAN BULANAN WHMS - MARET 2026', 14, 25);
  doc1.text('Bandara Internasional Soekarno-Hatta', 14, 32);

  autoTable(doc1, {
    startY: 40,
    head: [['No', 'Indikator Operasional Satwa', 'Satuan', 'Target', 'Realisasi']],
    body: [
      ['1', 'Wildlife Strike', 'Kali', '0', '1'],
      ['2', 'Wildlife Strike Berdampak Kerusakan', 'Kali', '0', '0'],
      ['3', 'Wildlife Occurrence / Perjumpaan', 'Kali', '-', '6'],
      ['4', 'Patroli & Inspeksi Airside Satwa', 'Kali', '100', '135'],
      ['5', 'Populasi Burung Teramati', 'Ekor', '-', '2.140'],
    ]
  });

  doc1.text('Spesies Dominan Teramati: Kuntul Kerbau (Bubulcus ibis)', 14, 95);
  doc1.text('Area Rawan Utama: Runway 07L/25R dan Infield Strip', 14, 103);
  doc1.text('Kesimpulan: Pengusiran intensif dengan laser dan sirene berhasil menekan risiko.', 14, 111);

  const buf1 = doc1.output('arraybuffer');
  const parsed1 = await parseMonthlyReportPdf(buf1, 'Laporan_WHMS_Maret_2026.pdf');

  console.log('Parsed 1 Result:', {
    bulan: parsed1.bulan,
    tahun: parsed1.tahun,
    totalStrike: parsed1.totalStrike,
    strikeWithDamage: parsed1.strikeWithDamage,
    totalOccurrence: parsed1.totalOccurrence,
    totalPatroli: parsed1.totalPatroli,
    totalSatwa: parsed1.totalSatwa,
    spesies: parsed1.spesiesDominan,
    area: parsed1.areaRawanUtama
  });

  if (parsed1.bulan !== 'Maret') throw new Error(`Expected month Maret, got ${parsed1.bulan}`);
  if (parsed1.tahun !== 2026) throw new Error(`Expected year 2026, got ${parsed1.tahun}`);
  if (parsed1.totalStrike !== 1) throw new Error(`Expected totalStrike 1, got ${parsed1.totalStrike}`);
  if (parsed1.strikeWithDamage !== 0) throw new Error(`Expected strikeWithDamage 0, got ${parsed1.strikeWithDamage}`);
  if (parsed1.totalOccurrence !== 6) throw new Error(`Expected totalOccurrence 6, got ${parsed1.totalOccurrence}`);
  if (parsed1.totalPatroli !== 135) throw new Error(`Expected totalPatroli 135, got ${parsed1.totalPatroli}`);
  if (parsed1.totalSatwa !== 2140) throw new Error(`Expected totalSatwa 2140, got ${parsed1.totalSatwa}`);
  if (!parsed1.spesiesDominan?.includes('Kuntul Kerbau')) throw new Error(`Expected Kuntul Kerbau, got ${parsed1.spesiesDominan}`);
  if (!parsed1.areaRawanUtama?.includes('07L/25R')) throw new Error(`Expected Runway 07L/25R, got ${parsed1.areaRawanUtama}`);
  console.log('✓ Single Month KPI Table PDF passed all assertions!');

  // Test 4: Generate Real PDF 2 - Multi-Month Historical Summary Table
  console.log('Testing Multi-Month Table PDF...');
  const doc2 = new jsPDF();
  doc2.text('REKAPITULASI DATA WHMS TAHUN 2026', 14, 15);
  doc2.text('Periode Pemantauan: Januari s/d Maret 2026', 14, 22);

  autoTable(doc2, {
    startY: 30,
    head: [['Bulan', 'Total Strike', 'Kerusakan', 'Occurrence', 'Patroli', 'Populasi Burung']],
    body: [
      ['Januari', '2', '0', '5', '124', '1.650'],
      ['Februari', '0', '0', '4', '118', '1.420'],
      ['Maret', '1', '0', '6', '135', '2.140'],
    ]
  });

  const buf2 = doc2.output('arraybuffer');
  const parsed2 = await parseMonthlyReportPdf(buf2, 'Rekapitulasi_WHMS_2026.pdf');

  console.log('Parsed 2 Result:', {
    bulan: parsed2.bulan,
    tahun: parsed2.tahun,
    monthlyRecordsCount: parsed2.monthlyBreakdown?.length
  });

  if (!parsed2.monthlyBreakdown || parsed2.monthlyBreakdown.length !== 3) {
    throw new Error(`Expected 3 monthly records, got ${parsed2.monthlyBreakdown?.length}`);
  }
  const jan = parsed2.monthlyBreakdown.find(r => r.bulan === 'Januari');
  if (!jan || jan.totalStrike !== 2 || jan.totalSatwa !== 1650) {
    throw new Error('Januari row parsed incorrectly');
  }
  const mar = parsed2.monthlyBreakdown.find(r => r.bulan === 'Maret');
  if (!mar || mar.totalStrike !== 1 || mar.totalSatwa !== 2140) {
    throw new Error('Maret row parsed incorrectly');
  }
  console.log('✓ Multi-Month Table PDF passed all assertions!');

  // Test 5: Duty Roster PDF Schedule
  console.log('Testing Duty Roster PDF...');
  const doc3 = new jsPDF();
  doc3.text('JADWAL ROSTER DINAS WHU - FEBRUARI 2026', 14, 15);
  doc3.text('Pleton: Pleton Alpha', 14, 22);

  autoTable(doc3, {
    startY: 30,
    head: [['Tanggal', 'Shift Pagi', 'Shift Malam']],
    body: [
      ['1', 'Pleton Alpha', 'Pleton Bravo'],
      ['2', 'Pleton Charlie', 'Pleton Delta'],
      ['3', 'Pleton Bravo', 'Pleton Charlie'],
    ]
  });

  const buf3 = doc3.output('arraybuffer');
  const parsed3 = await parseDutyRosterPdf(buf3, 'Roster_Februari_2026.pdf');

  console.log('Parsed 3 Result:', {
    bulan: parsed3.bulan,
    tahun: parsed3.tahun,
    pleton: parsed3.pleton,
    entriesCount: parsed3.entries.length
  });

  if (parsed3.bulan !== 'Februari') throw new Error(`Expected month Februari, got ${parsed3.bulan}`);
  if (parsed3.entries.length < 3) throw new Error(`Expected at least 3 entries, got ${parsed3.entries.length}`);
  console.log('✓ Duty Roster PDF passed all assertions!');

  console.log('\n========================================');
  console.log('ALL PDF PARSER TESTS PASSED SUCCESSFULLY!');
  console.log('========================================\n');
}

runPdfTests().catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
