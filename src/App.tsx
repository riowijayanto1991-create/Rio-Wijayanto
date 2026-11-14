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
  VehicleCheckForm 
} from './components/VehicleCheckForm';
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
  DutyRosterModal 
} from './components/DutyRosterModal';
import { 
  GeminiWildlifeAnalyticsModal 
} from './components/GeminiWildlifeAnalyticsModal';
import { 
  MonthlyReportDraftModal 
} from './components/MonthlyReportDraftModal';
import {
  WildlifeStrikePopulationDashboard
} from './components/WildlifeStrikePopulationDashboard';
import { WhmpRiskDashboard } from './components/WhmpRiskDashboard';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { 
  PatrolReport, 
  OccurrenceReport, 
  WildlifeStrikeReport, 
  VehicleCheckReport,
  ManagementRecipient, 
  NotificationLog,
  MonthlyReportDocument,
  OfficerDigitalSignature,
  GeminiTrendAnalysis
} from './types';
import { getCachedAnalysis } from './utils/geminiAiService';
import { 
  initialPatrolReports, 
  initialOccurrenceReports, 
  initialStrikeReports, 
  initialVehicleReports,
  initialManagementRecipients, 
  initialNotificationLogs,
  initialMonthlyDocuments 
} from './data/mockData';
import { exportAllToExcel } from './utils/excelExport';
import { playNotificationSound } from './utils/notificationService';
import { getChronologicalDocNumber, getReportPrefix } from './utils/reportNumberGenerator';
import { 
  initializeFirestoreDatabase,
  subscribeToPatrolReports,
  subscribeToOccurrenceReports,
  subscribeToStrikeReports,
  subscribeToVehicleReports,
  subscribeToManagementRecipients,
  subscribeToNotificationLogs,
  subscribeToMonthlyDocuments,
  savePatrolReportToFirestore,
  saveOccurrenceReportToFirestore,
  saveStrikeReportToFirestore,
  saveVehicleReportToFirestore,
  saveNotificationLogToFirestore,
  saveRecipientsToFirestore,
  saveMonthlyDocumentToFirestore,
  deletePatrolReportFromFirestore,
  deleteOccurrenceReportFromFirestore,
  deleteStrikeReportFromFirestore,
  deleteVehicleReportFromFirestore,
  deleteMonthlyDocumentFromFirestore,
  subscribeToActiveRosterPersonnel
} from './services/firestoreService';
import { setActiveRosterPersonnel } from './utils/dutyRosterService';
import { AdminAuthModal } from './components/AdminAuthModal';
import { UploadMonthlyReportModal } from './components/UploadMonthlyReportModal';
import { Sidebar } from './components/Sidebar';
import { SecurityAdminModal } from './components/SecurityAdminModal';
import { MfaEnrollmentModal } from './components/MfaEnrollmentModal';
import { ForcePasswordChangeModal } from './components/ForcePasswordChangeModal';
import { SecurityLoginModal } from './components/SecurityLoginModal';
import { useAuth } from './context/AuthContext';
import { 
  CheckCircle2, 
  Radio, 
  Cloud,
  CloudCheck,
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'patrol' | 'occurrence' | 'strike' | 'vehicle' | 'history' | 'wildlife-dashboard' | 'whmp-risk'
  >('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Core collections in state
  const [patrolReports, setPatrolReports] = useState<PatrolReport[]>(initialPatrolReports);
  const [occurrenceReports, setOccurrenceReports] = useState<OccurrenceReport[]>(initialOccurrenceReports);
  const [strikeReports, setStrikeReports] = useState<WildlifeStrikeReport[]>(initialStrikeReports);
  const [vehicleReports, setVehicleReports] = useState<VehicleCheckReport[]>(initialVehicleReports);
  const [recipients, setRecipients] = useState<ManagementRecipient[]>(initialManagementRecipients);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(initialNotificationLogs);
  const [monthlyDocuments, setMonthlyDocuments] = useState<MonthlyReportDocument[]>(initialMonthlyDocuments);
  const [isUploadMonthlyModalOpen, setIsUploadMonthlyModalOpen] = useState<boolean>(false);

  // Gemini AI Wildlife Hazard Trend Analysis state
  const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiTrendAnalysis | null>(() => getCachedAnalysis());
  const [isGeminiModalOpen, setIsGeminiModalOpen] = useState<boolean>(false);

  // Admin access state
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem('whu_admin_mode') === 'true');
  const [isAdminAuthModalOpen, setIsAdminAuthModalOpen] = useState<boolean>(false);

  // Enterprise RBAC & Security Modals
  const { user, isSuperAdmin, isAirportAdmin, hasPerm } = useAuth();
  const [isSecurityAdminModalOpen, setIsSecurityAdminModalOpen] = useState<boolean>(false);
  const [isMfaEnrollmentModalOpen, setIsMfaEnrollmentModalOpen] = useState<boolean>(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Edit report state
  const [editingItem, setEditingItem] = useState<{
    type: 'patrol' | 'occurrence' | 'strike' | 'vehicle';
    data: PatrolReport | OccurrenceReport | WildlifeStrikeReport | VehicleCheckReport;
  } | null>(null);

  // Map location prefill state
  const [prefilledLocation, setPrefilledLocation] = useState<{
    latitude: number;
    longitude: number;
    gridLocation: string;
    runwayTaxiway: string;
    lokasi: string;
    distanceFromArpKm: number;
  } | null>(null);

  // Cloud multi-device synchronization status
  const [syncStatus, setSyncStatus] = useState<'connecting' | 'synced' | 'error'>('connecting');
  const [lastSyncTime, setLastSyncTime] = useState<string>('Menghubungkan...');

  // Subscribe to real-time changes across all devices via Firebase Firestore
  useEffect(() => {
    let unsubPatrol = () => {};
    let unsubOcc = () => {};
    let unsubStrike = () => {};
    let unsubVehicle = () => {};
    let unsubRecipients = () => {};
    let unsubLogs = () => {};
    let unsubMonthly = () => {};

    const startSync = async () => {
      try {
        await initializeFirestoreDatabase();
        setSyncStatus('synced');
        setLastSyncTime(new Date().toLocaleTimeString('id-ID'));

        unsubPatrol = subscribeToPatrolReports((reports) => {
          setPatrolReports(reports);
          setSyncStatus('synced');
          setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
        });

        unsubOcc = subscribeToOccurrenceReports((reports) => {
          setOccurrenceReports(reports);
          setSyncStatus('synced');
          setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
        });

        unsubStrike = subscribeToStrikeReports((reports) => {
          setStrikeReports(reports);
          setSyncStatus('synced');
          setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
        });

        unsubVehicle = subscribeToVehicleReports((reports) => {
          setVehicleReports(reports);
          setSyncStatus('synced');
          setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
        });

        unsubRecipients = subscribeToManagementRecipients((recs) => {
          if (recs.length > 0) {
            setRecipients(recs);
          }
        });

        unsubLogs = subscribeToNotificationLogs((logs) => {
          setNotificationLogs(logs);
        });

        unsubMonthly = subscribeToMonthlyDocuments((docs) => {
          if (docs.length > 0) {
            setMonthlyDocuments(docs);
          }
        });

        // Real-time synchronization of Active Roster Personnel across all staff devices
        const unsubRosterPersonnel = subscribeToActiveRosterPersonnel((personnelMap) => {
          setActiveRosterPersonnel(personnelMap);
        });

        const prevUnsubMonthly = unsubMonthly;
        unsubMonthly = () => {
          prevUnsubMonthly();
          unsubRosterPersonnel();
        };
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
      unsubVehicle();
      unsubRecipients();
      unsubLogs();
      unsubMonthly();
    };
  }, []);

  // Modal states
  const [isNotifModalOpen, setIsNotifModalOpen] = useState<boolean>(false);
  const [isDutyRosterOpen, setIsDutyRosterOpen] = useState<boolean>(false);
  const [isMonthlyDraftModalOpen, setIsMonthlyDraftModalOpen] = useState<boolean>(false);
  const [dutyRosterInitialTab, setDutyRosterInitialTab] = useState<'calendar' | 'upload' | 'archive'>('calendar');

  const handleOpenDutyRoster = (tab: 'calendar' | 'upload' | 'archive' = 'calendar') => {
    setDutyRosterInitialTab(tab);
    setIsDutyRosterOpen(true);
  };
  const [broadcastReport, setBroadcastReport] = useState<{
    type: 'PATROL' | 'OCCURRENCE' | 'STRIKE' | 'VEHICLE';
    report: PatrolReport | OccurrenceReport | WildlifeStrikeReport | VehicleCheckReport;
  } | null>(null);

  // Document preview modal state
  const [previewData, setPreviewData] = useState<{
    isOpen: boolean;
    type: 'patrol' | 'occurrence' | 'strike' | 'vehicle';
    data: PatrolReport | OccurrenceReport | WildlifeStrikeReport | VehicleCheckReport | null;
    sequentialDocNumber?: string;
  }>({
    isOpen: false,
    type: 'patrol',
    data: null,
    sequentialDocNumber: undefined
  });

  // Global flash toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dark mode state with persistence (Default: Light Mode as requested)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Only enable dark mode if explicitly set by user in the new system
    const storedV2 = localStorage.getItem('whu_theme_mode_v2');
    if (storedV2 !== null) {
      return storedV2 === 'dark';
    }
    // Clean up legacy setting that was previously forcing dark mode
    try {
      localStorage.removeItem('whu_theme_mode');
    } catch {}
    return false; // Always default to Light Mode
  });

  // Desktop sidebar collapse state (230px vs 64px icon mode)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('whu_sidebar_collapsed') === 'true';
  });

  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('whu_sidebar_collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('whu_theme_mode_v2', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('whu_theme_mode_v2', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const next = !prev;
      showToast(next 
        ? 'Mode Gelap diaktifkan: Tampilan disesuaikan untuk kenyamanan visual dinas malam & pencahayaan minim.' 
        : 'Mode Terang diaktifkan.'
      );
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Handlers for saving reports with multi-device cloud persistence
  const handleSavePatrol = async (newReport: PatrolReport) => {
    const isEdit = !!editingItem && editingItem.type === 'patrol' && editingItem.data.id === newReport.id;
    setPatrolReports(prev => [newReport, ...prev.filter(p => p.id !== newReport.id)]);
    if (newReport.isDraft) {
      showToast(`Draft WOR (Wildlife Observation Report) ${newReport.reportNumber} berhasil disimpan. Anda dapat melanjutkannya kapan saja.`);
    } else {
      showToast(isEdit 
        ? `Perubahan WOR ${newReport.reportNumber} berhasil diperbarui di cloud database!`
        : `Laporan WOR (Observasi Satwa) ${newReport.reportNumber} tersimpan & disinkronkan ke seluruh personel.`
      );
    }
    playNotificationSound();
    setEditingItem(null);
    try {
      await savePatrolReportToFirestore(newReport);
    } catch (err) {
      console.error('Error saving patrol to Firestore:', err);
    }
  };

  const handleSaveOccurrence = async (newReport: OccurrenceReport) => {
    const isEdit = !!editingItem && editingItem.type === 'occurrence' && editingItem.data.id === newReport.id;
    setOccurrenceReports(prev => [newReport, ...prev.filter(o => o.id !== newReport.id)]);
    if (newReport.isDraft) {
      showToast(`Draft WHR (Wildlife Hazard Report) ${newReport.reportNumber} berhasil disimpan. Anda dapat melanjutkannya kapan saja.`);
    } else {
      showToast(isEdit
        ? `Perubahan WHR ${newReport.reportNumber} berhasil diperbarui di cloud database!`
        : `Laporan WHR (Hazard Report) ${newReport.reportNumber} berhasil disinkronkan ke cloud!`
      );
    }
    playNotificationSound();
    setEditingItem(null);
    setPrefilledLocation(null);
    try {
      await saveOccurrenceReportToFirestore(newReport);
    } catch (err) {
      console.error('Error saving occurrence to Firestore:', err);
    }
  };

  const handleSaveStrike = async (newReport: WildlifeStrikeReport) => {
    const isEdit = !!editingItem && editingItem.type === 'strike' && editingItem.data.id === newReport.id;
    setStrikeReports(prev => [newReport, ...prev.filter(s => s.id !== newReport.id)]);
    if (newReport.isDraft) {
      showToast(`Draft WSR (Wildlife Strike Report) ${newReport.reportNumber} berhasil disimpan.`);
    } else {
      showToast(isEdit
        ? `Perubahan WSR ${newReport.reportNumber} berhasil diperbarui di cloud database!`
        : `FLASH: Laporan WSR (Strike Report) ${newReport.reportNumber} disinkronkan ke cloud!`
      );
    }
    playNotificationSound();
    setEditingItem(null);
    setPrefilledLocation(null);
    if (!isEdit && !newReport.isDraft) {
      // Auto-open broadcast modal for rapid dispatch ONLY on critical new published strikes (never on drafts)
      setBroadcastReport({
        type: 'STRIKE',
        report: newReport
      });
      setIsNotifModalOpen(true);
    }
    try {
      await saveStrikeReportToFirestore(newReport);
    } catch (err) {
      console.error('Error saving strike to Firestore:', err);
    }
  };

  const handleSaveVehicle = async (newReport: VehicleCheckReport) => {
    const isEdit = !!editingItem && editingItem.type === 'vehicle' && editingItem.data.id === newReport.id;
    setVehicleReports(prev => [newReport, ...prev.filter(v => v.id !== newReport.id)]);
    if (newReport.isDraft) {
      showToast(`Draft Checklist Kendaraan ${newReport.reportNumber} berhasil disimpan.`);
    } else {
      showToast(isEdit
        ? `Perubahan Checklist Kendaraan ${newReport.reportNumber} berhasil diperbarui di cloud database!`
        : `Checklist Kendaraan ${newReport.reportNumber} tersimpan untuk serah terima tugas dinas.`
      );
    }
    playNotificationSound();
    setEditingItem(null);
    try {
      await saveVehicleReportToFirestore(newReport);
    } catch (err) {
      console.error('Error saving vehicle report to Firestore:', err);
    }
  };

  // Handler for saving digital signature to reports with auto-persistence
  const handleSaveReportSignature = async (
    type: 'patrol' | 'occurrence' | 'strike' | 'vehicle',
    reportId: string,
    roleKey: 'officer' | 'receiver' | 'supervisor',
    signature: OfficerDigitalSignature
  ) => {
    let updatedReport: any = null;

    if (type === 'patrol') {
      setPatrolReports(prev =>
        prev.map(p => {
          if (p.id === reportId) {
            updatedReport = {
              ...p,
              signatures: {
                ...p.signatures,
                [roleKey]: signature
              }
            };
            return updatedReport;
          }
          return p;
        })
      );
      if (updatedReport) {
        savePatrolReportToFirestore(updatedReport).catch(console.error);
      }
    } else if (type === 'occurrence') {
      setOccurrenceReports(prev =>
        prev.map(o => {
          if (o.id === reportId) {
            updatedReport = {
              ...o,
              signatures: {
                ...o.signatures,
                [roleKey]: signature
              }
            };
            return updatedReport;
          }
          return o;
        })
      );
      if (updatedReport) {
        saveOccurrenceReportToFirestore(updatedReport).catch(console.error);
      }
    } else if (type === 'strike') {
      setStrikeReports(prev =>
        prev.map(s => {
          if (s.id === reportId) {
            updatedReport = {
              ...s,
              signatures: {
                ...s.signatures,
                [roleKey]: signature
              }
            };
            return updatedReport;
          }
          return s;
        })
      );
      if (updatedReport) {
        saveStrikeReportToFirestore(updatedReport).catch(console.error);
      }
    } else if (type === 'vehicle') {
      setVehicleReports(prev =>
        prev.map(v => {
          if (v.id === reportId) {
            updatedReport = {
              ...v,
              signatures: {
                ...v.signatures,
                [roleKey]: signature
              }
            };
            return updatedReport;
          }
          return v;
        })
      );
      if (updatedReport) {
        saveVehicleReportToFirestore(updatedReport).catch(console.error);
      }
    }

    if (previewData.isOpen && previewData.data && previewData.data.id === reportId) {
      setPreviewData(prev => ({
        ...prev,
        data: {
          ...prev.data,
          signatures: {
            ...prev.data?.signatures,
            [roleKey]: signature
          }
        }
      }));
    }

    showToast(`Tanda tangan digital (${roleKey.toUpperCase()}) berhasil disahkan pada dokumen!`);
    playNotificationSound();
  };

  // Handlers for monthly report documents archive (PDF & Word)
  const handleSaveMonthlyDocument = async (newDoc: MonthlyReportDocument) => {
    setMonthlyDocuments(prev => [newDoc, ...prev.filter(d => d.id !== newDoc.id)]);
    showToast(`Dokumen "${newDoc.title}" (${newDoc.fileName}) berhasil diarsipkan ke database!`);
    playNotificationSound();
    try {
      await saveMonthlyDocumentToFirestore(newDoc);
    } catch (err) {
      console.error('Error saving monthly document to Firestore:', err);
    }
  };

  const handleDeleteMonthlyDocument = async (id: string, title: string) => {
    setMonthlyDocuments(prev => prev.filter(d => d.id !== id));
    showToast(`Dokumen "${title}" telah dihapus dari arsip.`);
    try {
      await deleteMonthlyDocumentFromFirestore(id);
    } catch (err) {
      console.error('Error deleting monthly document from Firestore:', err);
    }
  };

  // Handler for editing an existing report
  const handleEditReport = (
    type: 'patrol' | 'occurrence' | 'strike' | 'vehicle', 
    report: PatrolReport | OccurrenceReport | WildlifeStrikeReport | VehicleCheckReport
  ) => {
    setEditingItem({ type, data: report });
    setCurrentTab(type);
    showToast(`Membuka mode edit untuk dokumen ${report.reportNumber}`);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setPrefilledLocation(null);
  };

  const handleCreateReportWithLocation = (type: 'occurrence' | 'strike', locationData: {
    latitude: number;
    longitude: number;
    gridLocation: string;
    runwayTaxiway: string;
    lokasi: string;
    distanceFromArpKm: number;
  }) => {
    setEditingItem(null);
    setPrefilledLocation(locationData);
    setCurrentTab(type);
    showToast(`Membuka form ${type === 'occurrence' ? 'WHR — Wildlife Hazard Report' : 'WSR — Wildlife Strike Report'} di ${locationData.runwayTaxiway}`);
  };

  // Open Broadcast modal helper
  const handleOpenBroadcast = (
    type: 'PATROL' | 'OCCURRENCE' | 'STRIKE' | 'VEHICLE', 
    report: any
  ) => {
    setBroadcastReport({ type: type as any, report });
    setIsNotifModalOpen(true);
  };

  // Handle Preview Document
  const handlePreviewReport = (type: 'patrol' | 'occurrence' | 'strike' | 'vehicle', id: string) => {
    let foundData: any = null;
    let listForSeq: any[] = [];
    if (type === 'patrol') {
      foundData = patrolReports.find(p => p.id === id);
      listForSeq = patrolReports;
    } else if (type === 'occurrence') {
      foundData = occurrenceReports.find(o => o.id === id);
      listForSeq = occurrenceReports;
    } else if (type === 'strike') {
      foundData = strikeReports.find(s => s.id === id);
      listForSeq = strikeReports;
    } else {
      foundData = vehicleReports.find(v => v.id === id);
      listForSeq = vehicleReports;
    }

    if (foundData) {
      const seqDocNum = getChronologicalDocNumber(foundData, listForSeq, getReportPrefix(type));
      setPreviewData({
        isOpen: true,
        type: type as any,
        data: foundData,
        sequentialDocNumber: seqDocNum
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

  // Handler for Admin deletion of reports
  const handleDeleteReport = async (
    type: 'patrol' | 'occurrence' | 'strike' | 'vehicle', 
    id: string, 
    reportNumber: string
  ) => {
    try {
      if (type === 'patrol') {
        setPatrolReports(prev => prev.filter(p => p.id !== id));
        await deletePatrolReportFromFirestore(id);
      } else if (type === 'occurrence') {
        setOccurrenceReports(prev => prev.filter(o => o.id !== id));
        await deleteOccurrenceReportFromFirestore(id);
      } else if (type === 'strike') {
        setStrikeReports(prev => prev.filter(s => s.id !== id));
        await deleteStrikeReportFromFirestore(id);
      } else if (type === 'vehicle') {
        setVehicleReports(prev => prev.filter(v => v.id !== id));
        await deleteVehicleReportFromFirestore(id);
      }

      showToast(`Laporan ${reportNumber} berhasil dihapus oleh Admin dari arsip dan cloud database.`);
      playNotificationSound();
    } catch (error) {
      console.error('Error deleting report:', error);
      showToast(`Gagal menghapus laporan ${reportNumber}: ${error instanceof Error ? error.message : 'Terjadi kesalahan'}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-slate-950 flex font-sans text-[#0F172A] dark:text-slate-100 transition-colors duration-200">
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

      {/* Left Sidebar Navigation (Desktop permanent + Mobile slide-over) */}
      <Sidebar
        activeTab={currentTab}
        setActiveTab={(tab) => {
          if (tab === 'notifications') {
            setBroadcastReport(null);
            setIsNotifModalOpen(true);
          } else {
            if (editingItem && tab !== editingItem.type) {
              setEditingItem(null);
            }
            setCurrentTab(tab);
          }
        }}
        unreadCount={notificationLogs.length}
        onOpenNotifications={() => {
          setBroadcastReport(null);
          setIsNotifModalOpen(true);
        }}
        onExportAllExcel={() => exportAllToExcel(patrolReports, occurrenceReports, strikeReports, vehicleReports)}
        isAdmin={isAdmin}
        onOpenAdminAuth={() => setIsAdminAuthModalOpen(true)}
        onLogoutAdmin={() => {
          localStorage.removeItem('whu_admin_mode');
          setIsAdmin(false);
          showToast('Akses Administrator telah dikunci.');
        }}
        onOpenDutyRoster={() => handleOpenDutyRoster('calendar')}
        onOpenUploadRoster={() => handleOpenDutyRoster('upload')}
        onOpenGeminiAnalytics={() => setIsGeminiModalOpen(true)}
        onOpenMonthlyDraft={() => setIsMonthlyDraftModalOpen(true)}
        onOpenSecurityAdmin={() => setIsSecurityAdminModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapsed}
        counts={{
          patrols: patrolReports.length,
          occurrences: occurrenceReports.length,
          strikes: strikeReports.length,
          vehicles: vehicleReports.length
        }}
      />

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Main Navigation Top Bar (Max 56px, 1 Row) */}
        <Header
          activeTab={currentTab}
          setActiveTab={(tab) => {
            if (tab === 'notifications') {
              setBroadcastReport(null);
              setIsNotifModalOpen(true);
            } else {
              if (editingItem && tab !== editingItem.type) {
                setEditingItem(null);
              }
              setCurrentTab(tab);
            }
          }}
          unreadCount={notificationLogs.length}
          onOpenNotifications={() => {
            setBroadcastReport(null);
            setIsNotifModalOpen(true);
          }}
          onExportAllExcel={() => exportAllToExcel(patrolReports, occurrenceReports, strikeReports, vehicleReports)}
          isAdmin={isAdmin}
          onOpenAdminAuth={() => setIsAdminAuthModalOpen(true)}
          onLogoutAdmin={() => {
            localStorage.removeItem('whu_admin_mode');
            setIsAdmin(false);
            showToast('Akses Administrator telah dikunci.');
          }}
          onOpenDutyRoster={() => handleOpenDutyRoster('calendar')}
          onOpenUploadRoster={() => handleOpenDutyRoster('upload')}
          onOpenGeminiAnalytics={() => setIsGeminiModalOpen(true)}
          onOpenMonthlyDraft={() => setIsMonthlyDraftModalOpen(true)}
          onOpenSecurityAdmin={() => setIsSecurityAdminModalOpen(true)}
          onOpenLogin={() => setIsLoginModalOpen(true)}
          onOpenMfaEnrollment={() => setIsMfaEnrollmentModalOpen(true)}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          syncStatus={syncStatus}
          lastSyncTime={lastSyncTime}
        />

      {/* Main View Area with Tab Transitions */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6">
        <div
          key={currentTab}
          className="tab-transition-enter"
        >
            {currentTab === 'dashboard' && (
              <Dashboard
                patrols={patrolReports}
                occurrences={occurrenceReports}
                strikes={strikeReports}
                vehicles={vehicleReports}
                monthlyDocuments={monthlyDocuments}
                onNavigateToForm={(type) => {
                  setEditingItem(null);
                  setCurrentTab(type);
                }}
                onPreviewReport={handlePreviewReport}
                onOpenBroadcast={handleOpenBroadcast}
                onOpenUploadMonthly={() => setIsUploadMonthlyModalOpen(true)}
                onCreateReportWithLocation={handleCreateReportWithLocation}
                onOpenDutyRoster={() => handleOpenDutyRoster('calendar')}
                onOpenUploadRoster={() => handleOpenDutyRoster('upload')}
                geminiAnalysis={geminiAnalysis}
                onOpenGeminiAnalytics={() => setIsGeminiModalOpen(true)}
                onOpenMonthlyDraft={() => setIsMonthlyDraftModalOpen(true)}
                onNavigateToHistory={() => {
                  setEditingItem(null);
                  setPrefilledLocation(null);
                  setCurrentTab('history');
                }}
              />
            )}

            {currentTab === 'patrol' && (
              <PatrolForm
                initialData={editingItem?.type === 'patrol' ? (editingItem.data as PatrolReport) : null}
                isEditMode={editingItem?.type === 'patrol'}
                existingReports={patrolReports}
                onCancelEdit={handleCancelEdit}
                onSaveReport={handleSavePatrol}
                onOpenBroadcast={(rep) => handleOpenBroadcast('PATROL', rep)}
                onOpenDutyRoster={() => handleOpenDutyRoster('calendar')}
                onNavigateToHistory={() => {
                  setEditingItem(null);
                  setPrefilledLocation(null);
                  setCurrentTab('history');
                }}
              />
            )}

            {currentTab === 'occurrence' && (
              <OccurrenceForm
                initialData={
                  editingItem?.type === 'occurrence'
                    ? (editingItem.data as OccurrenceReport)
                    : prefilledLocation
                    ? ({
                        lokasi: prefilledLocation.lokasi,
                        gridLocation: prefilledLocation.gridLocation,
                        runwayTaxiwayArea: prefilledLocation.runwayTaxiway,
                        coordinates: {
                          latitude: prefilledLocation.latitude,
                          longitude: prefilledLocation.longitude,
                          distanceFromArpKm: prefilledLocation.distanceFromArpKm
                        }
                      } as OccurrenceReport)
                    : null
                }
                isEditMode={editingItem?.type === 'occurrence'}
                existingReports={occurrenceReports}
                onCancelEdit={handleCancelEdit}
                onSaveReport={handleSaveOccurrence}
                onOpenBroadcast={(rep) => handleOpenBroadcast('OCCURRENCE', rep)}
                onOpenDutyRoster={() => handleOpenDutyRoster('calendar')}
                onNavigateToHistory={() => {
                  setEditingItem(null);
                  setPrefilledLocation(null);
                  setCurrentTab('history');
                }}
              />
            )}

            {currentTab === 'strike' && (
              <StrikeForm
                initialData={
                  editingItem?.type === 'strike'
                    ? (editingItem.data as WildlifeStrikeReport)
                    : prefilledLocation
                    ? ({
                        lokasi: prefilledLocation.lokasi,
                        gridLocation: prefilledLocation.gridLocation,
                        runwayTaxiway: prefilledLocation.runwayTaxiway,
                        coordinates: {
                          latitude: prefilledLocation.latitude,
                          longitude: prefilledLocation.longitude,
                          distanceFromArpKm: prefilledLocation.distanceFromArpKm
                        }
                      } as WildlifeStrikeReport)
                    : null
                }
                isEditMode={editingItem?.type === 'strike'}
                existingReports={strikeReports}
                onCancelEdit={handleCancelEdit}
                onSaveReport={handleSaveStrike}
                onOpenBroadcast={(rep) => handleOpenBroadcast('STRIKE', rep)}
                onOpenDutyRoster={() => handleOpenDutyRoster('calendar')}
                onNavigateToHistory={() => {
                  setEditingItem(null);
                  setPrefilledLocation(null);
                  setCurrentTab('history');
                }}
              />
            )}

            {currentTab === 'vehicle' && (
              <VehicleCheckForm
                initialData={editingItem?.type === 'vehicle' ? (editingItem.data as VehicleCheckReport) : null}
                isEditMode={editingItem?.type === 'vehicle'}
                existingReports={vehicleReports}
                onCancelEdit={handleCancelEdit}
                onSaveReport={handleSaveVehicle}
                onOpenBroadcast={(rep) => handleOpenBroadcast('VEHICLE', rep)}
                onOpenDutyRoster={() => handleOpenDutyRoster('calendar')}
                onNavigateToHistory={() => {
                  setEditingItem(null);
                  setCurrentTab('history');
                }}
              />
            )}

            {currentTab === 'history' && (
              <ReportHistory
                patrols={patrolReports}
                occurrences={occurrenceReports}
                strikes={strikeReports}
                vehicles={vehicleReports}
                monthlyDocuments={monthlyDocuments}
                onPreviewReport={handlePreviewReport}
                onEditReport={handleEditReport}
                onOpenBroadcast={handleOpenBroadcast}
                onDeleteReport={handleDeleteReport}
                onOpenUploadMonthlyModal={() => setIsUploadMonthlyModalOpen(true)}
                onDeleteMonthlyDocument={handleDeleteMonthlyDocument}
                onOpenMonthlyDraft={() => setIsMonthlyDraftModalOpen(true)}
                onOpenDutyRoster={() => handleOpenDutyRoster('calendar')}
                onOpenUploadRoster={() => handleOpenDutyRoster('upload')}
                isAdmin={isAdmin}
                setIsAdmin={setIsAdmin}
              />
            )}

            {currentTab === 'wildlife-dashboard' && (
              <WildlifeStrikePopulationDashboard
                patrols={patrolReports}
                occurrences={occurrenceReports}
                strikes={strikeReports}
                monthlyDocuments={monthlyDocuments}
                onNavigateToForm={(type) => {
                  setEditingItem(null);
                  setCurrentTab(type);
                }}
                onOpenUploadMonthly={() => setIsUploadMonthlyModalOpen(true)}
              />
            )}

            {currentTab === 'whmp-risk' && (
              <WhmpRiskDashboard
                patrols={patrolReports}
                occurrences={occurrenceReports}
                strikes={strikeReports}
                onOpenReportForm={(type) => {
                  setEditingItem(null);
                  setCurrentTab(type);
                }}
              />
            )}
        </div>
      </main>

      {/* Slim Compact Footer */}
      <footer className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[11px] border-t border-slate-200 dark:border-slate-800 py-2.5 px-4 sm:px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap text-center sm:text-left">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              WHMS Live System
            </span>
            <span>•</span>
            <span>PT Angkasa Pura Indonesia</span>
            <span>•</span>
            <span className="text-slate-400 dark:text-slate-500">SOP ICAO Annex 14 &amp; Doc 9137 Part 3 / KP 326</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            <span>Airside Safety VHF 118.1 MHz</span>
            <span>•</span>
            <button
              type="button"
              onClick={() => exportAllToExcel(patrolReports, occurrenceReports, strikeReports, vehicleReports)}
              className="text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              Unduh Excel
            </button>
          </div>
        </div>
      </footer>

      {/* Modal Unggah Laporan Bulanan Terdahulu (PDF / Word) */}
      <UploadMonthlyReportModal
        isOpen={isUploadMonthlyModalOpen}
        onClose={() => setIsUploadMonthlyModalOpen(false)}
        onSaveDocument={handleSaveMonthlyDocument}
      />

      {/* Admin Authentication Modal */}
      <AdminAuthModal
        isOpen={isAdminAuthModalOpen}
        onClose={() => setIsAdminAuthModalOpen(false)}
        onSuccess={() => {
          setIsAdmin(true);
          showToast('Akses Administrator aktif (Wildlife Hazard Department Head). Hak hapus laporan terbuka.');
        }}
        title="Otorisasi Administrator WHU"
        description="Masukkan PIN atau Sandi Administrator untuk mengaktifkan wewenang penghapusan arsip dan manajemen data tingkat lanjut."
      />

      {/* Notification Dispatch & Management Modal */}
      <NotificationModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        currentReportForBroadcast={broadcastReport}
      />

      {/* Document Preview Modal */}
      <ReportPreviewModal
        isOpen={previewData.isOpen}
        onClose={() => setPreviewData(prev => ({ ...prev, isOpen: false }))}
        reportType={previewData.type}
        reportData={previewData.data}
        sequentialDocNumber={previewData.sequentialDocNumber}
        onOpenBroadcast={handleOpenBroadcast}
        onEditReport={handleEditReport}
        onSaveReportSignature={handleSaveReportSignature}
      />

      {/* Duty Roster Modal Calendar & Personnel */}
      <DutyRosterModal
        isOpen={isDutyRosterOpen}
        onClose={() => setIsDutyRosterOpen(false)}
        initialTab={dutyRosterInitialTab}
      />

      {/* Gemini AI Wildlife Hazard Trend Analytics & Mitigation Modal */}
      <GeminiWildlifeAnalyticsModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        patrols={patrolReports}
        occurrences={occurrenceReports}
        strikes={strikeReports}
        currentAnalysis={geminiAnalysis}
        onAnalysisUpdated={(newAnalysis) => {
          setGeminiAnalysis(newAnalysis);
          showToast('Analisis Tren Gemini AI & rekomendasi mitigasi berhasil diperbarui!');
        }}
      />

      {/* Modal Draft Laporan Bulanan JSON (Siap Integrasi Template Word / PDF) */}
      <MonthlyReportDraftModal
        isOpen={isMonthlyDraftModalOpen}
        onClose={() => setIsMonthlyDraftModalOpen(false)}
        patrols={patrolReports}
        occurrences={occurrenceReports}
        strikes={strikeReports}
        onSavedToArchive={async (newDoc) => {
          setMonthlyDocuments(prev => [newDoc, ...prev.filter(d => d.id !== newDoc.id)]);
          showToast(`Draft "${newDoc.title}" berhasil diarsipkan ke sistem Arsip Laporan Bulanan!`);
          playNotificationSound();
          try {
            await saveMonthlyDocumentToFirestore(newDoc);
          } catch (err) {
            console.error('Error syncing draft document to Firestore:', err);
          }
        }}
      />

      {/* Enterprise RBAC & Security Admin Console */}
      <SecurityAdminModal
        isOpen={isSecurityAdminModalOpen}
        onClose={() => setIsSecurityAdminModalOpen(false)}
      />

      {/* MFA Authenticator Enrollment Modal */}
      <MfaEnrollmentModal
        isOpen={isMfaEnrollmentModalOpen}
        onClose={() => setIsMfaEnrollmentModalOpen(false)}
        onSuccess={() => showToast('MFA Authenticator berhasil diamankan untuk akun Anda!')}
      />

      {/* Forced Password Change for New/Bootstrap Accounts */}
      <ForcePasswordChangeModal
        isOpen={!!user?.mustChangePassword}
        onSuccess={(requiresMfa) => {
          showToast('Kata sandi berhasil diperbarui sesuai kebijakan keamanan.');
          if (requiresMfa) {
            setIsMfaEnrollmentModalOpen(true);
          }
        }}
      />

      {/* Security Login & Role Switching Modal */}
      <SecurityLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onSuccess={() => showToast('Berhasil terotentikasi ke sistem WHMS.')}
      />

      {/* PWA In-App Mobile Banner & Offline Indicator */}
      <PWAInstallButton variant="banner" />
      <OfflineIndicator />
      </div>
    </div>
  );
}
