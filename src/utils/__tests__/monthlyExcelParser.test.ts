import * as XLSX from 'xlsx';
import { 
  toNumber, 
  parsePeriodCell, 
  parseMonthlyAttachmentWorkbook, 
  calculateSafeMoM 
} from '../monthlyExcelParser';

/**
 * Automated test suite validating monthly Excel attachment parser
 * and MoM calculation fixes.
 */
export function runExcelParserTests() {
  console.log('=== RUNNING MONTHLY EXCEL ATTACHMENT PARSER TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // TEST SUITE 1: Numeric sanitization (toNumber)
  console.log('[Suite 1: Safe Numeric Sanitization]');
  assert(toNumber('NIL') === 0, 'toNumber("NIL") returns 0');
  assert(toNumber('nil') === 0, 'toNumber("nil") returns 0');
  assert(toNumber('N/A') === 0, 'toNumber("N/A") returns 0');
  assert(toNumber('-') === 0, 'toNumber("-") returns 0');
  assert(toNumber('') === 0, 'toNumber("") returns 0');
  assert(toNumber('   ') === 0, 'toNumber("   ") returns 0');
  assert(toNumber(null) === 0, 'toNumber(null) returns 0');
  assert(toNumber(undefined) === 0, 'toNumber(undefined) returns 0');
  assert(toNumber('NONE') === 0, 'toNumber("NONE") returns 0');
  assert(toNumber('NIHIL') === 0, 'toNumber("NIHIL") returns 0');
  assert(toNumber(42) === 42, 'toNumber(42) returns 42');
  assert(toNumber('15') === 15, 'toNumber("15") returns 15');
  assert(toNumber(' 1,250 ') === 1250, 'toNumber(" 1,250 ") returns 1250 with comma');
  assert(!isNaN(toNumber('INVALID_STRING')), 'toNumber never returns NaN');

  // TEST SUITE 2: Explicit Period Text Parsing (No row index reliance)
  console.log('\n[Suite 2: Explicit Period Parsing from Cell Text]');
  const sep = parsePeriodCell('SEPTEMBER 2025');
  assert(sep !== null && sep.bulan === 'September' && sep.tahun === 2025 && sep.periodKey === '2025-09', 'Parse "SEPTEMBER 2025"');

  const okt = parsePeriodCell('OKTOBER 2025');
  assert(okt !== null && okt.bulan === 'Oktober' && okt.tahun === 2025 && okt.periodKey === '2025-10', 'Parse "OKTOBER 2025"');

  const des = parsePeriodCell('DESEMBER 2025');
  assert(des !== null && des.bulan === 'Desember' && des.tahun === 2025 && des.periodKey === '2025-12', 'Parse "DESEMBER 2025"');

  const jan = parsePeriodCell('JANUARI 2026');
  assert(jan !== null && jan.bulan === 'Januari' && jan.tahun === 2026 && jan.periodKey === '2026-01', 'Parse "JANUARI 2026"');

  const feb = parsePeriodCell('FEBRUARI 2026');
  assert(feb !== null && feb.bulan === 'Februari' && feb.tahun === 2026 && feb.periodKey === '2026-02', 'Parse "FEBRUARI 2026"');

  const agt = parsePeriodCell('AGUSTUS 2026');
  assert(agt !== null && agt.bulan === 'Agustus' && agt.tahun === 2026 && agt.periodKey === '2026-08', 'Parse "AGUSTUS 2026"');

  // TEST SUITE 3: Full Workbook Parsing with Flawed Merged Header in History Populasi Burung
  console.log('\n[Suite 3: Workbook Simulation - Sep 2025 to Agt 2026 with NIL & Flawed Header]');
  const wb = XLSX.utils.book_new();

  // 1. DATA WILDLIFE STRIKE Sheet (starts from September 2025!)
  const strikeData = [
    ['REKAPITULASI DATA WILDLIFE STRIKE BULANAN'],
    ['BANDARA INTERNASIONAL SOEKARNO-HATTA'],
    [],
    ['NO', 'PERIODE', 'TOTAL STRIKE', 'KERUSAKAN (DAMAGE)', 'KETERANGAN'],
    [1, 'SEPTEMBER 2025', 2, 'NIL', 'Aman terkendali'],
    [2, 'OKTOBER 2025', 3, 'NIL', 'Aktivitas migrasi'],
    [3, 'NOVEMBER 2025', 4, 1, 'Walet landing'],
    [4, 'DESEMBER 2025', 5, 'NIL', 'Hujan monsun'],
    [5, 'JANUARI 2026', 3, 'NIL', 'Patroli ditingkatkan'],
    [6, 'FEBRUARI 2026', 2, 1, 'Blekok di runway 07L'],
    [7, 'MARET 2026', 'NIL', 'NIL', 'Nihil insiden'],
    [8, 'APRIL 2026', 1, 'NIL', 'Pipit rumput'],
    [9, 'MEI 2026', 2, 'NIL', 'Normal'],
    [10, 'JUNI 2026', 'NIL', 'NIL', 'Nihil insiden'],
    [11, 'JULI 2026', 1, 'NIL', 'Elang bondol soaring'],
    [12, 'AGUSTUS 2026', 2, 'NIL', 'Normal']
  ];
  const wsStrike = XLSX.utils.aoa_to_sheet(strikeData);
  XLSX.utils.book_append_sheet(wb, wsStrike, 'DATA WILDLIFE STRIKE');

  // 2. DATA WILDLIFE OCCURRENCE Sheet
  const occData = [
    ['REKAPITULASI DATA WILDLIFE OCCURRENCE'],
    [],
    ['NO', 'PERIODE', 'TOTAL OCCURRENCE', 'TINDAK LANJUT DISPERSAL'],
    [1, 'SEPTEMBER 2025', 7, 'Dispersal siren & flare'],
    [2, 'OKTOBER 2025', 10, 'Pyrotechnics'],
    [3, 'NOVEMBER 2025', 12, 'Sound deterrent'],
    [4, 'DESEMBER 2025', 14, 'Intensive mobile'],
    [5, 'JANUARI 2026', 8, 'Laser deterrent'],
    [6, 'FEBRUARI 2026', 9, 'Grass cutting'],
    [7, 'MARET 2026', 5, 'Water drainage'],
    [8, 'APRIL 2026', 6, 'Normal'],
    [9, 'MEI 2026', 4, 'Normal'],
    [10, 'JUNI 2026', 3, 'Normal'],
    [11, 'JULI 2026', 4, 'Normal'],
    [12, 'AGUSTUS 2026', 5, 'Normal']
  ];
  const wsOcc = XLSX.utils.aoa_to_sheet(occData);
  XLSX.utils.book_append_sheet(wb, wsOcc, 'DATA WILDLIFE OCCURRENCE');

  // 3. 1.7.2 HISTORY POPULASI BURUNG (Simulate flawed header row 5 where 2025 was merged across Jan-Feb)
  const birdData = [
    ['1.7.2 HISTORY POPULASI BURUNG AIRSIDE'],
    ['BANDARA INTERNASIONAL SOEKARNO-HATTA - WHU'],
    [],
    ['TAHUN', '2025 (FLAWED MERGED)', '', '', '', '', '', '2026', '', '', '', '', ''],
    ['NO', 'NAMA SPESIES', 'SEP', 'OKT', 'NOV', 'DES', 'JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGT'],
    [1, 'Kuntul Kerbau (Bubulcus ibis)', 150, 180, 220, 260, 210, 190, 140, 120, 'NIL', 'NIL', 90, 110],
    [2, 'Blekok Sawah (Ardeola speciosa)', 40, 55, 60, 70, 65, 50, 35, 30, 20, 15, 'NIL', 25],
    [3, 'Walet Linchi (Collocalia linchi)', 300, 320, 400, 450, 380, 310, 280, 250, 200, 180, 220, 240],
    [4, 'Bondol Peking (Lonchura punctulata)', 'NIL', 45, 80, 95, 60, 40, 'NIL', 'NIL', 30, 40, 50, 60],
    [5, 'Elang Bondol (Haliastur indus)', 2, 2, 3, 3, 2, 2, 1, 1, 2, 2, 3, 2],
    ['TOTAL', '', 492, 602, 763, 878, 717, 592, 456, 401, 252, 237, 363, 437]
  ];
  const wsBird = XLSX.utils.aoa_to_sheet(birdData);
  XLSX.utils.book_append_sheet(wb, wsBird, '1.7.2 HISTORY POPULASI BURUNG');

  // Parse workbook
  const result = parseMonthlyAttachmentWorkbook(wb);

  assert(result.monthlyRecords.length === 12, `Extracted all 12 periods (got: ${result.monthlyRecords.length})`);
  assert(result.monthlyRecords[0].periodKey === '2025-09', 'First period is Sep 2025 (2025-09)');
  assert(result.monthlyRecords[3].periodKey === '2025-12', 'Fourth period is Des 2025 (2025-12)');
  assert(result.monthlyRecords[4].periodKey === '2026-01', 'Fifth period is Jan 2026 (2026-01) - correctly incremented year!');
  assert(result.monthlyRecords[11].periodKey === '2026-08', 'Twelfth period is Agt 2026 (2026-08)');

  // Verify Strike Values
  const janRecord = result.monthlyRecords.find(r => r.periodKey === '2026-01');
  assert(janRecord?.totalStrike === 3, 'Jan 2026 Total Strike = 3');
  assert(janRecord?.strikeWithDamage === 0, 'Jan 2026 Damage "NIL" correctly converted to 0');
  assert(janRecord?.totalOccurrence === 8, 'Jan 2026 Total Occurrence = 8');

  const marRecord = result.monthlyRecords.find(r => r.periodKey === '2026-03');
  assert(marRecord?.totalStrike === 0, 'Mar 2026 Strike "NIL" converted to 0');

  // Verify Bird Population
  assert(result.birdPopulationData.species.length === 5, `Extracted 5 bird species (got: ${result.birdPopulationData.species.length})`);
  assert(result.birdPopulationData.totalByPeriod['2025-09'] === 492, 'Sep 2025 Bird Population total = 492');
  assert(result.birdPopulationData.totalByPeriod['2026-01'] === 717, 'Jan 2026 Bird Population total = 717 (mapped to 2026 despite header flaw)');
  assert(result.birdPopulationData.grandTotal > 0, `Bird population grand total > 0 (${result.birdPopulationData.grandTotal})`);

  // Ensure NO NaN anywhere in monthly records
  let hasNaN = false;
  result.monthlyRecords.forEach(r => {
    if (isNaN(r.totalStrike) || isNaN(r.strikeWithDamage) || isNaN(r.totalOccurrence) || isNaN(r.totalSatwa)) {
      hasNaN = true;
    }
  });
  assert(!hasNaN, 'Zero NaN values across all 12 monthly records');

  // TEST SUITE 4: Month-over-Month (MoM) Safe Calculation
  console.log('\n[Suite 4: Safe MoM Delta & % Calculation]');
  const mom1 = calculateSafeMoM(5, 4);
  assert(mom1.delta === 1 && mom1.percent === 25 && mom1.direction === 'up', 'MoM (4 -> 5) is +25% up');

  const mom2 = calculateSafeMoM(2, 4);
  assert(mom2.delta === -2 && mom2.percent === -50 && mom2.direction === 'down', 'MoM (4 -> 2) is -50% down');

  const mom3 = calculateSafeMoM(0, 4);
  assert(mom3.delta === -4 && mom3.percent === -100 && mom3.direction === 'down', 'MoM (4 -> 0) is -100% down');

  const mom4 = calculateSafeMoM(0, 0);
  assert(mom4.delta === 0 && mom4.percent === 0 && mom4.direction === 'stable', 'MoM (0 -> 0) is 0% stable (no NaN)');

  const mom5 = calculateSafeMoM('NIL' as any, 5);
  assert(mom5.delta === -5 && mom5.percent === -100 && mom5.direction === 'down', 'MoM (5 -> "NIL") is -100% (safe sanitation)');

  const mom6 = calculateSafeMoM('NIL' as any, 'NIL' as any);
  assert(mom6.delta === 0 && mom6.percent === 0 && !isNaN(mom6.percent), 'MoM ("NIL" -> "NIL") is 0% (no NaN)');

  console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  return { passed, failed };
}

// Auto-run if invoked directly via tsx
if (typeof require !== 'undefined' && require.main === module) {
  const { failed } = runExcelParserTests();
  if (failed > 0) process.exit(1);
}
