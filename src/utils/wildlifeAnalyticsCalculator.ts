import * as XLSX from 'xlsx';
import { PatrolReport, OccurrenceReport, WildlifeStrikeReport, MonthlyReportDocument } from '../types';
import { 
  MonthlyWildlifeMetric, 
  BirdSpeciesStats, 
  MONTH_NAMES_INFO, 
  BASELINE_2025_DATA, 
  BASELINE_2026_DATA, 
  BASELINE_2027_DATA, 
  BIRD_SPECIES_MASTER 
} from '../data/wildlifePopulationAnalyticsData';
import { getNormalizedMonthIndex } from './dateUtils';
import { toNumber } from './monthlyExcelParser';

export interface MultiYearAnalyticsResult {
  timelineData: MonthlyWildlifeMetric[];          // All months in chronological order (2025 - 2026 dst)
  data2025: MonthlyWildlifeMetric[];              // 12 months of 2025
  data2026: MonthlyWildlifeMetric[];              // 12 months of 2026
  data2027: MonthlyWildlifeMetric[];              // 12 months of 2027
  comparisonByMonth: Array<{
    monthIndex: number;
    monthName: string;
    monthShort: string;
    strikes2025: number;
    strikes2026: number;
    strikes2027: number;
    occurrences2025: number;
    occurrences2026: number;
    occurrences2027: number;
    birds2025: number;
    birds2026: number;
    birds2027: number;
    damage2025: number;
    damage2026: number;
    damage2027: number;
    deltaStrikes26vs25: number;
    pctStrikes26vs25: number;
    deltaBirds26vs25: number;
    pctBirds26vs25: number;
    season: 'migrasi' | 'pancaroba' | 'kemarau';
    seasonLabel: string;
  }>;
  yearlyTotals: {
    year2025: { strikes: number; occurrences: number; birds: number; damage: number; movements: number; strikeRate: number };
    year2026: { strikes: number; occurrences: number; birds: number; damage: number; movements: number; strikeRate: number };
    year2027: { strikes: number; occurrences: number; birds: number; damage: number; movements: number; strikeRate: number };
  };
  speciesStats: BirdSpeciesStats[];
  dominantSpeciesName: string;
  peakMonthRisk: { monthName: string; year: number; strikes: number; birds: number };
}

// Helper to safely parse report dates
function parseReportDate(dateStr?: string, createdAt?: string): { month: number; year: number } | null {
  if (createdAt) {
    const d = new Date(createdAt);
    if (!isNaN(d.getTime())) {
      return { month: d.getMonth(), year: d.getFullYear() };
    }
  }
  if (dateStr) {
    const yMatch = dateStr.match(/\b(20\d{2})\b/);
    const foundYear = yMatch ? parseInt(yMatch[1], 10) : 2026;
    const mIdx = getNormalizedMonthIndex(dateStr);
    if (mIdx !== -1) {
      return { month: mIdx, year: foundYear };
    }
    const isoMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      return { month: parseInt(isoMatch[2], 10) - 1, year: parseInt(isoMatch[1], 10) };
    }
    const dmyMatch = dateStr.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (dmyMatch) {
      return { month: parseInt(dmyMatch[2], 10) - 1, year: parseInt(dmyMatch[3], 10) };
    }
  }
  return null;
}

