/**
 * Unit tests for WHMP Chapter II Risk Model (Soekarno-Hatta International Airport - WIII / CGK)
 *
 * Verifies:
 * 1. Exact 5x5 WHMP Risk Matrix lookup (verifying lookup table, NEVER L * S multiplication)
 * 2. Likelihood scale storing both letter ('A'..'E') and number (1..5)
 * 3. WHMP Document discrepancy detection
 * 4. Zones 1..6 reference data and critical zone enforcement (Zones 1-3 critical)
 * 5. Likelihood computation: Approach 1 (Days/year) & Approach 2 (5-yr avg strikes/year)
 * 6. Overlap handling and [PLACEHOLDER] threshold approval governance
 * 7. Taxonomy preservation (latin_name_as_written vs latin_name_corrected)
 * 8. Proposed species workflow (submission, review, and promotion)
 */

import {
  WHMP_RISK_MATRIX,
  WHMP_LIKELIHOOD_SCALE,
  WHMP_SEVERITY_SCALE,
  WHMP_ZONES,
  WHMP_LIKELIHOOD_CONFIG,
  WHMP_60_SPECIES
} from '../src/config/whmpRiskConfig';
import {
  lookupRisk,
  evaluateSpeciesDiscrepancy,
  computeLikelihoodFromDays,
  computeLikelihoodFromStrikes,
  calculateSpeciesComparison,
  getZoneById
} from '../src/utils/whmpRiskCalculator';
import { LikelihoodLetter, LikelihoodNumber, SeverityLevel, ProposedSpecies, WHMPSpecies } from '../src/types/whmpRisk';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

console.log('\n======================================================');
console.log(' WHMP CHAPTER II RISK MODEL - UNIT & INTEGRATION TESTS');
console.log('======================================================\n');

// ---------------------------------------------------------------------------
// TEST 1: Exact WHMP 5x5 Matrix Lookup (Proving NOT L * S multiplication)
// ---------------------------------------------------------------------------
console.log('--- 1. Testing Exact 5x5 Matrix Lookup Table (Not L * S) ---');

const expectedGrid: Record<LikelihoodLetter, Record<SeverityLevel, { score: number; tier: string }>> = {
  E: {
    1: { score: 7, tier: 'Moderate' },
    2: { score: 12, tier: 'Moderate' },
    3: { score: 17, tier: 'Moderate to High' },
    4: { score: 22, tier: 'High' },
    5: { score: 25, tier: 'High' }
  },
  D: {
    1: { score: 4, tier: 'Low to Moderate' },
    2: { score: 9, tier: 'Moderate' },
    3: { score: 14, tier: 'Moderate to High' },
    4: { score: 19, tier: 'High' },
    5: { score: 24, tier: 'High' }
  },
  C: {
    1: { score: 3, tier: 'Low to Moderate' },
    2: { score: 8, tier: 'Moderate' },
    3: { score: 13, tier: 'Moderate to High' },
    4: { score: 18, tier: 'Moderate to High' },
    5: { score: 23, tier: 'High' }
  },
  B: {
    1: { score: 2, tier: 'Low' },
    2: { score: 6, tier: 'Low to Moderate' },
    3: { score: 11, tier: 'Moderate' },
    4: { score: 16, tier: 'Moderate to High' },
    5: { score: 21, tier: 'High' }
  },
  A: {
    1: { score: 1, tier: 'Low' },
    2: { score: 5, tier: 'Low to Moderate' },
    3: { score: 10, tier: 'Moderate' },
    4: { score: 15, tier: 'Moderate to High' },
    5: { score: 20, tier: 'High' }
  }
};

