import {
  LikelihoodLetter,
  LikelihoodNumber,
  LikelihoodLevel,
  SeverityLevel,
  MatrixCell,
  RiskTier,
  WHMPSpecies,
  WHMPZone,
  LikelihoodComputationConfig,
  SpeciesActualComparison
} from '../types/whmpRisk';
import {
  WHMP_RISK_MATRIX,
  WHMP_ZONES,
  WHMP_LIKELIHOOD_CONFIG
} from '../config/whmpRiskConfig';

/**
 * EXACT LOOKUP FUNCTION (Likelihood x Severity -> Score, Tier)
 * CRITICAL RULE: DO NOT compute score as likelihood x severity. Use this lookup!
 */
export function lookupRisk(
  likelihood: LikelihoodLetter | LikelihoodNumber | LikelihoodLevel | number | string,
  severityLevel: SeverityLevel | number
): MatrixCell {
  let letter: LikelihoodLetter | undefined;

  if (typeof likelihood === 'object' && likelihood !== null && 'letter' in likelihood) {
    letter = (likelihood as any).letter;
  } else if (typeof likelihood === 'number') {
    const map: Record<number, LikelihoodLetter> = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E' };
    letter = map[likelihood];
  } else if (typeof likelihood === 'string') {
    const upper = likelihood.toUpperCase();
    if (['A', 'B', 'C', 'D', 'E'].includes(upper)) {
      letter = upper as LikelihoodLetter;
    } else {
      const num = parseInt(upper, 10);
      const map: Record<number, LikelihoodLetter> = { 1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E' };
      letter = map[num];
    }
  }

  if (!letter || !WHMP_RISK_MATRIX[letter]) {
    throw new Error(`Invalid likelihood letter: ${String(likelihood)}`);
  }
  const row = WHMP_RISK_MATRIX[letter];
  const sev = Number(severityLevel) as SeverityLevel;
  const cell = row[sev];
  if (!cell) {
    throw new Error(`Invalid severity level: ${severityLevel}`);
  }
  return cell;
}

/**
 * Check if a cell or species has a discrepancy between document value and lookup matrix
 */
export function evaluateSpeciesDiscrepancy(species: WHMPSpecies | any): {
  hasDiscrepancy: boolean;
  scoreDiff: number;
  tierMismatch: boolean;
  detail?: string;
  discrepancyNote?: string;
  recomputedScore: number;
  recomputedTier: RiskTier;
} {
  const likelihoodVal = species.likelihood_level?.letter || species.whmpBaseline?.likelihoodLetter || species.likelihood_level || species.whmpBaseline?.likelihoodLevel || 'A';
  const severityVal = species.severity_level || species.whmpBaseline?.severityLevel || 1;
  const originalScore = species.risk_score ?? species.whmpBaseline?.riskScore ?? 0;
  const originalTier = species.risk_tier ?? species.whmpBaseline?.riskTier ?? 'Low';

  const cell = lookupRisk(likelihoodVal, severityVal);
  const scoreDiff = originalScore - cell.score;
  const tierMismatch = originalTier !== cell.tier;
  const hasDiscrepancy = scoreDiff !== 0 || tierMismatch;

  let detail: string | undefined;
  if (hasDiscrepancy) {
    const parts: string[] = [];
    if (scoreDiff !== 0) {
      parts.push(`Score mismatch: Dokumen WHMP (${originalScore}) vs Matriks (${cell.score})`);
    }
    if (tierMismatch) {
      parts.push(`Tier mismatch: Dokumen WHMP (${originalTier}) vs Matriks (${cell.tier})`);
    }
    detail = parts.join(' • ');
  }

  return {
    hasDiscrepancy,
    scoreDiff,
    tierMismatch,
    detail,
    discrepancyNote: detail,
    recomputedScore: cell.score,
    recomputedTier: cell.tier
  };
}

/**
 * Approach 1: Days observed per year -> Likelihood (A..E)
 */
export function computeLikelihoodFromDays(
  daysObserved: number,
  config: LikelihoodComputationConfig = WHMP_LIKELIHOOD_CONFIG
): LikelihoodLetter {
  const tiers = config.approach1_daysObserved.thresholds;
  for (const t of tiers) {
    if (t.max === null) {
      if (daysObserved >= t.min) return t.letter;
    } else {
      if (daysObserved >= t.min && daysObserved <= t.max) return t.letter;
    }
  }
  return 'A';
}

/**
 * Approach 2: 5-year average strikes per year -> Likelihood (A..E)
 */
export function computeLikelihoodFromStrikes(
  strikesPerYear: number,
  config: LikelihoodComputationConfig = WHMP_LIKELIHOOD_CONFIG
): LikelihoodLetter {
  const tiers = config.approach2_strikesAverage.thresholds;
  for (const t of tiers) {
    if (t.max === null) {
      if (strikesPerYear >= t.min) return t.letter;
    } else {
      if (strikesPerYear >= t.min && strikesPerYear <= t.max) return t.letter;
    }
  }
  return 'A';
}

/**
 * Helper to get zone by ID or number
 */
export function getZoneById(zoneIdOrNum?: string | number): WHMPZone | undefined {
  if (!zoneIdOrNum) return undefined;
  if (typeof zoneIdOrNum === 'number') {
    return WHMP_ZONES.find(z => z.zoneNumber === zoneIdOrNum);
  }
  const clean = String(zoneIdOrNum).trim().toLowerCase();
  return WHMP_ZONES.find(
    z => z.id.toLowerCase() === clean || 
         z.code.toLowerCase() === clean || 
         z.zoneNumber.toString() === clean ||
         clean.includes(`zone-${z.zoneNumber}`) ||
         clean.includes(`zona ${z.zoneNumber}`)
  );
}

/**
 * Match species name from report strings (case-insensitive fuzzy match)
 */
export function matchesSpecies(reportName: string, species: WHMPSpecies): boolean {
  if (!reportName) return false;
  const normRep = reportName.toLowerCase().trim();
  const idMatch = species.common_name_id.toLowerCase();
  const enMatch = species.common_name_en.toLowerCase();
  const latWritten = species.latin_name_as_written.toLowerCase();
  const latCorrected = species.latin_name_corrected.toLowerCase();

  return (
    normRep.includes(idMatch) ||
    idMatch.includes(normRep) ||
    normRep.includes(latWritten) ||
    normRep.includes(latCorrected) ||
    normRep.includes(enMatch)
  );
}

/**
 * Compute "WHMP vs Actual" comparison for a single species against operational report collections
 */
export function calculateSpeciesComparison(
  species: WHMPSpecies,
  patrols: any[],
  occurrences: any[],
  strikes: any[],
  config: LikelihoodComputationConfig = WHMP_LIKELIHOOD_CONFIG
): SpeciesActualComparison {
  const uniqueObservationDates = new Set<string>();
  let totalSightingsCount = 0;
  let strikesCount = 0;

  // 1. Scan Patrol Reports
  for (const p of patrols) {
    const pDate = p.hariTanggal || p.createdAt?.slice(0, 10);
    if (!pDate) continue;

    let sawThisSpecies = false;
    if (Array.isArray(p.temuanSatwa)) {
      for (const t of p.temuanSatwa) {
        if (matchesSpecies(t.spesies, species)) {
          sawThisSpecies = true;
          totalSightingsCount += (Number(t.jumlah) || 1);
        }
      }
    }
    if (sawThisSpecies) {
      uniqueObservationDates.add(pDate);
    }
  }

  // 2. Scan Occurrence Reports
  for (const o of occurrences) {
    const oDate = o.hariTanggal || o.createdAt?.slice(0, 10);
    if (!oDate) continue;

    if (matchesSpecies(o.jenisSatwa, species)) {
      uniqueObservationDates.add(oDate);
      totalSightingsCount += (Number(o.jumlahSatwa) || 1);
    }
  }

  // 3. Scan Wildlife Strike Reports
  for (const s of strikes) {
    const sDate = s.hariTanggal || s.createdAt?.slice(0, 10);
    if (matchesSpecies(s.jenisWildlife, species)) {
      strikesCount += 1;
      if (sDate) {
        uniqueObservationDates.add(sDate);
      }
    }
  }

  const actualDaysObserved = uniqueObservationDates.size;
  // Assume a 1-year operational baseline, or annualized
  const strikesPerYear = strikesCount; 

  const app1Likelihood = computeLikelihoodFromDays(actualDaysObserved, config);
  const app2Likelihood = computeLikelihoodFromStrikes(strikesPerYear, config);

  // Adopt the conservative (higher) likelihood of the two per ICAO Safety Management Principles
  const likelihoodScoreMap: Record<LikelihoodLetter, number> = { A: 1, B: 2, C: 3, D: 4, E: 5 };
  const adoptedLikelihood = likelihoodScoreMap[app1Likelihood] >= likelihoodScoreMap[app2Likelihood] 
    ? app1Likelihood 
    : app2Likelihood;

  // Recompute actual risk score & tier using the lookup matrix
  const actualMatrixCell = lookupRisk(adoptedLikelihood, species.severity_level);
  const computedScore = actualMatrixCell.score;
  const computedTier = actualMatrixCell.tier;

  // Variance calculation
  const varianceScore = computedScore - species.risk_score;
  let varianceTier: 'INCREASED' | 'DECREASED' | 'STABLE' = 'STABLE';
  if (varianceScore > 0) {
    varianceTier = 'INCREASED';
  } else if (varianceScore < 0) {
    varianceTier = 'DECREASED';
  }

  let revisionRecommendation = 'Pertahankan peringkat risiko baseline dokumen WHMP.';
  if (varianceTier === 'INCREASED') {
    revisionRecommendation = `ESKALASI RISIKO: Frekuensi aktual (${actualDaysObserved} hari, ${strikesCount} strike) menunjukkan aktivitas lebih tinggi daripada baseline WHMP (Skor ${species.risk_score} -> ${computedScore}). Diusulkan penaikan peringkat risiko pada revisi dokumen WHMP berikutnya.`;
  } else if (varianceTier === 'DECREASED') {
    revisionRecommendation = `PENURUNAN RISIKO: Populasi teramati sangat terkendali (${actualDaysObserved} hari) dibanding baseline WHMP. Tindakan mitigasi saat ini efektif.`;
  }

  return {
    species,
    whmp_likelihood: species.likelihood_level.letter,
    whmp_likelihood_number: species.likelihood_level.number,
    whmp_severity: species.severity_level,
    whmp_score: species.risk_score,
    whmp_tier: species.risk_tier,

    actual_days_observed_year: actualDaysObserved,
    actual_total_sightings_count: totalSightingsCount,
    actual_strikes_count: strikesCount,
    actual_strikes_per_year: strikesPerYear,
    computed_likelihood_approach1: app1Likelihood,
    computed_likelihood_approach2: app2Likelihood,
    computed_likelihood_adopted: adoptedLikelihood,
    computed_score: computedScore,
    computed_tier: computedTier,

    variance_tier: varianceTier,
    variance_score: varianceScore,
    revision_recommendation: revisionRecommendation
  };
}
