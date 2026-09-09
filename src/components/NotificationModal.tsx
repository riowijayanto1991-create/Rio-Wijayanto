import React, { useState } from 'react';
import { 
  Bell, 
  Send, 
  Share2, 
  Mail, 
  Phone, 
  Copy, 
  Check, 
  UserCheck, 
  X, 
  Radio, 
  Volume2,
  FileText,
  AlertTriangle,
  History
} from 'lucide-react';
import { ManagementRecipient, NotificationLog, PatrolReport, OccurrenceReport, WildlifeStrikeReport } from '../types';
import { generateWhatsAppMessage, playNotificationSound } from '../utils/notificationService';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipients: ManagementRecipient[];
  onUpdateRecipients: (recipients: ManagementRecipient[]) => void;
  notificationLogs: NotificationLog[];
  onAddLog: (log: NotificationLog) => void;
  currentReportForBroadcast?: {
    type: 'PATROL' | 'OCCURRENCE' | 'STRIKE';
    report: PatrolReport | OccurrenceReport | WildlifeStrikeReport;
  } | null;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  recipients,
  onUpdateRecipients,
  notificationLogs,
  onAddLog,
  currentReportForBroadcast
}) => {
  const [activeTab, setActiveTab] = useState<'broadcast' | 'recipients' | 'logs'>('broadcast');
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>('all');
  const [copied, setCopied] = useState<boolean>(false);
  const [broadcastSent, setBroadcastSent] = useState<boolean>(false);

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

  const generatedWAMessage = generateWhatsAppMessage(broadcastType, reportObj);

  const handleCopyText = () => {
    navigator.clipboard.writeText(generatedWAMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWhatsApp = (recipient?: ManagementRecipient) => {
    playNotificationSound();
    const encoded = encodeURIComponent(generatedWAMessage);
    
    let url = `https://wa.me/?text=${encoded}`;
    if (recipient && recipient.phone) {
      const cleanPhone = recipient.phone.replace(/[^0-9]/g, '');
      url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
    }

    window.open(url, '_blank', 'noopener,noreferrer');

    // Record log
    const targetName = recipient ? recipient.role : 'Semua Manajemen Bandara Terkait (Broadcast Group)';
    const targetRole = recipient ? recipient.role : 'Aviation Executive & Operational Leads';

    onAddLog({
      id: `notif-${Date.now()}`,
      timestamp: new Date().toISOString(),
      reportType: broadcastType,
      reportNumber: reportObj.reportNumber || 'WHU/BROADCAST',
      title: `BROADCAST ${broadcastType}: ${reportObj.reportNumber}`,
      recipientName: targetName,
      recipientRole: targetRole,
      channel: 'WHATSAPP',
      status: 'TERKIRIM',
      messageSummary: generatedWAMessage.slice(0, 120) + '...'
    });

    setBroadcastSent(true);
    setTimeout(() => setBroadcastSent(false), 3500);
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`[WILDLIFE HAZARD NOTIFICATION] ${broadcastType} - ${reportObj.reportNumber}`);
    const body = encodeURIComponent(generatedWAMessage);
    const emails = recipients.map(r => r.email).join(',');
    window.location.href = `mailto:${emails}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-sky-600 text-white">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] bg-sky-500/30 text-sky-300 font-mono px-2 py-0.5 rounded font-semibold uppercase">
                  SISTEM DISPATCH OTOMATIS
                </span>
                <span className="text-xs text-slate-400">ICAO SMS Doc 9859</span>
              </div>
              <h3 className="font-bold text-base sm:text-lg text-white">
                Notifikasi Manajemen Bandara PT Angkasa Pura Indonesia
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
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('broadcast')}
            className={`px-4 py-2 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'broadcast'
                ? 'border-sky-600 text-sky-700 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Kirim Broadcast Laporan
          </button>
          <button
            onClick={() => setActiveTab('recipients')}
            className={`px-4 py-2 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'recipients'
                ? 'border-sky-600 text-sky-700 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Daftar Pejabat / Penerima ({recipients.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-sky-600 text-sky-700 font-bold bg-white rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Riwayat Dispatch ({notificationLogs.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 text-slate-800 text-xs space-y-4">
          {/* TAB 1: BROADCAST SENDER */}
          {activeTab === 'broadcast' && (
            <div className="space-y-4">
              {broadcastSent && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-800 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Notifikasi telah berhasil dikirimkan dan dicatat pada audit log.</span>
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Format Standar Pesan Broadcast Bandara:
                </div>
                <p className="text-[11px] text-amber-800">
                  Pesan di bawah terformat secara otomatis sesuai SOP PT Angkasa Pura Indonesia untuk disebarkan secara instan ke General Manager Bandara, ARFF Facility &amp; Maintenance Division Head, Wildlife Hazard Department Head, AMC Department Head, Duty ATC (AirNav Indonesia), serta Wildlife Hazard Supervisor &amp; Officer.
                </p>
              </div>

              {/* Message Preview Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">Preview Pesan WhatsApp &amp; Email :</label>
                  <button
                    onClick={handleCopyText}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium transition cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-200 font-mono text-[11px] rounded-lg border border-slate-700 whitespace-pre-wrap max-h-56 overflow-y-auto select-all">
                  {generatedWAMessage}
                </pre>
              </div>

              {/* Quick Send directly to specific recipients */}
              <div>
                <label className="block font-bold text-slate-700 mb-2">Kirim Cepat per Jabatan Manajemen :</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {recipients.map(recipient => (
                    <div
                      key={recipient.id}
                      className="p-2.5 rounded-lg border border-slate-200 hover:border-sky-400 bg-white hover:bg-sky-50/40 transition flex items-center justify-between"
                    >
                      <div className="truncate pr-2">
                        <p className="font-bold text-slate-900 text-xs truncate">{recipient.role}</p>
                        <p className="text-[11px] text-slate-500 truncate">{recipient.department}</p>
                        <p className="text-[10px] text-sky-700 font-mono">{recipient.phone}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(recipient)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-sm whitespace-nowrap cursor-pointer"
                        title={`Kirim WA ke ${recipient.role}`}
                      >
                        <Send className="w-3 h-3" />
                        Kirim WA
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Master Dispatch Actions */}
              <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSendEmail}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-sky-600" />
                  Kirim Email ke Semua
                </button>

                <button
                  type="button"
                  onClick={() => handleSendWhatsApp()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-2 shadow-md transition cursor-pointer text-xs sm:text-sm"
                >
                  <Share2 className="w-4 h-4" />
                  Broadcast WhatsApp Group Manajemen
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: RECIPIENTS DIRECTORY */}
          {activeTab === 'recipients' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-600 font-medium text-xs">
                  Daftar Jabatan Manajemen &amp; Unit Terkait penerima notifikasi insiden Wildlife Hazard:
                </p>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                {recipients.map(r => (
                  <div key={r.id} className="p-3.5 hover:bg-slate-50 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">{r.role}</span>
                        <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 border border-sky-200 font-mono text-[10px]">
                          {r.department}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 mt-1.5 text-[11px] text-slate-600 font-mono">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-slate-400" /> {r.phone}</span>
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-slate-400" /> {r.email}</span>
                      </div>
                    </div>

                    {/* Subscription Checkboxes */}
                    <div className="flex items-center space-x-2 bg-slate-50 px-2.5 py-1.5 rounded border border-slate-200 text-[11px]">
                      <span className={`px-1.5 py-0.5 rounded font-bold ${r.notifyOnStrike ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-400'}`}>
                        Strike
                      </span>
                      <span className={`px-1.5 py-0.5 rounded font-bold ${r.notifyOnOccurrence ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                        Occurrence
                      </span>
                      <span className={`px-1.5 py-0.5 rounded font-bold ${r.notifyOnPatrol ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-400'}`}>
                        Patrol
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: DISPATCH AUDIT LOG */}
          {activeTab === 'logs' && (
            <div className="space-y-3">
              <p className="text-slate-600 font-medium">
                Log audit pengiriman notifikasi broadcast manajemen:
              </p>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <tr>
                      <th className="p-2.5">Waktu</th>
                      <th className="p-2.5">Jenis</th>
                      <th className="p-2.5">Penerima</th>
                      <th className="p-2.5">Kanal</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {notificationLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString('id-ID')}
                        </td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                            log.reportType === 'STRIKE' ? 'bg-rose-100 text-rose-700' :
                            log.reportType === 'OCCURRENCE' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
                          }`}>
                            {log.reportType}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <p className="font-semibold text-slate-800">{log.recipientName}</p>
                          <p className="text-[10px] text-slate-500">{log.recipientRole}</p>
                        </td>
                        <td className="p-2.5 font-mono text-[11px] text-slate-600">{log.channel}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