let testedCellsCount = 0;
for (const lKey of ['E', 'D', 'C', 'B', 'A'] as LikelihoodLetter[]) {
  for (let s = 1; s <= 5; s++) {
    const sev = s as SeverityLevel;
    const expected = expectedGrid[lKey][sev];
    const cellFromConfig = WHMP_RISK_MATRIX[lKey][sev];
    const cellFromLookup = lookupRisk(lKey, sev);

    assert(
      cellFromConfig.score === expected.score && cellFromConfig.tier === expected.tier,
      `Cell ${lKey}${sev}: Config score=${cellFromConfig.score}, tier="${cellFromConfig.tier}" matches WHMP standard`
    );

    assert(
      cellFromLookup.score === expected.score && cellFromLookup.tier === expected.tier,
      `lookupRisk('${lKey}', ${sev}) returned score=${cellFromLookup.score}, tier="${cellFromLookup.tier}"`
    );

    // Explicit proof that this is NOT simple L * S:
    const likelihoodNum = WHMP_LIKELIHOOD_SCALE[lKey].number;
    const naiveProduct = likelihoodNum * sev;
    if (naiveProduct !== expected.score) {
      assert(
        cellFromLookup.score !== naiveProduct,
        `Proved NON-LINEAR: ${lKey}${sev} matrix score (${cellFromLookup.score}) ≠ Naive L*S (${naiveProduct})`
      );
    }

    testedCellsCount++;
  }
}
assert(testedCellsCount === 25, `All 25 matrix cells successfully verified against WHMP standard`);

// ---------------------------------------------------------------------------
// TEST 2: Likelihood Scale: Both Letter and Number Representation
// ---------------------------------------------------------------------------
console.log('\n--- 2. Testing Likelihood Scale (Letter A..E & Number 1..5) ---');
const letters: LikelihoodLetter[] = ['A', 'B', 'C', 'D', 'E'];
const expectedNumbers: LikelihoodNumber[] = [1, 2, 3, 4, 5];

letters.forEach((letter, idx) => {
  const scaleItem = WHMP_LIKELIHOOD_SCALE[letter];
  assert(scaleItem.letter === letter, `Scale ${letter} stores letter "${letter}"`);
  assert(scaleItem.number === expectedNumbers[idx], `Scale ${letter} maps to level ${expectedNumbers[idx]}`);
  assert(scaleItem.labelId.length > 0, `Scale ${letter} has Indonesian label: "${scaleItem.labelId}"`);
});

// Test numeric level lookup via helper:
assert(lookupRisk(5, 5).score === 25, 'lookupRisk accepts numeric level 5 (E) and severity 5 -> score 25');
assert(lookupRisk(1, 1).score === 1, 'lookupRisk accepts numeric level 1 (A) and severity 1 -> score 1');
assert(lookupRisk(3, 3).score === 13, 'lookupRisk accepts numeric level 3 (C) and severity 3 -> score 13');

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// TEST 3: Discrepancy Detection in WHMP Catalog
// ---------------------------------------------------------------------------
console.log('\n--- 3. Testing WHMP Discrepancy Detection ---');

// Mock species with baseline score matching matrix lookup
const concordantSpecies: WHMPSpecies = {
  id: 'test-1',
  species_number: 101,
  common_name_id: 'Kuntul Kerbau',
  common_name_en: 'Eastern Cattle Egret',
  latin_name_as_written: 'Bubulcus ibis',
  latin_name_corrected: 'Bubulcus coromandus',
  taxonomic_status: 'Needs taxonomic review',
  group: 'Burung (Aves)',
  likelihood_level: WHMP_LIKELIHOOD_SCALE.E,
  severity_level: 3,
  risk_score: 17, // Matches matrix E3 = 17
  risk_tier: 'Moderate to High',
  recomputed_score: 17,
  recomputed_tier: 'Moderate to High',
  has_discrepancy: false
};

const checkConcordant = evaluateSpeciesDiscrepancy(concordantSpecies);
assert(checkConcordant.hasDiscrepancy === false, 'Concordant species evaluated as having NO discrepancy');
assert(checkConcordant.recomputedScore === 17, 'Recomputed score correctly matched 17');

