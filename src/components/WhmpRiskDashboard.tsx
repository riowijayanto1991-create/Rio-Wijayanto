import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Info,
  Search,
  Filter,
  Plus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ExternalLink,
  MapPin,
  Flame,
  Check,
  X,
  FileCheck,
  Clock,
  Layers,
  ArrowRight,
  HelpCircle,
  AlertOctagon,
  Eye,
  Sliders,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import {
  LikelihoodLetter,
  SeverityLevel,
  RiskTier,
  WHMPSpecies,
  WHMPZone,
  LikelihoodComputationConfig,
  ProposedSpecies,
  SpeciesActualComparison
} from '../types/whmpRisk';
import {
  WHMP_LIKELIHOOD_SCALE,
  WHMP_SEVERITY_SCALE,
  WHMP_RISK_MATRIX,
  WHMP_ZONES,
  WHMP_LIKELIHOOD_CONFIG,
  WHMP_60_SPECIES
} from '../config/whmpRiskConfig';
import {
  lookupRisk,
  calculateSpeciesComparison,
  evaluateSpeciesDiscrepancy,
  getZoneById
} from '../utils/whmpRiskCalculator';
import { useAuth } from '../context/AuthContext';

interface WhmpRiskDashboardProps {
  patrols: any[];
  occurrences: any[];
  strikes: any[];
  onOpenReportForm?: (type: 'patrol' | 'occurrence' | 'strike') => void;
}

