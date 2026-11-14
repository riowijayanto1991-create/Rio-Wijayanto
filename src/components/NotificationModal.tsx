import React, { useState } from 'react';
import { 
  Bell, 
  Send, 
  Share2, 
  Copy, 
  Check, 
  UserCheck, 
  X, 
  Radio, 
  Volume2,
  FileText,
  AlertTriangle,
  History,
  Download,
  Truck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { ManagementRecipient, NotificationLog, PatrolReport, OccurrenceReport, WildlifeStrikeReport, VehicleCheckReport } from '../types';
import { generateWhatsAppMessage, playNotificationSound } from '../utils/notificationService';
import { exportVehiclePDF, exportPatrolPDF, exportOccurrencePDF, exportStrikePDF } from '../utils/pdfExport';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentReportForBroadcast?: {
    type: 'PATROL' | 'OCCURRENCE' | 'STRIKE' | 'VEHICLE';
    report: any;
  } | null;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  currentReportForBroadcast
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [broadcastSent, setBroadcastSent] = useState<boolean>(false);
  const [pdfDownloaded, setPdfDownloaded] = useState<boolean>(false);

  if (!isOpen) return null;

  // Selected or dummy report for preview
  const broadcastType = currentReportForBroadcast?.type || 'STRIKE';
  const reportObj = currentReportForBroadcast?.report || {
    reportNumber: 'WHU/STRIKE/2026/09/0006',
    hariTanggal: 'Rabu, 09 September 2026',
    waktuKejadian: '10:40 WIB',
    lokasi: 'Runway 25R Touchdown Zone',
    runwayTaxiway: 'Runway 25R',
    sumberInformasi: 'Pilot/Crew',
    operatorAirline: 'Garuda Indonesia',
    flightNumber: 'GA-320',
    aircraftType: 'Boeing 737-800',
    registration: 'PK-GMF',
    origin: 'SUB',
    destination: 'CGK',
    fasePenerbangan: 'Landing roll',
    bagianPesawatTerdampak: 'Leading Edge Port Wing',
    jenisWildlife: 'Burung Layang-layang Api',
    jumlahWildlife: 1,
    kondisiWildlife: 'Carcass/Sisa',
    identifikasi: 'Teridentifikasi',
    indikasiKerusakan: 'Tidak ada',
    bagianKerusakan: 'Bercak darah & bulu halus, no dent',
    dampakPenerbangan: 'Normal',
    statusLaporan: 'Final Report',
    pod: 'Achmad Fauzi (Lead WHU)'
  } as any;

  const generatedWAMessage = generateWhatsAppMessage(broadcastType as any, reportObj);

  const handleDownloadPDF = () => {
    try {
      if (broadcastType === 'VEHICLE') {
        exportVehiclePDF(reportObj as VehicleCheckReport);
      } else if (broadcastType === 'STRIKE') {
        exportStrikePDF(reportObj as WildlifeStrikeReport);
      } else if (broadcastType === 'OCCURRENCE') {
        exportOccurrencePDF(reportObj as OccurrenceReport);
      } else {
        exportPatrolPDF(reportObj as PatrolReport);
      }
      setPdfDownloaded(true);
      setTimeout(() => setPdfDownloaded(false), 4000);
    } catch (err) {
      console.error('Gagal mengekspor PDF:', err);
    }
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generatedWAMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = () => {
    playNotificationSound();
    const encoded = encodeURIComponent(generatedWAMessage);
    const url = `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3500);
  };

  const getReportTypeBadge = () => {
    switch (broadcastType) {
      case 'VEHICLE':
        return { label: 'CHECK KENDARAAN & SERAH TERIMA', color: 'bg-teal-500/20 text-teal-300' };
      case 'STRIKE':
        return { label: 'FLASH REPORT WILDLIFE STRIKE', color: 'bg-rose-500/20 text-rose-300' };
      case 'OCCURRENCE':
        return { label: 'LAPORAN INSIDEN OCCURRENCE', color: 'bg-amber-500/20 text-amber-300' };
      default:
        return { label: 'PATROLI & INSPEKSI HARIAN', color: 'bg-sky-500/20 text-sky-300' };
    }
  };

  const badge = getReportTypeBadge();

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg text-white shadow-sm ${broadcastType === 'VEHICLE' ? 'bg-teal-600' : 'bg-emerald-600'}`}>
              {broadcastType === 'VEHICLE' ? <Truck className="w-5 h-5" /> : <Share2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${badge.color}`}>
                  {badge.label}
                </span>
                <span className="text-xs text-slate-400">SOP PT Angkasa Pura Indonesia</span>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                {broadcastType === 'VEHICLE' 
                  ? 'Bukti PDF & Laporan WAG Pimpinan: Pengecekan Kendaraan' 
                  : 'Broadcast Laporan Operasional WHU ke WAG Pimpinan'}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={playNotificationSound}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1 cursor-pointer"
              title="Uji Bunyi Chime Notifikasi"
            >
              <Volume2 className="w-4 h-4 text-amber-400" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 text-slate-800 text-xs space-y-4">
          {broadcastSent && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>WhatsApp telah dibuka! Format laporan pimpinan siap dikirim ke grup komando/WAG.</span>
            </div>
          )}

          {pdfDownloaded && (
            <div className="p-3 bg-sky-50 border border-sky-300 rounded-lg text-sky-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
              <span className="font-medium">
                Bukti PDF Resmi ({reportObj.reportNumber}) berhasil diunduh! Silakan lampirkan dokumen ini di WhatsApp Group Pimpinan.
              </span>
            </div>
          )}

          {/* Quick Step Guide for WAG Report */}
          <div className="bg-gradient-to-r from-sky-50 via-slate-50 to-teal-50 border border-sky-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                <FileText className="w-4 h-4 text-sky-600" />
                Alur Pelaporan Resmi ke WAG Pimpinan:
              </span>
              <span className="text-[10px] font-mono bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded">
                Dokumen: {reportObj.reportNumber}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="p-2.5 bg-white hover:bg-sky-50 border border-sky-300 hover:border-sky-500 rounded-lg text-left transition flex items-start gap-2.5 shadow-xs cursor-pointer group"
              >
                <div className="p-1.5 bg-sky-100 text-sky-700 rounded-md group-hover:bg-sky-600 group-hover:text-white transition shrink-0">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-[11px] group-hover:text-sky-900">
                    1. Unduh Bukti PDF Pimpinan
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Kop resmi Angkasa Pura &amp; Berita Acara 3 Pihak
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="p-2.5 bg-white hover:bg-emerald-50 border border-emerald-300 hover:border-emerald-500 rounded-lg text-left transition flex items-start gap-2.5 shadow-xs cursor-pointer group"
              >
                <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md group-hover:bg-emerald-600 group-hover:text-white transition shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-[11px] group-hover:text-emerald-900">
                    2. Kirim Laporan ke WAG
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Buka WhatsApp lalu sertakan lampiran file PDF
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Message Preview Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700">Preview Teks Pesan Laporan WAG :</label>
              <button
                onClick={handleCopyText}
                className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium transition cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
              </button>
            </div>
            <pre className="p-3.5 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-lg border border-slate-800 whitespace-pre-wrap max-h-60 overflow-y-auto select-all leading-relaxed">
              {generatedWAMessage}
            </pre>
          </div>

          {/* Master Dispatch Actions */}
          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyText}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer text-xs"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                Salin Teks Pesan
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                className="px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-300 rounded-lg font-bold flex items-center gap-1.5 transition cursor-pointer text-xs"
              >
                <Download className="w-4 h-4 text-sky-600" />
                Unduh Bukti PDF Resmi
              </button>
            </div>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-md transition cursor-pointer text-xs sm:text-sm"
            >
              <Share2 className="w-4 h-4" />
              Kirim ke WhatsApp Group Pimpinan
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