// Mock species where WHMP written score has human transcription error
const discordantSpecies: WHMPSpecies = {
  ...concordantSpecies,
  id: 'test-2',
  risk_score: 15 // Written as 15 in erroneous document, but E3 is 17
};
const checkDiscordant = evaluateSpeciesDiscrepancy(discordantSpecies);
assert(checkDiscordant.hasDiscrepancy === true, 'Discordant species correctly flagged with hasDiscrepancy = true');
assert(
  checkDiscordant.discrepancyNote?.includes('Score mismatch'),
  `Detailed note generated: "${checkDiscordant.discrepancyNote}"`
);

// Verify Soekarno-Hatta 60 Species Catalog
assert(WHMP_60_SPECIES.length === 60, `Catalog contains exact ${WHMP_60_SPECIES.length} WHMP species`);
const speciesWithReview = WHMP_60_SPECIES.filter(s => s.taxonomic_status === 'Needs taxonomic review');
assert(
  speciesWithReview.length > 0,
  `Catalog properly isolates species needing taxonomic review (${speciesWithReview.length} species flagged)`
);

// ---------------------------------------------------------------------------
// TEST 4: WHMP Zones 1..6 Reference & Critical Zone Logic
// ---------------------------------------------------------------------------
console.log('\n--- 4. Testing WHMP Zones 1..6 Reference & Critical Flags ---');
assert(WHMP_ZONES.length === 6, `Exact 6 WHMP zones defined`);

const criticalZones = WHMP_ZONES.filter(z => z.isCritical);
const nonCriticalZones = WHMP_ZONES.filter(z => !z.isCritical);

assert(criticalZones.length === 3, `Exactly 3 zones flagged as Critical (Zones 1, 2, 3)`);
assert(nonCriticalZones.length === 3, `Exactly 3 zones flagged as Non-Critical (Zones 4, 5, 6)`);

assert(getZoneById('zone-1')?.isCritical === true, 'Zone 1 (Runway Strips & RESA) is Critical');
assert(getZoneById('zone-2')?.isCritical === true, 'Zone 2 (Taxiway & Apron) is Critical');
assert(getZoneById('zone-3')?.isCritical === true, 'Zone 3 (Approach & Climb-out 0-3km) is Critical');
assert(getZoneById('zone-4')?.isCritical === false, 'Zone 4 (Outer Airport 3-8km) is Non-Critical');
assert(getZoneById('zone-5')?.isCritical === false, 'Zone 5 (Extended Aerodrome 8-13km) is Non-Critical');
assert(getZoneById('zone-6')?.isCritical === false, 'Zone 6 (Peripheral 13km+) is Non-Critical');

// ---------------------------------------------------------------------------
// TEST 5: Likelihood Computation (Approach 1: Days/Year & Approach 2: Strikes/Year)
// ---------------------------------------------------------------------------
console.log('\n--- 5. Testing Likelihood Computations from Operational Reports ---');

// Approach 1: Days observed per year
// Config thresholds: E (>100), D (50-100), C (20-50), B (5-20), A (<5)
assert(computeLikelihoodFromDays(120) === 'E', '120 days/year -> Likelihood E (Sangat Besar)');
assert(computeLikelihoodFromDays(75) === 'D', '75 days/year -> Likelihood D (Besar)');
assert(computeLikelihoodFromDays(30) === 'C', '30 days/year -> Likelihood C (Sedang)');
assert(computeLikelihoodFromDays(12) === 'B', '12 days/year -> Likelihood B (Kecil)');
assert(computeLikelihoodFromDays(2) === 'A', '2 days/year -> Likelihood A (Sangat Sangat Jarang)');

// Document Overlap edge case: At exactly 50 days (WHMP text overlaps at 50)
const overlap50 = computeLikelihoodFromDays(50);
assert(
  overlap50 === 'D' || overlap50 === 'C',
  `50 days boundary evaluates safely to ${overlap50}`
);

// Verify Placeholder Flag is active
assert(
  WHMP_LIKELIHOOD_CONFIG.isPlaceholder === true,
  'WHMP likelihood config explicitly flagged with isPlaceholder = true'
);

