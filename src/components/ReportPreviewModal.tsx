import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  FileSpreadsheet, 
  Share2, 
  Printer, 
  CheckCircle2, 
  FileText,
  Edit3,
  Camera,
  Maximize2,
  PenTool,
  ShieldCheck,
  QrCode,
  Bookmark
} from 'lucide-react';
import { 
  PatrolReport, 
  OccurrenceReport, 
  WildlifeStrikeReport, 
  VehicleCheckReport, 
  OfficerDigitalSignature, 
  ReportSignatures 
} from '../types';
import { exportPatrolPDF, exportOccurrencePDF, exportStrikePDF, exportVehiclePDF } from '../utils/pdfExport';
import { exportSinglePatrolToExcel } from '../utils/excelExport';
import { formatReportCreationTime } from '../utils/reportNumberGenerator';
import { 
  getSoekarnoHattaLogoDataUrl, 
  getAirsideSafetySealDataUrl, 
  getQrCodeDataUrl, 
  generateRealisticSignatureDataUrl 
} from '../utils/airportAssets';
import { lookupPersonnelNip } from '../utils/personnelHelper';
import { DigitalSignatureModal } from './DigitalSignatureModal';

interface PhotoPreviewGalleryProps {
  title?: string;
  fotos?: string[];
  keterangan?: string;
  onSelectPhoto: (photoUrl: string) => void;
}