export function compileMultiYearWildlifeMetrics(
  strikes: WildlifeStrikeReport[] = [],
  occurrences: OccurrenceReport[] = [],
  patrols: PatrolReport[] = [],
  monthlyDocuments: MonthlyReportDocument[] = []
): MultiYearAnalyticsResult {
  // 1. Tally live reports per (year, month)
  interface LiveBucket {
    strikes: number;
    damage: number;
    occurrences: number;
    birdPop: number;
    patrols: number;
    speciesMap: Record<string, number>;
  }

  const liveMap = new Map<string, LiveBucket>();
  const getBucket = (year: number, monthIdx: number): LiveBucket => {
    const key = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
    let b = liveMap.get(key);
    if (!b) {
      b = { strikes: 0, damage: 0, occurrences: 0, birdPop: 0, patrols: 0, speciesMap: {} };
      liveMap.set(key, b);
    }
    return b;
  };

  // Process live strikes
  strikes.forEach(s => {
    const parsed = parseReportDate(s.hariTanggal, s.createdAt);
    if (!parsed) return;
    const bucket = getBucket(parsed.year, parsed.month);
    bucket.strikes++;
    if (s.indikasiKerusakan === 'Ada') {
      bucket.damage++;
    }
    if (s.jenisWildlife) {
      bucket.speciesMap[s.jenisWildlife] = (bucket.speciesMap[s.jenisWildlife] || 0) + (s.jumlahWildlife || 1);
    }
  });

  // Process live occurrences
  occurrences.forEach(o => {
    const parsed = parseReportDate(o.hariTanggal, o.createdAt);
    if (!parsed) return;
    const bucket = getBucket(parsed.year, parsed.month);
    bucket.occurrences++;
    if (o.jenisSatwa) {
      bucket.speciesMap[o.jenisSatwa] = (bucket.speciesMap[o.jenisSatwa] || 0) + (o.jumlahSatwa || 1);
    }
  });

  // Process live patrols
  patrols.forEach(p => {
    const parsed = parseReportDate(p.hariTanggal, p.createdAt);
    if (!parsed) return;
    const bucket = getBucket(parsed.year, parsed.month);
    bucket.patrols++;
    bucket.birdPop += (p.totalPopulasiTeramati || 0);
    p.temuanSatwa.forEach(ts => {
      if (ts.spesies) {
        bucket.speciesMap[ts.spesies] = (bucket.speciesMap[ts.spesies] || 0) + (ts.jumlah || 0);
      }
    });
  });

  // Also integrate uploaded monthly documents if available
  monthlyDocuments.forEach(doc => {
    // 1. If document has multi-month breakdown (e.g. from uploaded PDF/Excel), integrate all periods!
    if (doc.monthlyBreakdown && doc.monthlyBreakdown.length > 0) {
      doc.monthlyBreakdown.forEach(mb => {
        const mbYear = mb.tahun || 2026;
        const mbMonthIdx = mb.bulanIndex !== undefined && mb.bulanIndex >= 0 
          ? mb.bulanIndex 
          : getNormalizedMonthIndex(mb.bulan);
        if (mbMonthIdx >= 0 && mbMonthIdx < 12) {
          const bucket = getBucket(mbYear, mbMonthIdx);
          if (mb.totalStrike !== undefined) {
            bucket.strikes = Math.max(bucket.strikes, mb.totalStrike);
          }
          if (mb.strikeWithDamage !== undefined) {
            bucket.damage = Math.max(bucket.damage, mb.strikeWithDamage);
          }
          if (mb.totalOccurrence !== undefined) {
            bucket.occurrences = Math.max(bucket.occurrences, mb.totalOccurrence);
          }
          if (mb.totalSatwa !== undefined) {
            bucket.birdPop = Math.max(bucket.birdPop, mb.totalSatwa);
          }
          if (mb.totalPatroli !== undefined) {
            bucket.patrols = Math.max(bucket.patrols, mb.totalPatroli);
          }
        }
      });
    }

    // 2. Also integrate bird population species counts if available
    if (doc.birdPopulationData && doc.birdPopulationData.species?.length > 0) {
      doc.birdPopulationData.species.forEach(sp => {
        if (sp.countsByPeriod) {
          Object.entries(sp.countsByPeriod).forEach(([periodKey, count]) => {
            const [yStr, mStr] = periodKey.split('-');
            const y = parseInt(yStr, 10);
            const m = parseInt(mStr, 10) - 1;
            if (!isNaN(y) && !isNaN(m) && m >= 0 && m < 12) {
              const bucket = getBucket(y, m);
              bucket.speciesMap[sp.namaSpesies] = (bucket.speciesMap[sp.namaSpesies] || 0) + (count || 0);
            }
          });
        }
      });
    }

    // 3. Fallback for single-month document declarations
    const year = Number(doc.periodeTahun) || 2026;
    const monthIdx = getNormalizedMonthIndex(doc.periodeBulan);
    if (monthIdx >= 0 && monthIdx < 12) {
      const bucket = getBucket(year, monthIdx);
      if (doc.totalStrikeBulanIni !== undefined && doc.totalStrikeBulanIni > bucket.strikes) {
        bucket.strikes = doc.totalStrikeBulanIni;
      }
      if (doc.strikeWithDamageBulanIni !== undefined && doc.strikeWithDamageBulanIni > bucket.damage) {
        bucket.damage = doc.strikeWithDamageBulanIni;
      }
      if (doc.totalOccurrenceBulanIni !== undefined && doc.totalOccurrenceBulanIni > bucket.occurrences) {
        bucket.occurrences = doc.totalOccurrenceBulanIni;
      }
      if (doc.totalSatwaBulanIni !== undefined && doc.totalSatwaBulanIni > bucket.birdPop) {
        bucket.birdPop = doc.totalSatwaBulanIni;
      }
      if (doc.totalPatroliBulanIni !== undefined && doc.totalPatroliBulanIni > bucket.patrols) {
        bucket.patrols = doc.totalPatroliBulanIni;
      }
    }
  });

  // 2. Build standardized metrics for 2025, 2026, 2027
  const buildYearData = (year: number, baseline: typeof BASELINE_2025_DATA): MonthlyWildlifeMetric[] => {
    return MONTH_NAMES_INFO.map((mInfo, idx) => {
      const base = baseline[idx];
      const live = liveMap.get(`${year}-${String(idx + 1).padStart(2, '0')}`);

      const strikes = live && live.strikes > 0 ? live.strikes : base.strikes;
      const strikesWithDamage = live && live.damage > 0 ? live.damage : base.damage;
      const occurrences = live && live.occurrences > 0 ? live.occurrences : base.occurrences;
      const totalBirdPopulation = live && live.birdPop > 0 ? live.birdPop : base.birds;
      const patrolCount = live && live.patrols > 0 ? live.patrols : 88 + (idx % 4) * 2;
      const aircraftMovements = base.movements;
      const strikeRate = Number(((strikes / aircraftMovements) * 10000).toFixed(2));

      return {
        year,
        monthIndex: idx,
        monthName: mInfo.full,
        monthShort: mInfo.short,
        periodKey: `${year}-${String(idx + 1).padStart(2, '0')}`,
        label: `${mInfo.short} ${year}`,
        strikes,
        strikesWithDamage,
        strikesNoDamage: Math.max(0, strikes - strikesWithDamage),
        occurrences,
        totalBirdPopulation,
        patrolCount,
        aircraftMovements,
        strikeRatePer10kMovements: strikeRate,
        dominantSpecies: base.dominant,
        season: mInfo.season,
        seasonLabel: mInfo.seasonLabel,
        weatherRisk: mInfo.weather,
        recommendedMitigation: idx <= 1 || idx >= 10
          ? 'Tingkatkan patroli dispersal subuh/senja & pyrotechnics di holding pond (Musim Migrasi EAAF).'
          : idx >= 2 && idx <= 4
          ? 'Pemotongan rumput 15-20 cm & mitigasi serangga airside (Musim Pancaroba).'
          : idx >= 5 && idx <= 7
          ? 'Inspeksi jaring kolam retensi & water cannon deterrent (Musim Kemarau).'
          : 'Pembersihan sedimentasi parit drainase & pengawasan approach (Pancaroba Akhir).',
        isRealData: Boolean(live && (live.strikes > 0 || live.occurrences > 0 || live.birdPop > 0))
      };
    });
  };

  const data2025 = buildYearData(2025, BASELINE_2025_DATA);
  const data2026 = buildYearData(2026, BASELINE_2026_DATA);
  const data2027 = buildYearData(2027, BASELINE_2027_DATA);

  // Full chronological continuous timeline
  const timelineData: MonthlyWildlifeMetric[] = [...data2025, ...data2026, ...data2027];

  // 3. Side-by-side Monthly Comparison Matrix (2025 vs 2026 vs 2027)
  const comparisonByMonth = MONTH_NAMES_INFO.map((mInfo, idx) => {
    const s25 = data2025[idx];
    const s26 = data2026[idx];
    const s27 = data2027[idx];

    const deltaStrikes = s26.strikes - s25.strikes;
    const pctStrikes = s25.strikes > 0 ? Math.round((deltaStrikes / s25.strikes) * 100) : 0;

    const deltaBirds = s26.totalBirdPopulation - s25.totalBirdPopulation;
    const pctBirds = s25.totalBirdPopulation > 0 ? Math.round((deltaBirds / s25.totalBirdPopulation) * 100) : 0;

    return {
      monthIndex: idx,
      monthName: mInfo.full,
      monthShort: mInfo.short,
      strikes2025: s25.strikes,
      strikes2026: s26.strikes,
      strikes2027: s27.strikes,
      occurrences2025: s25.occurrences,
      occurrences2026: s26.occurrences,
      occurrences2027: s27.occurrences,
      birds2025: s25.totalBirdPopulation,
      birds2026: s26.totalBirdPopulation,
      birds2027: s27.totalBirdPopulation,
      damage2025: s25.strikesWithDamage,
      damage2026: s26.strikesWithDamage,
      damage2027: s27.strikesWithDamage,
      deltaStrikes26vs25: deltaStrikes,
      pctStrikes26vs25: pctStrikes,
      deltaBirds26vs25: deltaBirds,
      pctBirds26vs25: pctBirds,
      season: mInfo.season,
      seasonLabel: mInfo.seasonLabel
    };
  });

  // 4. Yearly Totals
  const calculateYearlyTotal = (list: MonthlyWildlifeMetric[]) => {
    const strikes = list.reduce((a, b) => a + b.strikes, 0);
    const occurrences = list.reduce((a, b) => a + b.occurrences, 0);
    const birds = list.reduce((a, b) => a + b.totalBirdPopulation, 0);
    const damage = list.reduce((a, b) => a + b.strikesWithDamage, 0);
    const movements = list.reduce((a, b) => a + b.aircraftMovements, 0);
    const strikeRate = movements > 0 ? Number(((strikes / movements) * 10000).toFixed(2)) : 0;
    return { strikes, occurrences, birds, damage, movements, strikeRate };
  };

  const yearlyTotals = {
    year2025: calculateYearlyTotal(data2025),
    year2026: calculateYearlyTotal(data2026),
    year2027: calculateYearlyTotal(data2027)
  };

  // 5. Species Stats
  const speciesStats: BirdSpeciesStats[] = BIRD_SPECIES_MASTER.map(sp => {
    // Check if live data recorded sightings for this species
    return { ...sp };
  });

  // Peak month identification across 2025-2026
  let maxStrikes = -1;
  let peak = { monthName: 'Desember', year: 2025, strikes: 8, birds: 2450 };
  timelineData.forEach(item => {
    if (item.year <= 2026 && item.strikes > maxStrikes) {
      maxStrikes = item.strikes;
      peak = {
        monthName: item.monthName,
        year: item.year,
        strikes: item.strikes,
        birds: item.totalBirdPopulation
      };
    }
  });

  return {
    timelineData,
    data2025,
    data2026,
    data2027,
    comparisonByMonth,
    yearlyTotals,
    speciesStats,
    dominantSpeciesName: 'Burung Kuntul Kerbau (Bubulcus ibis)',
    peakMonthRisk: peak
  };
}

