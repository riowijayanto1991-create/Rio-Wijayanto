import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  RefreshCw, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Radio, 
  Layers, 
  Share2, 
  Copy, 
  Check, 
  Send, 
  Info,
  Calendar,
  Flame,
  ArrowRight
} from 'lucide-react';
import { 
  GeminiTrendAnalysis, 
  PatrolReport, 
  OccurrenceReport, 
  WildlifeStrikeReport 
} from '../types';
import { fetchGeminiTrendAnalysis } from '../utils/geminiAiService';

interface GeminiWildlifeAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patrols: PatrolReport[];
  occurrences: OccurrenceReport[];
  strikes: WildlifeStrikeReport[];
  currentAnalysis: GeminiTrendAnalysis | null;
  onAnalysisUpdated: (analysis: GeminiTrendAnalysis) => void;
  onOpenBroadcast?: (text: string) => void;
}

export const GeminiWildlifeAnalyticsModal: React.FC<GeminiWildlifeAnalyticsModalProps> = ({
  isOpen,
  onClose,
  patrols,
  occurrences,
  strikes,
  currentAnalysis,
  onAnalysisUpdated,
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [customQuery, setCustomQuery] = useState<string>('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'ALL' | 'HABITAT' | 'TAKTIK_PENGUSIRAN' | 'OPERASIONAL_ATC' | 'MONITORING'>('ALL');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunAnalysis = async (focusQueryOverride?: string) => {
    setIsLoading(true);
    try {
      const queryToUse = focusQueryOverride !== undefined ? focusQueryOverride : customQuery;
      const res = await fetchGeminiTrendAnalysis({
        patrols,
        occurrences,
        strikes,
        customFocusQuery: queryToUse,
        airportCode: 'CGK',
      });
      onAnalysisUpdated(res);
    } catch (err) {
      console.error('Failed to run Gemini analysis:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'KRITIS':
        return {
          bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          dot: 'bg-rose-500',
          label: 'TINGKAT RISIKO KRITIS',
        };
      case 'TINGGI':
        return {
          bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          dot: 'bg-amber-500',
          label: 'TINGKAT RISIKO TINGGI',
        };
      case 'SEDANG':
        return {
          bg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
          dot: 'bg-sky-500',
          label: 'TINGKAT RISIKO SEDANG',
        };
      default:
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          dot: 'bg-emerald-500',
          label: 'TINGKAT RISIKO RENDAH',
        };
    }
  };

  const filteredMitigations = currentAnalysis?.mitigationRecommendations.filter(m => {
    if (activeCategoryFilter === 'ALL') return true;
    return m.category === activeCategoryFilter;
  }) || [];

  const presets = [
    { label: 'Analisis Komprehensif (ICAO Doc 9137)', query: '' },
    { label: 'Fokus Titik Rawan Runway & Hotspot', query: 'Fokuskan analisis pada hotspot koridor runway, threshold take-off, dan saluran air.' },
    { label: 'Pola Temporal Fajar/Senja', query: 'Analisis korelasi jam fajar (05:30-08:00) dan senja terhadap pergerakan kawanan burung.' },
    { label: 'Manajemen Habitat & Rumput KP 434', query: 'Rumuskan rekomendasi pemotongan rumput dan eliminasi genangan air menurut regulasi KP 434.' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  AI GEMINI 3.8 FLASH ANALYTICS
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  ICAO Doc 9137 Part 3 &amp; KP 434
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                Analisis Tren &amp; Rekomendasi Mitigasi Wildlife Hazard
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action / Trigger Bar */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 shrink-0 space-y-3">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Presets:
            </span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCustomQuery(p.query);
                  handleRunAnalysis(p.query);
                }}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer disabled:opacity-50"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Query Input + Run Button */}
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Ajukan pertanyaan khusus ke Gemini (cth: 'Bagaimana tren satwa di Runway 07R saat musim hujan?')..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRunAnalysis();
                }}
              />
            </div>
            <button
              type="button"
              onClick={() => handleRunAnalysis()}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Menganalisis Pola...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-sky-200" />
                  <span>Jalankan Analisis Gemini</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 animate-pulse">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Memproses Data Historis dengan Gemini 3.8 Flash...</h3>
              <p className="text-xs text-slate-400 max-w-md">
                Mengevaluasi {patrols.length} laporan patroli, {occurrences.length} occurrence, dan {strikes.length} insiden strike untuk mengidentifikasi pola tersembunyi dan rekomendasi mitigasi ICAO Doc 9137.
              </p>
            </div>
          )}

          {!isLoading && !currentAnalysis && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                <Sparkles className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Belum Ada Analisis Terkini</h3>
                <p className="text-xs text-slate-400 max-w-md mt-1">
                  Klik tombol <strong>"Jalankan Analisis Gemini"</strong> di atas untuk memproses data historis laporan bandara dan menghasilkan pola kejadian serta rekomendasi mitigasi otomatis.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRunAnalysis()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-2 cursor-pointer shadow"
              >
                <Sparkles className="w-4 h-4" />
                <span>Mulai Analisis Sekarang</span>
              </button>
            </div>
          )}

          {!isLoading && currentAnalysis && (
            <div className="space-y-6">
              {/* Executive Overview & Risk Score Banner */}
              {(() => {
                const badge = getRiskBadge(currentAnalysis.overallRiskLevel);
                return (
                  <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-4">
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${badge.bg}`}>
                          <span className={`w-2 h-2 rounded-full ${badge.dot} animate-ping`} />
                          <span>{badge.label}</span>
                        </div>
                        <span className="text-xs text-slate-400">
                          Skor Indeks Risiko: <strong className="text-white font-mono text-sm">{currentAnalysis.riskScore}</strong> / 100
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Dibuat: {new Date(currentAnalysis.generatedAt).toLocaleString('id-ID')}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 text-[10px] font-mono">
                          {currentAnalysis.modelUsed}
                        </span>
                      </div>
                    </div>

                    {/* Executive Summary */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-indigo-400" />
                        Ringkasan Eksekutif Keselamatan Sisi Udara
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                        {currentAnalysis.executiveSummary}
                      </p>
                    </div>

                    {/* Analyzed Scope Quick Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Patroli Dievaluasi</span>
                        <div className="text-sm font-bold text-white mt-0.5">{currentAnalysis.dataAnalyzed.totalPatrols} Laporan</div>
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Laporan Occurrence</span>
                        <div className="text-sm font-bold text-amber-400 mt-0.5">{currentAnalysis.dataAnalyzed.totalOccurrences} Kejadian</div>
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Wildlife Strike</span>
                        <div className="text-sm font-bold text-rose-400 mt-0.5">{currentAnalysis.dataAnalyzed.totalStrikes} Insiden</div>
                      </div>
                      <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Populasi Teramati</span>
                        <div className="text-sm font-bold text-sky-400 mt-0.5">{currentAnalysis.dataAnalyzed.totalWildlifeObserved} Ekor</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Identified Patterns Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>Pola Bahaya &amp; Karakteristik Terdeteksi (Pattern Recognition)</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    {currentAnalysis.identifiedPatterns.length} Pola Teridentifikasi
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {currentAnalysis.identifiedPatterns.map((pat) => {
                    const sevColor =
                      pat.severity === 'CRITICAL'
                        ? 'border-rose-500/40 bg-rose-950/20 text-rose-300'
                        : pat.severity === 'HIGH'
                        ? 'border-amber-500/40 bg-amber-950/20 text-amber-300'
                        : 'border-sky-500/40 bg-sky-950/20 text-sky-300';

                    return (
                      <div
                        key={pat.id}
                        className={`p-4 rounded-xl border ${sevColor} flex flex-col justify-between space-y-2`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/40 border border-white/10 text-white">
                              {pat.category.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-mono font-bold uppercase">
                              {pat.severity}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-white leading-snug">
                            {pat.patternTitle}
                          </h4>
                          <p className="text-[11px] text-slate-300 leading-relaxed">
                            {pat.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-white/10 space-y-1 text-[10px]">
                          <div className="text-slate-400">
                            <strong>Bukti Data:</strong> {pat.evidenceData}
                          </div>
                          <div className="text-sky-300 font-semibold flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>{pat.affectedRunwayOrZone}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hotspot Alerts Box */}
              {currentAnalysis.hotspotAlerts && currentAnalysis.hotspotAlerts.length > 0 && (
                <div className="bg-slate-800/70 border border-slate-700/80 rounded-2xl p-4 space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Titik Rawan Hotspot &amp; Rekomendasi Frekuensi Patroli
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentAnalysis.hotspotAlerts.map((spot, idx) => (
                      <div key={idx} className="bg-slate-900/90 p-3 rounded-xl border border-slate-700/80 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-rose-400" />
                            {spot.locationName}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-sky-300 border border-slate-700">
                            Grid {spot.gridCode}
                          </span>
                        </div>
                        <p className="text-slate-300 text-[11px]">
                          <strong>Faktor Risiko:</strong> {spot.riskFactor}
                        </p>
                        <p className="text-slate-300 text-[11px]">
                          <strong>Spesies Dominan:</strong> {spot.dominantSpecies}
                        </p>
                        <p className="text-emerald-400 font-medium text-[11px] pt-1">
                          ↳ Rekomendasi Patroli: {spot.recommendedPatrolFrequency}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Automatic Mitigation Recommendations Matrix */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Matriks Rekomendasi Mitigasi Otomatis (Action Plan)</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Rekomendasi tindakan mitigasi teknis dan operasional yang dihasilkan otomatis sesuai regulasi ICAO.
                    </p>
                  </div>

                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    {(['ALL', 'HABITAT', 'TAKTIK_PENGUSIRAN', 'OPERASIONAL_ATC', 'MONITORING'] as const).map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setActiveCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition cursor-pointer ${
                          activeCategoryFilter === cat
                            ? 'bg-indigo-600 text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat === 'ALL' ? 'Semua' : cat.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredMitigations.map((mit) => {
                    const urgencyBg =
                      mit.urgency === 'SEGERA'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : mit.urgency === 'JANGKA_PENDEK'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-sky-500/20 text-sky-300 border-sky-500/30';

                    return (
                      <div
                        key={mit.id}
                        className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3 hover:border-slate-600 transition"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-2.5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${urgencyBg}`}>
                                {mit.urgency}
                              </span>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {mit.category.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                • {mit.regulatoryRef}
                              </span>
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-white mt-1">
                              {mit.title}
                            </h4>
                          </div>

                          <div className="text-xs text-slate-400 self-end sm:self-center">
                            Penanggung Jawab: <strong className="text-slate-200">{mit.responsibleUnit}</strong>
                          </div>
                        </div>

                        {/* Action Steps List */}
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                            Langkah Tindakan Konkret:
                          </span>
                          <ul className="space-y-1 text-xs text-slate-200 pl-1">
                            {mit.actionSteps.map((step, sIdx) => (
                              <li key={sIdx} className="flex items-start gap-2">
                                <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Expected Impact */}
                        <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 text-[11px] text-emerald-300 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span><strong>Ekspektasi Dampak:</strong> {mit.expectedImpact}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* NOTAM Advisory Card */}
              {currentAnalysis.notamAdvisory && (
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 rounded-2xl border border-indigo-900/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
                      <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-200">
                        Draf Rekomendasi NOTAM Wildlife Hazard (Aeronautical Information Service)
                      </h4>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      currentAnalysis.notamAdvisory.recommended ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {currentAnalysis.notamAdvisory.recommended ? 'DIREKOMENDASIKAN TERBIT' : 'OPSIONAL'}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-xs text-amber-300 select-all">
                    {currentAnalysis.notamAdvisory.proposedText || 'Tidak ada draft NOTAM spesifik yang diusulkan.'}
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
                    <span>Target Runway: <strong className="text-white">{currentAnalysis.notamAdvisory.targetRunway}</strong> | Masa Berlaku: {currentAnalysis.notamAdvisory.validitySuggestion}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(currentAnalysis.notamAdvisory.proposedText, 'notam')}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === 'notam' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'notam' ? 'Tersalin' : 'Salin Teks NOTAM'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Projected Trend Next 30 Days */}
              {currentAnalysis.projectedTrendNext30Days && (
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-sky-400" />
                    Proyeksi Tren &amp; Prakiraan Dinamika Satwa 30 Hari Ke Depan
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {currentAnalysis.projectedTrendNext30Days}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 text-center sm:text-left">
            <span>Sistem Pelaporan WHMS • Terintegrasi Server-Side Gemini 3.8 Flash SDK</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {currentAnalysis && (
              <button
                type="button"
                onClick={() => {
                  const summaryText = `*LAPORAN ANALISIS TREN WILDLIFE HAZARD (GEMINI AI)*\n` +
                    `Status Risiko: ${currentAnalysis.overallRiskLevel} (Skor: ${currentAnalysis.riskScore}/100)\n` +
                    `Waktu Analisis: ${new Date(currentAnalysis.generatedAt).toLocaleString('id-ID')}\n\n` +
                    `*Ringkasan:* ${currentAnalysis.executiveSummary}\n\n` +
                    `*Rekomendasi Utama:*\n` +
                    currentAnalysis.mitigationRecommendations.slice(0, 3).map((m, i) => `${i + 1}. [${m.category}] ${m.title} (${m.urgency})`).join('\n') +
                    `\n\n_Generated by WHMS PT Angkasa Pura Indonesia_`;
                  handleCopyText(summaryText, 'all');
                }}
                className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedKey === 'all' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey === 'all' ? 'Tersalin' : 'Salin Ringkasan Briefing'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
