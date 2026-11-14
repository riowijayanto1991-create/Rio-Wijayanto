import React, { useState, useEffect, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  BarChart,
  Bar, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ReferenceArea,
  ReferenceLine,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  Calendar, 
  Info, 
  ShieldAlert, 
  CloudRain, 
  BarChart3,
  Layers,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Table,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  AlertOctagon,
  FileText,
  FileSpreadsheet,
  Upload,
  Edit3,
  Sliders
} from 'lucide-react';
import { WildlifeStrikeReport, MonthlyReportDocument, ManualMonthlyWSREntry } from '../types';
import { getNormalizedMonthIndex } from '../utils/dateUtils';
import { toNumber, calculateSafeMoM } from '../utils/monthlyExcelParser';
import { subscribeToManualMonthlyWSR } from '../services/firestoreService';
import { ManualMonthlyWSRModal } from './ManualMonthlyWSRModal';

interface WildlifeStrikeMonthlyChartProps {
  strikes: WildlifeStrikeReport[];
  monthlyDocuments?: MonthlyReportDocument[];
  onOpenUploadMonthly?: () => void;
  onOpenFullPopulationDashboard?: () => void;
}

export interface MonthlyDataPoint {
  monthKey: string;          // '01', '02', etc.
  monthName: string;         // 'Januari', etc.
  shortMonth: string;        // 'Jan', etc.
  strikes: number;           // Live / active data for current year
  prevMonthStrikes: number;  // Previous month count for MoM calculation
  momDelta: number;          // strikes - prevMonthStrikes
  momPercent: number;        // ((strikes - prevMonthStrikes) / prevMonthStrikes) * 100
  trendDirection: 'up' | 'down' | 'stable';
  strikesWithDamage: number;
  strikesNoDamage: number;
  priorYearStrikes: number;  // Comparison with previous year (YoY)
  yoyDelta: number;          // strikes - priorYearStrikes
  yoyPercent: number;        // ((strikes - priorYearStrikes) / priorYearStrikes) * 100
  ytdStrikes: number;        // Cumulative Year to Date
  priorYtdStrikes: number;   // Prior Year cumulative YTD
  safetyTargetThreshold: number; // ICAO safety benchmark target per month
  season: 'migrasi' | 'pancaroba' | 'kemarau';
  seasonLabel: string;
  weatherRisk: string;
  recommendedMitigation: string;
  hasMonthlyDocument?: boolean;
  monthlyDocumentName?: string;
  monthlyDocumentFormat?: 'pdf' | 'word' | 'excel';
  monthlyPatrols?: number;
  monthlyOccurrences?: number;
  monthlySatwa?: number;
  hasManualOverride?: boolean;
  manualNotes?: string;
  isManualVerified?: boolean;
}

const MONTH_NAMES = [
  { 
    key: '01', 
    short: 'Jan', 
    full: 'Januari', 
    season: 'migrasi' as const, 
    seasonLabel: 'Musim Migrasi Burung Air (EAAF) & Curah Hujan Tinggi', 
    weather: 'Hujan Monsun Barat',
    mitigation: 'Tingkatkan patroli mobile dispersal subuh/senja, aktifkan pyrotechnics flare di holding pond.'
  },
  { 
    key: '02', 
    short: 'Feb', 
    full: 'Februari', 
    season: 'migrasi' as const, 
    seasonLabel: 'Puncak Musim Migrasi Burung Air Lintas Benua', 
    weather: 'Curah Hujan Tinggi & Genangan Airside',
    mitigation: 'Pompa genangan airside taxiway, sweeping satwa di runway 07L/25R dan 07R/25L secara periodik.'
  },
  { 
    key: '03', 
    short: 'Mar', 
    full: 'Maret', 
    season: 'pancaroba' as const, 
    seasonLabel: 'Pancaroba Awal (Transisi Hujan-Kemarau)', 
    weather: 'Pancaroba & Angin Fluktuatif',
    mitigation: 'Pengendalian kawanan burung pemakan serangga (layang-layang/pipit) pasca hujan reda.'
  },
  { 
    key: '04', 
    short: 'Apr', 
    full: 'April', 
    season: 'pancaroba' as const, 
    seasonLabel: 'Pancaroba (Pergerakan Serangga Rumput & Pipit)', 
    weather: 'Lembab & Terik Siang Hari',
    mitigation: 'Pemotongan rumput berkala 15–20 cm untuk menekan habitat belalang & serangga airside.'
  },
  { 
    key: '05', 
    short: 'Mei', 
    full: 'Mei', 
    season: 'pancaroba' as const, 
    seasonLabel: 'Pancaroba Akhir Menuju Kemarau', 
    weather: 'Cerah Berawan & Terik',
    mitigation: 'Pengawasan area shoulder runway terhadap aktivitas biawak & burung raptor berburu.'
  },
  { 
    key: '06', 
    short: 'Jun', 
    full: 'Juni', 
    season: 'kemarau' as const, 
    seasonLabel: 'Musim Kemarau (Konsentrasi Satwa di Kolam Retensi)', 
    weather: 'Kemarau & Suhu Tinggi',
    mitigation: 'Inspeksi jaring penghalau satwa di kolam retensi, cegah satwa mendekati zona pendaratan.'
  },
  { 
    key: '07', 
    short: 'Jul', 
    full: 'Juli', 
    season: 'kemarau' as const, 
    seasonLabel: 'Musim Kemarau (Thermal Soaring Burung Pemangsa)', 
    weather: 'Kering & Angin Kencang',
    mitigation: 'Pemantauan thermal soaring elang bondol di approach zone runway dengan teropong binokular.'
  },
  { 
    key: '08', 
    short: 'Ags', 
    full: 'Agustus', 
    season: 'kemarau' as const, 
    seasonLabel: 'Puncak Musim Kemarau', 
    weather: 'Kering & Debu Runway',
    mitigation: 'Water cannon deterrent di area hijau, pembersihan bangkai serangga di lampu runway.'
  },
  { 
    key: '09', 
    short: 'Sep', 
    full: 'September', 
    season: 'pancaroba' as const, 
    seasonLabel: 'Pancaroba Awal Menuju Hujan', 
    weather: 'Pancaroba & Hujan Awal',
    mitigation: 'Pembersihan saluran drainase airside dari tumpukan ranting & satwa pengerat.'
  },
  { 
    key: '10', 
    short: 'Okt', 
    full: 'Oktober', 
    season: 'pancaroba' as const, 
    seasonLabel: 'Pancaroba & Mulai Arus Masuk Migrasi Burung', 
    weather: 'Frekuensi Hujan Meningkat',
    mitigation: 'Peningkatan frekuensi patroli runway inspection sebelum jam sibuk keberangkatan & kedatangan.'
  },
  { 
    key: '11', 
    short: 'Nov', 
    full: 'November', 
    season: 'migrasi' as const, 
    seasonLabel: 'Awal Musim Migrasi Penuh (East Asian-Australasian Flyway)', 
    weather: 'Curah Hujan Lebat',
    mitigation: 'Operasikan sound cannon bio-akustik dan laser repellent pada pagi dan malam hari.'
  },
  { 
    key: '12', 
    short: 'Des', 
    full: 'Desember', 
    season: 'migrasi' as const, 
    seasonLabel: 'Puncak Musim Migrasi & Monsun Hujan Akhir Tahun', 
    weather: 'Curah Hujan Monsun Ekstrem',
    mitigation: 'Siaga 24 jam unit WHU bersama tim ARFF & ATC untuk respons darurat strike di runway.'
  }
];

