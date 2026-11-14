/**
 * Configurable Bird Activity Risk Evaluator for Soekarno-Hatta (WIII).
 * Evaluates operational conditions against the rule table.
 * All thresholds are marked as placeholders requiring wildlife hazard team approval.
 */

import { BirdActivityRisk, BirdRiskLevel } from '../types/weather';
import birdRulesConfig from '../../config/birdActivityRules.json';

export interface BirdActivityInputs {
  thermalHeightM: number | null;
  windSpeedKt: number | null;
  visibilityKm: number | null;
  isThunderstorm: boolean;
  rainfallMm: number | null;
  humidityPct: number | null;
  hourWib: number; // 0 - 23.99 in WIB
  recentSightingsLast24h?: number;
}

export interface RuleDefinition {
  id: string;
  priority: number;
  riskLevel: BirdRiskLevel;
  title: string;
  conditions: {
    isThunderstorm?: boolean;
    timeOfDay?: 'CREPUSCULAR' | 'DAY' | 'NIGHT';
    maxVisibilityKm?: number;
    minThermalHeightM?: number;
    maxWindSpeedKt?: number;
    minWindSpeedKt?: number;
    recentRainfallMm?: number;
    humidityMin?: number;
    minRecentSightings?: number;
  };
  description: string;
  thresholdsNote: string;
}

export function getTimeOfDayCategory(hourWib: number): {
  category: 'DAWN' | 'DAY' | 'DUSK' | 'NIGHT';
  isCrepuscular: boolean;
} {
  // 05:30 (5.5) to 07:30 (7.5) = Dawn (Fajar)
  if (hourWib >= 5.5 && hourWib <= 7.5) {
    return { category: 'DAWN', isCrepuscular: true };
  }
  // 17:30 (17.5) to 18.75 (18:45) = Dusk (Senja)
  if (hourWib >= 17.5 && hourWib <= 18.75) {
    return { category: 'DUSK', isCrepuscular: true };
  }
  // Daytime
  if (hourWib > 7.5 && hourWib < 17.5) {
    return { category: 'DAY', isCrepuscular: false };
  }
  // Night
  return { category: 'NIGHT', isCrepuscular: false };
}

/**
 * Evaluates inputs against the rule table sorted by priority (highest first)
 */
export function evaluateBirdActivityRisk(
  inputs: BirdActivityInputs,
  rulesOverride?: RuleDefinition[]
): BirdActivityRisk {
  const rules: RuleDefinition[] = (rulesOverride || (birdRulesConfig.rules as unknown as RuleDefinition[]))
    .slice()
    .sort((a, b) => b.priority - a.priority);

  const { category, isCrepuscular } = getTimeOfDayCategory(inputs.hourWib);
  const contributingFactors: string[] = [];

  for (const rule of rules) {
    const cond = rule.conditions;
    let matched = true;

    // 1. Thunderstorm condition
    if (cond.isThunderstorm !== undefined) {
      if (cond.isThunderstorm !== inputs.isThunderstorm) {
        matched = false;
      } else if (inputs.isThunderstorm) {
        contributingFactors.push('Badai petir / awan konvektif terpantau aktif');
      }
    }

    // 2. Crepuscular / Time of Day
    if (matched && cond.timeOfDay !== undefined) {
      if (cond.timeOfDay === 'CREPUSCULAR' && !isCrepuscular) {
        matched = false;
      } else if (isCrepuscular) {
        contributingFactors.push(`Periode kerepuskular (${category === 'DAWN' ? 'Fajar Pagi' : 'Senja Hari'}) aktif`);
      }
    }

    // 3. Visibility condition
    if (matched && cond.maxVisibilityKm !== undefined) {
      if (inputs.visibilityKm === null || inputs.visibilityKm > cond.maxVisibilityKm) {
        matched = false;
      } else {
        contributingFactors.push(`Visibilitas rendah: ${inputs.visibilityKm.toFixed(1)} km (≤ ${cond.maxVisibilityKm} km)`);
      }
    }

    // 4. Thermal Height condition
    if (matched && cond.minThermalHeightM !== undefined) {
      if (inputs.thermalHeightM === null || inputs.thermalHeightM < cond.minThermalHeightM) {
        matched = false;
      } else {
        contributingFactors.push(`Thermal mixing height tinggi: ${inputs.thermalHeightM} m (≥ ${cond.minThermalHeightM} m)`);
      }
    }

    // 5. Max Wind speed condition (calm / light wind)
    if (matched && cond.maxWindSpeedKt !== undefined) {
      if (inputs.windSpeedKt === null || inputs.windSpeedKt > cond.maxWindSpeedKt) {
        matched = false;
      } else {
        contributingFactors.push(`Angin tenang/ringan: ${inputs.windSpeedKt} kt (≤ ${cond.maxWindSpeedKt} kt)`);
      }
    }

    // 6. Min Wind speed condition (high wind)
    if (matched && cond.minWindSpeedKt !== undefined) {
      if (inputs.windSpeedKt === null || inputs.windSpeedKt < cond.minWindSpeedKt) {
        matched = false;
      } else {
        contributingFactors.push(`Angin kencang: ${inputs.windSpeedKt} kt (≥ ${cond.minWindSpeedKt} kt)`);
      }
    }

    // 7. Recent rainfall condition
    if (matched && cond.recentRainfallMm !== undefined) {
      if (inputs.rainfallMm === null || inputs.rainfallMm < cond.recentRainfallMm) {
        matched = false;
      } else {
        contributingFactors.push(`Curah hujan tercatat: ${inputs.rainfallMm} mm`);
      }
    }

    // 8. Min Humidity condition
    if (matched && cond.humidityMin !== undefined) {
      if (inputs.humidityPct === null || inputs.humidityPct < cond.humidityMin) {
        matched = false;
      } else {
        contributingFactors.push(`Kelembapan udara tinggi: ${inputs.humidityPct}%`);
      }
    }

    // 9. Recent Wildlife sightings from database
    if (matched && cond.minRecentSightings !== undefined) {
      const sightings = inputs.recentSightingsLast24h || 0;
      if (sightings < cond.minRecentSightings) {
        matched = false;
      } else {
        contributingFactors.push(`Laporan observasi satwa 24 jam terakhir: ${sightings} kejadian`);
      }
    }

    // If all defined conditions match, trigger this rule!
    if (matched) {
      return {
        level: rule.riskLevel,
        ruleId: rule.id,
        ruleTitle: rule.title,
        description: rule.description,
        thresholdsNote: rule.thresholdsNote,
        timeOfDayCategory: category,
        contributingFactors: Array.from(new Set(contributingFactors))
      };
    }
  }

  // Fallback safe baseline
  return {
    level: 'LOW',
    ruleId: 'RULE_DEFAULT_BASELINE',
    ruleTitle: 'Kondisi Cuaca Standar - Risiko Aktivitas Satwa Terkendali',
    description: 'Kondisi meteorologi dalam batas normal. Lanjutkan patroli dan observasi satwa rutin.',
    thresholdsNote: '[BASELINE]: Tidak ada ambang batas khusus yang terpicu.',
    timeOfDayCategory: category,
    contributingFactors: []
  };
}
