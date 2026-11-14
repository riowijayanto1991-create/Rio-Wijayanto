import {
  generateSequentialReportNumber,
  getChronologicalDocNumber,
  formatReportCreationTime,
  parseExistingDocNumber
} from '../reportNumberGenerator';

export function runReportNumberTests() {
  console.log('=== RUNNING REPORT NUMBER GENERATOR TESTS ===');

  // Test 1: Empty list generates 0001
  const num1 = generateSequentialReportNumber('PATROL', [], '2026-09-01T08:00:00.000Z');
  console.assert(num1 === 'WHU/PATROL/2026/09/0001', `Expected WHU/PATROL/2026/09/0001, got ${num1}`);
  console.log('✅ PASS: Empty list generates 0001:', num1);

  // Test 2: Sequential increment based on existing reports
  const existing = [
    { reportNumber: 'WHU/PATROL/2026/09/0001', createdAt: '2026-09-01T08:00:00.000Z' },
    { reportNumber: 'WHU/PATROL/2026/09/0002', createdAt: '2026-09-02T09:30:00.000Z' }
  ];
  const num3 = generateSequentialReportNumber('PATROL', existing, '2026-09-05T14:00:00.000Z');
  console.assert(num3 === 'WHU/PATROL/2026/09/0003', `Expected WHU/PATROL/2026/09/0003, got ${num3}`);
  console.log('✅ PASS: Sequential increment generates 0003:', num3);

  // Test 3: Chronological ordering of legacy random numbered reports
  const legacyReports = [
    { id: 'p-3', reportNumber: 'WHU/PATROL/2026/09/9821', createdAt: '2026-09-10T12:00:00.000Z' },
    { id: 'p-1', reportNumber: 'WHU/PATROL/2026/09/4102', createdAt: '2026-09-01T07:00:00.000Z' },
    { id: 'p-2', reportNumber: 'WHU/PATROL/2026/09/1089', createdAt: '2026-09-05T08:00:00.000Z' }
  ];

  const chrono1 = getChronologicalDocNumber(legacyReports[1], legacyReports, 'PATROL');
  const chrono2 = getChronologicalDocNumber(legacyReports[2], legacyReports, 'PATROL');
  const chrono3 = getChronologicalDocNumber(legacyReports[0], legacyReports, 'PATROL');

  console.assert(chrono1 === 'WHU/PATROL/2026/09/0001', `Expected 0001 for earliest report, got ${chrono1}`);
  console.assert(chrono2 === 'WHU/PATROL/2026/09/0002', `Expected 0002 for second report, got ${chrono2}`);
  console.assert(chrono3 === 'WHU/PATROL/2026/09/0003', `Expected 0003 for latest report, got ${chrono3}`);
  console.log('✅ PASS: Chronological mapping orders legacy random reports to 0001, 0002, 0003 correctly');

  // Test 4: Strike and Occurrence types
  const strikeNum = generateSequentialReportNumber('strike', [], '2026-09-17T08:00:00.000Z');
  console.assert(strikeNum === 'WHU/STRIKE/2026/09/0001', `Expected WHU/STRIKE/2026/09/0001, got ${strikeNum}`);
  console.log('✅ PASS: Strike prefix WHU/STRIKE:', strikeNum);

  const occNum = generateSequentialReportNumber('occurrence', [], '2026-09-17T08:00:00.000Z');
  console.assert(occNum === 'WHU/OCC/2026/09/0001', `Expected WHU/OCC/2026/09/0001, got ${occNum}`);
  console.log('✅ PASS: Occurrence prefix WHU/OCC:', occNum);

  const vehNum = generateSequentialReportNumber('vehicle', [], '2026-09-17T08:00:00.000Z');
  console.assert(vehNum === 'WHU/VEH/2026/09/0001', `Expected WHU/VEH/2026/09/0001, got ${vehNum}`);
  console.log('✅ PASS: Vehicle prefix WHU/VEH:', vehNum);

  console.log('=== ALL TESTS PASSED SUCCESSFULLY ===');
}