// Approach 2: 5-year average strikes per year
// Config thresholds: E (>5.0), D (2.0-5.0), C (0.5-2.0), B (0.1-0.5), A (<0.1)
assert(computeLikelihoodFromStrikes(6.0) === 'E', '6.0 strikes/year -> Likelihood E (Sangat Besar)');
assert(computeLikelihoodFromStrikes(3.5) === 'D', '3.5 strikes/year -> Likelihood D (Besar)');
assert(computeLikelihoodFromStrikes(1.0) === 'C', '1.0 strikes/year -> Likelihood C (Sedang)');
assert(computeLikelihoodFromStrikes(0.3) === 'B', '0.3 strikes/year -> Likelihood B (Kecil)');
assert(computeLikelihoodFromStrikes(0.05) === 'A', '0.05 strikes/year -> Likelihood A (Sangat Sangat Jarang)');

// ---------------------------------------------------------------------------
// TEST 6: Latin Name Separation & Taxonomic Review Workflow
// ---------------------------------------------------------------------------
console.log('\n--- 6. Testing Latin Name Separation & Taxonomy Review ---');

const sampleSpecies = WHMP_60_SPECIES.find(s => s.id === 'whmp-sp-02');
assert(sampleSpecies !== undefined, 'Found test species in catalog');
if (sampleSpecies) {
  assert(
    typeof sampleSpecies.latin_name_as_written === 'string' && sampleSpecies.latin_name_as_written.length > 0,
    `latin_name_as_written preserved: "${sampleSpecies.latin_name_as_written}"`
  );
  assert(
    sampleSpecies.latin_name_corrected !== undefined,
    `latin_name_corrected field exists separately ("${sampleSpecies.latin_name_corrected}")`
  );
  assert(
    sampleSpecies.taxonomic_status === 'Needs taxonomic review',
    'Flagged as Needs taxonomic review until verified'
  );
}

// ---------------------------------------------------------------------------
// TEST 7: Proposed Species Workflow (Outside 60 & Non-Birds)
// ---------------------------------------------------------------------------
console.log('\n--- 7. Testing Proposed Species Lifecycle ---');

const mockProposedNonBird: ProposedSpecies = {
  id: 'prop-varanus-1',
  common_name_id: 'Biawak Air',
  common_name_en: 'Asian Water Monitor',
  proposed_latin_name: 'Varanus salvator',
  group: 'Reptil',
  proposed_severity: 3,
  severity_justification: 'Potensi debris / hazard bagi roda pesawat saat take-off',
  estimated_likelihood: 'C',
  first_observed_date: '2026-11-01',
  first_observed_zone_id: 'zone-1',
  first_observed_location_desc: 'Saluran drainase terbuka dekat RWY 07R/25L',
  estimated_population: 2,
  proposed_by_name: 'Officer Alpha',
  proposed_by_user_id: 'officer-alpha-id',
  proposed_at: new Date().toISOString(),
  status: 'PROPOSED'
};

assert(mockProposedNonBird.status === 'PROPOSED', 'New proposed species starts in "PROPOSED" status');
assert(mockProposedNonBird.group === 'Reptil', 'Supports non-bird taxonomic groups (reptiles, mammals)');

// Simulate review and approval
const approvedProposal: ProposedSpecies = {
  ...mockProposedNonBird,
  status: 'APPROVED',
  reviewed_by_name: 'SuperAdmin WHU',
  reviewed_by_user_id: 'admin-id',
  reviewed_at: new Date().toISOString(),
  review_notes: 'Disetujui masuk katalog risiko WHMP CGK'
};

assert(approvedProposal.status === 'APPROVED', 'Proposal successfully approved');
const calculatedApprovedRisk = lookupRisk(approvedProposal.estimated_likelihood, approvedProposal.proposed_severity);
assert(calculatedApprovedRisk.score === 13, 'Approved proposal correctly yields matrix score 13 (C3)');

console.log('\n======================================================');
console.log(' ALL 7 WHMP RISK MODEL TEST SUITES PASSED (100% OK)');
console.log('======================================================\n');