// Baseline historical benchmarks (CGK Aerodrome & ICAO Doc 9137 Part 3 averages)
// Used for comprehensive annual comparison & baseline target
const PRIOR_YEAR_2025_BENCHMARK = [7, 8, 5, 4, 3, 2, 2, 3, 4, 6, 8, 9];
const BASELINE_HISTORICAL_STRIKES = [6, 7, 4, 3, 2, 1, 2, 2, 3, 5, 7, 8];
const SAFETY_TARGET_BENCHMARK = [4, 4, 3, 2, 2, 2, 2, 2, 3, 3, 4, 4]; // Safety Performance Target

export const WildlifeStrikeMonthlyChart: React.FC<WildlifeStrikeMonthlyChartProps> = ({ 
  strikes,
  monthlyDocuments = [],
  onOpenUploadMonthly,
  onOpenFullPopulationDashboard
}) => {
  // Chart visual modes
  const [chartMode, setChartMode] = useState<'mom' | 'annual-trend' | 'yoy' | 'damage'>('mom');
  const [barChartMetric, setBarChartMetric] = useState<'strikes' | 'patrols' | 'occurrences' | 'satwa' | 'multi'>('strikes');
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [useIntegratedBaseline, setUseIntegratedBaseline] = useState<boolean>(true);
  const [showTableDetails, setShowTableDetails] = useState<boolean>(false);
  const [showTargetLine, setShowTargetLine] = useState<boolean>(true);
  const [showBirdPopulationTable, setShowBirdPopulationTable] = useState<boolean>(false);

  // Manual Monthly WSR states
  const [manualEntries, setManualEntries] = useState<Record<number, ManualMonthlyWSREntry>>({});
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [manualModalFocusMonth, setManualModalFocusMonth] = useState<number | undefined>(undefined);
  const [isManualEnabled, setIsManualEnabled] = useState<boolean>(true);

  // Real-time synchronization of manual entries from Firestore across all devices
  useEffect(() => {
    const effectiveYear = selectedYear === 'all' ? '2026' : selectedYear;
    const unsubscribe = subscribeToManualMonthlyWSR(effectiveYear, (entries) => {
      setManualEntries(entries || {});
    });
    return () => unsubscribe();
  }, [selectedYear]);

  // Count active manual entries for current view
  const manualCountForYear = useMemo(() => {
    return Object.values(manualEntries).filter(
      e => (e.totalStrike > 0 || e.strikeWithDamage > 0 || (e.notes && e.notes.trim().length > 0))
    ).length;
  }, [manualEntries]);

  // Check if any uploaded monthly document contains bird population matrix from sheet 1.7.2
  const activeBirdPopulation = useMemo(() => {
    for (const doc of monthlyDocuments) {
      if (doc.birdPopulationData && doc.birdPopulationData.species && doc.birdPopulationData.species.length > 0) {
        return { data: doc.birdPopulationData, doc };
      }
    }
    return null;
  }, [monthlyDocuments]);

  // Extract available years from strike reports + monthly documents + current year
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    years.add('2026');
    years.add('2025');

    strikes.forEach(s => {
      if (s.createdAt) {
        const y = new Date(s.createdAt).getFullYear();
        if (!isNaN(y)) years.add(String(y));
      }
      const match = s.hariTanggal?.match(/\b(20\d{2})\b/);
      if (match) years.add(match[1]);
    });

    monthlyDocuments.forEach(doc => {
      if (doc.periodeTahun) {
        years.add(String(doc.periodeTahun));
      }
    });

    return Array.from(years).sort().reverse();
  }, [strikes, monthlyDocuments]);

  // Robust parsing of strike date to month (0 - 11)
  const parseStrikeMonth = (s: WildlifeStrikeReport): { month: number; year: number } | null => {
    // 1. Try ISO createdAt
    if (s.createdAt) {
      const d = new Date(s.createdAt);
      if (!isNaN(d.getTime())) {
        return { month: d.getMonth(), year: d.getFullYear() };
      }
    }
    // 2. Try hariTanggal string
    if (s.hariTanggal) {
      // Check year
      const yMatch = s.hariTanggal.match(/\b(20\d{2})\b/);
      const foundYear = yMatch ? parseInt(yMatch[1], 10) : 2026;

      // Use normalized month index
      const mIdx = getNormalizedMonthIndex(s.hariTanggal);
      if (mIdx !== -1) {
        return { month: mIdx, year: foundYear };
      }

      // Check YYYY-MM-DD
      const isoMatch = s.hariTanggal.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        return {
          month: parseInt(isoMatch[2], 10) - 1,
          year: parseInt(isoMatch[1], 10)
        };
      }

      // Check DD/MM/YYYY or DD-MM-YYYY
      const dmyMatch = s.hariTanggal.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
      if (dmyMatch) {
        return {
          month: parseInt(dmyMatch[2], 10) - 1,
          year: parseInt(dmyMatch[3], 10)
        };
      }
    }

    return null;
  };

  // Compile monthly data points with MoM and YoY calculations
  const monthlyData: MonthlyDataPoint[] = useMemo(() => {
    const liveCounts = new Array(12).fill(0);
    const liveDamageCounts = new Array(12).fill(0);

    // Tally strikes from live database
    strikes.forEach(s => {
      const parsed = parseStrikeMonth(s);
      if (!parsed) return;

      // Filter by selected year if not 'all'
      if (selectedYear !== 'all' && String(parsed.year) !== selectedYear) {
        return;
      }

      if (parsed.month >= 0 && parsed.month < 12) {
        liveCounts[parsed.month]++;
        if (s.indikasiKerusakan === 'Ada') {
          liveDamageCounts[parsed.month]++;
        }
      }
    });

    // Check if live data has any entries
    const hasLiveEntries = liveCounts.some(c => c > 0);

    // Group and aggregate uploaded monthly documents for the current selectedYear
    interface MonthlyGroup {
      docs: MonthlyReportDocument[];
      primaryDoc: MonthlyReportDocument;
      totalStrike: number;
      strikeWithDamage: number;
      totalPatrol: number;
      totalOccurrence: number;
      totalSatwa: number;
    }
    const monthDocMap = new Map<number, MonthlyGroup>();

    monthlyDocuments.forEach(doc => {
      // 1. Process breakdown records if available (from multi-month Excel attachment)
      if (doc.monthlyBreakdown && doc.monthlyBreakdown.length > 0) {
        doc.monthlyBreakdown.forEach(rec => {
          const isYearMatch = selectedYear === 'all' || rec.tahun === Number(selectedYear);
          if (!isYearMatch) return;

          const monthIdx = rec.bulanIndex;
          if (monthIdx >= 0 && monthIdx < 12) {
            const existing = monthDocMap.get(monthIdx);
            const docStrikes = toNumber(rec.totalStrike);
            const docDamage = toNumber(rec.strikeWithDamage);
            const docOccurrences = toNumber(rec.totalOccurrence);
            const docSatwa = toNumber(rec.totalSatwa);
            const docPatrols = 0;

            if (existing) {
              if (!existing.docs.includes(doc)) existing.docs.push(doc);
              existing.totalStrike = Math.max(existing.totalStrike, docStrikes);
              existing.strikeWithDamage = Math.max(existing.strikeWithDamage, docDamage);
              existing.totalOccurrence = Math.max(existing.totalOccurrence, docOccurrences);
              existing.totalSatwa = Math.max(existing.totalSatwa, docSatwa);
            } else {
              monthDocMap.set(monthIdx, {
                docs: [doc],
                primaryDoc: doc,
                totalStrike: docStrikes,
                strikeWithDamage: docDamage,
                totalPatrol: docPatrols,
                totalOccurrence: docOccurrences,
                totalSatwa: docSatwa
              });
            }
          }
        });
      }

      // 2. Also process primary document fields
      const docYear = Number(doc.periodeTahun);
      const isYearMatch = selectedYear === 'all' || docYear === Number(selectedYear);
      if (!isYearMatch) return;

      const monthIdx = getNormalizedMonthIndex(doc.periodeBulan);
      if (monthIdx >= 0 && monthIdx < 12) {
        const existing = monthDocMap.get(monthIdx);
        const docStrikes = toNumber(doc.totalStrikeBulanIni);
        const docDamage = toNumber(doc.strikeWithDamageBulanIni);
        const docPatrols = toNumber(doc.totalPatroliBulanIni);
        const docOccurrences = toNumber(doc.totalOccurrenceBulanIni);
        const docSatwa = toNumber(doc.totalSatwaBulanIni);

        if (existing) {
          if (!existing.docs.includes(doc)) existing.docs.push(doc);
          existing.totalStrike = Math.max(existing.totalStrike, docStrikes);
          existing.strikeWithDamage = Math.max(existing.strikeWithDamage, docDamage);
          existing.totalPatrol = Math.max(existing.totalPatrol, docPatrols);
          existing.totalOccurrence = Math.max(existing.totalOccurrence, docOccurrences);
          existing.totalSatwa = Math.max(existing.totalSatwa, docSatwa);
        } else {
          monthDocMap.set(monthIdx, {
            docs: [doc],
            primaryDoc: doc,
            totalStrike: docStrikes,
            strikeWithDamage: docDamage,
            totalPatrol: docPatrols,
            totalOccurrence: docOccurrences,
            totalSatwa: docSatwa
          });
        }
      }
    });

    let cumulativeYtd = 0;
    let priorCumulativeYtd = 0;

    return MONTH_NAMES.map((m, idx) => {
      let count = liveCounts[idx];
      let damage = liveDamageCounts[idx];
      const uploadedGroup = monthDocMap.get(idx);
      const manualEntry = isManualEnabled ? manualEntries[idx] : undefined;

      let hasManualOverride = false;
      let manualNotes = '';

      // 1. Manual Monthly WSR Input (Highest priority if present)
      if (manualEntry && (manualEntry.totalStrike > 0 || manualEntry.strikeWithDamage > 0 || (manualEntry.notes && manualEntry.notes.trim().length > 0))) {
        count = manualEntry.totalStrike;
        damage = manualEntry.strikeWithDamage;
        hasManualOverride = true;
        manualNotes = manualEntry.notes || '';
      } else if (uploadedGroup) {
        // 2. Document data from official uploaded reports
        count = Math.max(count, uploadedGroup.totalStrike);
        damage = Math.max(damage, uploadedGroup.strikeWithDamage);
        // CRITICAL: Do NOT let baseline overwrite uploaded document data!
      } else if (useIntegratedBaseline && !hasLiveEntries) {
        // Full baseline display when database is empty
        count = BASELINE_HISTORICAL_STRIKES[idx];
        damage = idx % 3 === 0 ? 1 : 0;
      } else if (useIntegratedBaseline && hasLiveEntries) {
        // If live entries exist, blend live records on top of baseline for prior months without documents
        if (count === 0 && idx < 9) { // Months Jan - Sep (past months up to current time Sept 2026)
          count = BASELINE_HISTORICAL_STRIKES[idx];
          damage = idx % 4 === 0 ? 1 : 0;
        }
      }

      // Prior year reference count (e.g. 2025 or selectedYear - 1)
      let priorYearCount = PRIOR_YEAR_2025_BENCHMARK[idx];
      const targetPriorYear = parseInt(selectedYear === 'all' ? '2026' : selectedYear, 10) - 1;
      
      let foundPriorBreakdownCount: number | null = null;
      for (const d of monthlyDocuments) {
        if (d.monthlyBreakdown && d.monthlyBreakdown.length > 0) {
          const matched = d.monthlyBreakdown.find(r => r.bulanIndex === idx && r.tahun === targetPriorYear);
          if (matched) {
            foundPriorBreakdownCount = toNumber(matched.totalStrike);
            break;
          }
        }
      }

      if (foundPriorBreakdownCount !== null) {
        priorYearCount = foundPriorBreakdownCount;
      } else {
        const priorYearDocs = monthlyDocuments.filter(
          d => getNormalizedMonthIndex(d.periodeBulan) === idx && Number(d.periodeTahun) === targetPriorYear
        );
        if (priorYearDocs.length > 0) {
          priorYearCount = priorYearDocs.reduce((acc, d) => acc + toNumber(d.totalStrikeBulanIni), 0);
        }
      }

      const targetThreshold = SAFETY_TARGET_BENCHMARK[idx];

      // Prior month count for MoM calculation
      let prevCount = 0;
      if (idx === 0) {
        // Check prior year Dec document or breakdown if exists
        const priorYear = parseInt(selectedYear === 'all' ? '2026' : selectedYear, 10) - 1;
        let foundDecBreakdownCount: number | null = null;
        for (const d of monthlyDocuments) {
          if (d.monthlyBreakdown && d.monthlyBreakdown.length > 0) {
            const matched = d.monthlyBreakdown.find(r => r.bulanIndex === 11 && r.tahun === priorYear);
            if (matched) {
              foundDecBreakdownCount = toNumber(matched.totalStrike);
              break;
            }
          }
        }

        if (foundDecBreakdownCount !== null) {
          prevCount = foundDecBreakdownCount;
        } else {
          const decDoc = monthlyDocuments.find(
            d => getNormalizedMonthIndex(d.periodeBulan) === 11 && Number(d.periodeTahun) === priorYear
          );
          if (decDoc && decDoc.totalStrikeBulanIni !== undefined) {
            prevCount = toNumber(decDoc.totalStrikeBulanIni);
          } else {
            prevCount = PRIOR_YEAR_2025_BENCHMARK[11]; // Dec prior year
          }
        }
      } else {
        // Check previous month uploaded document or live count
        const prevGroup = monthDocMap.get(idx - 1);
        if (prevGroup) {
          prevCount = Math.max(liveCounts[idx - 1], prevGroup.totalStrike);
        } else {
          const prevLive = liveCounts[idx - 1];
          if (useIntegratedBaseline && !hasLiveEntries) {
            prevCount = BASELINE_HISTORICAL_STRIKES[idx - 1];
          } else if (useIntegratedBaseline && hasLiveEntries && prevLive === 0 && (idx - 1) < 9) {
            prevCount = BASELINE_HISTORICAL_STRIKES[idx - 1];
          } else {
            prevCount = prevLive;
          }
        }
      }

      // Safe MoM Calculations
      const { delta: momDelta, percent: momPercent, direction: trendDirection } = calculateSafeMoM(count, prevCount);

      // YoY Calculations
      const yoyDelta = count - priorYearCount;
      let yoyPercent = 0;
      if (priorYearCount > 0) {
        yoyPercent = Math.round(((count - priorYearCount) / priorYearCount) * 100);
      }

      // Cumulative YTD calculations
      cumulativeYtd += count;
      priorCumulativeYtd += priorYearCount;

      const strikesWithDamage = damage;
      const strikesNoDamage = Math.max(0, count - damage);

      return {
        monthKey: m.key,
        monthName: m.full,
        shortMonth: m.short,
        strikes: count,
        prevMonthStrikes: prevCount,
        momDelta,
        momPercent,
        trendDirection,
        strikesWithDamage,
        strikesNoDamage,
        priorYearStrikes: priorYearCount,
        yoyDelta,
        yoyPercent,
        ytdStrikes: cumulativeYtd,
        priorYtdStrikes: priorCumulativeYtd,
        safetyTargetThreshold: targetThreshold,
        season: m.season,
        seasonLabel: m.seasonLabel,
        weatherRisk: m.weather,
        recommendedMitigation: m.mitigation,
        hasMonthlyDocument: Boolean(uploadedGroup),
        monthlyDocumentName: uploadedGroup?.primaryDoc.fileName,
        monthlyDocumentFormat: uploadedGroup?.primaryDoc.fileType,
        hasManualOverride,
        manualNotes,
        isManualVerified: hasManualOverride,
        monthlyPatrols: (manualEntry && manualEntry.totalPatroli) ? manualEntry.totalPatroli : (uploadedGroup ? uploadedGroup.totalPatrol : (useIntegratedBaseline && idx < 9 ? (82 + (idx % 4) * 4) : 0)),
        monthlyOccurrences: (manualEntry && manualEntry.totalOccurrence) ? manualEntry.totalOccurrence : (uploadedGroup ? uploadedGroup.totalOccurrence : (useIntegratedBaseline && idx < 9 ? (6 + (idx % 3) * 2) : 0)),
        monthlySatwa: (manualEntry && manualEntry.totalSatwa) ? manualEntry.totalSatwa : (uploadedGroup ? uploadedGroup.totalSatwa : (useIntegratedBaseline && idx < 9 ? (1150 + (idx % 5) * 220) : 0)),
        patrolTarget: 90
      };
    });
  }, [strikes, monthlyDocuments, selectedYear, useIntegratedBaseline, manualEntries, isManualEnabled]);

  // Aggregate executive metrics
  const integratedDocsCount = useMemo(() => {
    return monthlyData.filter(m => m.hasMonthlyDocument).length;
  }, [monthlyData]);

  const totalStrikesInView = useMemo(() => {
    return monthlyData.reduce((acc, m) => acc + m.strikes, 0);
  }, [monthlyData]);

  const totalDamageInView = useMemo(() => {
    return monthlyData.reduce((acc, m) => acc + m.strikesWithDamage, 0);
  }, [monthlyData]);

  const priorYearTotalInView = useMemo(() => {
    return monthlyData.reduce((acc, m) => acc + m.priorYearStrikes, 0);
  }, [monthlyData]);

  // Overall Annual Trend Direction (YoY comparison)
  const annualTrendYoY = useMemo(() => {
    if (priorYearTotalInView === 0) return { delta: 0, percent: 0, direction: 'stable' as const };
    const delta = totalStrikesInView - priorYearTotalInView;
    const percent = Math.round((delta / priorYearTotalInView) * 100);
    const direction = delta > 0 ? ('up' as const) : delta < 0 ? ('down' as const) : ('stable' as const);
    return { delta, percent, direction };
  }, [totalStrikesInView, priorYearTotalInView]);

  // Latest Month MoM Trend (active month or last evaluated month, e.g. September / idx 8)
  const latestEvaluatedMonth = useMemo(() => {
    // Current local month is September (index 8)
    const currentMonthIdx = 8;
    return monthlyData[currentMonthIdx] || monthlyData[monthlyData.length - 1];
  }, [monthlyData]);

  // Peak Month identification
  const peakMonth = useMemo(() => {
    let max = -1;
    let peak = monthlyData[0];
    monthlyData.forEach(m => {
      if (m.strikes > max) {
        max = m.strikes;
        peak = m;
      }
    });
    return peak;
  }, [monthlyData]);

  // Lowest Risk Month (Best Mitigation)
  const lowestMonth = useMemo(() => {
    let min = 9999;
    let lowest = monthlyData[0];
    monthlyData.forEach(m => {
      if (m.strikes < min && m.strikes >= 0) {
        min = m.strikes;
        lowest = m;
      }
    });
    return lowest;
  }, [monthlyData]);

  const damageRate = totalStrikesInView > 0 
    ? Math.round((totalDamageInView / totalStrikesInView) * 100) 
    : 0;

  // Custom Rich Tooltip for Recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;
    const data: MonthlyDataPoint = payload[0]?.payload;
    if (!data) return null;

    const isRiskUp = data.momDelta > 0;
    const isRiskDown = data.momDelta < 0;

    return (
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl border border-slate-700/90 text-xs min-w-[280px] max-w-xs z-50 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2.5">
          <div className="flex items-center space-x-1.5 font-bold text-sm text-sky-400">
            <Calendar className="w-4 h-4" />
            <span>{data.monthName} ({selectedYear === 'all' ? '2026' : selectedYear})</span>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            data.season === 'migrasi'
              ? 'bg-rose-950 text-rose-300 border border-rose-800'
              : data.season === 'pancaroba'
              ? 'bg-amber-950 text-amber-300 border border-amber-800'
              : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
          }`}>
            {data.season === 'migrasi' ? 'Musim Migrasi (Tinggi)' : data.season === 'pancaroba' ? 'Pancaroba (Sedang)' : 'Kemarau (Rendah)'}
          </span>
        </div>

        {/* Primary Metrics */}
        <div className="space-y-2">
          <div className="flex items-center justify-between bg-slate-800/60 p-2 rounded-lg">
            <span className="text-slate-300 font-medium">Total Laporan Strike:</span>
            <span className="font-mono font-bold text-white text-base">{data.strikes} Kejadian</span>
          </div>

          {/* MoM Comparison Badge */}
          <div className="flex items-center justify-between text-[11px] px-1">
            <span className="text-slate-400">vs Bulan Sebelumnya:</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-mono">({data.prevMonthStrikes} Kejadian)</span>
              <span className={`px-1.5 py-0.5 rounded font-bold font-mono text-[10px] flex items-center gap-0.5 ${
                isRiskUp 
                  ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                  : isRiskDown 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-slate-800 text-slate-300'
              }`}>
                {isRiskUp ? <ArrowUpRight className="w-3 h-3 text-rose-400" /> : isRiskDown ? <ArrowDownRight className="w-3 h-3 text-emerald-400" /> : <Minus className="w-3 h-3 text-slate-400" />}
                {data.momDelta > 0 ? `+${data.momDelta}` : `${data.momDelta}`} ({data.momPercent > 0 ? `+${data.momPercent}%` : `${data.momPercent}%`})
              </span>
            </div>
          </div>

          {/* YoY Comparison */}
          <div className="flex items-center justify-between text-[11px] px-1">
            <span className="text-slate-400">vs Tahun Lalu (2025):</span>
            <span className="font-mono text-sky-300 font-medium">
              {data.priorYearStrikes} Kejadian ({data.yoyDelta > 0 ? `+${data.yoyDelta}` : data.yoyDelta})
            </span>
          </div>

          {/* Damage Severity */}
          <div className="flex items-center justify-between text-[11px] px-1">
            <span className="text-slate-400">Ada Kerusakan Pesawat:</span>
            <span className={`font-mono font-semibold ${data.strikesWithDamage > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {data.strikesWithDamage} Kasus ({data.strikes > 0 ? Math.round((data.strikesWithDamage / data.strikes) * 100) : 0}%)
            </span>
          </div>

          {/* Safety Target Limit */}
          {showTargetLine && (
            <div className="flex items-center justify-between text-[11px] px-1 pt-1 border-t border-slate-800 text-slate-400">
              <span className="text-teal-300">Ambang Toleransi ICAO:</span>
              <span className="font-mono text-teal-300 font-medium">Maks. {data.safetyTargetThreshold} Kasus</span>
            </div>
          )}

          {/* Uploaded Document Badge Indicator */}
          {data.hasMonthlyDocument && (
            <div className="p-2 rounded-lg bg-sky-950/70 border border-sky-800/80 text-[11px] space-y-1 mt-1">
              <div className="flex items-center justify-between text-sky-300 font-semibold">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  Data Laporan Bulanan Terunggah:
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-sky-800 text-sky-200 rounded">
                  {data.monthlyDocumentFormat || 'Dokumen'}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 truncate font-mono">
                {data.monthlyDocumentName}
              </p>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-300 pt-0.5 border-t border-sky-900/80">
                {data.monthlyPatrols !== undefined && (
                  <span>• Patroli: <strong>{data.monthlyPatrols}</strong></span>
                )}
                {data.monthlyOccurrences !== undefined && (
                  <span>• Occurrence: <strong>{data.monthlyOccurrences}</strong></span>
                )}
                {data.monthlySatwa !== undefined && (
                  <span className="col-span-2">• Satwa Teramati: <strong>{data.monthlySatwa.toLocaleString('id-ID')} ekor</strong></span>
                )}
              </div>
            </div>
          )}

          {/* Manual Input Override Badge Indicator */}
          {data.hasManualOverride && (
            <div className="p-2 rounded-lg bg-amber-950/70 border border-amber-700/80 text-[11px] space-y-1 mt-1">
              <div className="flex items-center justify-between text-amber-300 font-semibold">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  Data Kalibrasi Manual WHU:
                </span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 bg-amber-800 text-amber-100 rounded">
                  Diverifikasi
                </span>
              </div>
              {data.manualNotes && (
                <p className="text-[10px] text-amber-200/90 italic bg-amber-950/40 p-1.5 rounded border border-amber-900/60 font-mono">
                  "{data.manualNotes}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Management Guidance */}
        <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 leading-snug">
          <p className="font-semibold text-slate-300 flex items-center gap-1 mb-0.5">
            <Info className="w-3 h-3 text-sky-400" />
            Rekomendasi Tindakan Mitigasi:
          </p>
          <p className="text-slate-300">{data.recommendedMitigation}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="wildlife-strike-monthly-chart">
      {/* Header & Controls */}
      <div className="p-5 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 flex-wrap gap-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              ANALISIS RISIKO TAHUNAN &amp; KOMPARASI BULANAN
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-sky-600" />
              Recharts Analytics Engine
            </span>
            {monthlyDocuments.length > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <FileText className="w-3 h-3 text-indigo-600" />
                {monthlyDocuments.length} Dokumen Terunggah Terintegrasi
              </span>
            )}
            <span className="text-xs text-slate-400">ICAO Doc 9137 Part 3 &amp; KP 326</span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1.5 flex items-center gap-2">
            Visualisasi &amp; Perbandingan Tren Wildlife Strike Bulan ke Bulan
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring komparasi fluktuasi total insiden antar-bulan (Month-over-Month) untuk mendeteksi tren peningkatan atau penurunan risiko tahunan secara proaktif.
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart View Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1 text-xs">
            <button
              onClick={() => setChartMode('mom')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                chartMode === 'mom'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Komparasi langsung total strike bulan ini vs bulan sebelumnya"
            >
              <BarChart3 className="w-3.5 h-3.5 text-rose-600" />
              <span>Komparasi MoM</span>
            </button>

            <button
              onClick={() => setChartMode('annual-trend')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                chartMode === 'annual-trend'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tren akumulatif YTD untuk melihat laju kenaikan/penurunan risiko tahunan"
            >
              <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
              <span>Tren YTD Tahunan</span>
            </button>

            <button
              onClick={() => setChartMode('yoy')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                chartMode === 'yoy'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Laporan grafik batang terpadu & integrasi data dokumen terunggah"
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Grafik Batang Terpadu</span>
            </button>

            <button
              onClick={() => setChartMode('damage')}
              className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
                chartMode === 'damage'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Proporsi kerusakan pesawat per bulan"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Dampak Kerusakan</span>
            </button>
          </div>

          {/* Year Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent text-slate-800 font-semibold focus:outline-hidden cursor-pointer"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>Tahun {y}</option>
              ))}
              <option value="all">Semua Data</option>
            </select>
          </div>

          {/* Baseline & Table Action Buttons */}
          <button
            onClick={() => setUseIntegratedBaseline(prev => !prev)}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
              useIntegratedBaseline
                ? 'bg-sky-50 border-sky-200 text-sky-800 font-semibold'
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800'
            }`}
            title="Gabungkan data riil Firestore dengan baseline historis tahunan untuk perbandingan komprehensif"
          >
            <SlidersHorizontal className="w-3 h-3 text-sky-600" />
            <span>{useIntegratedBaseline ? 'Basis Historis Aktif' : 'Hanya Data Riil'}</span>
          </button>

          <button
            onClick={() => setShowTableDetails(prev => !prev)}
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1"
            title="Tampilkan tabel matriks evaluasi risiko MoM"
          >
            <Table className="w-3.5 h-3.5 text-slate-600" />
            <span>Matriks MoM</span>
            {showTableDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Manual Monthly WSR Input Button */}
          <button
            onClick={() => {
              setManualModalFocusMonth(undefined);
              setIsManualModalOpen(true);
            }}
            className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
            title="Pengisian & Penyesuaian Manual Kejadian WSR per Bulan untuk Grafik Batang"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Pengisian Manual WSR</span>
            {manualCountForYear > 0 && (
              <span className="bg-amber-900/90 text-amber-200 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {manualCountForYear} Bln
              </span>
            )}
          </button>

          {/* Direct Upload Button from Chart */}
          {onOpenUploadMonthly && (
            <button
              onClick={onOpenUploadMonthly}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1.5"
              title="Unggah berkas laporan bulanan (PDF / Word) untuk langsung diperbarui ke grafik batang"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah Laporan</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Row (Management High-Level Indicators) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-5 bg-slate-50/60 border-b border-slate-100">
        {/* KPI 1: Tren MoM Bulan Berjalan */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Tren MoM Terakhir ({latestEvaluatedMonth.shortMonth})
            </span>
            <div className={`p-1 rounded-md ${
              latestEvaluatedMonth.momDelta > 0 
                ? 'bg-rose-100 text-rose-700' 
                : latestEvaluatedMonth.momDelta < 0 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-slate-100 text-slate-600'
            }`}>
              {latestEvaluatedMonth.momDelta > 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : latestEvaluatedMonth.momDelta < 0 ? (
                <ArrowDownRight className="w-3.5 h-3.5" />
              ) : (
                <Minus className="w-3.5 h-3.5" />
              )}
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
              {latestEvaluatedMonth.strikes}
            </span>
            <span className="text-xs text-slate-500">Laporan</span>
            <span className={`ml-auto font-mono text-xs font-bold ${
              latestEvaluatedMonth.momDelta > 0 ? 'text-rose-600' : latestEvaluatedMonth.momDelta < 0 ? 'text-emerald-600' : 'text-slate-600'
            }`}>
              {latestEvaluatedMonth.momDelta > 0 ? `+${latestEvaluatedMonth.momDelta}` : latestEvaluatedMonth.momDelta} ({latestEvaluatedMonth.momPercent > 0 ? `+${latestEvaluatedMonth.momPercent}%` : `${latestEvaluatedMonth.momPercent}%`})
            </span>
          </div>
          <span className={`text-[10px] font-semibold mt-1 block ${
            latestEvaluatedMonth.momDelta > 0 
              ? 'text-rose-700' 
              : latestEvaluatedMonth.momDelta < 0 
              ? 'text-emerald-700' 
              : 'text-slate-500'
          }`}>
            {latestEvaluatedMonth.momDelta > 0 
              ? 'Peningkatan Risiko dari bulan sebelumnya' 
              : latestEvaluatedMonth.momDelta < 0 
              ? 'Penurunan Risiko (Mitigasi Efektif)' 
              : 'Kondisi Relatif Stabil'}
          </span>
        </div>

        {/* KPI 2: Evaluasi Tren Risiko Tahunan (YoY) */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Tren Risiko Tahunan (YoY)
            </span>
            <div className={`p-1 rounded-md ${
              annualTrendYoY.direction === 'down' 
                ? 'bg-emerald-100 text-emerald-700' 
                : annualTrendYoY.direction === 'up' 
                ? 'bg-rose-100 text-rose-700' 
                : 'bg-slate-100 text-slate-600'
            }`}>
              {annualTrendYoY.direction === 'down' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertOctagon className="w-3.5 h-3.5 text-rose-600" />
              )}
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className={`text-xl sm:text-2xl font-bold font-mono ${
              annualTrendYoY.direction === 'down' ? 'text-emerald-600' : annualTrendYoY.direction === 'up' ? 'text-rose-600' : 'text-slate-800'
            }`}>
              {annualTrendYoY.percent > 0 ? `+${annualTrendYoY.percent}%` : `${annualTrendYoY.percent}%`}
            </span>
            <span className="text-xs text-slate-500">vs 2025</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {annualTrendYoY.direction === 'down' 
              ? `Risiko Tahunan Menurun (${Math.abs(annualTrendYoY.delta)} insiden lebih sedikit)`
              : annualTrendYoY.direction === 'up'
              ? `Risiko Tahunan Meningkat (+${annualTrendYoY.delta} insiden)`
              : 'Tingkat insiden setara tahun sebelumnya'}
          </span>
        </div>

        {/* KPI 3: Periode Puncak Risiko (Peak Alert) */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Bulan Puncak Risiko Terbesar
          </span>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {peakMonth.monthName}
            </span>
            <span className="text-xs font-mono font-bold text-rose-600">
              ({peakMonth.strikes} Strike)
            </span>
          </div>
          <span className="text-[10px] text-rose-700 font-medium block mt-1 flex items-center gap-1">
            <CloudRain className="w-3 h-3" />
            {peakMonth.seasonLabel.split('(')[0]}
          </span>
        </div>

        {/* KPI 4: Rasio Dampak Kerusakan Pesawat */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Rasio Kerusakan Pesawat
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              {totalDamageInView} Kasus
            </span>
          </div>
          <div className="flex items-baseline space-x-1.5 mt-1.5">
            <span className={`text-xl sm:text-2xl font-bold font-mono ${damageRate > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {damageRate}%
            </span>
            <span className="text-xs text-slate-500">dari total {totalStrikesInView} strike</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Tingkat keparahan struktural &amp; engine ingestion
          </span>
        </div>
      </div>

      {/* Main Recharts Canvas */}
      <div className="p-5">
        {/* Secondary Sub-toolbar for Bar Chart Metrics */}
        {chartMode === 'yoy' && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80 mb-4 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                Metrik Grafik Batang:
              </span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setBarChartMetric('strikes')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    barChartMetric === 'strikes'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Wildlife Strike
                </button>
                <button
                  type="button"
                  onClick={() => setBarChartMetric('patrols')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    barChartMetric === 'patrols'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Patroli &amp; Inspeksi
                </button>
                <button
                  type="button"
                  onClick={() => setBarChartMetric('occurrences')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    barChartMetric === 'occurrences'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Occurrence
                </button>
                <button
                  type="button"
                  onClick={() => setBarChartMetric('satwa')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    barChartMetric === 'satwa'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Satwa Teramati
                </button>
                <button
                  type="button"
                  onClick={() => setBarChartMetric('multi')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition cursor-pointer ${
                    barChartMetric === 'multi'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Multi-Indikator
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 text-[11px] font-semibold border border-sky-200">
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                <span>{integratedDocsCount} Dokumen Terunggah Disinkronkan</span>
              </span>
            </div>
          </div>
        )}

        <div className="h-72 sm:h-84 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === 'mom' ? (
              /* MODE 1: Month-to-Month Comparison (Bulan Ini vs Bulan Sebelumnya + Delta Line) */
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="shortMonth" 
                  tickLine={false} 
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                />
                <YAxis 
                  yAxisId="left"
                  allowDecimals={false}
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  unit="%"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={38} 
                  formatter={(value) => <span className="text-xs text-slate-700 font-semibold">{value}</span>}
                />

                {/* High Risk Migration Zone Shading */}
                <ReferenceArea 
                  {...({ 
                    yAxisId: 'left', 
                    x1: 'Okt', 
                    x2: 'Feb', 
                    fill: '#fee2e2', 
                    fillOpacity: 0.35 
                  } as any)} 
                />

                {/* Bars: Current Month Strikes */}
                <Bar 
                  yAxisId="left"
                  dataKey="strikes" 
                  name="Total Strike Bulan Berjalan" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                >
                  {monthlyData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.hasManualOverride ? '#d97706' : (entry.hasMonthlyDocument ? '#0284c7' : (entry.momDelta > 0 ? '#e11d48' : entry.momDelta < 0 ? '#059669' : '#3b82f6'))} 
                      stroke={entry.hasManualOverride ? '#b45309' : (entry.hasMonthlyDocument ? '#0369a1' : undefined)}
                      strokeWidth={entry.hasManualOverride || entry.hasMonthlyDocument ? 1.5 : 0}
                    />
                  ))}
                </Bar>

                {/* Bars: Previous Month Strikes (Direct visual comparison) */}
                <Bar 
                  yAxisId="left"
                  dataKey="prevMonthStrikes" 
                  name="Total Strike Bulan Sebelumnya (Pembanding)" 
                  fill="#94a3b8" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={20}
                />

                {/* Line: Month-over-Month Delta % (Right Axis) */}
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="momPercent" 
                  name="Tren % Perubahan MoM (+Naik / -Turun)" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  dot={(props: any) => {
                    const { cx, cy, payload } = props;
                    const isUp = payload.momDelta > 0;
                    const isDown = payload.momDelta < 0;
                    return (
                      <circle 
                        key={`dot-${payload.monthKey}`}
                        cx={cx} 
                        cy={cy} 
                        r={4.5} 
                        fill={isUp ? '#e11d48' : isDown ? '#059669' : '#64748b'} 
                        stroke="#ffffff" 
                        strokeWidth={1.5} 
                      />
                    );
                  }}
                />

                {/* 0% Line Reference */}
                <ReferenceLine 
                  yAxisId="right" 
                  y={0} 
                  stroke="#94a3b8" 
                  strokeDasharray="3 3" 
                  label={{ value: 'Netral (0%)', position: 'insideRight', fill: '#94a3b8', fontSize: 10 }}
                />

                {/* Safety Target Reference */}
                {showTargetLine && (
                  <Line 
                    yAxisId="left"
                    type="stepAfter" 
                    dataKey="safetyTargetThreshold" 
                    name="Ambang Toleransi ICAO (Target)" 
                    stroke="#0d9488" 
                    strokeDasharray="4 4"
                    strokeWidth={1.8}
                    dot={false}
                  />
                )}
              </ComposedChart>
            ) : chartMode === 'annual-trend' ? (
              /* MODE 2: Cumulative YTD Annual Trajectory (Melihat Tren Tahunan Meningkat atau Menurun) */
              <AreaChart data={monthlyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="ytdCurrentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#e11d48" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="ytdPriorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#64748b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#64748b" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="shortMonth" 
                  tickLine={false} 
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                />
                <YAxis 
                  allowDecimals={false}
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={38} 
                  formatter={(value) => <span className="text-xs text-slate-700 font-semibold">{value}</span>}
                />

                <Area 
                  type="monotone" 
                  dataKey="ytdStrikes" 
                  name={`Akumulasi Insiden YTD (${selectedYear === 'all' ? '2026' : selectedYear})`} 
                  stroke="#e11d48" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#ytdCurrentGradient)" 
                />

                <Area 
                  type="monotone" 
                  dataKey="priorYtdStrikes" 
                  name="Akumulasi Insiden YTD Tahun 2025 (Pembanding)" 
                  stroke="#64748b" 
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1} 
                  fill="url(#ytdPriorGradient)" 
                />
              </AreaChart>
            ) : chartMode === 'yoy' ? (
              /* MODE 3: Unified Bar Chart with Integrated Uploaded Documents Metrics */
              <BarChart data={monthlyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="shortMonth" 
                  tickLine={false} 
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                />
                <YAxis 
                  allowDecimals={false}
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={38} 
                  formatter={(value) => <span className="text-xs text-slate-700 font-semibold">{value}</span>}
                />

                {barChartMetric === 'strikes' && (
                  <>
                    <Bar 
                      dataKey="strikes" 
                      name={`Tahun ${selectedYear === 'all' ? '2026' : selectedYear} (Amber: Input Manual, Biru: Dokumen, Merah: Lapangan)`} 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={26}
                    >
                      {monthlyData.map((entry, index) => (
                        <Cell 
                          key={`cell-strike-${index}`} 
                          fill={entry.hasManualOverride ? '#d97706' : (entry.hasMonthlyDocument ? '#0284c7' : '#e11d48')} 
                          stroke={entry.hasManualOverride ? '#b45309' : undefined}
                          strokeWidth={entry.hasManualOverride ? 1.5 : 0}
                        />
                      ))}
                    </Bar>

                    <Bar 
                      dataKey="priorYearStrikes" 
                      name="Tahun 2025 (Historis)" 
                      fill="#94a3b8" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={26}
                    />

                    {showTargetLine && (
                      <Line 
                        type="monotone" 
                        dataKey="safetyTargetThreshold" 
                        name="Target Maksimum Keselamatan" 
                        stroke="#0d9488" 
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={{ r: 3, fill: '#0d9488' }}
                      />
                    )}
                  </>
                )}

                {barChartMetric === 'patrols' && (
                  <>
                    <Bar 
                      dataKey="monthlyPatrols" 
                      name="Frekuensi Patroli (Indigo: Dokumen Terunggah, Abu: Rutin)" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={30}
                    >
                      {monthlyData.map((entry, index) => (
                        <Cell 
                          key={`cell-patrol-${index}`} 
                          fill={entry.hasMonthlyDocument ? '#4f46e5' : '#64748b'} 
                        />
                      ))}
                    </Bar>
                    <Line 
                      type="monotone"
                      dataKey="patrolTarget" 
                      name="Target SOP Bulanan (90 Patroli)" 
                      stroke="#059669" 
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 3, fill: '#059669' }}
                    />
                  </>
                )}

                {barChartMetric === 'occurrences' && (
                  <Bar 
                    dataKey="monthlyOccurrences" 
                    name="Laporan Occurrence Satwa (Amber: Dokumen Terunggah)" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  >
                    {monthlyData.map((entry, index) => (
                      <Cell 
                        key={`cell-occ-${index}`} 
                        fill={entry.hasMonthlyDocument ? '#f59e0b' : '#d97706'} 
                      />
                    ))}
                  </Bar>
                )}

                {barChartMetric === 'satwa' && (
                  <Bar 
                    dataKey="monthlySatwa" 
                    name="Populasi Satwa Teramati (Ekor)" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={30}
                  >
                    {monthlyData.map((entry, index) => (
                      <Cell 
                        key={`cell-satwa-${index}`} 
                        fill={entry.hasMonthlyDocument ? '#10b981' : '#059669'} 
                      />
                    ))}
                  </Bar>
                )}

                {barChartMetric === 'multi' && (
                  <>
                    <Bar 
                      dataKey="strikes" 
                      name="Strike (Insiden)" 
                      fill="#e11d48" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={20}
                    />
                    <Bar 
                      dataKey="monthlyOccurrences" 
                      name="Occurrence (Kejadian)" 
                      fill="#f59e0b" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={20}
                    />
                    <Bar 
                      dataKey="monthlyPatrols" 
                      name="Patroli Lapangan" 
                      fill="#4f46e5" 
                      radius={[4, 4, 0, 0]}
                      maxBarSize={20}
                    />
                  </>
                )}
              </BarChart>
            ) : (
              /* MODE 4: Damage Breakdown */
              <ComposedChart data={monthlyData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="shortMonth" 
                  tickLine={false} 
                  axisLine={{ stroke: '#cbd5e1' }}
                  tick={{ fontSize: 11, fill: '#475569', fontWeight: 500 }}
                />
                <YAxis 
                  allowDecimals={false}
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={38} 
                  formatter={(value) => <span className="text-xs text-slate-700 font-semibold">{value}</span>}
                />

                <Bar 
                  dataKey="strikesWithDamage" 
                  name="Ada Kerusakan Pesawat (Substantial Damage)" 
                  fill="#b91c1c" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />

                <Bar 
                  dataKey="strikesNoDamage" 
                  name="Tanpa Kerusakan (Nil Damage)" 
                  fill="#38bdf8" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />

                <Line 
                  type="monotone" 
                  dataKey="strikes" 
                  name="Total Seluruh Strike" 
                  stroke="#e11d48" 
                  strokeWidth={2.2}
                  dot={{ r: 4, fill: '#e11d48' }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Visual Legend Helper for MoM colors */}
        {chartMode === 'mom' && (
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-3 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-700">Indikator Warna Batang MoM:</span>
              <span className="flex items-center gap-1 text-[11px] text-rose-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-600 inline-block"></span>
                Kenaikan Risiko (MoM Naik)
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block"></span>
                Penurunan Risiko (MoM Turun)
              </span>
              <span className="flex items-center gap-1 text-[11px] text-blue-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 inline-block"></span>
                Stabil / Netral
              </span>
              <span className="flex items-center gap-1 text-[11px] text-sky-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs bg-sky-600 border border-sky-800 inline-block"></span>
                Dokumen Terunggah (Resmi)
              </span>
              <span className="flex items-center gap-1 text-[11px] text-amber-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 border border-amber-600 inline-block"></span>
                Input Manual WSR
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowTargetLine(prev => !prev)}
                className="text-[11px] text-teal-700 hover:text-teal-900 font-medium underline cursor-pointer"
              >
                {showTargetLine ? 'Sembunyikan Target ICAO' : 'Tampilkan Target ICAO'}
              </button>
            </div>
          </div>
        )}

        {/* Expandable MoM Risk Evaluation Table */}
        {showTableDetails && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Table className="w-3.5 h-3.5 text-sky-600" />
                Matriks Evaluasi Risiko Bulan ke Bulan (Month-over-Month Risk Scorecard)
              </h4>
              <span className="text-[11px] text-slate-500">Periode Evaluasi {selectedYear === 'all' ? '2026' : selectedYear}</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3">Bulan</th>
                    <th className="py-2.5 px-3 text-center">Total Strike</th>
                    <th className="py-2.5 px-3 text-center">Bulan Lalu</th>
                    <th className="py-2.5 px-3 text-center">Delta MoM</th>
                    <th className="py-2.5 px-3 text-center">% Perubahan</th>
                    <th className="py-2.5 px-3 text-center">Status Risiko</th>
                    <th className="py-2.5 px-3 text-center">Kerusakan</th>
                    <th className="py-2.5 px-3">Rekomendasi Manajemen</th>
                    <th className="py-2.5 px-3 text-center">Aksi Kalibrasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {monthlyData.map((row) => {
                    const isUp = row.momDelta > 0;
                    const isDown = row.momDelta < 0;
                    return (
                      <tr key={row.monthKey} className="hover:bg-slate-50/80 transition">
                        <td className="py-2 px-3 font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span>{row.monthName}</span>
                          {row.season === 'migrasi' && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" title="Musim Migrasi"></span>
                          )}
                          {row.hasMonthlyDocument && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-100 text-sky-800 border border-sky-200" title={`Laporan terunggah: ${row.monthlyDocumentName}`}>
                              Arsip Dokumen
                            </span>
                          )}
                          {row.hasManualOverride && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5" title={`Kalibrasi manual: ${row.manualNotes || 'Diverifikasi WHU'}`}>
                              <Sliders className="w-2.5 h-2.5 text-amber-700" />
                              Manual
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">
                          {row.strikes}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-slate-500">
                          {row.prevMonthStrikes}
                        </td>
                        <td className="py-2 px-3 text-center font-mono font-bold">
                          <span className={isUp ? 'text-rose-600' : isDown ? 'text-emerald-600' : 'text-slate-500'}>
                            {row.momDelta > 0 ? `+${row.momDelta}` : row.momDelta}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isUp 
                              ? 'bg-rose-100 text-rose-800' 
                              : isDown 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {row.momPercent > 0 ? `+${row.momPercent}%` : `${row.momPercent}%`}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isUp 
                              ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                              : isDown 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {isUp ? 'Risiko Naik 🔺' : isDown ? 'Risiko Turun 🔻' : 'Stabil ➖'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          {row.strikesWithDamage > 0 ? (
                            <span className="font-bold text-rose-600">{row.strikesWithDamage} Ada</span>
                          ) : (
                            <span className="text-slate-400">Nihil</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-slate-600 leading-snug">
                          {row.recommendedMitigation}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const mIdx = parseInt(row.monthKey, 10) - 1;
                              setManualModalFocusMonth(mIdx);
                              setIsManualModalOpen(true);
                            }}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-md font-semibold text-[10px] transition cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                            title="Edit atau kalibrasi data manual WSR bulan ini"
                          >
                            <Edit3 className="w-2.5 h-2.5 text-amber-600" />
                            <span>Edit WSR</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bird Population Matrix Table from Sheet 1.7.2 */}
        {activeBirdPopulation && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <span>Lampiran Sheet 1.7.2 HISTORY POPULASI BURUNG</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {activeBirdPopulation.data.species.length} Spesies Burung
                    </span>
                  </h4>
                  <p className="text-[11px] text-emerald-800">
                    Sumber: {activeBirdPopulation.doc.fileName} • Seluruh nilai "NIL" disanitasi ke numerik 0.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowBirdPopulationTable(prev => !prev)}
                className="self-start sm:self-auto px-3 py-1.5 rounded-lg bg-white border border-emerald-300 hover:bg-emerald-100 text-xs font-semibold text-emerald-900 transition cursor-pointer shadow-2xs"
              >
                {showBirdPopulationTable ? 'Sembunyikan Matriks Spesies' : 'Tampilkan Matriks Spesies Burung'}
              </button>
            </div>

            {showBirdPopulationTable && (
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold">
                      <th className="py-2.5 px-3 sticky left-0 bg-slate-100 z-10">Nama Spesies Burung</th>
                      {activeBirdPopulation.data.periods.map(p => (
                        <th key={p.key} className="py-2.5 px-2.5 text-center whitespace-nowrap">
                          {p.bulan} {p.tahun}
                        </th>
                      ))}
                      <th className="py-2.5 px-3 text-center bg-slate-200/80 font-bold">Total Ekor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {activeBirdPopulation.data.species.map(sp => (
                      <tr key={sp.namaSpesies} className="hover:bg-slate-50/80 transition">
                        <td className="py-2 px-3 font-semibold text-slate-900 sticky left-0 bg-white hover:bg-slate-50/80 z-10 whitespace-nowrap border-r border-slate-100">
                          {sp.namaSpesies}
                          {sp.namaLatin && <span className="text-[10px] text-slate-500 italic block font-normal">{sp.namaLatin}</span>}
                        </td>
                        {activeBirdPopulation.data.periods.map(p => {
                          const cnt = sp.countsByPeriod[p.key] || 0;
                          return (
                            <td key={p.key} className="py-2 px-2.5 text-center font-mono">
                              <span className={cnt > 0 ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
                                {cnt > 0 ? cnt.toLocaleString('id-ID') : '0'}
                              </span>
                            </td>
                          );
                        })}
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-900 bg-slate-50/80">
                          {sp.totalSemuaPeriode.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                    {/* Summary row */}
                    <tr className="bg-emerald-50/60 font-bold border-t-2 border-emerald-200">
                      <td className="py-2.5 px-3 text-emerald-950 sticky left-0 bg-emerald-50/90 z-10">
                        TOTAL POPULASI BURUNG
                      </td>
                      {activeBirdPopulation.data.periods.map(p => (
                        <td key={p.key} className="py-2.5 px-2.5 text-center font-mono text-emerald-900">
                          {(activeBirdPopulation.data.totalByPeriod[p.key] || 0).toLocaleString('id-ID')}
                        </td>
                      ))}
                      <td className="py-2.5 px-3 text-center font-mono text-emerald-950 text-sm">
                        {activeBirdPopulation.data.grandTotal.toLocaleString('id-ID')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Seasonal Ecological Guidance Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Season 1: Migrasi */}
            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/80">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                <span className="text-xs font-bold text-rose-900">Musim Migrasi (Nov – Feb)</span>
              </div>
              <p className="text-[11px] text-rose-800 mt-1 leading-relaxed">
                Puncak kedatangan burung air migran (EAAF) &amp; intensitas curah hujan tinggi. 
                <strong className="font-semibold block text-rose-950 mt-0.5">
                  Rekomendasi: Tingkatkan patroli mobile dispersal, operasikan sound cannon &amp; pistol flare subuh/senja.
                </strong>
              </p>
            </div>

            {/* Season 2: Pancaroba */}
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>
                <span className="text-xs font-bold text-amber-900">Musim Pancaroba (Mar–Mei &amp; Sep–Okt)</span>
              </div>
              <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                Fluktuasi arah angin dan peningkatan serangga memicu kawanan burung pipit &amp; layang-layang.
                <strong className="font-semibold block text-amber-950 mt-0.5">
                  Rekomendasi: Potong rumput airside maksimal 15–20 cm untuk memutus rantai makanan serangga.
                </strong>
              </p>
            </div>

            {/* Season 3: Kemarau */}
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span className="text-xs font-bold text-emerald-900">Musim Kemarau (Jun – Ags)</span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
                Frekuensi strike umumnya menurun. Satwa terkonsentrasi di dekat drainase &amp; holding pond.
                <strong className="font-semibold block text-emerald-950 mt-0.5">
                  Rekomendasi: Pasang jaring dan bird wire di kolam retensi, pantau thermal soaring burung pemangsa.
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Pengisian Manual Kejadian WSR Per Bulan */}
      <ManualMonthlyWSRModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        year={selectedYear === 'all' ? '2026' : selectedYear}
        availableYears={availableYears}
        onYearChange={(y) => setSelectedYear(y)}
        currentLiveStrikes={strikes}
        manualEntries={manualEntries}
        initialFocusMonth={manualModalFocusMonth}
        onSaveSuccess={() => {
          // Subscribed listener automatically refreshes
        }}
      />
    </div>
  );
};