export const WhmpRiskDashboard: React.FC<WhmpRiskDashboardProps> = ({
  patrols,
  occurrences,
  strikes,
  onOpenReportForm
}) => {
  const { user, isSuperAdmin, isAirportAdmin, hasPerm } = useAuth();
  const canEditRiskRules = isSuperAdmin || isAirportAdmin || hasPerm('RiskRules.Edit');

  // Sub-navigation tabs
  const [activeSubTab, setActiveSubTab] = useState<'comparison' | 'matrix' | 'zones' | 'proposed'>('comparison');

  // Configuration and species state
  const [speciesCatalog, setSpeciesCatalog] = useState<WHMPSpecies[]>(WHMP_60_SPECIES);
  const [likelihoodConfig, setLikelihoodConfig] = useState<LikelihoodComputationConfig>(WHMP_LIKELIHOOD_CONFIG);
  const [proposedSpeciesList, setProposedSpeciesList] = useState<ProposedSpecies[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Selected cell for interactive matrix inspector
  const [selectedCell, setSelectedCell] = useState<{ likelihood: LikelihoodLetter; severity: SeverityLevel } | null>({
    likelihood: 'E',
    severity: 3
  });

  // Filters for Comparison tab
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [taxonomicFilter, setTaxonomicFilter] = useState<string>('all');
  const [varianceFilter, setVarianceFilter] = useState<string>('all');

  // Modals & Drawers
  const [isProposedModalOpen, setIsProposedModalOpen] = useState<boolean>(false);
  const [isTaxonomyModalOpen, setIsTaxonomyModalOpen] = useState<boolean>(false);
  const [selectedSpeciesForTaxonomy, setSelectedSpeciesForTaxonomy] = useState<WHMPSpecies | null>(null);
  const [taxonomyCorrectedName, setTaxonomyCorrectedName] = useState<string>('');
  const [taxonomyNotes, setTaxonomyNotes] = useState<string>('');
  const [taxonomyStatusChoice, setTaxonomyStatusChoice] = useState<'Needs taxonomic review' | 'Verified'>('Verified');

  // New Proposed Species form state
  const [newCommonId, setNewCommonId] = useState('');
  const [newCommonEn, setNewCommonEn] = useState('');
  const [newLatin, setNewLatin] = useState('');
  const [newGroup, setNewGroup] = useState<'Burung (Aves)' | 'Mamalia' | 'Reptil' | 'Amfibi' | 'Lainnya'>('Burung (Aves)');
  const [newSeverity, setNewSeverity] = useState<SeverityLevel>(2);
  const [newLikelihood, setNewLikelihood] = useState<LikelihoodLetter>('B');
  const [newJustification, setNewJustification] = useState('');
  const [newZoneId, setNewZoneId] = useState('zone-1');
  const [newLocationDesc, setNewLocationDesc] = useState('');
  const [newPopulation, setNewPopulation] = useState(1);

  // Approval remarks for placeholder thresholds
  const [isApproveThresholdModalOpen, setIsApproveThresholdModalOpen] = useState(false);
  const [thresholdApprovalRemarks, setThresholdApprovalRemarks] = useState('');

  // Flash notification toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch live config, species, and proposed species from API
  const fetchWhmpData = async () => {
    setLoading(true);
    try {
      // 1. Config
      const confRes = await fetch('/api/whmp/config');
      if (confRes.ok) {
        const confData = await confRes.json();
        if (confData.likelihoodConfig) {
          setLikelihoodConfig(confData.likelihoodConfig);
        }
      }

      // 2. Species Catalog
      const spRes = await fetch('/api/whmp/species');
      if (spRes.ok) {
        const spData = await spRes.json();
        if (Array.isArray(spData.species)) {
          setSpeciesCatalog(spData.species);
        }
      }

      // 3. Proposed Species
      const propRes = await fetch('/api/whmp/proposed-species');
      if (propRes.ok) {
        const propData = await propRes.json();
        if (Array.isArray(propData.proposedSpecies)) {
          setProposedSpeciesList(propData.proposedSpecies);
        }
      }
    } catch (err) {
      console.warn('API error, using cached WHMP dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWhmpData();
  }, []);

  // Compute "WHMP vs Actual" comparisons across the entire species catalog
  const speciesComparisons = useMemo<SpeciesActualComparison[]>(() => {
    return speciesCatalog.map(sp => {
      return calculateSpeciesComparison(sp, patrols, occurrences, strikes, likelihoodConfig);
    });
  }, [speciesCatalog, patrols, occurrences, strikes, likelihoodConfig]);

  // Filtered comparison results
  const filteredComparisons = useMemo(() => {
    return speciesComparisons.filter(item => {
      const sp = item.species;
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = 
          sp.common_name_id.toLowerCase().includes(q) ||
          sp.common_name_en.toLowerCase().includes(q) ||
          sp.latin_name_as_written.toLowerCase().includes(q) ||
          sp.latin_name_corrected.toLowerCase().includes(q);
        if (!matches) return false;
      }
      // Tier filter
      if (tierFilter !== 'all' && sp.risk_tier !== tierFilter) {
        return false;
      }
      // Group filter
      if (groupFilter !== 'all' && sp.group !== groupFilter) {
        return false;
      }
      // Taxonomic filter
      if (taxonomicFilter !== 'all' && sp.taxonomic_status !== taxonomicFilter) {
        return false;
      }
      // Variance filter
      if (varianceFilter !== 'all' && item.variance_tier !== varianceFilter) {
        return false;
      }
      return true;
    });
  }, [speciesComparisons, searchQuery, tierFilter, groupFilter, taxonomicFilter, varianceFilter]);

  // Stats summaries
  const comparisonStats = useMemo(() => {
    let increased = 0;
    let stable = 0;
    let decreased = 0;
    let needsTaxonomy = 0;
    let discrepancies = 0;

    speciesComparisons.forEach(c => {
      if (c.variance_tier === 'INCREASED') increased++;
      else if (c.variance_tier === 'DECREASED') decreased++;
      else stable++;

      if (c.species.taxonomic_status === 'Needs taxonomic review') needsTaxonomy++;
      const disc = evaluateSpeciesDiscrepancy(c.species);
      if (disc.hasDiscrepancy) discrepancies++;
    });

    return {
      total: speciesComparisons.length,
      increased,
      stable,
      decreased,
      needsTaxonomy,
      discrepancies
    };
  }, [speciesComparisons]);

  // Zone statistics (count reports per zone)
  const zoneStats = useMemo(() => {
    const stats: Record<string, { patrols: number; occurrences: number; strikes: number }> = {};
    WHMP_ZONES.forEach(z => {
      stats[z.id] = { patrols: 0, occurrences: 0, strikes: 0 };
    });

    patrols.forEach(p => {
      if (p.whmpZoneId && stats[p.whmpZoneId]) stats[p.whmpZoneId].patrols++;
    });
    occurrences.forEach(o => {
      if (o.whmpZoneId && stats[o.whmpZoneId]) stats[o.whmpZoneId].occurrences++;
    });
    strikes.forEach(s => {
      if (s.whmpZoneId && stats[s.whmpZoneId]) stats[s.whmpZoneId].strikes++;
    });

    return stats;
  }, [patrols, occurrences, strikes]);

  // Handlers
  const handleApproveThresholds = async () => {
    try {
      const res = await fetch('/api/whmp/thresholds/approve', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('whms_auth_token') || ''}`
        },
        body: JSON.stringify({ remarks: thresholdApprovalRemarks })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyetujui ambang batas.');
      setLikelihoodConfig(data.config);
      setIsApproveThresholdModalOpen(false);
      showToast('Ambang batas risiko WHMP berhasil disahkan resmi!');
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleOpenTaxonomyModal = (sp: WHMPSpecies) => {
    setSelectedSpeciesForTaxonomy(sp);
    setTaxonomyCorrectedName(sp.latin_name_corrected);
    setTaxonomyNotes(sp.taxonomic_notes || '');
    setTaxonomyStatusChoice(sp.taxonomic_status);
    setIsTaxonomyModalOpen(true);
  };

  const handleSaveTaxonomy = async () => {
    if (!selectedSpeciesForTaxonomy) return;
    try {
      const res = await fetch(`/api/whmp/species/${selectedSpeciesForTaxonomy.id}/taxonomy`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('whms_auth_token') || ''}`
        },
        body: JSON.stringify({
          status: taxonomyStatusChoice,
          correctedName: taxonomyCorrectedName,
          notes: taxonomyNotes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memperbarui status taksonomi.');
      
      setSpeciesCatalog(prev => prev.map(s => s.id === selectedSpeciesForTaxonomy.id ? data.species : s));
      setIsTaxonomyModalOpen(false);
      showToast(`Status taksonomi ${selectedSpeciesForTaxonomy.common_name_id} berhasil diperbarui.`);
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleCreateProposedSpecies = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/whmp/proposed-species', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('whms_auth_token') || ''}`
        },
        body: JSON.stringify({
          common_name_id: newCommonId,
          common_name_en: newCommonEn,
          proposed_latin_name: newLatin,
          group: newGroup,
          proposed_severity: newSeverity,
          severity_justification: newJustification,
          estimated_likelihood: newLikelihood,
          first_observed_zone_id: newZoneId,
          first_observed_location_desc: newLocationDesc,
          estimated_population: newPopulation
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mendaftarkan usulan spesies.');
      setProposedSpeciesList(prev => [data.proposedSpecies, ...prev]);
      setIsProposedModalOpen(false);
      showToast(`Usulan satwa "${newCommonId}" berhasil diajukan untuk ditinjau supervisor.`);
      // Reset form
      setNewCommonId('');
      setNewCommonEn('');
      setNewLatin('');
      setNewJustification('');
      setNewLocationDesc('');
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleReviewProposedSpecies = async (id: string, action: 'APPROVE' | 'REJECT' | 'UNDER_REVIEW') => {
    try {
      const res = await fetch(`/api/whmp/proposed-species/${id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('whms_auth_token') || ''}`
        },
        body: JSON.stringify({
          action,
          review_notes: action === 'APPROVE' ? 'Disetujui dan dimasukkan ke katalog resmi WHMP.' : 'Ditolak / Perlu data konfirmasi tambahan.'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses review spesies.');

      setProposedSpeciesList(prev => prev.map(p => p.id === id ? data.proposed : p));
      if (data.addedToCatalog) {
        setSpeciesCatalog(prev => [...prev, data.addedToCatalog]);
        showToast(`Spesies baru disetujui & ditambahkan ke katalog aktif WHMP!`);
      } else {
        showToast(data.message);
      }
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const getTierBadgeStyle = (tier: RiskTier) => {
    switch (tier) {
      case 'High':
        return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800';
      case 'Moderate to High':
        return 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-800';
      case 'Moderate':
        return 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'Low to Moderate':
        return 'bg-lime-100 dark:bg-lime-950/60 text-lime-700 dark:text-lime-300 border-lime-300 dark:border-lime-800';
      case 'Low':
        return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-sky-500/30 flex items-center space-x-3 text-xs animate-in fade-in slide-in-from-top-3">
          <div className="p-1 rounded bg-sky-500 text-slate-900">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold">Notifikasi Model Risiko WHMP</p>
            <p className="text-slate-300 text-[11px]">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Main Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-sky-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-sky-500/10 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/30 tracking-wider uppercase">
                WHMP Chapter II • ICAO Doc 9137 Part 3
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                Soekarno-Hatta (CGK / WIII)
              </span>
              {likelihoodConfig.isPlaceholder ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/30 text-amber-200 border border-amber-400/40 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-300" />
                  <span>Ambang Batas: PLACEHOLDER</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                  <span>Ambang Batas: DISAHKAN</span>
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-sky-400" />
              <span>Model Risiko Satwa Liar WHMP (Likelihood A..E &times; Severity 1..5)</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Konfigurasi matriks lookup tabel, zonasi kritis landasan 1-6, komparasi evidensi WHMP baseline vs laporan aktual lapangan, dan alur permohonan satwa baru airside.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsProposedModalOpen(true)}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ajukan Spesies Baru</span>
            </button>
            <button
              type="button"
              onClick={fetchWhmpData}
              disabled={loading}
              className="p-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition cursor-pointer"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Placeholder Warning Banner */}
        {likelihoodConfig.isPlaceholder && (
          <div className="mt-4 p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-100">
            <div className="flex items-start gap-2.5">
              <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-200">
                  Perhatian Ambang Batas Draf: Tumpang Tindih (Overlap) pada Frekuensi 50
                </p>
                <p className="text-[11px] text-amber-300/90 mt-0.5">
                  {likelihoodConfig.placeholderNotice}
                </p>
              </div>
            </div>
            {canEditRiskRules && (
              <button
                type="button"
                onClick={() => setIsApproveThresholdModalOpen(true)}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition shrink-0 cursor-pointer shadow-xs"
              >
                Sahkan Ambang Batas
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto text-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('comparison')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeSubTab === 'comparison'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>WHMP vs Data Aktual ({speciesCatalog.length} Spesies)</span>
          {comparisonStats.increased > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
              {comparisonStats.increased} Eskalasi
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('matrix')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeSubTab === 'matrix'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Matriks Risiko WHMP 5&times;5 (Lookup Table)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('zones')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeSubTab === 'zones'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Zonasi Wilayah 1-6 (Zonasi Kritis 1..3)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('proposed')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold transition cursor-pointer ${
            activeSubTab === 'proposed'
              ? 'bg-sky-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Alur Usulan Spesies Baru</span>
          {proposedSpeciesList.filter(p => p.status === 'PROPOSED').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 text-[10px] font-bold">
              {proposedSpeciesList.filter(p => p.status === 'PROPOSED').length} Antrean
            </span>
          )}
        </button>
      </div>

      {/* SUB-TAB 1: WHMP VS ACTUAL DASHBOARD */}
      {activeSubTab === 'comparison' && (
        <div className="space-y-4">
          {/* Top Quick Stats Pill Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500 text-[11px] block">Katalog Spesies WHMP</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{comparisonStats.total}</span>
              <span className="text-[10px] text-slate-400 block">Baseline Dokumen</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs">
              <span className="text-rose-600 dark:text-rose-400 text-[11px] block font-semibold flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Eskalasi Risiko
              </span>
              <span className="text-lg font-bold text-rose-600 dark:text-rose-400">{comparisonStats.increased}</span>
              <span className="text-[10px] text-slate-400 block">Frekuensi Naik</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <span className="text-slate-500 text-[11px] block flex items-center gap-1">
                <Minus className="w-3 h-3" /> Risiko Stabil
              </span>
              <span className="text-lg font-bold text-slate-700 dark:text-slate-300">{comparisonStats.stable}</span>
              <span className="text-[10px] text-slate-400 block">Sesuai Baseline</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/40 text-xs">
              <span className="text-emerald-600 dark:text-emerald-400 text-[11px] block font-semibold flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> Risiko Terkendali
              </span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{comparisonStats.decreased}</span>
              <span className="text-[10px] text-slate-400 block">Aktivitas Rendah</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-amber-200 dark:border-amber-900/40 text-xs">
              <span className="text-amber-600 dark:text-amber-400 text-[11px] block font-semibold">
                Review Taksonomi
              </span>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">{comparisonStats.needsTaxonomy}</span>
              <span className="text-[10px] text-slate-400 block">Perlu Verifikasi</span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-purple-200 dark:border-purple-900/40 text-xs">
              <span className="text-purple-600 dark:text-purple-400 text-[11px] block font-semibold">
                Anomali Matriks WHMP
              </span>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{comparisonStats.discrepancies}</span>
              <span className="text-[10px] text-slate-400 block">Discrepancy Warning</span>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama Indonesia, Inggris, atau Latin..."
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={tierFilter}
                  onChange={(e) => setTierFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none text-xs"
                >
                  <option value="all">Semua Kategori Risiko</option>
                  <option value="High">High (Merah)</option>
                  <option value="Moderate to High">Moderate to High (Oranye)</option>
                  <option value="Moderate">Moderate (Kuning)</option>
                  <option value="Low to Moderate">Low to Moderate (Hijau Muda)</option>
                  <option value="Low">Low (Hijau)</option>
                </select>

                <select
                  value={varianceFilter}
                  onChange={(e) => setVarianceFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none text-xs"
                >
                  <option value="all">Semua Tren (WHMP vs Aktual)</option>
                  <option value="INCREASED">Eskalasi Risiko (Naik)</option>
                  <option value="STABLE">Stabil (Sesuai WHMP)</option>
                  <option value="DECREASED">Terkendali (Turun)</option>
                </select>

                <select
                  value={taxonomicFilter}
                  onChange={(e) => setTaxonomicFilter(e.target.value)}
                  className="px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 outline-none text-xs"
                >
                  <option value="all">Semua Status Taksonomi</option>
                  <option value="Needs taxonomic review">Perlu Review Taksonomi</option>
                  <option value="Verified">Terverifikasi Taksonomi</option>
                </select>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[650px] overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 sticky top-0 z-10 select-none">
                  <tr>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold w-12 text-center">No</th>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold min-w-[200px]">Identitas Spesies Satwa</th>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-center min-w-[150px]">
                      WHMP Baseline
                      <span className="block text-[10px] font-normal text-slate-500">Likelihood &bull; Severity &bull; Skor</span>
                    </th>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-center min-w-[170px]">
                      Data Aktual Lapangan
                      <span className="block text-[10px] font-normal text-slate-500">Hari Teramati &bull; Insiden Strike</span>
                    </th>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-center min-w-[150px]">
                      Kalkulasi Aktual
                      <span className="block text-[10px] font-normal text-slate-500">Likelihood &bull; Skor Matriks</span>
                    </th>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-center min-w-[130px]">
                      Variansi &bull; Revisi
                      <span className="block text-[10px] font-normal text-slate-500">WHMP vs Aktual</span>
                    </th>
                    <th className="p-3 border-b border-slate-200 dark:border-slate-700 font-semibold text-center w-28">Aksi Taksonomi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredComparisons.map((item, idx) => {
                    const sp = item.species;
                    const disc = evaluateSpeciesDiscrepancy(sp);

                    return (
                      <tr 
                        key={sp.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="p-3 text-center text-slate-400 font-mono">
                          {sp.species_number || idx + 1}
                        </td>
                        <td className="p-3 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {sp.common_name_id}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              ({sp.common_name_en})
                            </span>
                          </div>

                          <div className="text-[11px] font-mono space-y-0.5">
                            <div className="text-slate-500">
                              <span className="text-[10px] text-slate-400 uppercase">Tercatat WHMP:</span>{' '}
                              <span className="italic">{sp.latin_name_as_written}</span>
                            </div>
                            {sp.latin_name_as_written !== sp.latin_name_corrected && (
                              <div className="text-sky-700 dark:text-sky-400">
                                <span className="text-[10px] text-sky-500 uppercase">Koreksi Taksonomi:</span>{' '}
                                <span className="italic font-semibold">{sp.latin_name_corrected}</span>
                              </div>
                            )}
                          </div>

                          {/* Badges */}
                          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {sp.group}
                            </span>
                            {sp.taxonomic_status === 'Needs taxonomic review' ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                                <HelpCircle className="w-2.5 h-2.5" />
                                <span>Needs taxonomic review</span>
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Verified</span>
                              </span>
                            )}
                            {disc.hasDiscrepancy && (
                              <span 
                                className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-1 cursor-help"
                                title={`Peringatan: ${disc.detail}`}
                              >
                                <AlertTriangle className="w-2.5 h-2.5 text-purple-600" />
                                <span>Discrepancy WHMP</span>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* WHMP Baseline Assessment */}
                        <td className="p-3 text-center">
                          <div className="inline-flex flex-col items-center space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs border border-slate-300 dark:border-slate-700" title={`Likelihood ${sp.likelihood_level.letter} (Nilai ${sp.likelihood_level.number})`}>
                                L: {sp.likelihood_level.letter} ({sp.likelihood_level.number})
                              </span>
                              <span className="text-slate-400">&bull;</span>
                              <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs border border-slate-300 dark:border-slate-700" title={`Severity Level ${sp.severity_level}`}>
                                S: {sp.severity_level}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTierBadgeStyle(sp.risk_tier)}`}>
                                Skor {sp.risk_score} &bull; {sp.risk_tier}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Actual Operational Reports */}
                        <td className="p-3 text-center">
                          <div className="inline-flex flex-col items-center space-y-1 text-[11px]">
                            <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                              <span>{item.actual_days_observed_year} hari teramati</span>
                              <span className="text-slate-300">&bull;</span>
                              <span>{item.actual_total_sightings_count} ekor</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Strike: <strong className={item.actual_strikes_count > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}>{item.actual_strikes_count} kejadian</strong>
                            </div>
                          </div>
                        </td>

                        {/* Actual Computed Likelihood & Risk */}
                        <td className="p-3 text-center">
                          <div className="inline-flex flex-col items-center space-y-1">
                            <div className="flex items-center gap-1">
                              <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-200 text-xs border border-sky-300 dark:border-sky-800" title={`Pendekatan 1: ${item.computed_likelihood_approach1} | Pendekatan 2: ${item.computed_likelihood_approach2}`}>
                                L: {item.computed_likelihood_adopted}
                              </span>
                              <span className="text-slate-400">&bull;</span>
                              <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs border border-slate-300 dark:border-slate-700">
                                S: {sp.severity_level}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTierBadgeStyle(item.computed_tier)}`}>
                              Skor {item.computed_score} &bull; {item.computed_tier}
                            </span>
                          </div>
                        </td>

                        {/* Variance & Revision Guidance */}
                        <td className="p-3 text-center">
                          {item.variance_tier === 'INCREASED' && (
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-rose-600" />
                                <span>+{item.variance_score} (Eskalasi)</span>
                              </span>
                              <span className="text-[9px] text-rose-600 dark:text-rose-400">Usul Revisi WHMP &uarr;</span>
                            </div>
                          )}
                          {item.variance_tier === 'DECREASED' && (
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <TrendingDown className="w-3 h-3 text-emerald-600" />
                                <span>{item.variance_score} (Terkendali)</span>
                              </span>
                              <span className="text-[9px] text-emerald-600 dark:text-emerald-400">Mitigasi Efektif</span>
                            </div>
                          )}
                          {item.variance_tier === 'STABLE' && (
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
                                <Minus className="w-3 h-3 text-slate-400" />
                                <span>Stabil</span>
                              </span>
                              <span className="text-[9px] text-slate-400">Sesuai Dokumen</span>
                            </div>
                          )}
                        </td>

                        {/* Action Column */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenTaxonomyModal(sp)}
                            className="px-2 py-1 text-[11px] font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded border border-sky-200 dark:border-sky-800 transition cursor-pointer"
                            title="Tinjau nama taksonomi dan verifikasi"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: RISK MATRIX 5X5 & LOOKUP TABLE */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600" />
                  <span>Matriks Risiko Satwa Liar WHMP Chapter II (Tabel Rujukan Baku)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Peraturan Sistem: Skor didapatkan melalui pemetaan sel (lookup), bukan melalui operasi perkalian.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                <span>Kolom: Severity 1..5</span>
                <span>&bull;</span>
                <span>Baris: Likelihood E..A</span>
              </div>
            </div>

            {/* Matrix Grid 5x5 */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-center">
                <thead>
                  <tr>
                    <th className="p-2 border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 w-28">
                      Likelihood \ Severity
                    </th>
                    {[1, 2, 3, 4, 5].map((sev) => {
                      const sevDef = WHMP_SEVERITY_SCALE[sev as SeverityLevel];
                      return (
                        <th 
                          key={sev}
                          className="p-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-800 dark:text-slate-200"
                        >
                          <div>Level {sev}</div>
                          <div className="text-[10px] font-normal text-slate-500 truncate">{sevDef.labelId.split('(')[0]}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {(['E', 'D', 'C', 'B', 'A'] as LikelihoodLetter[]).map((likLetter) => {
                    const likInfo = WHMP_LIKELIHOOD_SCALE[likLetter];
                    return (
                      <tr key={likLetter}>
                        {/* Likelihood Row Header */}
                        <td className="p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-left">
                          <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded bg-sky-600 text-white flex items-center justify-center font-mono text-[11px]">
                              {likLetter}
                            </span>
                            <span>Level {likInfo.number}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">{likInfo.labelId.split('(')[0]}</div>
                        </td>

                        {/* 5 Severity Columns */}
                        {([1, 2, 3, 4, 5] as SeverityLevel[]).map((sevLevel) => {
                          const cell = WHMP_RISK_MATRIX[likLetter][sevLevel];
                          const isSelected = selectedCell?.likelihood === likLetter && selectedCell?.severity === sevLevel;

                          return (
                            <td
                              key={sevLevel}
                              onClick={() => setSelectedCell({ likelihood: likLetter, severity: sevLevel })}
                              className={`p-3 border border-slate-200 dark:border-slate-700 cursor-pointer transition-all relative ${
                                cell.colorCode.bg
                              } ${
                                isSelected ? 'ring-3 ring-sky-500 z-10 scale-[1.02] shadow-md' : 'hover:opacity-90'
                              }`}
                            >
                              <div className="flex flex-col items-center justify-center space-y-1">
                                <span className="text-base font-extrabold font-mono text-slate-900 dark:text-white">
                                  {cell.score}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cell.colorCode.badgeBg}`}>
                                  {cell.tier}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Legend Tiers */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-500">Tingkatan Risiko (Tiers):</span>
              <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">Low (1-2)</span>
              <span className="px-2 py-0.5 rounded bg-lime-600 text-white font-bold text-[10px]">Low to Moderate (3-6)</span>
              <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-bold text-[10px]">Moderate (7-12)</span>
              <span className="px-2 py-0.5 rounded bg-orange-500 text-white font-bold text-[10px]">Moderate to High (13-18)</span>
              <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px]">High (19-25)</span>
            </div>
          </div>

          {/* Interactive Cell Inspector Detail */}
          {selectedCell && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-sky-300 dark:border-sky-800/60 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-sky-600 text-white font-bold font-mono text-sm flex items-center justify-center">
                    {selectedCell.likelihood}{selectedCell.severity}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Detail Sel Matriks: Likelihood {selectedCell.likelihood} &times; Severity {selectedCell.severity}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Skor Baku: <strong className="font-mono text-slate-900 dark:text-white">{WHMP_RISK_MATRIX[selectedCell.likelihood][selectedCell.severity].score}</strong> &bull; 
                      Kategori: <strong className="text-slate-900 dark:text-white">{WHMP_RISK_MATRIX[selectedCell.likelihood][selectedCell.severity].tier}</strong>
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${WHMP_RISK_MATRIX[selectedCell.likelihood][selectedCell.severity].colorCode.badgeBg}`}>
                  {WHMP_RISK_MATRIX[selectedCell.likelihood][selectedCell.severity].tier}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="font-bold text-slate-600 dark:text-slate-300 block uppercase tracking-wider text-[10px]">
                    Frekuensi Teramati (Likelihood {selectedCell.likelihood})
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold">{WHMP_LIKELIHOOD_SCALE[selectedCell.likelihood].labelId}</p>
                  <p className="text-[11px] text-slate-500">{WHMP_LIKELIHOOD_SCALE[selectedCell.likelihood].labelEn}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="font-bold text-slate-600 dark:text-slate-300 block uppercase tracking-wider text-[10px]">
                    Dampak Pesawat (Severity {selectedCell.severity})
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold">{WHMP_SEVERITY_SCALE[selectedCell.severity].labelId}</p>
                  <p className="text-[11px] text-slate-500">{WHMP_SEVERITY_SCALE[selectedCell.severity].criteriaAircraft}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="font-bold text-slate-600 dark:text-slate-300 block uppercase tracking-wider text-[10px]">
                    Tindakan Mitigasi Standar WHMP
                  </span>
                  <p className="text-slate-800 dark:text-slate-200 font-semibold leading-relaxed">
                    {WHMP_RISK_MATRIX[selectedCell.likelihood][selectedCell.severity].actionRequired}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: ZONASI WILAYAH 1-6 */}
      {activeSubTab === 'zones' && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Ketentuan Zonasi Peta WHMP (Bandara Soekarno-Hatta)</p>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                Berdasarkan WHMP Dokumen Bab II, <strong>Zona 1, 2, dan 3 berstatus KRITIS (Critical Operational Zones)</strong> karena mencakup landasan pacu aktif, rapid exit taxiway, dan koridor pendekat/lepas landas pesawat di bawah 500 kaki. Setiap laporan patroli, perjumpaan, atau strike di zona ini diprioritaskan dalam evaluasi keselamatan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {WHMP_ZONES.map((zone) => {
              const countInfo = zoneStats[zone.id] || { patrols: 0, occurrences: 0, strikes: 0 };

              return (
                <div
                  key={zone.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl p-4.5 border transition-all ${
                    zone.isCritical 
                      ? 'border-rose-300 dark:border-rose-900/60 shadow-xs' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center font-mono text-sm ${
                        zone.isCritical ? 'bg-rose-600 text-white' : 'bg-slate-700 text-white'
                      }`}>
                        Z{zone.zoneNumber}
                      </span>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                          {zone.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">{zone.code}</span>
                      </div>
                    </div>

                    {zone.isCritical ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1 shrink-0 animate-pulse">
                        <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                        <span>CRITICAL</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                        Non-Kritis
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3 min-h-[48px]">
                    {zone.description}
                  </p>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 text-[11px]">Aktivitas Laporan:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sky-600" title="Patroli">{countInfo.patrols}P</span>
                      <span className="text-amber-600" title="Occurrences">{countInfo.occurrences}O</span>
                      <span className="text-rose-600 font-bold" title="Strikes">{countInfo.strikes}S</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: ALUR USULAN SPESIES BARU */}
      {activeSubTab === 'proposed' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Daftar Usulan Spesies di Luar 60 Katalog WHMP
              </h3>
              <p className="text-xs text-slate-500">
                Mencakup burung non-katalog, mamalia (anjing liar, musang, codot), reptil (biawak, ular), dan satwa liar lainnya yang teramati di airside.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsProposedModalOpen(true)}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Usulkan Satwa Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {proposedSpeciesList.map((item) => (
              <div 
                key={item.id}
                className="bg-white dark:bg-slate-900 rounded-2xl p-4.5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {item.common_name_id}
                      </h4>
                      <span className="text-xs text-slate-400">({item.common_name_en})</span>
                    </div>
                    <p className="text-xs font-mono italic text-sky-600 dark:text-sky-400">
                      {item.proposed_latin_name}
                    </p>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                    item.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border-rose-300' :
                    item.status === 'UNDER_REVIEW' ? 'bg-purple-50 text-purple-700 border-purple-300' :
                    'bg-amber-50 text-amber-700 border-amber-300'
                  }`}>
                    {item.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Kelompok:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.group}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Severity Usulan:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Level {item.proposed_severity}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Perkiraan Likelihood:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">Level {item.estimated_likelihood}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Teramati Pertama:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{item.first_observed_date}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>Justifikasi:</strong> {item.severity_justification}
                </p>

                {item.first_observed_location_desc && (
                  <p className="text-[11px] text-slate-500">
                    <strong>Lokasi:</strong> {item.first_observed_location_desc}
                  </p>
                )}

                <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Diusulkan: {item.proposed_by_name}</span>
                  
                  {/* Supervisor Action buttons */}
                  {item.status === 'PROPOSED' && canEditRiskRules && (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleReviewProposedSpecies(item.id, 'APPROVE')}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Setujui</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReviewProposedSpecies(item.id, 'REJECT')}
                        className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        <span>Tolak</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: AJUKAN SPESIES BARU */}
      {isProposedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-4.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Usulkan Spesies Satwa Baru</h3>
                  <p className="text-[11px] text-slate-400">Spesies di Luar 60 Katalog WHMP Chapter II</p>
                </div>
              </div>
              <button
                onClick={() => setIsProposedModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProposedSpecies} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Indonesia:
                  </label>
                  <input
                    type="text"
                    required
                    value={newCommonId}
                    onChange={(e) => setNewCommonId(e.target.value)}
                    placeholder="Contoh: Musang Rase"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Inggris:
                  </label>
                  <input
                    type="text"
                    value={newCommonEn}
                    onChange={(e) => setNewCommonEn(e.target.value)}
                    placeholder="Contoh: Small Indian Civet"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Latin Ilmiah:
                  </label>
                  <input
                    type="text"
                    required
                    value={newLatin}
                    onChange={(e) => setNewLatin(e.target.value)}
                    placeholder="Contoh: Viverricula indica"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono italic outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kelompok Satwa:
                  </label>
                  <select
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Burung (Aves)">Burung (Aves)</option>
                    <option value="Mamalia">Mamalia (Anjing, Kucing, Musang, dll)</option>
                    <option value="Reptil">Reptil (Biawak, Ular, dll)</option>
                    <option value="Amfibi">Amfibi</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Usulan Severity (1..5):
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(Number(e.target.value) as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value={1}>Level 1: Sangat Rendah (Negligible)</option>
                    <option value={2}>Level 2: Rendah (Minor)</option>
                    <option value={3}>Level 3: Sedang (Moderate)</option>
                    <option value={4}>Level 4: Tinggi (Major Damage)</option>
                    <option value={5}>Level 5: Sangat Tinggi (Catastrophic)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Perkiraan Likelihood (A..E):
                  </label>
                  <select
                    value={newLikelihood}
                    onChange={(e) => setNewLikelihood(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="A">Level A: Sangat Sangat Jarang (&lt; 5 hari)</option>
                    <option value="B">Level B: Sangat Jarang (5-20 hari)</option>
                    <option value="C">Level C: Jarang / Sedang (20-50 hari)</option>
                    <option value="D">Level D: Sering (50-100 hari)</option>
                    <option value="E">Level E: Sangat Besar (&gt; 100 hari)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Justifikasi Keparahan &amp; Alasan Bahaya:
                </label>
                <textarea
                  rows={2}
                  required
                  value={newJustification}
                  onChange={(e) => setNewJustification(e.target.value)}
                  placeholder="Jelaskan estimasi bobot satwa, perilaku bergerombol, atau risiko terhadap pesawat udara..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Zona Teramati Pertama:
                  </label>
                  <select
                    value={newZoneId}
                    onChange={(e) => setNewZoneId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    {WHMP_ZONES.map(z => (
                      <option key={z.id} value={z.id}>
                        {z.name} {z.isCritical ? '⚠️ (KRITIS)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Deskripsi Lokasi / Grid:
                  </label>
                  <input
                    type="text"
                    value={newLocationDesc}
                    onChange={(e) => setNewLocationDesc(e.target.value)}
                    placeholder="Contoh: Taxiway South C5"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProposedModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition shadow-xs cursor-pointer"
                >
                  Kirimkan Usulan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REVIEW TAKSONOMI SPESIES */}
      {isTaxonomyModalOpen && selectedSpeciesForTaxonomy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white p-4.5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-white">Verifikasi Taksonomi Spesies</h3>
                <p className="text-[11px] text-slate-400">{selectedSpeciesForTaxonomy.common_name_id}</p>
              </div>
              <button
                onClick={() => setIsTaxonomyModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1 font-mono">
                <span className="text-[10px] text-slate-400 uppercase block">Nama Tertulis di WHMP:</span>
                <span className="font-bold italic text-slate-800 dark:text-slate-200">
                  {selectedSpeciesForTaxonomy.latin_name_as_written}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Latin Terverifikasi (Koreksi):
                </label>
                <input
                  type="text"
                  value={taxonomyCorrectedName}
                  onChange={(e) => setTaxonomyCorrectedName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono italic outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Status Verifikasi:
                </label>
                <select
                  value={taxonomyStatusChoice}
                  onChange={(e) => setTaxonomyStatusChoice(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                >
                  <option value="Verified">Verified (Terverifikasi Taksonomi)</option>
                  <option value="Needs taxonomic review">Needs taxonomic review (Perlu Review)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Referensi Taksonomi (IOC / Burung Indonesia):
                </label>
                <textarea
                  rows={2}
                  value={taxonomyNotes}
                  onChange={(e) => setTaxonomyNotes(e.target.value)}
                  placeholder="Contoh: Direvisi berdasarkan IOC World Bird List v13.2..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsTaxonomyModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveTaxonomy}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition shadow-xs cursor-pointer"
                >
                  Simpan Status
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PENGESAHAN AMBANG BATAS THRESHOLD */}
      {isApproveThresholdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
            <div className="bg-slate-900 text-white p-4.5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-white">Pengesahan Ambang Batas Risiko</h3>
                <p className="text-[11px] text-slate-400">Persetujuan Otoritas WHMS Hazard Management</p>
              </div>
              <button
                onClick={() => setIsApproveThresholdModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-amber-900 dark:text-amber-200">
                <p className="font-bold">Konfirmasi Pengesahan Ambang Batas</p>
                <p className="text-[11px] mt-0.5 leading-relaxed">
                  Tindakan ini akan mengubah status ambang batas dari <strong>PLACEHOLDER</strong> menjadi <strong>RESMI (APPROVED)</strong>, mengesahkan pembagian frekuensi hari teramati dan strike tahunan untuk dasar revisi dokumen WHMP.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Catatan Pengesahan / Berita Acara:
                </label>
                <textarea
                  rows={3}
                  value={thresholdApprovalRemarks}
                  onChange={(e) => setThresholdApprovalRemarks(e.target.value)}
                  placeholder="Contoh: Disetujui oleh Kepala Unit WHU CGK untuk evaluasi kuartal II 2026..."
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsApproveThresholdModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleApproveThresholds}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sahkan Sekarang</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