const PhotoPreviewGallery: React.FC<PhotoPreviewGalleryProps> = ({
  title,
  fotos,
  keterangan,
  onSelectPhoto
}) => {
  const validPhotos = (fotos || []).filter(p => typeof p === 'string' && p.trim().length > 0);
  const hasPhotos = validPhotos.length > 0;
  const hasKeterangan = !!(keterangan && keterangan.trim().length > 0);

  if (!hasPhotos && !hasKeterangan) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {hasKeterangan && (
        <div className="bg-slate-50 border border-slate-200 rounded p-2.5 text-xs text-slate-800">
          <p className="font-semibold text-slate-700 text-[11px] mb-0.5 uppercase tracking-wide">
            Keterangan / Catatan Dokumentasi:
          </p>
          <p className="whitespace-pre-line text-slate-700">{keterangan}</p>
        </div>
      )}

      {hasPhotos && (
        <div className="mt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-sky-600" />
              {title || 'Dokumentasi Foto Lapangan'}
            </span>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              {validPhotos.length} Foto Terlampir (Maks. 5)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {validPhotos.map((photo, index) => (
              <div
                key={index}
                onClick={() => onSelectPhoto(photo)}
                className="group relative rounded-lg overflow-hidden border border-slate-200 hover:border-sky-500 bg-slate-900 cursor-pointer transition-all shadow-xs hover:shadow-md aspect-4/3 flex items-center justify-center"
              >
                <img
                  src={photo}
                  alt={`Dokumentasi ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[10px] font-bold text-white truncate drop-shadow-sm flex items-center justify-between">
                  <span>Foto {index + 1}</span>
                  <Maximize2 className="w-3 h-3 text-sky-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-1 italic no-print">
            * Klik foto untuk melihat ukuran penuh (Lightbox). Foto otomatis dicetak dan dilampirkan pada ekspor PDF resmi.
          </p>
        </div>
      )}
    </div>
  );
};

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'patrol' | 'occurrence' | 'strike' | 'vehicle';
  reportData: PatrolReport | OccurrenceReport | WildlifeStrikeReport | VehicleCheckReport | null;
  onOpenBroadcast: (type: 'PATROL' | 'OCCURRENCE' | 'STRIKE' | 'VEHICLE', report: any) => void;
  onEditReport?: (type: 'patrol' | 'occurrence' | 'strike' | 'vehicle', report: any) => void;
  onSaveReportSignature?: (type: 'patrol' | 'occurrence' | 'strike' | 'vehicle', reportId: string, roleKey: 'officer' | 'receiver' | 'supervisor', signature: OfficerDigitalSignature) => void;
  sequentialDocNumber?: string;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  reportType,
  reportData,
  onOpenBroadcast,
  onEditReport,
  onSaveReportSignature,
  sequentialDocNumber
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [isSigModalOpen, setIsSigModalOpen] = useState<boolean>(false);
  const [activeSigRole, setActiveSigRole] = useState<'officer' | 'receiver' | 'supervisor'>('officer');
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const [sealDataUrl, setSealDataUrl] = useState<string>('');
  const [qrCodeUrls, setQrCodeUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setLogoDataUrl(getSoekarnoHattaLogoDataUrl());
      setSealDataUrl(getAirsideSafetySealDataUrl());
    }
  }, [isOpen]);

  const activeDocNum = (reportData && (sequentialDocNumber || reportData.reportNumber)) || 'WHU-DOC';

  useEffect(() => {
    if (!isOpen || !reportData) return;
    let isMounted = true;
    const loadQrs = async () => {
      const qrMap: Record<string, string> = {};
      const supName = reportData.signatures?.supervisor?.signerName || 'RACHMADITYA';
      const supNipp = reportData.signatures?.supervisor?.signerNipp || lookupPersonnelNip(supName, 'supervisor');
      const supPayload = `PT ANGKASA PURA INDONESIA\nVERIFIKASI SAH WHMS\nDoc: ${activeDocNum}\nSupervisor: ${supName}\nNIP: ${supNipp}\nStandard: ICAO Annex 14 / Doc 9137`;
      const supUrl = await getQrCodeDataUrl(supPayload);
      if (supUrl) qrMap['supervisor'] = supUrl;

      const offRaw = Array.isArray((reportData as any).pod) ? (reportData as any).pod[0] : (reportData as any).pod;
      const offName = reportData.signatures?.officer?.signerName || offRaw || 'RIO WIJAYANTO';
      const offNipp = reportData.signatures?.officer?.signerNipp || lookupPersonnelNip(offName, 'officer');
      const offPayload = `PT ANGKASA PURA INDONESIA\nPELAPOR WHMS RESMI\nDoc: ${activeDocNum}\nOfficer: ${offName}\nNIP: ${offNipp}\nUnit: ARFF & Safety WHU`;
      const offUrl = await getQrCodeDataUrl(offPayload);
      if (offUrl) qrMap['officer'] = offUrl;

      if (isMounted) {
        setQrCodeUrls(qrMap);
      }
    };
    loadQrs();
    return () => { isMounted = false; };
  }, [isOpen, reportData, activeDocNum]);

  if (!isOpen || !reportData) return null;

  const handleDownloadPDF = () => {
    if (reportType === 'strike') exportStrikePDF(reportData as WildlifeStrikeReport, activeDocNum, reportData.createdAt);
    else if (reportType === 'occurrence') exportOccurrencePDF(reportData as OccurrenceReport, activeDocNum, reportData.createdAt);
    else if (reportType === 'vehicle') exportVehiclePDF(reportData as VehicleCheckReport, activeDocNum, reportData.createdAt);
    else exportPatrolPDF(reportData as PatrolReport, activeDocNum, reportData.createdAt);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    if (reportType === 'patrol') {
      exportSinglePatrolToExcel(reportData as PatrolReport);
    }
  };

  const handleOpenSignature = (role: 'officer' | 'receiver' | 'supervisor') => {
    setActiveSigRole(role);
    setIsSigModalOpen(true);
  };

  const handleSaveSignature = (roleKey: 'officer' | 'receiver' | 'supervisor', sig: OfficerDigitalSignature) => {
    if (onSaveReportSignature && reportData) {
      onSaveReportSignature(reportType, reportData.id, roleKey, sig);
    }
  };

  const hasAnySignature = !!(reportData.signatures?.officer || reportData.signatures?.supervisor || reportData.signatures?.receiver);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Print Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report-document, #printable-report-document * {
            visibility: visible;
          }
          #printable-report-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 8mm 12mm;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Action Bar */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 no-print">
          <div className="flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-sky-400" />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-sky-400 font-mono font-semibold">PRATINJAU DOKUMEN RESMI</p>
                {reportData.isDraft && (
                  <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black flex items-center gap-1 uppercase tracking-wider shadow-xs">
                    <Bookmark className="w-2.5 h-2.5 fill-current" />
                    DRAFT SEMENTARA
                  </span>
                )}
                {hasAnySignature && !reportData.isDraft && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Terverifikasi Digital
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base text-white font-mono">{activeDocNum}</h3>
                {reportData.createdAt && (
                  <span className="text-[10px] text-slate-300 font-sans bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    Dibuat: {formatReportCreationTime(reportData.createdAt)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onSaveReportSignature && (
              <button
                onClick={() => handleOpenSignature('officer')}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Bubuhkan tanda tangan digital petugas / verifikator"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Tanda Tangan Digital</span>
              </button>
            )}

            {onEditReport && (
              <button
                onClick={() => {
                  onClose();
                  onEditReport(reportType, reportData);
                }}
                className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs ${
                  reportData.isDraft
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
                title={reportData.isDraft ? 'Lanjutkan pengisian draft dan terbitkan laporan ini' : 'Buka form untuk mengedit laporan ini'}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{reportData.isDraft ? 'Lanjutkan Draft' : 'Edit Laporan'}</span>
              </button>
            )}

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              title="Cetak format cetak resmi (Print A4)"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Cetak</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Unduh file PDF resmi PT Angkasa Pura Indonesia"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{reportType === 'vehicle' ? 'Unduh Bukti PDF Pimpinan' : 'Unduh PDF'}</span>
            </button>

            {reportType === 'patrol' && (
              <button
                onClick={handleDownloadExcel}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Excel</span>
              </button>
            )}

            <button
              onClick={() => onOpenBroadcast(reportType.toUpperCase() as any, reportData)}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              title="Kirim ringkasan laporan ke WhatsApp Group Pimpinan"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{reportType === 'vehicle' ? 'Laporan WAG Pimpinan' : 'Broadcast WA'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Draft Notice Banner */}
        {reportData.isDraft && (
          <div className="bg-amber-400 text-slate-950 px-4 py-2.5 font-medium text-xs flex flex-wrap items-center justify-between gap-3 shadow-md border-b border-amber-500 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-slate-950 text-amber-400 rounded-md shrink-0">
                <Bookmark className="w-4 h-4 fill-current" />
              </div>
              <div>
                <span className="font-extrabold uppercase tracking-wide">
                  STATUS DOKUMEN: DRAFT SEMENTARA
                </span>
                <span className="text-slate-800 ml-2">
                  {reportData.draftSavedAt ? `(Tersimpan: ${new Date(reportData.draftSavedAt).toLocaleString('id-ID')}) — ` : '— '}
                  Dokumen ini belum diterbitkan sebagai laporan resmi operasional.
                </span>
              </div>
            </div>

            {onEditReport && (
              <button
                onClick={() => {
                  onClose();
                  onEditReport(reportType, reportData);
                }}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs ml-auto"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Lanjutkan &amp; Terbitkan Laporan</span>
              </button>
            )}
          </div>
        )}

        {/* Modal Document Body (Rendered as paper document layout) */}
        <div className="p-6 sm:p-10 overflow-y-auto flex-1 bg-slate-50 font-sans text-slate-900 text-xs">
          <div id="printable-report-document" className="max-w-3xl mx-auto bg-white p-8 sm:p-12 shadow-md border border-slate-300 space-y-6">
            {/* Draft Watermark Banner on Printable Document */}
            {reportData.isDraft && (
              <div className="bg-amber-50 border-2 border-dashed border-amber-400 text-amber-950 p-2.5 rounded-lg text-center font-black text-xs uppercase tracking-widest shadow-xs">
                *** DOKUMEN DRAFT SEMENTARA — BELUM DISAHKAN SECARA RESMI ***
              </div>
            )}

            {/* Header Kop Surat Formal PT Angkasa Pura Indonesia */}
            <div className="border-b-2 border-slate-900 pb-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                {/* Logo Kiri Soekarno-Hatta International Airport by InJourney Airports */}
                <div className="shrink-0">
                  {logoDataUrl ? (
                    <img 
                      src={logoDataUrl} 
                      alt="Soekarno-Hatta International Airport" 
                      className="h-13 w-auto object-contain"
                    />
                  ) : (
                    <div className="h-10 w-28 bg-slate-900 text-white font-bold text-xs flex items-center justify-center rounded">
                      SOEKARNO-HATTA
                    </div>
                  )}
                </div>

                {/* Teks Kop Surat Tengah */}
                <div className="text-center flex-1">
                  <h1 className="text-sm sm:text-base font-black tracking-wider text-slate-900 uppercase">
                    PT ANGKASA PURA INDONESIA
                  </h1>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-800 uppercase tracking-wide">
                    AIRPORT RESCUE &amp; FIRE FIGHTING DIVISION
                  </p>
                  <p className="text-[10px] sm:text-[11px] font-bold text-sky-900 uppercase tracking-wider">
                    WILDLIFE HAZARD MANAGEMENT UNIT (WHU)
                  </p>
                  <p className="text-[8.5px] sm:text-[9px] text-slate-500 mt-0.5 tracking-tight font-medium">
                    STANDAR OPERASIONAL: ICAO ANNEX 14 • DOC 9137 PART 3 • KP 434 DIRJEN HUBUD
                  </p>
                </div>

                {/* Crest Lambang Kanan */}
                <div className="shrink-0">
                  {sealDataUrl ? (
                    <img 
                      src={sealDataUrl} 
                      alt="Airside Safety Crest" 
                      className="h-13 w-13 object-contain"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full border border-sky-600 flex items-center justify-center text-[8px] font-bold text-sky-800">
                      SAFETY
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata Bar */}
              <div className="mt-2.5 pt-2 border-t border-slate-200 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-slate-600 font-mono">
                <span>No. Dokumen: <strong className="text-slate-900 font-mono font-bold">{activeDocNum}</strong></span>
                {reportData.createdAt && (
                  <>
                    <span>•</span>
                    <span>Waktu Dibuat: <strong className="text-slate-900 font-sans">{formatReportCreationTime(reportData.createdAt)}</strong></span>
                  </>
                )}
                <span>•</span>
                <span>Tanggal Cetak: <strong className="text-slate-900 font-sans">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></span>
                {reportType === 'vehicle' && (
                  <>
                    <span>•</span>
                    <span>Status: <strong className="text-emerald-700 font-sans">{(reportData as VehicleCheckReport).statusKelayakan}</strong></span>
                  </>
                )}
              </div>
            </div>

            {/* Document Content by Type */}
            {reportType === 'patrol' && (() => {
              const p = reportData as PatrolReport;
              return (
                <div className="space-y-5">
                  <div className="text-center">
                    <h2 className="text-sm sm:text-base font-black text-center uppercase tracking-wide text-slate-900">
                      1. WOR — WILDLIFE OBSERVATION REPORT
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Observasi dan pengumpulan data satwa liar • Unit Wildlife Hazard (WHS)
                    </p>
                  </div>

                  {/* I. DATA KEGIATAN */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">I. DATA KEGIATAN</h3>
                    <div className="grid grid-cols-2 gap-y-1.5 text-xs text-slate-700">
                      <div><strong className="text-slate-900">Hari / Tanggal:</strong> {p.hariTanggal}</div>
                      <div><strong className="text-slate-900">Waktu Patroli:</strong> {p.waktuPatroli}</div>
                      <div><strong className="text-slate-900">Pleton:</strong> {p.pleton}</div>
                      <div><strong className="text-slate-900">Durasi:</strong> {p.durasi}</div>
                      <div><strong className="text-slate-900">Dinas:</strong> {p.dinas}</div>
                      <div><strong className="text-slate-900">Cuaca / Suhu:</strong> {p.cuaca}, {p.suhu}</div>
                      <div className="col-span-2"><strong className="text-slate-900">Situasi Operasional:</strong> {p.situasiOperasional}</div>
                      <div className="col-span-2"><strong className="text-slate-900">POD (Person on Duty):</strong> {p.pod.join(', ')}</div>
                    </div>
                  </div>

                  {/* II. RUTE PATROLI */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">II. RUTE PATROLI &amp; GEOSPASIAL</h3>
                    <div className="space-y-1.5 text-xs text-slate-700 bg-slate-50 p-2.5 border border-slate-200 rounded">
                      <p><strong className="text-slate-900">Rute Patroli:</strong> {p.rutePatroli}</p>
                      {p.gridLocation && (
                        <p><strong className="text-slate-900">Sektor Grid Peta:</strong> <span className="font-mono font-bold text-sky-800">{p.gridLocation}</span></p>
                      )}
                      {p.coordinates && (
                        <div className="mt-1 pt-1.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                          <div>
                            <span className="text-slate-500">Koordinat GPS: </span>
                            <strong>Lat {p.coordinates.latitude.toFixed(5)}, Long {p.coordinates.longitude.toFixed(5)}</strong>
                            <span className="text-slate-500 ml-1.5">({p.coordinates.distanceFromArpKm.toFixed(2)} km dari ARP WIII)</span>
                          </div>
                          {p.coordinates.isWithinOperationalRadius ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-sans text-[10px]">
                              ✓ Dalam Radius Operasional ({p.coordinates.maxRadiusAllowedKm} km)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold font-sans text-[10px]">
                              ⚠️ Di Luar Radius Operasional (Batas: {p.coordinates.maxRadiusAllowedKm} km)
                            </span>
                          )}
                          {p.coordinates.confirmedOutsideReason && (
                            <div className="w-full text-[10px] text-amber-900 bg-amber-50 p-1.5 rounded border border-amber-200 font-sans">
                              <strong>Justifikasi Luar Perimeter:</strong> {p.coordinates.confirmedOutsideReason}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* III. TEMUAN SATWA LIAR */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">III. TEMUAN SATWA LIAR</h3>
                    <table className="w-full text-xs border border-slate-300">
                      <thead className="bg-slate-100 font-bold border-b border-slate-300">
                        <tr>
                          <th className="p-1.5 w-8 text-center">No</th>
                          <th className="p-1.5">Spesies / Satwa</th>
                          <th className="p-1.5 w-24 text-center">Jumlah</th>
                          <th className="p-1.5">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {p.temuanSatwa.map((s, idx) => (
                          <tr key={s.id}>
                            <td className="p-1.5 text-center font-mono">{idx + 1}</td>
                            <td className="p-1.5 font-medium">{s.spesies}</td>
                            <td className="p-1.5 text-center font-bold">{s.jumlah} ekor</td>
                            <td className="p-1.5 text-slate-600">{s.keterangan || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="font-bold text-slate-900 mt-1.5 text-right">
                      Total Populasi Teramati: {p.totalPopulasiTeramati} ekor
                    </p>
                  </div>

                  {/* IV. MONITORING HABITAT */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">IV. MONITORING HABITAT DAN VEGETASI</h3>
                    <div className="space-y-1 text-slate-700">
                      <p>1. Kondisi Vegetasi / Rumput : {p.kondisiVegetasi}</p>
                      <p>2. Kondisi Drainase / Genangan Air : {p.kondisiDrainase}</p>
                      <p>3. Potensi Wildlife Attractant : {p.potensiAttractant}</p>
                      <p>4. Habitat Management : {p.habitatManagement}</p>
                      <p>5. Area Perhatian : {p.areaPerhatian}</p>
                    </div>
                  </div>

                  {/* V. TINDAKAN PENGENDALIAN */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">V. TINDAKAN PENGENDALIAN</h3>
                    <p className="font-semibold text-slate-800">5.1 Non-Lethal Control</p>
                    <div className="pl-3 text-slate-700 space-y-0.5 mb-2">
                      <p>- Mobile dispersal : {p.nonLethal.mobileDispersal}</p>
                      <p>- Auditory deterrent : {p.nonLethal.auditoryDeterrent}</p>
                      <p>- Visual deterrent : {p.nonLethal.visualDeterrent}</p>
                      <p>- Monitoring flyway movement : {p.nonLethal.monitoringFlyway}</p>
                    </div>
                    <p className="font-semibold text-slate-800">5.2 Selective Lethal Control</p>
                    <div className="pl-3 text-slate-700">
                      {p.selectiveLethal.items.map((item, idx) => (
                        <p key={idx}>- {item.spesies} : {item.jumlah} ekor</p>
                      ))}
                      <p className="font-bold">Total Selective Lethal : {p.selectiveLethal.totalLethal} ekor</p>
                    </div>
                  </div>

                  {/* VI. KESIMPULAN */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">VI. KESIMPULAN</h3>
                    {p.kesimpulan.map((k, idx) => (
                      <p key={idx} className="text-slate-700">{idx + 1}. {k}</p>
                    ))}
                  </div>

                  {/* VII. MITIGASI */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">VII. MITIGASI</h3>
                    {p.mitigasi.map((m, idx) => (
                      <p key={idx} className="text-slate-700">{idx + 1}. {m}</p>
                    ))}
                  </div>

                  {/* VIII. DOKUMENTASI FOTO & BUKTI OPERASIONAL */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">VIII. DOKUMENTASI FOTO &amp; BUKTI OPERASIONAL</h3>
                    <PhotoPreviewGallery
                      title="Dokumentasi Visual Patroli Airside"
                      fotos={p.fotos}
                      keterangan={p.keteranganDokumentasi}
                      onSelectPhoto={setSelectedPhoto}
                    />
                  </div>
                </div>
              );
            })()}

            {reportType === 'occurrence' && (() => {
              const o = reportData as OccurrenceReport;
              return (
                <div className="space-y-5">
                  <div className="text-center">
                    <h2 className="text-sm sm:text-base font-black text-center uppercase tracking-wide text-amber-900">
                      2. WHR — WILDLIFE HAZARD REPORT
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Identifikasi bahaya, evaluasi risiko, dan mitigasi • Unit Wildlife Hazard (WHS)
                    </p>
                  </div>

                  {/* I. DATA OCCURRENCE */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">I. DATA OCCURRENCE</h3>
                    <div className="grid grid-cols-2 gap-y-1.5 text-slate-700">
                      <div><strong className="text-slate-900">Hari / Tanggal:</strong> {o.hariTanggal}</div>
                      <div><strong className="text-slate-900">Waktu Kejadian:</strong> {o.waktuKejadian}</div>
                      <div><strong className="text-slate-900">Pleton / Dinas:</strong> {o.pleton} / {o.dinas}</div>
                      <div><strong className="text-slate-900">POD:</strong> {o.pod}</div>
                      <div><strong className="text-slate-900">Lokasi:</strong> {o.lokasi} {o.gridLocation && <span className="font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">[{o.gridLocation}]</span>}</div>
                      <div><strong className="text-slate-900">Runway / Area:</strong> {o.runwayTaxiwayArea}</div>
                      <div className="col-span-2"><strong className="text-slate-900">Jenis Occurrence:</strong> {o.jenisOccurrence}</div>
                    </div>
                  </div>

                  {/* II. KRONOLOGI */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">II. KRONOLOGI KEJADIAN</h3>
                    <p className="text-slate-700 bg-slate-50 p-2 border border-slate-200 rounded">{o.kronologi}</p>
                  </div>

                  {/* III. IDENTIFIKASI SATWA */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">III. IDENTIFIKASI SATWA</h3>
                    <p className="text-slate-700">Jenis : {o.jenisSatwa}</p>
                    <p className="text-slate-700">Jumlah : {o.jumlahSatwa} ekor</p>
                    <p className="text-slate-700">Kondisi : [ {o.kondisiSatwa === 'Hidup' ? '■' : '□'} Hidup ]  [ {o.kondisiSatwa === 'Mati' ? '■' : '□'} Mati ]  [ {o.kondisiSatwa === 'Terluka' ? '■' : '□'} Terluka ]  [ {o.kondisiSatwa === 'Tidak teridentifikasi' ? '■' : '□'} Tidak teridentifikasi ]</p>
                    <p className="text-slate-700">Aktivitas / Pergerakan : {o.aktivitasPergerakan}</p>
                  </div>

                  {/* IV. KONDISI OPERASIONAL */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">IV. KONDISI OPERASIONAL</h3>
                    <p className="text-slate-700">Cuaca : {o.cuaca}   Suhu : {o.suhu}   Visibility : {o.visibility}</p>
                    <p className="text-slate-700">Kondisi Runway / Taxiway : {o.kondisiRunwayTaxiway}</p>
                    <p className="text-slate-700">Aktivitas Pergerakan Pesawat : {o.aktivitasPergerakanPesawat}</p>
                  </div>

                  {/* V. POTENSI HAZARD */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">V. POTENSI HAZARD</h3>
                    <p className="text-slate-700">Jenis Potensi Hazard : {o.jenisPotensiHazard}</p>
                    <p className="text-slate-700">Potensi Dampak Operasi : {o.potensiDampakOperasi}</p>
                  </div>

                  {/* VI. TINDAKAN */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">VI. TINDAKAN YANG DILAKUKAN</h3>
                    <p className="text-slate-700">1. Deteksi / monitoring : {o.tindakan.deteksiMonitoring}</p>
                    <p className="text-slate-700">2. Mobile dispersal : {o.tindakan.mobileDispersal}</p>
                    <p className="text-slate-700">3. Auditory / visual deterrent : {o.tindakan.auditoryVisualDeterrent}</p>
                    <p className="text-slate-700">4. Koordinasi : {o.tindakan.koordinasi}</p>
                    <p className="text-slate-700">5. Tindakan lainnya : {o.tindakan.tindakanLainnya}</p>
                  </div>

                  {/* VII. HASIL PENANGANAN */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">VII. HASIL PENANGANAN</h3>
                    <p className="text-slate-700">{o.hasilPenanganan}</p>
                    <p className="font-bold text-slate-900 mt-1">Status : ■ {o.status}</p>
                  </div>

                  {/* VIII. REKOMENDASI */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">VIII. REKOMENDASI / MITIGASI</h3>
                    {o.rekomendasiMitigasi.map((rm, idx) => (
                      <p key={idx} className="text-slate-700">{idx + 1}. {rm}</p>
                    ))}
                  </div>

                  {/* IX. DOKUMENTASI */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">IX. DOKUMENTASI &amp; EVIDENCE</h3>
                    <p className="text-slate-700">
                      Status Bukti Fisik: [ {o.fotoVideoAda || (o.fotos && o.fotos.length > 0) ? '■ Ada Dilampirkan' : '□ Tidak Ada'} ]
                    </p>
                    <PhotoPreviewGallery
                      title="Dokumentasi Visual Insiden Occurrence"
                      fotos={o.fotos}
                      keterangan={o.keteranganDokumentasi}
                      onSelectPhoto={setSelectedPhoto}
                    />
                  </div>
                </div>
              );
            })()}

            {reportType === 'strike' && (() => {
              const s = reportData as WildlifeStrikeReport;
              return (
                <div className="space-y-5">
                  <div className="text-center">
                    <h2 className="text-sm sm:text-base font-black text-center text-red-700 uppercase tracking-wide">
                      3. WSR — WILDLIFE STRIKE REPORT
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                      Pencatatan dugaan atau kejadian wildlife strike, bukti, dampak, dan status verifikasi • ICAO Doc 9388
                    </p>
                  </div>

                  {/* I. DATA KEJADIAN */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">I. DATA KEJADIAN</h3>
                    <div className="grid grid-cols-2 gap-y-1.5 text-slate-700">
                      <div><strong className="text-slate-900">Hari / Tanggal:</strong> {s.hariTanggal}</div>
                      <div><strong className="text-slate-900">Waktu Kejadian:</strong> {s.waktuKejadian}</div>
                      <div><strong className="text-slate-900">Pleton / Dinas:</strong> {s.pleton} / {s.dinas}</div>
                      <div><strong className="text-slate-900">POD:</strong> {s.pod}</div>
                      <div><strong className="text-slate-900">Lokasi:</strong> {s.lokasi} {s.gridLocation && <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">[{s.gridLocation}]</span>}</div>
                      <div><strong className="text-slate-900">Runway / Taxiway:</strong> {s.runwayTaxiway}</div>
                      <div className="col-span-2"><strong className="text-slate-900">Sumber Informasi:</strong> ■ {s.sumberInformasi}</div>
                    </div>
                  </div>

                  {/* II. DATA PESAWAT */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">II. DATA PESAWAT</h3>
                    <div className="grid grid-cols-2 gap-y-1.5 text-slate-700">
                      <div><strong className="text-slate-900">Operator / Airline:</strong> {s.operatorAirline}</div>
                      <div><strong className="text-slate-900">Flight Number:</strong> {s.flightNumber}</div>
                      <div><strong className="text-slate-900">Aircraft Type:</strong> {s.aircraftType}</div>
                      <div><strong className="text-slate-900">Registration:</strong> {s.registration}</div>
                      <div><strong className="text-slate-900">Origin / Destination:</strong> {s.origin} - {s.destination}</div>
                      <div><strong className="text-slate-900">Posisi Pesawat:</strong> {s.posisiPesawat}</div>
                    </div>
                  </div>

                  {/* III. DATA WILDLIFE */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">III. DATA WILDLIFE</h3>
                    <p className="text-slate-700">Jenis : {s.jenisWildlife}   Jumlah : {s.jumlahWildlife} ekor</p>
                    <p className="text-slate-700">Identifikasi : ■ {s.identifikasi}</p>
                    <p className="text-slate-700">Kondisi : ■ {s.kondisiWildlife}</p>
                  </div>

                  {/* IV. KRONOLOGI */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">IV. KRONOLOGI WILDLIFE STRIKE</h3>
                    <p className="text-slate-700 bg-slate-50 p-2 border border-slate-200 rounded">{s.kronologiStrike}</p>
                    <p className="mt-2 font-semibold text-slate-900">FASE PENERBANGAN : ■ {s.fasePenerbangan}</p>
                    <p className="font-semibold text-slate-900">BAGIAN PESAWAT YANG TERDAMPAK : {s.bagianPesawatTerdampak}</p>
                  </div>

                  {/* V. DAMPAK */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">V. DAMPAK TERHADAP PESAWAT</h3>
                    <p className="text-slate-700">Indikasi Kerusakan : ■ {s.indikasiKerusakan}</p>
                    <p className="text-slate-700">Bagian Kerusakan : {s.bagianKerusakan}</p>
                    <p className="text-slate-700">Dampak Penerbangan : {s.dampakPenerbangan}</p>
                    <p className="text-slate-700">Keterangan : {s.keteranganDampak}</p>
                  </div>

                  {/* VI. TINDAKAN WHU */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">VI. TINDAKAN WILDLIFE HAZARD UNIT</h3>
                    <div className="space-y-0.5 text-slate-700">
                      <p>1. Penerimaan informasi : {s.tindakanUnit.penerimaanInformasi}</p>
                      <p>2. Verifikasi lokasi : {s.tindakanUnit.verifikasiLokasi}</p>
                      <p>3. Pengumpulan evidence : {s.tindakanUnit.pengumpulanEvidence}</p>
                      <p>4. Pengamanan / pembersihan : {s.tindakanUnit.pengamananPembersihan}</p>
                      <p>5. Dispersal / pengendalian : {s.tindakanUnit.dispersalPengendalian}</p>
                      <p>6. Koordinasi : {s.tindakanUnit.koordinasi}</p>
                      <p>7. Dokumentasi : {s.tindakanUnit.dokumentasi}</p>
                    </div>
                  </div>

                  {/* VII. HASIL INVESTIGASI AWAL */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">VII. HASIL INVESTIGASI AWAL</h3>
                    <div className="space-y-0.5 text-slate-700">
                      <p>Spesies : {s.investigasiAwal.spesies}</p>
                      <p>Lokasi / Hotspot : {s.investigasiAwal.lokasiHotspot}</p>
                      <p>Kondisi Habitat : {s.investigasiAwal.kondisiHabitat}</p>
                      <p>Potensi Attractant : {s.investigasiAwal.potensiAttractant}</p>
                      <p>Pola Flyway : {s.investigasiAwal.polaFlyway}</p>
                      <p>Indikasi Penyebab : {s.investigasiAwal.indikasiPenyebab}</p>
                    </div>
                  </div>

                  {/* VIII. MITIGASI & TINDAK LANJUT */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">VIII. MITIGASI DAN TINDAK LANJUT</h3>
                    {s.mitigasi.map((m, idx) => (
                      <p key={idx} className="text-slate-700">{idx + 1}. {m}</p>
                    ))}
                    <p className="text-slate-700 mt-1"><strong className="text-slate-900">Rekomendasi :</strong> {s.rekomendasi}</p>
                  </div>

                  {/* IX. DOKUMENTASI / EVIDENCE */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">IX. DOKUMENTASI / EVIDENCE</h3>
                    <p className="text-slate-700">
                      Foto Satwa/Carcass: [ {s.evidence.fotoSatwaCarcass || (s.fotos && s.fotos.length > 0) ? '■ Ada' : '□ Tidak'} ]   
                      Foto Lokasi: [ {s.evidence.fotoLokasi ? '■ Ada' : '□ Tidak'} ]   
                      Foto Kerusakan: [ {s.evidence.fotoKerusakan ? '■ Ada' : '□ Tidak'} ]
                    </p>
                    <p className="text-slate-700">Video: [ {s.evidence.video ? '■ Ada' : '□ Tidak'} ]   Evidence lain: {s.evidence.evidenceLain || '-'}</p>
                    <PhotoPreviewGallery
                      title="Bukti Foto Investigasi Wildlife Strike"
                      fotos={s.fotos}
                      keterangan={s.keteranganDokumentasi}
                      onSelectPhoto={setSelectedPhoto}
                    />
                  </div>

                  {/* X. STATUS LAPORAN */}
                  <div>
                    <h3 className="font-bold text-slate-900 mb-1">X. STATUS LAPORAN</h3>
                    <p className="text-slate-700">Status: ■ {s.statusLaporan}   |   Tindak Lanjut: ■ {s.tindakLanjut ? 'Ya' : 'Tidak'}</p>
                    <p className="text-slate-700">Keterangan: {s.keteranganStatus}</p>
                  </div>
                </div>
              );
            })()}

            {/* Document Content for Vehicle Check */}
            {reportType === 'vehicle' && (() => {
              const v = reportData as VehicleCheckReport;
              const mechanicalItems = [
                { name: 'Oli Mesin & Coolant Radiator', cat: 'Mesin & Pendingin', status: v.oliMesinCoolant },
                { name: 'Sistem Rem Kaki & Handbrake', cat: 'Sistem Pengereman', status: v.sistemRemTangan },
                { name: 'Kondisi Ban (4 Roda + Serep)', cat: 'Roda & Tekanan', status: v.kondisiBanTekanan },
                { name: 'Lampu Utama (Jauh / Dekat) & Fog', cat: 'Penerangan Depan', status: v.lampuUtamaJauhDekat },
                { name: 'Lampu Rotary Strobo Amber (Airside)', cat: 'Mandatory Airside', status: v.lampuRotaryStroboAirside },
                { name: 'Lampu Sein, Hazard & Rem', cat: 'Signal & Indicator', status: v.lampuSeinHazardRem },
                { name: 'Wiper & Air Washer Pembersih', cat: 'Visibilitas Kaca', status: v.wiperAirPembersih },
                { name: 'Klakson & Sirine Suara Airside', cat: 'Audible Warning', status: v.klaksonSirineAirside },
                { name: 'AC Kabin & Kelistrikan 12V', cat: 'Interior & Battery', status: v.acKabinKelistrikan },
                { name: 'Kebersihan Fisik Kendaraan', cat: 'Kebersihan Body', status: v.kebersihanKendaraan }
              ];

              const toolItems = [
                { name: 'Radio Airside HT (VHF Bandara)', cat: 'Komunikasi Tower', status: v.radioAirsideHT },
                { name: 'Bird Scarer Megaphone Sound System', cat: 'Akustik Halau', status: v.birdScarerSoundMegaphone },
                { name: 'Laser Pengusir Satwa (Bird Laser)', cat: 'Optik Halau', status: v.laserBirdDisperser },
                { name: `Pistol Suar (Flare Gun - ${v.amunisiFlareButir} Butir)`, cat: 'Piroteknik', status: v.pyroFlareGun },
                { name: 'Teropong / Binokular 10x50', cat: 'Observasi Satwa', status: v.binokularTeropong },
                { name: 'Senter Taktis High-Beam Searchlight', cat: 'Patroli Malam', status: v.senterTaktisSearchlight },
                { name: 'Jaring Tangkap & Handling Gloves', cat: 'Evakuasi Satwa', status: v.jaringNetGunHandling },
                { name: 'APAR Kendaraan (Pemadam Api)', cat: 'Tanggap Darurat', status: v.aparKendaraan },
                { name: 'Kotak P3K Airside First Aid', cat: 'Pertolongan Pertama', status: v.kotakP3K },
                { name: 'Tool Kit, Kunci Roda & Dongkrak', cat: 'Tools Emergency', status: v.toolKitDongkrak }
              ];

              const getBadgeStyle = (status: string) => {
                const s = (status || '').toLowerCase();
                if (s.includes('baik') || s.includes('normal') || s.includes('lengkap') || s.includes('siap')) {
                  return 'bg-emerald-50 text-emerald-800 border-emerald-300';
                }
                if (s.includes('kurang') || s.includes('perhatian') || s.includes('kotor') || s.includes('catatan') || s.includes('tipis')) {
                  return 'bg-amber-50 text-amber-800 border-amber-300';
                }
                return 'bg-rose-50 text-rose-800 border-rose-300';
              };

              return (
                <div className="space-y-6">
                  <div className="bg-slate-900 text-white py-1.5 px-3 rounded text-center">
                    <h2 className="text-xs sm:text-sm font-black tracking-wide uppercase">
                      BERITA ACARA &amp; FORMULIR PENGECEKAN KENDARAAN OPERASIONAL AIRSIDE
                    </h2>
                  </div>

                  {/* I. IDENTITAS ARMADA & SHIFT DINAS */}
                  <div className="border border-slate-300 rounded overflow-hidden">
                    <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                      I. IDENTITAS ARMADA KENDARAAN OPERASIONAL &amp; KELAYAKAN
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 text-[11px] divide-y sm:divide-y-0 sm:divide-x divide-slate-200">
                      <div className="p-3 space-y-1.5">
                        <div className="flex justify-between"><span className="text-slate-500 font-medium">No. Lambung Armada:</span> <strong className="text-sky-900 font-bold text-xs">{v.nomorLambung}</strong></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-medium">Plat Nomor Polisi:</span> <strong className="text-slate-900 font-mono">{v.platNomor}</strong></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-medium">Merk / Tipe Armada:</span> <span className="text-slate-800">{v.merkModel}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-medium">Odometer Tercatat:</span> <strong className="text-slate-900 font-mono">{Number(v.odometerKM || 0).toLocaleString('id-ID')} KM</strong></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-medium">Level BBM Tangki:</span> <strong className="text-slate-900">{v.levelBBM}</strong></div>
                      </div>
                      <div className="p-3 space-y-1.5">
                        <div className="flex justify-between"><span className="text-slate-500 font-medium">Hari / Tanggal:</span> <span className="text-slate-800 font-medium">{v.hariTanggal}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-medium">Waktu Pemeriksaan:</span> <span className="text-slate-800 font-medium">{v.waktuPengecekan} WIB</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-medium">Dinas Operasional:</span> <strong className="text-sky-900">{v.dinas}</strong></div>
                        <div className="flex justify-between"><span className="text-slate-500 font-medium">Pleton Petugas:</span> <strong className="text-slate-900">{v.pleton}</strong></div>
                        <div className="flex justify-between items-center pt-0.5">
                          <span className="text-slate-500 font-medium">Kelayakan Operasi:</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(v.statusKelayakan)}`}>
                            {v.statusKelayakan}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* II. HASIL CHECKLIST DUA KATEGORI */}
                  <div className="space-y-4">
                    {/* Sub-A: Mekanikal & Kelistrikan */}
                    <div className="border border-slate-300 rounded overflow-hidden">
                      <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                        II.A PEMERIKSAAN KELAYAKAN MEKANIKAL, FISIK &amp; KELISTRIKAN AIRSIDE
                      </div>
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-2 w-10 text-center">No</th>
                            <th className="p-2">Komponen Pengecekan</th>
                            <th className="p-2 hidden sm:table-cell">Kategori Sub-Sistem</th>
                            <th className="p-2 text-center w-36">Status Hasil</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {mechanicalItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-2 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                              <td className="p-2 font-medium text-slate-900">{item.name}</td>
                              <td className="p-2 text-slate-500 hidden sm:table-cell text-[10px]">{item.cat}</td>
                              <td className="p-2 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(item.status)}`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Sub-B: Alat Halau & Safety Airside */}
                    <div className="border border-slate-300 rounded overflow-hidden">
                      <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                        II.B INVENTARIS PERALATAN MITIGASI SATWA LIAR (WILDLIFE CONTROL TOOLS)
                      </div>
                      <table className="w-full text-left text-[11px]">
                        <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-2 w-10 text-center">No</th>
                            <th className="p-2">Peralatan Mitigasi &amp; Safety</th>
                            <th className="p-2 hidden sm:table-cell">Fungsi / Peruntukan</th>
                            <th className="p-2 text-center w-36">Status Kelayakan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {toolItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="p-2 text-center text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                              <td className="p-2 font-medium text-slate-900">{item.name}</td>
                              <td className="p-2 text-slate-500 hidden sm:table-cell text-[10px]">{item.cat}</td>
                              <td className="p-2 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeStyle(item.status)}`}>
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* III. CATATAN KENDALA & BERITA ACARA */}
                  <div className="border border-slate-300 rounded overflow-hidden">
                    <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                      III. CATATAN KENDALA OPERASIONAL &amp; BERITA ACARA SERAH TERIMA
                    </div>
                    <div className="p-3 space-y-2 text-[11px] text-slate-700 bg-white">
                      <div>
                        <strong className="text-slate-900 block font-semibold mb-0.5">Catatan Kerusakan / Kendala Teknis:</strong>
                        <div className="bg-slate-50 p-2 rounded border border-slate-200 text-slate-800">
                          {v.catatanKerusakanKendala || 'Nihil. Seluruh sistem mesin, fisik kendaraan, dan inventaris halau satwa berfungsi normal.'}
                        </div>
                      </div>
                      <div>
                        <strong className="text-slate-900 block font-semibold mb-0.5">Berita Acara Serah Terima Tugas:</strong>
                        <div className="bg-slate-50 p-2 rounded border border-slate-200 text-slate-800">
                          {v.catatanSerahTerima || 'Kendaraan operasional diserahterimakan dalam keadaan bersih, inventaris lengkap, dan siap digunakan untuk operasi patroli airside.'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* IV. DOKUMENTASI FOTO ARMADA & INVENTARIS */}
                  <div className="border border-slate-300 rounded overflow-hidden">
                    <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 font-bold text-slate-800 text-[11px] uppercase tracking-wide">
                      IV. DOKUMENTASI FOTO FISIK ARMADA &amp; INVENTARIS PERALATAN
                    </div>
                    <div className="p-3 bg-white">
                      <PhotoPreviewGallery
                        title="Dokumentasi Visual Armada &amp; Alat Mitigasi"
                        fotos={v.fotos}
                        keterangan={v.keteranganDokumentasi}
                        onSelectPhoto={setSelectedPhoto}
                      />
                    </div>
                  </div>

                  {/* V. PENGESAHAN 3 PIHAK BERITA ACARA RESMI */}
                  <div className="border border-slate-300 rounded overflow-hidden">
                    <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-300 font-bold text-slate-800 text-[11px] uppercase tracking-wide text-center">
                      V. BERITA ACARA PENGESAHAN &amp; SERAH TERIMA OPERASIONAL ARMADA
                    </div>
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-[11px]">
                      {/* Pihak 1: Menyerahkan */}
                      {(() => {
                        const off = reportData.signatures?.officer;
                        const name = off?.signerName || v.petugasMenyerahkan || 'NURJAYA';
                        const nipp = off?.signerNipp || lookupPersonnelNip(name, 'officer');
                        const sigImg = off?.signatureDataUrl || generateRealisticSignatureDataUrl(name, 'Dinas Lepas');

                        return (
                          <div className="border border-slate-200 rounded p-2.5 bg-slate-50/50 flex flex-col justify-between min-h-[160px] relative">
                            <div>
                              <p className="text-[10px] font-bold text-slate-600 uppercase">Yang Menyerahkan</p>
                              <p className="text-[10px] text-slate-500">Petugas Dinas Lepas</p>
                            </div>

                            <div className="my-1.5 relative h-16 flex items-center justify-center">
                              {sigImg && (
                                <img src={sigImg} alt="Signature" className="h-14 max-w-full object-contain relative z-10" />
                              )}
                            </div>

                            <div>
                              <p className="font-bold text-slate-900 underline text-[11px]">( {name} )</p>
                              <p className="text-[9px] text-slate-500 font-mono mt-0.5">NIP: {nipp}</p>
                              <p className="text-[9px] text-emerald-700 font-semibold mt-0.5">✓ Tervalidasi Handover</p>
                              <button
                                onClick={() => handleOpenSignature('officer')}
                                className="no-print mt-1.5 text-[10px] text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                              >
                                {off ? 'Ubah TTD' : 'Bubuhkan TTD'}
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Pihak 2: Menerima */}
                      {(() => {
                        const rec = reportData.signatures?.receiver;
                        const name = rec?.signerName || v.petugasMenerima || 'MOHAMAD DANIL';
                        const nipp = rec?.signerNipp || lookupPersonnelNip(name, 'receiver');
                        const sigImg = rec?.signatureDataUrl || generateRealisticSignatureDataUrl(name, 'Dinas Berjalan');

                        return (
                          <div className="border border-sky-300 rounded p-2.5 bg-sky-50/30 flex flex-col justify-between min-h-[160px] relative">
                            <div>
                              <p className="text-[10px] font-bold text-sky-800 uppercase">Yang Menerima</p>
                              <p className="text-[10px] text-slate-500">Petugas Dinas Berjalan (Driver)</p>
                            </div>

                            <div className="my-1.5 relative h-16 flex items-center justify-center">
                              {sigImg && (
                                <img src={sigImg} alt="Signature" className="h-14 max-w-full object-contain relative z-10" />
                              )}
                            </div>

                            <div>
                              <p className="font-bold text-slate-900 underline text-[11px]">( {name} )</p>
                              <p className="text-[9px] text-slate-500 font-mono mt-0.5">NIP: {nipp}</p>
                              <p className="text-[9px] text-emerald-700 font-semibold mt-0.5">✓ Tervalidasi Penerimaan</p>
                              <button
                                onClick={() => handleOpenSignature('receiver')}
                                className="no-print mt-1.5 text-[10px] text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                              >
                                {rec ? 'Ubah TTD' : 'Bubuhkan TTD'}
                              </button>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Pihak 3: Mengetahui / Supervisor */}
                      {(() => {
                        const sup = reportData.signatures?.supervisor;
                        const name = sup?.signerName || v.supervisorLead || 'RACHMADITYA';
                        const nipp = sup?.signerNipp || lookupPersonnelNip(name, 'supervisor');
                        const sigImg = sup?.signatureDataUrl || generateRealisticSignatureDataUrl(name, 'Lead WHU');
                        const qr = qrCodeUrls['supervisor'];

                        return (
                          <div className="border border-slate-200 rounded p-2.5 bg-slate-50/50 flex flex-col justify-between min-h-[160px] relative">
                            <div>
                              <p className="text-[10px] font-bold text-slate-700 uppercase">Mengetahui / Verifikator</p>
                              <p className="text-[10px] text-slate-500">Supervisor / Lead WHU</p>
                            </div>

                            <div className="my-1.5 relative h-16 flex items-center justify-center">
                              {sigImg && (
                                <img src={sigImg} alt="Signature" className="h-14 max-w-full object-contain relative z-10" />
                              )}
                              {qr && (
                                <img src={qr} alt="QR Verification" className="absolute right-1 top-0 h-14 w-14 object-contain border border-slate-300 p-0.5 bg-white rounded" />
                              )}
                            </div>

                            <div>
                              <p className="font-bold text-slate-900 underline text-[11px]">( {name} )</p>
                              <p className="text-[9px] text-slate-500 font-mono mt-0.5">NIP: {nipp}</p>
                              <p className="text-[9px] text-teal-800 font-semibold mt-0.5">✓ AIRSIDE OPS VERIFIED</p>
                              <button
                                onClick={() => handleOpenSignature('supervisor')}
                                className="no-print mt-1.5 text-[10px] text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                              >
                                {sup ? 'Ubah TTD' : 'Bubuhkan TTD'}
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Standard Signatures block for other reports (strike, occurrence, patrol) */}
            {reportType !== 'vehicle' && (() => {
              const sup = reportData.signatures?.supervisor;
              const supName = sup?.signerName || 'RACHMADITYA';
              const supNipp = sup?.signerNipp || lookupPersonnelNip(supName, 'supervisor');
              const supSigImg = sup?.signatureDataUrl || generateRealisticSignatureDataUrl(supName, 'WHU Department Head');
              const supQr = qrCodeUrls['supervisor'];

              const off = reportData.signatures?.officer;
              const offRawName = Array.isArray((reportData as any).pod)
                ? ((reportData as any).pod.filter(Boolean).join(', ') || 'Petugas WHU')
                : ((reportData as any).pod || 'Petugas WHU');
              const offName = off?.signerName || offRawName;
              const offNipp = off?.signerNipp || lookupPersonnelNip(offName, 'officer');
              const offSigImg = off?.signatureDataUrl || generateRealisticSignatureDataUrl(offName, 'Person on Duty');
              const offQr = qrCodeUrls['officer'];

              return (
                <div className="pt-6 border-t-2 border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-slate-800">
                  {/* Supervisor Left */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Pengesahan / Verifikasi:</p>
                      <p className="font-bold text-slate-900 mt-0.5">Wildlife Hazard Department Head</p>
                      <p className="text-[10px] text-slate-500">PT Angkasa Pura Indonesia</p>
                    </div>

                    <div className="my-2.5 relative h-20 flex items-center justify-start pl-2">
                      {supSigImg && (
                        <img src={supSigImg} alt="Supervisor Signature" className="h-16 max-w-[160px] object-contain relative z-10" />
                      )}
                      {supQr && (
                        <img src={supQr} alt="QR Code" className="absolute right-1 top-1 h-16 w-16 object-contain border border-slate-300 p-0.5 bg-white rounded shadow-xs" />
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <p className="font-bold text-slate-900 text-sm">( {supName} )</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-slate-500 font-mono">NIP: {supNipp}</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">✓ TTD Digital Sah</span>
                      </div>
                      <button
                        onClick={() => handleOpenSignature('supervisor')}
                        className="no-print mt-2 text-[10px] text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                      >
                        {sup ? 'Ubah Tanda Tangan Supervisor' : 'Bubuhkan Tanda Tangan Supervisor'}
                      </button>
                    </div>
                  </div>

                  {/* Officer Right */}
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/60 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-slate-500 uppercase">Petugas Pelapor Unit WHU:</p>
                      <p className="font-bold text-slate-900 mt-0.5">
                        {reportType === 'strike' ? 'Lead Investigator / Duty Officer' : 'Person on Duty (POD) Unit WHU'}
                      </p>
                      <p className="text-[10px] text-slate-500">Airside Safety &amp; Wildlife Control</p>
                    </div>

                    <div className="my-2.5 relative h-20 flex items-center justify-start pl-2">
                      {offSigImg && (
                        <img src={offSigImg} alt="Officer Signature" className="h-16 max-w-[160px] object-contain relative z-10" />
                      )}
                      {offQr && (
                        <img src={offQr} alt="QR Code" className="absolute right-1 top-1 h-16 w-16 object-contain border border-slate-300 p-0.5 bg-white rounded shadow-xs" />
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <p className="font-bold text-slate-900 text-sm">( {offName} )</p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[10px] text-slate-500 font-mono">NIP: {offNipp}</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">✓ TTD Digital Sah</span>
                      </div>
                      <button
                        onClick={() => handleOpenSignature('officer')}
                        className="no-print mt-2 text-[10px] text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                      >
                        {off ? 'Ubah Tanda Tangan Petugas' : 'Bubuhkan Tanda Tangan Petugas'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Digital Signature Modal Integration */}
      <DigitalSignatureModal
        isOpen={isSigModalOpen}
        onClose={() => setIsSigModalOpen(false)}
        reportNumber={activeDocNum}
        reportType={reportType}
        defaultRole={activeSigRole}
        defaultOfficerName={
          activeSigRole === 'supervisor'
            ? (reportData.signatures?.supervisor?.signerName || 'RACHMADITYA')
            : activeSigRole === 'receiver'
            ? ((reportData as any).petugasMenerima || 'Petugas Dinas Berjalan')
            : ((reportData as any).petugasMenyerahkan || (Array.isArray((reportData as any).pod) ? (reportData as any).pod[0] : (reportData as any).pod) || 'Petugas Pelaksana WHU')
        }
        existingSignature={reportData.signatures?.[activeSigRole]}
        onSaveSignature={handleSaveSignature}
      />

      {/* Lightbox Modal for Fullsize Photo Preview */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-60 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-3.5 bg-slate-800 text-white flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2 text-xs font-semibold">
                <Camera className="w-4 h-4 text-sky-400" />
                <span>Pratinjau Foto Dokumentasi Lapangan WHU (Ukuran Penuh)</span>
              </div>
              <button
                onClick={() => setSelectedPhoto(null)}
                className="p-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition cursor-pointer"
                title="Tutup Pratinjau Foto"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black/70 min-h-[300px] max-h-[75vh]">
              <img
                src={selectedPhoto}
                alt="Dokumentasi Fullsize"
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-md"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="p-2.5 bg-slate-800 text-center text-xs text-slate-300 border-t border-slate-700">
              Dokumen Bukti Resmi Unit Wildlife Hazard Management - PT Angkasa Pura Indonesia
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