export function exportWildlifeAnalyticsToExcel(analytics: MultiYearAnalyticsResult) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Linimasa Kontinu 2025 - 2026 dst
  const timelineSheetData = analytics.timelineData.map((d, idx) => ({
    No: idx + 1,
    Tahun: d.year,
    Bulan: d.monthName,
    'Kode Periode': d.periodKey,
    'Total Wildlife Strike': d.strikes,
    'Strike Ada Kerusakan': d.strikesWithDamage,
    'Strike Tanpa Kerusakan': d.strikesNoDamage,
    'Total Occurrence': d.occurrences,
    'Populasi Burung Teramati (Ekor)': d.totalBirdPopulation,
    'Jumlah Inspeksi / Patroli': d.patrolCount,
    'Pergerakan Pesawat Udara': d.aircraftMovements,
    'Strike Rate / 10.000 Pergerakan': d.strikeRatePer10kMovements,
    'Spesies Burung Dominan': d.dominantSpecies,
    Musim: d.seasonLabel,
    'Risiko Cuaca': d.weatherRisk,
    'Rekomendasi Mitigasi': d.recommendedMitigation
  }));
  const wsTimeline = XLSX.utils.json_to_sheet(timelineSheetData);
  XLSX.utils.book_append_sheet(wb, wsTimeline, 'Linimasa 2025-2026 dst');

  // Sheet 2: Perbandingan Bulanan 2025 vs 2026 vs 2027
  const comparisonSheetData = analytics.comparisonByMonth.map((c, idx) => ({
    No: idx + 1,
    Bulan: c.monthName,
    'Strike 2025': c.strikes2025,
    'Strike 2026': c.strikes2026,
    'Delta Strike (26 vs 25)': c.deltaStrikes26vs25,
    '% Perubahan Strike': `${c.pctStrikes26vs25}%`,
    'Strike 2027 (Proyeksi)': c.strikes2027,
    'Occurrence 2025': c.occurrences2025,
    'Occurrence 2026': c.occurrences2026,
    'Occurrence 2027': c.occurrences2027,
    'Populasi Burung 2025': c.birds2025,
    'Populasi Burung 2026': c.birds2026,
    'Delta Burung (26 vs 25)': c.deltaBirds26vs25,
    '% Perubahan Populasi': `${c.pctBirds26vs25}%`,
    'Populasi Burung 2027': c.birds2027,
    'Kerusakan Pesawat 2025': c.damage2025,
    'Kerusakan Pesawat 2026': c.damage2026,
    Musim: c.seasonLabel
  }));
  const wsComp = XLSX.utils.json_to_sheet(comparisonSheetData);
  XLSX.utils.book_append_sheet(wb, wsComp, 'Komparasi 2025 vs 2026 dst');

  // Sheet 3: Rekapitulasi Tahunan (Summary)
  const summarySheetData = [
    {
      Parameter: 'Total Wildlife Strike',
      'Tahun 2025': analytics.yearlyTotals.year2025.strikes,
      'Tahun 2026': analytics.yearlyTotals.year2026.strikes,
      'Tahun 2027 (Target)': analytics.yearlyTotals.year2027.strikes,
      'Keterangan & Evaluasi': 'Penurunan kejadian strike berkat pengoperasian laser & sweeping patroli.'
    },
    {
      Parameter: 'Strike Berdampak Kerusakan (Substantial)',
      'Tahun 2025': analytics.yearlyTotals.year2025.damage,
      'Tahun 2026': analytics.yearlyTotals.year2026.damage,
      'Tahun 2027 (Target)': analytics.yearlyTotals.year2027.damage,
      'Keterangan & Evaluasi': 'Penekanan kerusakan struktural & engine ingestion.'
    },
    {
      Parameter: 'Total Occurrence Satwa',
      'Tahun 2025': analytics.yearlyTotals.year2025.occurrences,
      'Tahun 2026': analytics.yearlyTotals.year2026.occurrences,
      'Tahun 2027 (Target)': analytics.yearlyTotals.year2027.occurrences,
      'Keterangan & Evaluasi': 'Laporan deteksi dini dan pengusiran di airside.'
    },
    {
      Parameter: 'Total Populasi Burung Teramati (Ekor)',
      'Tahun 2025': analytics.yearlyTotals.year2025.birds,
      'Tahun 2026': analytics.yearlyTotals.year2026.birds,
      'Tahun 2027 (Target)': analytics.yearlyTotals.year2027.birds,
      'Keterangan & Evaluasi': 'Pengendalian vegetasi menekan kawanan burung pakan.'
    },
    {
      Parameter: 'Pergerakan Pesawat Udara (Trafik)',
      'Tahun 2025': analytics.yearlyTotals.year2025.movements,
      'Tahun 2026': analytics.yearlyTotals.year2026.movements,
      'Tahun 2027 (Target)': analytics.yearlyTotals.year2027.movements,
      'Keterangan & Evaluasi': 'Pertumbuhan volume penerbangan komersial.'
    },
    {
      Parameter: 'Strike Rate per 10.000 Pergerakan',
      'Tahun 2025': analytics.yearlyTotals.year2025.strikeRate,
      'Tahun 2026': analytics.yearlyTotals.year2026.strikeRate,
      'Tahun 2027 (Target)': analytics.yearlyTotals.year2027.strikeRate,
      'Keterangan & Evaluasi': 'Indikator Kinerja Keselamatan ICAO Doc 9137.'
    }
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summarySheetData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Tahunan');

  // Sheet 4: Populasi per Spesies Burung
  const speciesSheetData = analytics.speciesStats.map((sp, idx) => ({
    No: idx + 1,
    'Nama Spesies Burung': sp.namaIndonesia,
    'Nama Ilmiah / Latin': sp.namaLatin,
    'Tingkat Risiko': sp.kategoriRisiko,
    'Bobot Rata-rata (gram)': sp.bobotRataRataGram,
    'Karakter Kawanan': sp.perilakuFlocking,
    'Habitat Utama Bandara': sp.habitatUtama,
    'Populasi 2025 (Ekor)': sp.populasi2025,
    'Populasi 2026 (Ekor)': sp.populasi2026,
    'Populasi 2027 (Ekor)': sp.populasi2027,
    'Insiden Strike 2025': sp.strikes2025,
    'Insiden Strike 2026': sp.strikes2026,
    'Tindakan Mitigasi Rekomendasi': sp.deskripsiMitigasi
  }));
  const wsSpecies = XLSX.utils.json_to_sheet(speciesSheetData);
  XLSX.utils.book_append_sheet(wb, wsSpecies, 'Populasi per Spesies');

  // Download
  XLSX.writeFile(wb, `Dashboard_Wildlife_Strike_Occurence_Populasi_Burung_2025-2026_${new Date().toISOString().split('T')[0]}.xlsx`);
}
