import * as XLSX from 'xlsx';
import { parseDutyRosterFromExcel, parseDutyRosterFromPdf } from '../dutyRosterParser';
import { jsPDF } from 'jspdf';

async function testDutyRosterParsing() {
  console.log('--- Testing Duty Roster Parser (Nama, NIK, Pleton) ---');

  // Test 1: Generate Mock Excel Roster Workbook
  const wb = XLSX.utils.book_new();
  const wsData = [
    ['JADWAL DINAS WILDLIFE HAZARD - CGK BULAN SEPTEMBER 2026'],
    ['Disahkan oleh: RACHMADITYA (Dept. Head)'],
    [],
    ['NO', 'NAMA PETUGAS', 'NIK', 'PLETON', 'JABATAN', '1', '2', '3', '4'],
    [1, 'MOHAMAD DANIL', '20244166', 'Pleton Alpha', 'Anggota WHU', 'APME', 'APMG', 'FREE', 'APME'],
    [2, 'YUDISTIRA ADY P.', '20245256', 'Pleton Alpha', 'Anggota WHU', 'APME', 'APMG', 'FREE', 'APME'],
    [3, 'KUKUH BRILIYANDHI', '20242969', 'Pleton Bravo', 'Anggota WHU', 'FREE', 'APME', 'APMG', 'FREE'],
    [4, 'M. SYAFRIZAL L. TOBING', '20245727', 'Pleton Bravo', 'Anggota WHU', 'FREE', 'APME', 'APMG', 'FREE'],
    [5, 'YUDHA ABADI S.', '20246882', 'Pleton Charlie', 'Anggota WHU', 'APMG', 'FREE', 'APME', 'APMG'],
    [6, 'M. RIZKI ROMADHON S.', '20245602', 'Pleton Charlie', 'Anggota WHU', 'APMG', 'FREE', 'APME', 'APMG'],
    [7, 'NURJAYA', '20242880', 'Pleton Delta', 'Anggota WHU', 'APMG', 'APME', 'FREE', 'APMG'],
    [8, 'RIO WIJAYANTO', '20243777', 'Pleton Delta', 'Anggota WHU', 'APMG', 'APME', 'FREE', 'APMG']
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, 'Roster September 2026');
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

  const excelResult = await parseDutyRosterFromExcel(excelBuffer, 'Roster_September_2026.xlsx');
  console.log(`Excel Parsed: ${excelResult.personnelList.length} personil, Bulan: ${excelResult.bulan} ${excelResult.tahun}`);
  
  if (excelResult.personnelList.length !== 8) {
    throw new Error(`Expected 8 personnel, got ${excelResult.personnelList.length}`);
  }

  if (excelResult.bulan !== 'September') {
    throw new Error(`Expected bulan 'September', got '${excelResult.bulan}'`);
  }

  const danil = excelResult.personnelList.find(p => p.nik === '20244166');
  if (!danil || danil.nama !== 'MOHAMAD DANIL' || !danil.pleton.includes('Alpha')) {
    throw new Error(`Failed to correctly parse MOHAMAD DANIL: got ${JSON.stringify(danil)}`);
  }

  const rio = excelResult.personnelList.find(p => p.nik === '20243777');
  if (!rio || rio.nama !== 'RIO WIJAYANTO' || !rio.pleton.includes('Delta')) {
    throw new Error(`Failed to correctly parse RIO WIJAYANTO: got ${JSON.stringify(rio)}`);
  }
  console.log('✓ Excel Roster Parser passed with flying colors!');

  // Test 2: Generate Mock PDF Roster for Oktober 2026
  const pdfDoc = new jsPDF();
  pdfDoc.text('JADWAL ROSTER DINAS WHU - OKTOBER 2026', 14, 15);
  pdfDoc.text('Disahkan oleh: RACHMADITYA (Dept. Head)', 14, 22);
  pdfDoc.text('PLETON ALPHA', 14, 30);
  pdfDoc.text('1. MOHAMAD DANIL | NIK: 20244166 | Pleton Alpha', 14, 36);
  pdfDoc.text('2. YUDISTIRA ADY P. | NIK: 20245256 | Pleton Alpha', 14, 42);
  pdfDoc.text('PLETON DELTA', 14, 52);
  pdfDoc.text('1. NURJAYA | NIK: 20242880 | Pleton Delta', 14, 58);
  pdfDoc.text('2. RIO WIJAYANTO | NIK: 20243777 | Pleton Delta', 14, 64);

  const pdfArrayBuffer = pdfDoc.output('arraybuffer');
  const pdfResult = await parseDutyRosterFromPdf(pdfArrayBuffer, 'Roster_Oktober_2026.pdf');
  console.log(`PDF Parsed: ${pdfResult.personnelList.length} personil, Bulan: ${pdfResult.bulan} ${pdfResult.tahun}`);
  if (pdfResult.bulan !== 'Oktober') {
    throw new Error(`Expected PDF bulan 'Oktober', got '${pdfResult.bulan}'`);
  }

  const danilPdf = pdfResult.personnelList.find(p => p.nik === '20244166');
  if (!danilPdf || danilPdf.nama !== 'MOHAMAD DANIL') {
    throw new Error(`PDF failed to parse MOHAMAD DANIL: got ${JSON.stringify(danilPdf)}`);
  }
  console.log('✓ PDF Roster Parser passed all assertions!');

  // Test 3: Generate Mock Excel Roster for Oktober 2026 (ensuring no hardcoded September!)
  const wbOkt = XLSX.utils.book_new();
  const wsDataOkt = [
    ['JADWAL DINAS WILDLIFE HAZARD - CGK BULAN OKTOBER 2026'],
    ['Disahkan oleh: RACHMADITYA (Dept. Head)'],
    [],
    ['NO', 'NAMA PETUGAS', 'NIK', 'PLETON', 'JABATAN', '1', '2', '3'],
    [1, 'NURJAYA', '20242880', 'Pleton Delta', 'Anggota WHU', 'APME', 'APMG', 'FREE'],
    [2, 'RIO WIJAYANTO', '20243777', 'Pleton Delta', 'Anggota WHU', 'APME', 'APMG', 'FREE']
  ];
  const wsOkt = XLSX.utils.aoa_to_sheet(wsDataOkt);
  XLSX.utils.book_append_sheet(wbOkt, wsOkt, 'Roster Okt 2026');
  const excelOktBuffer = XLSX.write(wbOkt, { bookType: 'xlsx', type: 'array' });
  const oktResult = await parseDutyRosterFromExcel(excelOktBuffer, 'Roster_Dinas_Oktober_2026.xlsx');
  console.log(`Excel Okt Parsed: Bulan: ${oktResult.bulan} ${oktResult.tahun}, ${oktResult.personnelList.length} personil`);
  if (oktResult.bulan !== 'Oktober') {
    throw new Error(`Expected Excel bulan 'Oktober', got '${oktResult.bulan}'`);
  }
  console.log('✓ Excel Oktober Parser passed properly without sticking to September!');

  // Test 4: Excel with generic name without explicit month, using fileLastModified date (e.g. November 2026)
  const wbNov = XLSX.utils.book_new();
  const wsDataNov = [
    ['JADWAL DINAS WILDLIFE HAZARD - CGK'],
    ['Disahkan oleh: RACHMADITYA (Dept. Head)'],
    [],
    ['NO', 'NAMA PETUGAS', 'NIK', 'PLETON', 'JABATAN'],
    [1, 'NURJAYA', '20242880', 'Pleton Delta', 'Anggota WHU'],
    [2, 'RIO WIJAYANTO', '20243777', 'Pleton Delta', 'Anggota WHU']
  ];
  const wsNov = XLSX.utils.aoa_to_sheet(wsDataNov);
  XLSX.utils.book_append_sheet(wbNov, wsNov, 'Sheet1');
  const excelNovBuffer = XLSX.write(wbNov, { bookType: 'xlsx', type: 'array' });
  // November 15, 2026 timestamp
  const novTimestamp = new Date(2026, 10, 15).getTime();
  const novResult = await parseDutyRosterFromExcel(excelNovBuffer, 'roster_dinas_final.xlsx', novTimestamp);
  console.log(`Excel Nov Date Parsed: Bulan: ${novResult.bulan} ${novResult.tahun}`);
  if (novResult.bulan !== 'November') {
    throw new Error(`Expected Excel bulan 'November' from fileLastModified, got '${novResult.bulan}'`);
  }
  console.log('✓ fileLastModified Date Extraction passed properly!');
  console.log('--- ALL DUTY ROSTER PARSER TESTS PASSED ---');
}

testDutyRosterParsing().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
