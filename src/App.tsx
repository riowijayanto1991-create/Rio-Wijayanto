import React, { useState, useEffect } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  Dashboard 
} from './components/Dashboard';
import { 
  PatrolForm 
} from './components/PatrolForm';
import { 
  OccurrenceForm 
} from './components/OccurrenceForm';
import { 
  StrikeForm 
} from './components/StrikeForm';
import { 
  ReportHistory 
} from './components/ReportHistory';
import { 
  NotificationModal 
} from './components/NotificationModal';
import { 
  ReportPreviewModal 
} from './components/ReportPreviewModal';
import { 
  PatrolReport, 
  OccurrenceReport, 
  WildlifeStrikeReport, 
  ManagementRecipient, 
  NotificationLog 
} from './types';
import { 
  initialPatrolReports, 
  initialOccurrenceReports, 
  initialStrikeReports, 
  initialManagementRecipients, 
  initialNotificationLogs 
} from './data/mockData';
import { exportAllToExcel } from './utils/excelExport';
import { playNotificationSound } from './utils/notificationService';
import { 
  initializeFirestoreDatabase,
  subscribeToPatrolReports,
  subscribeToOccurrenceReports,
  subscribeToStrikeReports,
  subscribeToManagementRecipients,
  subscribeToNotificationLogs,
  savePatrolReportToFirestore,
  saveOccurrenceReportToFirestore,
  saveStrikeReportToFirestore,
  saveNotificationLogToFirestore,
  saveRecipientsToFirestore
} from './services/firestoreService';
import { 
  CheckCircle2, 
  Radio, 
  Cloud,
  CloudCheck,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'patrol-form' | 'occurrence-form' | 'strike-form' | 'history'
  >('dashboard');

  // Core collections in state
  const [patrolReports, setPatrolReports] = useState<PatrolReport[]>(initialPatrolReports);
  const [occurrenceReports, setOccurrenceReports] = useState<OccurrenceReport[]>(initialOccurrenceReports);
  const [strikeReports, setStrikeReports] = useState<WildlifeStrikeReport[]>(initialStrikeReports);
  const [recipients, setRecipients] = useState<ManagementRecipient[]>(initialManagementRecipients);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(initialNotificationLogs);

  // Cloud multi-device synchronization status
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'synced' | 'error'>('connecting');
  const [lastSyncTime, setLastSyncTime] = useState<string>('Menghubungkan...');

  // Subscribe to real-time changes across all devices via Firebase Firestore
  useEffect(() => {
    let unsubPatrol = () => {};
    let unsubOcc = () => {};
    let unsubStrike = () => {};
    let unsubRecipients = () => {};
    let unsubLogs = () => {};

    const startSync = async () => {
      try {
        await initializeFirestoreDatabase();
        setSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString('id-ID'));

        unsubPatrol = subscribeToPatrolReports((reports) => {
          if (reports.length > 0) {
            setPatrolReports(reports);
          }
          setSyncStatus('synced');
          setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
        });

        unsubOcc = subscribeToOccurrenceReports((reports) => {
          if (reports.length > 0) {
            setOccurrenceReports(reports);
          }
          setSyncStatus('synced');
          setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
        });

        unsubStrike = subscribeToStrikeReports((reports) => {
          if (reports.length > 0) {
            setStrikeReports(reports);
          }
          setSyncStatus('synced');
          setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
        });

        unsubRecipients = subscribeToManagementRecipients((recs) => {
          if (recs.length > 0) {
            setRecipients(recs);
          }
        });

        unsubLogs = subscribeToNotificationLogs((logs) => {
          if (logs.length > 0) {
            setNotificationLogs(logs);
          }
        });
      } catch (err) {
        console.error('Gagal menghubungkan sinkronisasi cloud:', err);
        setSyncStatus('error');
      }
    };

    startSync();

    return () => {
      unsubPatrol();
      unsubOcc();
      unsubStrike();
      unsubRecipients();
      unsubLogs();
    };
  }, []);

  // Modal states
  const [isNotifModalOpen, setIsNotifModalOpen] = useState<boolean>(false);
  const [broadcastReport, setBroadcastReport] = useState<{
    type: 'PATROL' | 'OCCURRENCE' | 'STRIKE';
    report: PatrolReport | OccurrenceReport | WildlifeStrikeReport;
  } | null>(null);

  // Document preview modal state
  const [previewData, setPreviewData] = useState<{
    isOpen: boolean;
    type: 'patrol' | 'occurrence' | 'strike';
    data: PatrolReport | OccurrenceReport | WildlifeStrikeReport | null;
  }>({
    isOpen: false,
    type: 'patrol',
    data: null
  });

  // Global flash toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Handlers for saving reports with multi-device cloud persistence
  const handleSavePatrol = async (newReport: PatrolReport) => {
    setPatrolReports(prev => [newReport, ...prev.filter(p => p.id !== newReport.id)]);
    showToast(`Laporan Patroli ${newReport.reportNumber} tersimpan & disinkronkan ke seluruh personel.`);
    playNotificationSound();
    try {
      await savePatrolReportToFirestore(newReport);
    } catch (err) {
      console.error('Error saving patrol to Firestore:', err);
    }
  };

  const handleSaveOccurrence = async (newReport: OccurrenceReport) => {
    setOccurrenceReports(prev => [newReport, ...prev.filter(o => o.id !== newReport.id)]);
    showToast(`Laporan Occurrence ${newReport.reportNumber} berhasil disinkronkan ke cloud!`);
    playNotificationSound();
    try {
      await saveOccurrenceReportToFirestore(newReport);
    } catch (err) {
      console.error('Error saving occurrence to Firestore:', err);
    }
  };

  const handleSaveStrike = async (newReport: WildlifeStrikeReport) => {
    setStrikeReports(prev => [newReport, ...prev.filter(s => s.id !== newReport.id)]);
    showToast(`FLASH: Laporan Wildlife Strike ${newReport.reportNumber} disinkronkan ke cloud!`);
    playNotificationSound();
    // Auto-open broadcast modal for rapid dispatch on critical strikes
    setBroadcastReport({
      type: 'STRIKE',
      report: newReport
    });
    setIsNotifModalOpen(true);
    try {
      await saveStrikeReportToFirestore(newReport);
    } catch (err) {
      console.error('Error saving strike to Firestore:', err);
    }
  };

  // Open Broadcast modal helper
  const handleOpenBroadcast = (
    type: 'PATROL' | 'OCCURRENCE' | 'STRIKE', 
    report: PatrolReport | OccurrenceReport | WildlifeStrikeReport
  ) => {
    setBroadcastReport({ type, report });
    setIsNotifModalOpen(true);
  };

  // Handle Preview Document
  const handlePreviewReport = (type: 'patrol' | 'occurrence' | 'strike', id: string) => {
    let foundData: any = null;
    if (type === 'patrol') foundData = patrolReports.find(p => p.id === id);
    else if (type === 'occurrence') foundData = occurrenceReports.find(o => o.id === id);
    else foundData = strikeReports.find(s => s.id === id);

    if (foundData) {
      setPreviewData({
        isOpen: true,
        type,
        data: foundData
      });
    }
  };

  const handleAddNotificationLog = async (log: NotificationLog) => {
    setNotificationLogs(prev => [log, ...prev]);
    try {
      await saveNotificationLogToFirestore(log);
    } catch (err) {
      console.error('Error saving log to Firestore:', err);
    }
  };

  const handleUpdateRecipients = async (newRecipients: ManagementRecipient[]) => {
    setRecipients(newRecipients);
    try {
      await saveRecipientsToFirestore(newRecipients);
    } catch (err) {
      console.error('Error updating recipients in Firestore:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Toast alert */}
      {toastMessage && (
        <div className="fixed top-18 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-sky-500/30 flex items-center space-x-3 text-xs animate-in fade-in slide-in-from-top-3">
          <div className="p-1 rounded bg-sky-500 text-slate-900">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-bold">Notifikasi Sistem Operasional</p>
            <p className="text-slate-300 text-[11px]">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Main Navigation Header */}
      <Header
        activeTab={currentTab}
        onSelectTab={setCurrentTab}
        unreadNotificationCount={notificationLogs.length}
        onOpenNotifications={() => {
          setBroadcastReport(null);
          setIsNotifModalOpen(true);
        }}
      />

      {/* Subheader Status Ticker */}
      <div className="bg-sky-900 text-sky-100 px-4 py-1.5 text-[11px] border-b border-sky-950 flex flex-wrap items-center justify-between gap-2 shadow-inner">
        <div className="flex items-center space-x-3">
          <span className="flex items-center gap-1.5 font-semibold text-emerald-400">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            STATUS SISTEM: LIVE OPERASIONAL WHU
          </span>
          <span className="hidden sm:inline text-sky-400">|</span>
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold border ${
              syncStatus === 'synced'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                : syncStatus === 'connecting'
                ? 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
            }`}>
              <Cloud className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>
                {syncStatus === 'synced'
                  ? `CLOUD SYNC AKTIF (SEMUA DEVICE TERHUBUNG) • ${lastSyncTime}`
                  : syncStatus === 'connecting'
                  ? 'MENGHUBUNGKAN CLOUD DATABASE...'
                  : 'OFFLINE MODE (LOKAL)'}
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => exportAllToExcel(patrolReports, occurrenceReports, strikeReports)}
            className="hover:text-white font-medium underline cursor-pointer text-sky-300 hover:text-sky-100"
          >
            Unduh Rekapitulasi Excel
          </button>
          <span>•</span>
          <span>SOP ICAO Annex 14 &amp; Doc 9137 Part 3</span>
        </div>
      </div>

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'dashboard' && (
          <Dashboard
            patrols={patrolReports}
            occurrences={occurrenceReports}
            strikes={strikeReports}
            onNavigateTab={setCurrentTab}
            onOpenBroadcast={handleOpenBroadcast}
          />
        )}

        {currentTab === 'patrol-form' && (
          <PatrolForm
            onSaveReport={handleSavePatrol}
            onOpenBroadcast={(rep) => handleOpenBroadcast('PATROL', rep)}
          />
        )}

        {currentTab === 'occurrence-form' && (
          <OccurrenceForm
            onSaveReport={handleSaveOccurrence}
            onOpenBroadcast={(rep) => handleOpenBroadcast('OCCURRENCE', rep)}
          />
        )}

        {currentTab === 'strike-form' && (
          <StrikeForm
            onSaveReport={handleSaveStrike}
            onOpenBroadcast={(rep) => handleOpenBroadcast('STRIKE', rep)}
          />
        )}

        {currentTab === 'history' && (
          <ReportHistory
            patrols={patrolReports}
            occurrences={occurrenceReports}
            strikes={strikeReports}
            onPreviewReport={handlePreviewReport}
            onOpenBroadcast={handleOpenBroadcast}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-6 px-4 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-200 uppercase tracking-wider">
              PT ANGKASA PURA INDONESIA • AIRSIDE OPERATION DIVISION
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Unit Wildlife Hazard Management System (WHMS) • Terintegrasi ICAO IBIS Database &amp; KP 326
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-500">
            <p>Export Engine: PDF (jsPDF Autotable) &amp; Excel (XLSX SheetJS)</p>
            <p className="text-slate-400 mt-0.5">Hotline Airside Safety / Emergency WHU: VHF 118.1 MHz / Ext. 5420</p>
          </div>
        </div>
      </footer>

      {/* Notification Dispatch & Management Modal */}
      <NotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        recipients={recipients}
        onUpdateRecipients={handleUpdateRecipients}
        notificationLogs={notificationLogs}
        onAddLog={handleAddNotificationLog}
        currentReportForBroadcast={broadcastReport}
      />

      {/* Document Preview Modal */}
      <ReportPreviewModal
        isOpen={previewData.isOpen}
        onClose={() => setPreviewData(prev => ({ ...prev, isOpen: false }))}
        reportType={previewData.type}
        reportData={previewData.data}
        onOpenBroadcast={handleOpenBroadcast}
      />
    </div>
  );
}
