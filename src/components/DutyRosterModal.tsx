import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Calendar, 
  Clock, 
  X, 
  Users, 
  Shield, 
  CheckCircle2, 
  Award, 
  FileText,
  Search, 
  Filter, 
  ArrowRight, 
  Sun, 
  Moon,
  Upload,
  FileSpreadsheet,
  Download,
  Trash2,
  Eye,
  AlertCircle,
  Sparkles,
  Layers,
  FolderArchive,
  RefreshCw,
  Table,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Check
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  OFFICIAL_ROSTER_PERSONNEL, 
  getActiveDutyInfo, 
  getMonthRosterList, 
  DayShiftInfo,
  setActiveRosterPersonnel,
  getActiveRosterPersonnel,
  resetToOfficialRosterPersonnel,
  RosterPersonnel
} from '../utils/dutyRosterService';
import { Pleton, Dinas, DutyRosterDocument, DutyRosterPersonnel, DutyRosterDayEntry } from '../types';
import { parseDutyRosterPdf } from '../utils/pdfParser';
import { 
  parseDutyRosterFromExcel, 
  parseDutyRosterFromPdf, 
  ParsedRosterScheduleResult,
  normalizePletonName 
} from '../utils/dutyRosterParser';
import { PdfCanvasViewer } from './PdfCanvasViewer';
import { 
  subscribeToDutyRosterDocuments, 
  saveDutyRosterDocumentToFirestore, 
  deleteDutyRosterDocumentFromFirestore,
  saveActiveRosterPersonnelToFirestore,
  subscribeToActiveRosterPersonnel
} from '../services/firestoreService';
import { 
  saveRosterLocally, 
  getRosterWithFileData, 
  deleteRosterLocally, 
  mergeRostersWithLocalCache,
  getAllLocalRosters
} from '../utils/documentStorage';
import { OFFICIAL_OCTOBER_ROSTER_DOCUMENT } from '../data/officialOctoberRoster';

interface DutyRosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectShift?: (pleton: Pleton, dinas: Dinas, podList: string[], dateStr?: string) => void;
  initialTab?: 'calendar' | 'upload' | 'archive';
}

const BULAN_OPTIONS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const TAHUN_OPTIONS = [2027, 2026, 2025, 2024];

export const DutyRosterModal: React.FC<DutyRosterModalProps> = ({
  isOpen,
  onClose,
  onSelectShift,
  initialTab = 'calendar'
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'calendar' | 'upload' | 'archive'>(initialTab);

  // Synchronize activeTab when modal opens with a requested tab (e.g. direct 'upload' mode)
  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Calendar view state
  const [selectedPletonFilter, setSelectedPletonFilter] = useState<'ALL' | 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Roster archive state
  const [rosterDocuments, setRosterDocuments] = useState<DutyRosterDocument[]>([]);
  const [archiveSearch, setArchiveSearch] = useState<string>('');
  const [archiveFormatFilter, setArchiveFormatFilter] = useState<'all' | 'excel' | 'pdf'>('all');
  const [previewRosterDoc, setPreviewRosterDoc] = useState<DutyRosterDocument | null>(null);
  const [docToDelete, setDocToDelete] = useState<{ id: string; title: string } | null>(null);

  // Excel viewer inside preview state
  const [previewActiveSheet, setPreviewActiveSheet] = useState<string>('');
  const [previewSheetNames, setPreviewSheetNames] = useState<string[]>([]);
  const [previewSheetRows, setPreviewSheetRows] = useState<any[][]>([]);
  const [previewSearch, setPreviewSearch] = useState<string>('');
  const [previewTab, setPreviewTab] = useState<'document' | 'personnel'>('document');

  const filteredPreviewRows = useMemo(() => {
    if (!previewSearch.trim()) return previewSheetRows;
    const q = previewSearch.toLowerCase();
    return previewSheetRows.filter((row) => 
      Array.isArray(row) && row.some(cell => String(cell || '').toLowerCase().includes(q))
    );
  }, [previewSheetRows, previewSearch]);

  // Upload form state
  const currentMonthIdx = new Date().getMonth();
  const defaultMonth = BULAN_OPTIONS[currentMonthIdx];
  const defaultYear = new Date().getFullYear();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileFormat, setFileFormat] = useState<'excel' | 'pdf'>('excel');
  const [rosterTitle, setRosterTitle] = useState<string>(`Roster Dinas WHU - ${defaultMonth} ${defaultYear}`);
  const [periodeBulan, setPeriodeBulan] = useState<string>(defaultMonth);
  const [periodeTahun, setPeriodeTahun] = useState<number>(defaultYear);
  const [pletonTarget, setPletonTarget] = useState<string>('Semua Pleton (4 Pleton)');
  const [statusDokumen, setStatusDokumen] = useState<'Resmi Berlaku' | 'Revisi / Pengganti' | 'Draft / Usulan'>('Resmi Berlaku');
  const [uploadedBy, setUploadedBy] = useState<string>('Staff / Admin WHU');
  const [keterangan, setKeterangan] = useState<string>('');

  // Uploaded Excel parsing analysis
  const [parsedSheetNames, setParsedSheetNames] = useState<string[]>([]);
  const [parsedTotalRows, setParsedTotalRows] = useState<number>(0);
  const [excelPreviewRows, setExcelPreviewRows] = useState<any[][]>([]);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);

  // Instant Personnel & Shift Detection State (Nama, NIK, Pleton)
  const [detectedPersonnel, setDetectedPersonnel] = useState<DutyRosterPersonnel[]>([]);
  const [detectedPletonMembers, setDetectedPletonMembers] = useState<Record<string, DutyRosterPersonnel[]>>({
    ALPHA: [],
    BRAVO: [],
    CHARLIE: [],
    DELTA: []
  });
  const [detectedDailyEntries, setDetectedDailyEntries] = useState<DutyRosterDayEntry[]>([]);
  const [isParsingRoster, setIsParsingRoster] = useState<boolean>(false);
  const [detectedPletonFilter, setDetectedPletonFilter] = useState<'ALL' | 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA'>('ALL');
  const [showDailyScheduleInPreview, setShowDailyScheduleInPreview] = useState<boolean>(false);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadSuccessMessage, setUploadSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to Duty Roster collection from Firestore + local IndexedDB
  useEffect(() => {
    if (!isOpen) return;

    const syncCalendarToRelevantDoc = (docsList: DutyRosterDocument[]) => {
      if (!docsList || docsList.length === 0) return;
      const activeDocs = docsList.filter(d => d.status === 'Aktif');
      const nowMonthName = BULAN_OPTIONS[new Date().getMonth()];
      const nowYear = new Date().getFullYear();
      const currentMonthDoc = activeDocs.find(
        d => d.periodeBulan.toLowerCase() === nowMonthName.toLowerCase() && d.periodeTahun === nowYear
      );
      if (currentMonthDoc) {
        setCalendarMonth(new Date().getMonth());
        setCalendarYear(nowYear);
      } else if (activeDocs.length > 0) {
        const latest = activeDocs[0];
        const mIdx = BULAN_OPTIONS.findIndex(b => b.toLowerCase() === latest.periodeBulan.toLowerCase());
        if (mIdx !== -1) {
          setCalendarMonth(mIdx);
          setCalendarYear(latest.periodeTahun);
        }
      }
    };

    // Load locally saved rosters immediately
    getAllLocalRosters().then((localDocs) => {
      if (localDocs && localDocs.length > 0) {
        setRosterDocuments((prev) => (prev.length === 0 ? localDocs : prev));
        syncCalendarToRelevantDoc(localDocs);
      }
    }).catch(() => {});

    const unsub = subscribeToDutyRosterDocuments(
      async (docs) => {
        try {
          const merged = await mergeRostersWithLocalCache(docs);
          setRosterDocuments(merged);
          syncCalendarToRelevantDoc(merged);
          if (!docs.some(d => d.periodeBulan.toLowerCase() === 'oktober' && d.periodeTahun === 2026)) {
            saveDutyRosterDocumentToFirestore(OFFICIAL_OCTOBER_ROSTER_DOCUMENT).catch(() => {});
          }
        } catch {
          setRosterDocuments(docs);
          syncCalendarToRelevantDoc(docs);
        }
      },
      async (err) => {
        console.warn('Subscription error fallback to local storage:', err);
        try {
          const localDocs = await getAllLocalRosters();
          if (localDocs && localDocs.length > 0) {
            setRosterDocuments(localDocs);
            syncCalendarToRelevantDoc(localDocs);
          }
        } catch {
          // ignore
        }
      }
    );

    // Real-time synchronization of Active Roster Personnel across all staff devices
    const unsubPersonnel = subscribeToActiveRosterPersonnel((personnel) => {
      if (personnel && personnel.ALPHA && personnel.BRAVO && personnel.CHARLIE && personnel.DELTA) {
        setActiveRosterPersonnel(personnel);
        setActivePersonnelMap(personnel);
      }
    });

    return () => {
      unsub();
      unsubPersonnel();
    };
  }, [isOpen]);

  // Personnel state & editing dialog state
  const [activePersonnelMap, setActivePersonnelMap] = useState<Record<'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA', RosterPersonnel[]>>(getActiveRosterPersonnel());
  const [isEditingPersonnel, setIsEditingPersonnel] = useState<boolean>(false);
  const [editPersonnelDraft, setEditPersonnelDraft] = useState<Record<'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA', RosterPersonnel[]>>(getActiveRosterPersonnel());
  const [personnelSaveLoading, setPersonnelSaveLoading] = useState<boolean>(false);
  const [personnelFeedbackMsg, setPersonnelFeedbackMsg] = useState<string | null>(null);

  // Calendar view month & year navigation state (default to current month, e.g. Oktober 2026)
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());

  const activeInfo = getActiveDutyInfo();

  // Find if an active uploaded roster document exists for the currently selected calendar month & year
  const activeUploadedDocForMonth = useMemo(() => {
    const monthName = BULAN_OPTIONS[calendarMonth];
    return rosterDocuments.find(
      doc => doc.periodeTahun === calendarYear && 
             doc.periodeBulan.toLowerCase() === monthName.toLowerCase() &&
             doc.status === 'Aktif'
    );
  }, [rosterDocuments, calendarYear, calendarMonth]);

  const monthRoster = useMemo(() => {
    const baseSchedule = getMonthRosterList(calendarYear, calendarMonth);

    // If an active uploaded document with parsed entries exists, overlay with uploaded schedule!
    if (activeUploadedDocForMonth && activeUploadedDocForMonth.parsedEntries && activeUploadedDocForMonth.parsedEntries.length > 0) {
      const entryMap = new Map<number, DutyRosterDayEntry>();
      activeUploadedDocForMonth.parsedEntries.forEach(entry => entryMap.set(entry.tanggal, entry));

      return baseSchedule.map(day => {
        const uploadedEntry = entryMap.get(day.dayNumber);
        if (!uploadedEntry) return day;

        const pagiNorm = normalizePletonName(uploadedEntry.pagiPleton);
        const malamNorm = normalizePletonName(uploadedEntry.malamPleton);
        const pagiPleton = pagiNorm.fullName;
        const malamPleton = malamNorm.fullName;
        const pagiCode = pagiNorm.code;
        const malamCode = malamNorm.code;

        // Parse staff names
        const pagiPersonnel: RosterPersonnel[] = uploadedEntry.pagiPetugas 
          ? uploadedEntry.pagiPetugas.split(',').map(s => {
              const trimmed = s.trim();
              const nikMatch = trimmed.match(/\((\d+)\)/);
              const nama = trimmed.replace(/\(\d+\)/, '').trim();
              return { nama, nik: nikMatch ? nikMatch[1] : '-', pleton: pagiPleton, pletonCode: pagiCode, jabatan: 'Petugas WHU' };
            })
          : day.pagiPersonnel;

        const malamPersonnel: RosterPersonnel[] = uploadedEntry.malamPetugas
          ? uploadedEntry.malamPetugas.split(',').map(s => {
              const trimmed = s.trim();
              const nikMatch = trimmed.match(/\((\d+)\)/);
              const nama = trimmed.replace(/\(\d+\)/, '').trim();
              return { nama, nik: nikMatch ? nikMatch[1] : '-', pleton: malamPleton, pletonCode: malamCode, jabatan: 'Petugas WHU' };
            })
          : day.malamPersonnel;

        return {
          ...day,
          pagiPleton,
          pagiPletonCode: pagiCode,
          pagiPersonnel,
          malamPleton,
          malamPletonCode: malamCode,
          malamPersonnel
        };
      });
    }

    return baseSchedule;
  }, [calendarYear, calendarMonth, activeUploadedDocForMonth]);

  const todayDate = new Date();
  const isCurrentViewingMonth = todayDate.getFullYear() === calendarYear && todayDate.getMonth() === calendarMonth;
  const todayDayNumber = isCurrentViewingMonth ? todayDate.getDate() : -1;

  const getPletonBadgeStyle = (code: 'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA' | string) => {
    switch (code) {
      case 'ALPHA':
      case 'Pleton Alpha':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'BRAVO':
      case 'Pleton Bravo':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'CHARLIE':
      case 'Pleton Charlie':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'DELTA':
      case 'Pleton Delta':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const filteredDays = monthRoster.filter(day => {
    if (selectedPletonFilter !== 'ALL') {
      const matchPagi = day.pagiPletonCode === selectedPletonFilter;
      const matchMalam = day.malamPletonCode === selectedPletonFilter;
      if (!matchPagi && !matchMalam) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inPagiNames = day.pagiPersonnel.some(p => p.nama.toLowerCase().includes(q) || p.nik.includes(q));
      const inMalamNames = day.malamPersonnel.some(p => p.nama.toLowerCase().includes(q) || p.nik.includes(q));
      const inDayNum = String(day.dayNumber).includes(q);
      return inPagiNames || inMalamNames || inDayNum;
    }

    return true;
  });

  // Handle file selection for upload
  const handleFileSelection = async (file: File) => {
    setErrorMessage(null);
    setUploadNotice(null);
    setParsedSheetNames([]);
    setParsedTotalRows(0);
    setExcelPreviewRows([]);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isExcel = ext === 'xlsx' || ext === 'xls' || ext === 'csv' || file.type.includes('spreadsheet') || file.type.includes('excel');
    const isPdf = ext === 'pdf' || file.type.includes('pdf');

    if (!isExcel && !isPdf) {
      setErrorMessage('Format file tidak didukung. Mohon unggah dokumen Roster Dinas dalam format Excel (.xlsx / .xls) atau PDF (.pdf).');
      return;
    }

    const maxSizeBytes = 25 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMessage(`Ukuran file terlalu besar (${(file.size / (1024 * 1024)).toFixed(1)} MB). Batas maksimum adalah 25 MB.`);
      return;
    }

    setSelectedFile(file);
    const format = isExcel ? 'excel' : 'pdf';
    setFileFormat(format);
    setIsParsingRoster(true);

    let parsedResult: ParsedRosterScheduleResult | null = null;

    // 1. If Excel, inspect sheets & read roster data
    if (isExcel) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheets = workbook.SheetNames || [];
        setParsedSheetNames(sheets);

        if (sheets.length > 0) {
          const firstSheet = workbook.Sheets[sheets[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
          setParsedTotalRows(rows.length);
          setExcelPreviewRows(rows.slice(0, 15));
        }

        parsedResult = await parseDutyRosterFromExcel(file, file.name, file.lastModified);
      } catch (err) {
        console.warn('Error reading Excel roster:', err);
      }
    }

    // 2. If PDF, parse month, year, pleton, and personnel entries
    if (isPdf) {
      try {
        parsedResult = await parseDutyRosterFromPdf(file, file.name, file.lastModified);
      } catch (err) {
        console.warn('Error reading PDF roster:', err);
      }
    }

    // 3. Immediately apply detected results based on file date & content
    let targetMonth = parsedResult?.bulan;
    let targetYear = parsedResult?.tahun;
    let dateSource = 'konten berkas';

    // Fallback to file date metadata (file.lastModified) if not explicitly declared in text
    if ((!targetMonth || !targetYear) && file.lastModified) {
      const fileDate = new Date(file.lastModified);
      if (!isNaN(fileDate.getTime())) {
        if (!targetMonth) {
          targetMonth = BULAN_OPTIONS[fileDate.getMonth()];
          dateSource = 'metadata tanggal modifikasi file';
        }
        if (!targetYear) {
          targetYear = fileDate.getFullYear();
        }
      }
    }

    const canonicalBulan = targetMonth
      ? (BULAN_OPTIONS.find(b => b.toLowerCase() === targetMonth.toLowerCase()) || targetMonth)
      : defaultMonth;
    const detectedYearVal = targetYear || defaultYear;

    // Automatically update upload form fields
    setPeriodeBulan(canonicalBulan);
    setPeriodeTahun(detectedYearVal);
    setRosterTitle(`Roster Dinas WHU - ${canonicalBulan} ${detectedYearVal}`);

    // Automatically synchronize and select the calendar month & year
    const detectedMonthIdx = BULAN_OPTIONS.findIndex(b => b.toLowerCase() === canonicalBulan.toLowerCase());
    if (detectedMonthIdx !== -1) {
      setCalendarMonth(detectedMonthIdx);
    }
    setCalendarYear(detectedYearVal);

    if (parsedResult) {
      if (parsedResult.detectedPletonList && parsedResult.detectedPletonList.length === 1) {
        setPletonTarget(parsedResult.detectedPletonList[0]);
      } else {
        setPletonTarget('Semua Pleton (4 Pleton)');
      }

      setDetectedPersonnel(parsedResult.personnelList);
      setDetectedPletonMembers(parsedResult.pletonMembers);
      setDetectedDailyEntries(parsedResult.dailyEntries);
      if (parsedResult.dailyEntries && parsedResult.dailyEntries.length > 0) {
        setParsedTotalRows(parsedResult.dailyEntries.length);
      }

      const fileDateLabel = file.lastModified 
        ? new Date(file.lastModified).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) 
        : '';

      setUploadNotice(
        `✓ Berkas ${file.name} Berhasil Diparsing • Periode Otomatis Terseleksi: ${canonicalBulan} ${detectedYearVal} (${dateSource}${fileDateLabel ? ` • Tanggal Berkas: ${fileDateLabel}` : ''}) • ${parsedResult.personnelList.length} Personil WHU (Nama & NIK Terverifikasi) • Kalender Roster Otomatis Berpindah ke ${canonicalBulan} ${detectedYearVal}`
      );
    }
    setIsParsingRoster(false);

    // Read base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFileBase64(result || '');
    };
    reader.onerror = () => {
      setErrorMessage('Gagal membaca isi berkas. Silakan coba kembali.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Submit roster document
  const handleSubmitRoster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Silakan pilih berkas Excel atau PDF yang ingin diunggah terlebih dahulu.');
      return;
    }

    if (!rosterTitle.trim()) {
      setErrorMessage('Judul dokumen roster tidak boleh kosong.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Ensure base64 is resolved if file reading took longer
      let resolvedBase64 = fileBase64;
      if (!resolvedBase64) {
        resolvedBase64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(selectedFile);
        });
      }

      const docId = `roster-${periodeTahun}-${String(BULAN_OPTIONS.indexOf(periodeBulan) + 1).padStart(2, '0')}-${Date.now()}`;
      
      const newRosterDoc: DutyRosterDocument = {
        id: docId,
        title: rosterTitle.trim(),
        periodeBulan,
        periodeTahun,
        fileName: selectedFile.name,
        fileType: fileFormat,
        fileMime: selectedFile.type || (fileFormat === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'application/pdf'),
        fileSize: selectedFile.size,
        fileData: resolvedBase64,
        uploadedAt: new Date().toISOString(),
        uploadedBy: uploadedBy.trim() || 'Staff WHU',
        status: 'Aktif',
        statusDokumen,
        pleton: pletonTarget,
        keterangan: keterangan.trim() || undefined,
        sheetNames: parsedSheetNames.length > 0 ? parsedSheetNames : undefined,
        totalRows: parsedTotalRows > 0 ? parsedTotalRows : undefined,
        personnelList: detectedPersonnel.length > 0 ? detectedPersonnel : undefined,
        pletonMembers: Object.keys(detectedPletonMembers).length > 0 ? detectedPletonMembers : undefined,
        parsedEntries: detectedDailyEntries.length > 0 ? detectedDailyEntries : undefined
      };

      // Immediately activate custom personnel in the system and broadcast across devices
      if (detectedPletonMembers && Object.values(detectedPletonMembers).some(arr => arr && arr.length > 0)) {
        setActiveRosterPersonnel(detectedPletonMembers as any);
        saveActiveRosterPersonnelToFirestore(detectedPletonMembers as any).catch(err => {
          console.warn('Gagal sinkronisasi personel roster ke cloud:', err);
        });
      }

      // Save to IndexedDB (full binary)
      await saveRosterLocally(newRosterDoc);

      // Save to Firestore (metadata + striped binary if >600KB)
      await saveDutyRosterDocumentToFirestore(newRosterDoc);

      // Update state
      setRosterDocuments(prev => [newRosterDoc, ...prev.filter(r => r.id !== docId)]);

      // Reset form
      setSelectedFile(null);
      setFileBase64('');
      setParsedSheetNames([]);
      setParsedTotalRows(0);
      setExcelPreviewRows([]);
      setUploadNotice(null);
      setDetectedPersonnel([]);
      setDetectedPletonMembers({ ALPHA: [], BRAVO: [], CHARLIE: [], DELTA: [] });
      setDetectedDailyEntries([]);
      setIsSubmitting(false);

      // Automatically synchronize calendar view to this newly saved roster document's month and year
      const docMonthIdx = BULAN_OPTIONS.findIndex(b => b.toLowerCase() === newRosterDoc.periodeBulan.toLowerCase());
      if (docMonthIdx !== -1) {
        setCalendarMonth(docMonthIdx);
      }
      setCalendarYear(newRosterDoc.periodeTahun);

      const totalParsed = newRosterDoc.personnelList ? newRosterDoc.personnelList.length : 0;
      setUploadSuccessMessage(
        `Dokumen Roster "${newRosterDoc.title}" (${newRosterDoc.fileName}) berhasil diunggah! ${totalParsed > 0 ? `${totalParsed} personil (Nama, NIK, dan Pleton) langsung aktif di sistem!` : ''}`
      );
      setTimeout(() => {
        setUploadSuccessMessage(null);
        setActiveTab('archive');
      }, 1400);
    } catch (err) {
      console.error('Error saving roster document:', err);
      setErrorMessage('Terjadi kendala saat menyimpan berkas roster. Silakan coba kembali.');
      setIsSubmitting(false);
    }
  };

  // Open Preview for an uploaded Roster Document
  const handleOpenPreview = async (docItem: DutyRosterDocument) => {
    setPreviewActiveSheet('');
    setPreviewSheetNames([]);
    setPreviewSheetRows([]);
    setPreviewSearch('');
    setPreviewTab('document');

    let fullDoc = docItem;
    if (!fullDoc.fileData || !fullDoc.fileData.startsWith('data:')) {
      const fromLocal = await getRosterWithFileData(docItem.id);
      if (fromLocal && fromLocal.fileData) {
        fullDoc = fromLocal;
      }
    }

    setPreviewRosterDoc(fullDoc);

    // If Excel, parse sheets
    if (fullDoc.fileType === 'excel' && fullDoc.fileData && fullDoc.fileData.startsWith('data:')) {
      try {
        const base64Content = fullDoc.fileData.split(',')[1] || fullDoc.fileData;
        const workbook = XLSX.read(base64Content, { type: 'base64' });
        const sheets = workbook.SheetNames || [];
        setPreviewSheetNames(sheets);
        if (sheets.length > 0) {
          setPreviewActiveSheet(sheets[0]);
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheets[0]], { header: 1 }) as any[][];
          setPreviewSheetRows(rows);
        }
      } catch (err) {
        console.warn('Gagal membaca Excel data untuk preview:', err);
      }
    }
  };

  const handlePreviewSheetSwitch = (sheetName: string) => {
    if (!previewRosterDoc?.fileData) return;
    try {
      setPreviewActiveSheet(sheetName);
      const base64Content = previewRosterDoc.fileData.split(',')[1] || previewRosterDoc.fileData;
      const workbook = XLSX.read(base64Content, { type: 'base64' });
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }) as any[][];
      setPreviewSheetRows(rows);
    } catch (err) {
      console.warn('Gagal switch sheet preview:', err);
    }
  };

  // Download document
  const handleDownload = async (docItem: DutyRosterDocument) => {
    let fullDoc = docItem;
    if (!fullDoc.fileData || !fullDoc.fileData.startsWith('data:')) {
      const fromLocal = await getRosterWithFileData(docItem.id);
      if (fromLocal && fromLocal.fileData) {
        fullDoc = fromLocal;
      }
    }

    if (fullDoc.fileData) {
      const a = document.createElement('a');
      a.href = fullDoc.fileData;
      a.download = fullDoc.fileName || `${fullDoc.title}.${fullDoc.fileType === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      setErrorMessage('Data berkas tidak ditemukan di penyimpanan lokal.');
    }
  };

  // Trigger delete confirmation
  const handleDeleteRosterDoc = (id: string, title: string) => {
    setDocToDelete({ id, title });
  };

  // Confirm and execute delete document
  const confirmDeleteRosterDoc = async () => {
    if (!docToDelete) return;
    const { id } = docToDelete;
    setDocToDelete(null);

    setRosterDocuments(prev => prev.filter(r => r.id !== id));
    if (previewRosterDoc?.id === id) {
      setPreviewRosterDoc(null);
    }
    try {
      await deleteRosterLocally(id);
      await deleteDutyRosterDocumentFromFirestore(id);
    } catch (err) {
      console.error('Gagal menghapus roster:', err);
    }
  };

  const filteredArchive = rosterDocuments.filter((doc) => {
    if (!doc) return false;
    if (archiveFormatFilter !== 'all' && doc.fileType !== archiveFormatFilter) return false;
    if (archiveSearch.trim()) {
      const q = archiveSearch.toLowerCase();
      return (
        (doc.title && doc.title.toLowerCase().includes(q)) ||
        (doc.fileName && doc.fileName.toLowerCase().includes(q)) ||
        (doc.periodeBulan && doc.periodeBulan.toLowerCase().includes(q)) ||
        (doc.uploadedBy && doc.uploadedBy.toLowerCase().includes(q)) ||
        (doc.keterangan && doc.keterangan.toLowerCase().includes(q)) ||
        (doc.pleton && doc.pleton.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const formatBytes = (bytes?: number) => {
    if (!bytes || isNaN(bytes) || bytes <= 0) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header with Navigation Tabs */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center shadow-inner">
              <Calendar className="w-5 h-5 text-sky-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[11px] font-mono tracking-wider text-sky-400 font-semibold uppercase">
                  PT ANGKASA PURA INDONESIA • CGK
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono border border-emerald-800">
                  OFFICIAL ROSTER DINAS
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Jadwal &amp; Dokumen Roster Dinas WHU (Excel &amp; PDF)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher Toolbar */}
        <div className="bg-slate-800 px-5 py-2 flex items-center justify-between gap-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Kalender Roster Berjalan</span>
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Unggah Roster (Excel / PDF)</span>
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === 'archive'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Arsip Berkas ({rosterDocuments.length})</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
            Rotasi 4 Hari: Pagi - Malam - Libur - Libur
          </span>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/60">
          
          {/* TAB 1: CALENDAR & LIVE ACTIVE ROSTER */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              {/* Current Live Shift Banner */}
              <div className="bg-linear-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-700">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-xs font-mono uppercase tracking-wider text-emerald-300 font-semibold">
                        STATUS DINAS AKTIF REAL-TIME SAAT INI
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                        {activeInfo.shiftType === 'PAGI' ? (
                          <Sun className="w-6 h-6 text-amber-400" />
                        ) : (
                          <Moon className="w-6 h-6 text-sky-300" />
                        )}
                        <span>{activeInfo.dinas}</span>
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-extrabold border uppercase shadow-2xs ${getPletonBadgeStyle(activeInfo.pletonCode)}`}>
                        {activeInfo.pleton}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1">
                      {activeInfo.shiftType === 'PAGI' ? 'APME (08:00 - 20:00 WIB)' : 'APMG (20:00 - 08:00 WIB)'} • Tanggal Sistem: {todayDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Personnel on Duty Right Now */}
                  <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/80 min-w-[280px]">
                    <p className="text-[11px] font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-sky-400" />
                      <span>Personel Bertugas (POD Roster):</span>
                    </p>
                    <div className="space-y-1.5">
                      {activeInfo.personnel.map((p, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-slate-900/80 px-2.5 py-1.5 rounded text-xs border border-slate-700/50">
                          <span className="font-bold text-white">{p.nama}</span>
                          <span className="font-mono text-[11px] text-slate-300">NIK {p.nik}</span>
                        </div>
                      ))}
                    </div>

                    {onSelectShift && (
                      <button
                        onClick={() => {
                          onSelectShift(activeInfo.pleton, activeInfo.dinas, activeInfo.podFormattedList);
                          onClose();
                        }}
                        className="w-full mt-2.5 py-1.5 px-3 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                      >
                        <span>Terapkan ke Laporan Aktif</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Roster Officers Directory Cards */}
              <div>
                {personnelFeedbackMsg && (
                  <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center justify-between gap-2 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{personnelFeedbackMsg}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPersonnelFeedbackMsg(null)}
                      className="text-emerald-700 hover:text-emerald-900 p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2.5">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-sky-600" />
                      <span>Susunan Personel 4 Pleton (Total 8 Personel Resmi)</span>
                    </h4>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Rotasi 4 Hari (Pagi - Malam - Libur - Libur) • Terkoneksi Real-Time Antar Petugas
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setEditPersonnelDraft(JSON.parse(JSON.stringify(activePersonnelMap)));
                        setIsEditingPersonnel(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                      title="Perbarui daftar nama dan NIK personel 4 Pleton yang tersinkronisasi otomatis"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Update / Edit Personel Pleton</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        if (window.confirm('Kembalikan susunan personel ke daftar resmi SK Dept Head (NURJAYA, DANIL, YUDHA, KUKUH, dll)?')) {
                          resetToOfficialRosterPersonnel();
                          const def = OFFICIAL_ROSTER_PERSONNEL;
                          setActivePersonnelMap(def);
                          try {
                            await saveActiveRosterPersonnelToFirestore(def);
                            setPersonnelFeedbackMsg('Susunan Personel 4 Pleton berhasil di-reset ke dokumen resmi dan disinkronkan ke seluruh device.');
                          } catch (err) {
                            console.error('Reset error:', err);
                          }
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium border border-slate-300 transition cursor-pointer"
                      title="Reset ke susunan personel resmi SK Dept Head"
                    >
                      <RefreshCw className="w-3 h-3 text-slate-500 inline mr-1" />
                      <span>Reset Resmi</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'] as const).map((code) => {
                    const members = activePersonnelMap[code] || OFFICIAL_ROSTER_PERSONNEL[code];
                    const pletonName = code === 'ALPHA' ? 'Pleton Alpha' : code === 'BRAVO' ? 'Pleton Bravo' : code === 'CHARLIE' ? 'Pleton Charlie' : 'Pleton Delta';
                    const isCurrent = activeInfo.pletonCode === code;
                    return (
                      <div 
                        key={code} 
                        className={`rounded-xl p-3 border transition ${
                          isCurrent 
                            ? 'bg-sky-50/70 border-sky-300 ring-2 ring-sky-400/40 shadow-xs' 
                            : 'bg-white border-slate-200 shadow-2xs'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-black border uppercase ${getPletonBadgeStyle(code)}`}>
                            {pletonName}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> AKTIF
                            </span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          {members.map((m, idx) => (
                            <div key={idx} className="text-xs border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                              <p className="font-bold text-slate-800 leading-tight">{m.nama}</p>
                              <p className="font-mono text-[10px] text-slate-500">NIK: {m.nik}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Modal / Dialog Edit Susunan Personel 4 Pleton (Total 8 Personel) */}
                {isEditingPersonnel && (
                  <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
                      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-white">
                              Kelola &amp; Update Susunan Personel (4 Pleton - 8 Personel)
                            </h3>
                            <p className="text-[11px] text-slate-400">
                              Perubahan akan langsung terhubung dan tersinkronisasi di device seluruh petugas.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingPersonnel(false)}
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">Ketentuan Standar WHU Bandara:</p>
                            <p className="text-[11px] text-amber-700 mt-0.5">
                              Terdapat 4 Pleton (Alpha, Bravo, Charlie, Delta) dengan masing-masing 2 personel per pleton (total 8 personel dinas). Pastikan nama lengkap dan NIK akurat sesuai SK Dinas.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'] as const).map((code) => {
                            const pletonName = code === 'ALPHA' ? 'Pleton Alpha' : code === 'BRAVO' ? 'Pleton Bravo' : code === 'CHARLIE' ? 'Pleton Charlie' : 'Pleton Delta';
                            const pletonMembers = editPersonnelDraft[code] || [
                              { nama: '', nik: '', pleton: pletonName as any, pletonCode: code },
                              { nama: '', nik: '', pleton: pletonName as any, pletonCode: code }
                            ];
                            // ensure 2 slots
                            while (pletonMembers.length < 2) {
                              pletonMembers.push({ nama: '', nik: '', pleton: pletonName as any, pletonCode: code });
                            }

                            return (
                              <div key={code} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border uppercase ${getPletonBadgeStyle(code)}`}>
                                    {pletonName}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-500">2 Personel</span>
                                </div>

                                <div className="space-y-3">
                                  {pletonMembers.slice(0, 2).map((mem, idx) => (
                                    <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1.5 shadow-2xs">
                                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                                        <span>Petugas #{idx + 1}</span>
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                                          Nama Lengkap
                                        </label>
                                        <input
                                          type="text"
                                          value={mem.nama}
                                          onChange={(e) => {
                                            const val = e.target.value.toUpperCase();
                                            setEditPersonnelDraft(prev => {
                                              const updatedPleton = [...(prev[code] || [])];
                                              updatedPleton[idx] = { ...updatedPleton[idx], nama: val, pleton: pletonName as any, pletonCode: code };
                                              return { ...prev, [code]: updatedPleton };
                                            });
                                          }}
                                          placeholder="Contoh: NURJAYA"
                                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold uppercase focus:ring-2 focus:ring-sky-500 outline-hidden"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-[10px] font-medium text-slate-500 mb-0.5">
                                          NIK / No. Induk Karyawan
                                        </label>
                                        <input
                                          type="text"
                                          value={mem.nik}
                                          onChange={(e) => {
                                            const val = e.target.value.trim();
                                            setEditPersonnelDraft(prev => {
                                              const updatedPleton = [...(prev[code] || [])];
                                              updatedPleton[idx] = { ...updatedPleton[idx], nik: val, pleton: pletonName as any, pletonCode: code };
                                              return { ...prev, [code]: updatedPleton };
                                            });
                                          }}
                                          placeholder="Contoh: 20242880"
                                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 outline-hidden"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setEditPersonnelDraft(JSON.parse(JSON.stringify(OFFICIAL_ROSTER_PERSONNEL)));
                          }}
                          className="w-full sm:w-auto px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                        >
                          Isi Template Standar Resmi (SK Dept Head)
                        </button>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => setIsEditingPersonnel(false)}
                            className="flex-1 sm:flex-initial px-4 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            disabled={personnelSaveLoading}
                            onClick={async () => {
                              setPersonnelSaveLoading(true);
                              try {
                                setActiveRosterPersonnel(editPersonnelDraft);
                                setActivePersonnelMap(editPersonnelDraft);
                                await saveActiveRosterPersonnelToFirestore(editPersonnelDraft);
                                setIsEditingPersonnel(false);
                                setPersonnelFeedbackMsg('Susunan Personel 4 Pleton (Total 8 Personel) berhasil diperbarui dan tersinkronisasi otomatis ke semua device petugas!');
                                setTimeout(() => setPersonnelFeedbackMsg(null), 5000);
                              } catch (err) {
                                console.error('Error saving personnel:', err);
                                alert('Terjadi kesalahan saat menyimpan ke cloud database.');
                              } finally {
                                setPersonnelSaveLoading(false);
                              }
                            }}
                            className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                          >
                            {personnelSaveLoading ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Simpan &amp; Sinkronkan ke Semua Petugas</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Roster Calendar & Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Month & Year Navigation Toolbar */}
                <div className="px-4 py-2.5 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700">
                      <button
                        type="button"
                        onClick={() => {
                          if (calendarMonth === 0) {
                            setCalendarMonth(11);
                            setCalendarYear(y => y - 1);
                          } else {
                            setCalendarMonth(m => m - 1);
                          }
                        }}
                        className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Bulan Sebelumnya"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <select
                        value={calendarMonth}
                        onChange={(e) => setCalendarMonth(parseInt(e.target.value, 10))}
                        className="bg-transparent text-xs font-bold text-white px-2 py-1 outline-hidden cursor-pointer"
                      >
                        {BULAN_OPTIONS.map((m, idx) => (
                          <option key={m} value={idx} className="bg-slate-900 text-white">{m}</option>
                        ))}
                      </select>

                      <select
                        value={calendarYear}
                        onChange={(e) => setCalendarYear(parseInt(e.target.value, 10))}
                        className="bg-transparent text-xs font-bold text-sky-400 px-2 py-1 outline-hidden cursor-pointer"
                      >
                        {TAHUN_OPTIONS.map((y) => (
                          <option key={y} value={y} className="bg-slate-900 text-white">{y}</option>
                        ))}
                      </select>

                      <button
                        type="button"
                        onClick={() => {
                          if (calendarMonth === 11) {
                            setCalendarMonth(0);
                            setCalendarYear(y => y + 1);
                          } else {
                            setCalendarMonth(m => m + 1);
                          }
                        }}
                        className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                        title="Bulan Berikutnya"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Button quick jump to current month */}
                    <button
                      type="button"
                      onClick={() => {
                        setCalendarMonth(new Date().getMonth());
                        setCalendarYear(new Date().getFullYear());
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-sky-600/80 hover:bg-sky-600 text-white text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 shadow-2xs"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>Bulan Berjalan ({BULAN_OPTIONS[new Date().getMonth()]} {new Date().getFullYear()})</span>
                    </button>
                  </div>

                  <div className="text-left sm:text-right">
                    <div className="flex items-center sm:justify-end gap-1.5 flex-wrap">
                      <span className="text-xs font-semibold text-slate-300">
                        Jadwal Rotasi Periode: <strong className="text-white">{BULAN_OPTIONS[calendarMonth]} {calendarYear}</strong>
                      </span>
                      {activeUploadedDocForMonth && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Roster Unggahan Aktif</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                      Total {monthRoster.length} Hari Kalender {activeUploadedDocForMonth ? `• Berkas: ${activeUploadedDocForMonth.fileName}` : ''}
                    </span>
                  </div>
                </div>

                {/* Filter & Search Toolbar */}
                <div className="p-3 sm:p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                    <span className="text-xs font-semibold text-slate-600 mr-1 flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5" /> Filter:
                    </span>
                    {(['ALL', 'ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'] as const).map((code) => (
                      <button
                        key={code}
                        onClick={() => setSelectedPletonFilter(code)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                          selectedPletonFilter === code
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {code === 'ALL' ? 'Semua Pleton' : code}
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari nama / NIK / tanggal..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-sky-500 outline-hidden"
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-mono text-[11px] sticky top-0 z-10 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 font-bold">Tanggal</th>
                        <th className="py-2.5 px-3 font-bold bg-amber-50/80 text-amber-900 border-x border-amber-200/60">
                          <div className="flex items-center gap-1">
                            <Sun className="w-3 h-3 text-amber-600" />
                            <span>Dinas Pagi (APME 08:00 - 20:00)</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-3 font-bold bg-sky-50/80 text-sky-900 border-r border-sky-200/60">
                          <div className="flex items-center gap-1">
                            <Moon className="w-3 h-3 text-sky-600" />
                            <span>Dinas Malam (APMG 20:00 - 08:00)</span>
                          </div>
                        </th>
                        <th className="py-2.5 px-3 font-bold text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredDays.map((day) => {
                        const isToday = day.dayNumber === todayDayNumber;
                        const dateObj = new Date(calendarYear, calendarMonth, day.dayNumber);
                        const dayFormatted = dateObj.toLocaleDateString('id-ID', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short'
                        });

                        return (
                          <tr 
                            key={day.dayNumber}
                            className={`hover:bg-slate-50/80 transition ${
                              isToday ? 'bg-sky-50/60 font-semibold' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-xs ${
                                  isToday ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {day.dayNumber}
                                </span>
                                <div>
                                  <p className="font-semibold text-slate-800">{dayFormatted}</p>
                                  {isToday && (
                                    <span className="text-[10px] text-sky-600 font-bold">HARI INI</span>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Dinas Pagi Column */}
                            <td className="py-2.5 px-3 border-x border-slate-200 bg-amber-50/30">
                              <div className="space-y-1">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getPletonBadgeStyle(day.pagiPletonCode)}`}>
                                  {day.pagiPleton}
                                </span>
                                <div className="text-[11px] text-slate-700">
                                  {day.pagiPersonnel.map(p => p.nama).join(', ')}
                                </div>
                              </div>
                            </td>

                            {/* Dinas Malam Column */}
                            <td className="py-2.5 px-3 border-r border-slate-200 bg-sky-50/30">
                              <div className="space-y-1">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${getPletonBadgeStyle(day.malamPletonCode)}`}>
                                  {day.malamPleton}
                                </span>
                                <div className="text-[11px] text-slate-700">
                                  {day.malamPersonnel.map(p => p.nama).join(', ')}
                                </div>
                              </div>
                            </td>

                            {/* Action buttons */}
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              {onSelectShift ? (
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => {
                                      onSelectShift(
                                        day.pagiPleton, 
                                        'Dinas Pagi (08:00 - 20:00)', 
                                        day.pagiPersonnel.map(p => `${p.nama} (${p.nik})`),
                                        day.dateStr
                                      );
                                      onClose();
                                    }}
                                    className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded text-[10px] font-bold transition cursor-pointer"
                                    title="Pilih Pagi tanggal ini"
                                  >
                                    Pagi
                                  </button>
                                  <button
                                    onClick={() => {
                                      onSelectShift(
                                        day.malamPleton, 
                                        'Dinas Malam (20:00 - 08:00)', 
                                        day.malamPersonnel.map(p => `${p.nama} (${p.nik})`),
                                        day.dateStr
                                      );
                                      onClose();
                                    }}
                                    className="px-2 py-1 bg-sky-100 hover:bg-sky-200 text-sky-900 rounded text-[10px] font-bold transition cursor-pointer"
                                    title="Pilih Malam tanggal ini"
                                  >
                                    Malam
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400">Roster CGK</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Department Head Approval Note */}
              <div className="bg-slate-100 rounded-xl p-3.5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-sky-600 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-800">Pengesahan Resmi: </span>
                    <span>Tangerang, 24 Agustus 2026 • Wildlife Hazard Department Head (RACHMADITYA)</span>
                  </div>
                </div>
                <div className="text-[11px] font-mono text-slate-500">
                  Shift Rule: APME 08:00-20:00 | APMG 20:00-08:00 | FREE Libur
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD ROSTER (EXCEL / PDF) */}
          {activeTab === 'upload' && (
            <form onSubmit={handleSubmitRoster} className="space-y-5 max-w-3xl mx-auto">
              {/* Success Message Banner */}
              {uploadSuccessMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="font-semibold">{uploadSuccessMessage}</p>
                </div>
              )}

              {/* Error Banner */}
              {errorMessage && (
                <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Pemberitahuan</p>
                    <p className="mt-0.5">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Notice Banner */}
              {uploadNotice && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in">
                  <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold">Analisis Excel Roster Berhasil</p>
                    <p className="mt-0.5">{uploadNotice}</p>
                  </div>
                </div>
              )}

              {/* Drag & Drop File Zone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Berkas Jadwal Roster (Excel atau PDF) <span className="text-rose-500">*</span>
                </label>

                <input
                  id="roster-file-upload-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/pdf"
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelection(e.target.files[0]);
                    }
                    // Reset input value so selecting the same file again triggers onChange
                    e.target.value = '';
                  }}
                />

                {!selectedFile ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3.5 ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-50/80 scale-[0.99]'
                        : 'border-slate-300 hover:border-emerald-500 bg-white hover:bg-emerald-50/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex flex-col items-center justify-center border border-emerald-200 shadow-sm">
                        <FileSpreadsheet className="w-6 h-6" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">EXCEL</span>
                      </div>
                      <span className="text-slate-300 font-bold text-sm">•</span>
                      <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex flex-col items-center justify-center border border-rose-200 shadow-sm">
                        <FileText className="w-6 h-6" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">PDF</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        Tarik dan lepas berkas Roster di sini, atau <span className="text-emerald-700 underline font-bold">klik untuk memilih berkas</span>
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Mendukung format <span className="font-semibold text-emerald-700">Microsoft Excel (.xlsx, .xls)</span> atau <span className="font-semibold text-rose-700">Adobe PDF (.pdf)</span> (Maks. 25 MB)
                      </p>
                    </div>

                    <button
                      type="button"
                      id="btn-trigger-roster-file"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="mt-1 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Pilih Berkas Roster dari Perangkat</span>
                    </button>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white shrink-0 shadow-sm ${
                        fileFormat === 'excel' ? 'bg-emerald-600' : 'bg-rose-600'
                      }`}>
                        {fileFormat === 'excel' ? (
                          <FileSpreadsheet className="w-5 h-5" />
                        ) : (
                          <FileText className="w-5 h-5" />
                        )}
                        <span className="text-[9px] font-black tracking-wider uppercase">
                          {fileFormat === 'excel' ? 'EXCEL' : 'PDF'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {selectedFile.name}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                          <span className="font-mono">{formatBytes(selectedFile.size)}</span>
                          <span>•</span>
                          {fileFormat === 'excel' && parsedTotalRows > 0 && (
                            <>
                              <span className="text-emerald-700 font-medium">
                                {parsedSheetNames.length} Sheet ({parsedTotalRows} baris)
                              </span>
                              <span>•</span>
                            </>
                          )}
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Siap diarsipkan
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setFileBase64('');
                        setParsedSheetNames([]);
                        setParsedTotalRows(0);
                        setExcelPreviewRows([]);
                        setUploadNotice(null);
                        setDetectedPersonnel([]);
                        setDetectedPletonMembers({ ALPHA: [], BRAVO: [], CHARLIE: [], DELTA: [] });
                        setDetectedDailyEntries([]);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer shrink-0"
                    >
                      Ganti Berkas
                    </button>
                  </div>
                )}
              </div>

              {/* Parsing Progress Indicator */}
              {isParsingRoster && (
                <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-center animate-pulse">
                  <div className="flex items-center justify-center gap-2 text-sky-800 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-sky-600 animate-spin" />
                    <span>Sistem Sedang Membaca Dokumen Roster Dinas...</span>
                  </div>
                  <p className="text-xs text-sky-600 mt-1">
                    Menganalisis Nama Lengkap, Nomor NIK Karyawan, dan Penugasan Pleton yang berdinas...
                  </p>
                </div>
              )}

              {/* AUTOMATIC ROSTER DETECTION: NAMA, NIK & PLETON YANG BERDINAS */}
              {detectedPersonnel.length > 0 && (
                <div className="bg-white rounded-2xl border-2 border-emerald-500/40 shadow-sm overflow-hidden animate-in fade-in duration-200">
                  {/* Header Bar */}
                  <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                            <span>Hasil Pembacaan Data Roster Otomatis</span>
                            <span className="text-emerald-400 font-normal">({detectedPersonnel.length} Personil)</span>
                          </h4>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                            Nama, NIK &amp; Pleton Terdeteksi
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          Sistem langsung membaca personil berdinas, NIK dinas, dan pembagian Pleton untuk Periode {periodeBulan} {periodeTahun}.
                        </p>
                      </div>
                    </div>

                    {detectedDailyEntries.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowDailyScheduleInPreview(prev => !prev)}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5 text-sky-400" />
                        <span>{showDailyScheduleInPreview ? 'Tutup Jadwal Tanggal' : 'Lihat Jadwal Harian (1-30/31)'}</span>
                      </button>
                    )}
                  </div>

                  {/* Platoon Filter Tabs */}
                  <div className="bg-slate-50 border-b border-slate-200 p-2.5 flex items-center gap-1.5 overflow-x-auto">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2">
                      Saring:
                    </span>
                    <button
                      type="button"
                      onClick={() => setDetectedPletonFilter('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        detectedPletonFilter === 'ALL'
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      Semua ({detectedPersonnel.length})
                    </button>
                    {(['ALPHA', 'BRAVO', 'CHARLIE', 'DELTA'] as const).map(pCode => {
                      const count = detectedPletonMembers[pCode]?.length || 0;
                      const isActive = detectedPletonFilter === pCode;
                      const badgeColors: Record<string, string> = {
                        ALPHA: isActive ? 'bg-sky-700 text-white' : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100',
                        BRAVO: isActive ? 'bg-amber-700 text-white' : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100',
                        CHARLIE: isActive ? 'bg-yellow-700 text-white' : 'bg-yellow-50 text-yellow-800 border border-yellow-200 hover:bg-yellow-100',
                        DELTA: isActive ? 'bg-purple-700 text-white' : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
                      };
                      return (
                        <button
                          key={pCode}
                          type="button"
                          onClick={() => setDetectedPletonFilter(pCode)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${badgeColors[pCode]}`}
                        >
                          <span>Pleton {pCode.charAt(0) + pCode.slice(1).toLowerCase()}</span>
                          <span className="opacity-80 font-mono">({count})</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Personnel Cards Grid */}
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {detectedPersonnel
                      .filter(p => detectedPletonFilter === 'ALL' || p.pletonCode === detectedPletonFilter)
                      .map((person, idx) => {
                        const pletonColors: Record<string, { card: string; badge: string; dot: string }> = {
                          ALPHA: { card: 'border-sky-200 bg-sky-50/40 hover:border-sky-400', badge: 'bg-sky-100 text-sky-800 border-sky-300', dot: 'bg-sky-500' },
                          BRAVO: { card: 'border-amber-200 bg-amber-50/40 hover:border-amber-400', badge: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500' },
                          CHARLIE: { card: 'border-yellow-200 bg-yellow-50/40 hover:border-yellow-400', badge: 'bg-yellow-100 text-yellow-800 border-yellow-300', dot: 'bg-yellow-500' },
                          DELTA: { card: 'border-purple-200 bg-purple-50/40 hover:border-purple-400', badge: 'bg-purple-100 text-purple-800 border-purple-300', dot: 'bg-purple-500' }
                        };
                        const color = pletonColors[person.pletonCode as string] || pletonColors.ALPHA;

                        return (
                          <div 
                            key={`${person.nik}-${idx}`}
                            className={`p-3 rounded-xl border transition shadow-2xs ${color.card}`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${color.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`}></span>
                                <span>{person.pleton}</span>
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {person.shiftPattern || 'APME / APMG'}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-start gap-1.5">
                                <Users className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
                                <div className="min-w-0">
                                  <h5 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight truncate" title={person.nama}>
                                    {person.nama}
                                  </h5>
                                  <p className="text-[10px] text-slate-500 truncate">
                                    {person.jabatan || 'Petugas Wildlife Hazard Unit'}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                  No. NIK:
                                </span>
                                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300 shadow-2xs">
                                  {person.nik}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Collapsible Daily Schedule Table (1 to 30/31) */}
                  {showDailyScheduleInPreview && detectedDailyEntries.length > 0 && (
                    <div className="border-t border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between mb-2.5">
                        <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Table className="w-3.5 h-3.5 text-sky-600" />
                          <span>Jadwal Rotasi Harian Berdinas ({periodeBulan} {periodeTahun}):</span>
                        </h5>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {detectedDailyEntries.length} Hari Terdeteksi
                        </span>
                      </div>
                      <div className="overflow-x-auto max-h-56 bg-white rounded-xl border border-slate-200 shadow-2xs">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                            <tr>
                              <th className="px-3 py-2 w-16">Tgl</th>
                              <th className="px-3 py-2">Dinas Pagi (APME 08:00 - 20:00)</th>
                              <th className="px-3 py-2">Dinas Malam (APMG 20:00 - 08:00)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                            {detectedDailyEntries.map(entry => (
                              <tr key={entry.tanggal} className="hover:bg-slate-50">
                                <td className="px-3 py-1.5 font-bold text-slate-900">
                                  Tgl {entry.tanggal}
                                </td>
                                <td className="px-3 py-1.5 text-sky-900">
                                  <span className="font-bold">{entry.pagiPleton}:</span> {entry.pagiPetugas}
                                </td>
                                <td className="px-3 py-1.5 text-purple-900">
                                  <span className="font-bold">{entry.malamPleton}:</span> {entry.malamPetugas}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Excel Preview snippet if available */}
              {excelPreviewRows.length > 0 && !detectedPersonnel.length && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                  <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 flex items-center gap-1.5">
                      <Table className="w-3.5 h-3.5 text-emerald-600" />
                      Pratinjau Awal Data Excel (15 Baris Pertama):
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">
                      Sheet: {parsedSheetNames[0] || 'Sheet1'}
                    </span>
                  </div>
                  <div className="overflow-x-auto max-h-48 p-2">
                    <table className="w-full text-left text-[11px] border-collapse">
                      <tbody>
                        {excelPreviewRows.map((row, rIdx) => (
                          <tr key={rIdx} className={rIdx === 0 ? 'bg-slate-50 font-bold border-b border-slate-200' : 'border-b border-slate-100 hover:bg-slate-50/50'}>
                            <td className="px-2 py-1 text-slate-400 font-mono text-[10px] w-6">{rIdx + 1}</td>
                            {Array.isArray(row) && row.slice(0, 8).map((cell, cIdx) => (
                              <td key={cIdx} className="px-2.5 py-1 text-slate-700 whitespace-nowrap truncate max-w-xs">
                                {cell !== undefined && cell !== null ? String(cell) : ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Form Metadata Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Judul Roster */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Judul Dokumen Roster <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={rosterTitle}
                    onChange={(e) => setRosterTitle(e.target.value)}
                    placeholder={`Contoh: Roster Dinas WHU - ${defaultMonth} ${defaultYear}`}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    required
                  />
                </div>

                {/* Periode Bulan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    Periode Bulan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={periodeBulan}
                    onChange={(e) => {
                      setPeriodeBulan(e.target.value);
                      if (rosterTitle.startsWith('Roster Dinas WHU -')) {
                        setRosterTitle(`Roster Dinas WHU - ${e.target.value} ${periodeTahun}`);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    {BULAN_OPTIONS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Periode Tahun */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    Periode Tahun <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={periodeTahun}
                    onChange={(e) => {
                      const newYr = parseInt(e.target.value, 10);
                      setPeriodeTahun(newYr);
                      if (rosterTitle.startsWith('Roster Dinas WHU -')) {
                        setRosterTitle(`Roster Dinas WHU - ${periodeBulan} ${newYr}`);
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    {TAHUN_OPTIONS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Pleton / Lingkup */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    Pleton / Cakupan Roster <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={pletonTarget}
                    onChange={(e) => setPletonTarget(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="Semua Pleton (4 Pleton)">Semua Pleton (4 Pleton: Alpha, Bravo, Charlie, Delta)</option>
                    <option value="Pleton Alpha">Khusus Pleton Alpha</option>
                    <option value="Pleton Bravo">Khusus Pleton Bravo</option>
                    <option value="Pleton Charlie">Khusus Pleton Charlie</option>
                    <option value="Pleton Delta">Khusus Pleton Delta</option>
                  </select>
                </div>

                {/* Status Dokumen */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Status Dokumen Roster <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={statusDokumen}
                    onChange={(e) => setStatusDokumen(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="Resmi Berlaku">Resmi Berlaku (Disahkan Dept Head)</option>
                    <option value="Revisi / Pengganti">Revisi / Pengganti Jadwal</option>
                    <option value="Draft / Usulan">Draft / Usulan Internal</option>
                  </select>
                </div>

                {/* Pengunggah */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Petugas / Pengunggah
                  </label>
                  <input
                    type="text"
                    value={uploadedBy}
                    onChange={(e) => setUploadedBy(e.target.value)}
                    placeholder="Nama petugas pengunggah"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>

                {/* Keterangan */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Catatan Khusus / Ringkasan Jadwal (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder={`Contoh: Jadwal rotasi dinas WHMS Bulan ${defaultMonth} ${defaultYear} telah disesuaikan dengan cuti dinas dan pemeliharaan armada...`}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('calendar')}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
                >
                  Kembali ke Kalender
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedFile}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan Roster...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Simpan &amp; Arsipkan Roster</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ARCHIVED ROSTER DOCUMENTS */}
          {activeTab === 'archive' && (
            <div className="space-y-4">
              {/* Archive Filters */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari judul berkas / pengunggah..."
                      value={archiveSearch}
                      onChange={(e) => setArchiveSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-hidden"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setArchiveFormatFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        archiveFormatFilter === 'all'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setArchiveFormatFilter('excel')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                        archiveFormatFilter === 'excel'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Excel</span>
                    </button>
                    <button
                      onClick={() => setArchiveFormatFilter('pdf')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
                        archiveFormatFilter === 'pdf'
                          ? 'bg-rose-600 text-white'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('upload')}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 self-end md:self-auto shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Unggah Berkas Baru</span>
                </button>
              </div>

              {/* Archive Grid */}
              {filteredArchive.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <FolderArchive className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Belum Ada Berkas Roster Dinas yang Tersimpan
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Unggah jadwal resmi personel WHMS dalam format Excel (.xlsx / .xls) atau PDF (.pdf) untuk dokumentasi operasional.
                  </p>
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold inline-flex items-center gap-2 shadow transition cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Unggah Berkas Roster Sekarang</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredArchive.map((doc) => {
                    const isExcel = doc.fileType === 'excel';
                    return (
                      <div
                        key={doc.id}
                        className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow transition p-4 flex flex-col justify-between"
                      >
                        <div>
                          {/* Top row */}
                          <div className="flex items-start justify-between gap-3 mb-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-white shrink-0 shadow-sm ${
                                isExcel ? 'bg-emerald-600' : 'bg-rose-600'
                              }`}>
                                {isExcel ? (
                                  <FileSpreadsheet className="w-5 h-5" />
                                ) : (
                                  <FileText className="w-5 h-5" />
                                )}
                                <span className="text-[8px] font-black uppercase tracking-wider">
                                  {isExcel ? 'XLSX' : 'PDF'}
                                </span>
                              </div>

                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border ${
                                    isExcel 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}>
                                    {isExcel ? 'EXCEL' : 'PDF'}
                                  </span>
                                  <span className="text-[11px] font-bold text-sky-900 bg-sky-50 px-2 py-0.2 rounded-full border border-sky-200">
                                    {doc.periodeBulan} {doc.periodeTahun}
                                  </span>
                                  {doc.statusDokumen && (
                                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                                      {doc.statusDokumen}
                                    </span>
                                  )}
                                </div>

                                <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                                  {doc.title}
                                </h3>
                              </div>
                            </div>
                          </div>

                          {/* File Details */}
                          <div className="text-xs text-slate-500 space-y-1 mb-3">
                            {doc.pleton && (
                              <p className="flex items-center gap-1.5 text-slate-700 font-medium">
                                <Shield className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                <span>{doc.pleton}</span>
                              </p>
                            )}
                            <p className="font-mono text-[11px] text-slate-500 truncate bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
                              📄 {doc.fileName} • {formatBytes(doc.fileSize)}
                              {doc.sheetNames && doc.sheetNames.length > 0 && (
                                <span className="text-emerald-700 ml-1">
                                  ({doc.sheetNames.length} sheet)
                                </span>
                              )}
                            </p>
                          </div>

                          {/* Keterangan */}
                          {doc.keterangan && (
                            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 line-clamp-2 mb-3">
                              {doc.keterangan}
                            </div>
                          )}
                        </div>

                        {/* Card Footer Actions */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                          <div className="text-[10px] text-slate-400">
                            <span>Oleh <strong>{doc.uploadedBy}</strong></span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                const mIdx = BULAN_OPTIONS.findIndex(b => b.toLowerCase() === doc.periodeBulan.toLowerCase());
                                if (mIdx !== -1) {
                                  setCalendarMonth(mIdx);
                                }
                                setCalendarYear(doc.periodeTahun);
                                setActiveTab('calendar');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                              title={`Buka Jadwal Kalender ${doc.periodeBulan} ${doc.periodeTahun}`}
                            >
                              <Calendar className="w-3.5 h-3.5" />
                              <span>Kalender</span>
                            </button>

                            <button
                              onClick={() => handleOpenPreview(doc)}
                              className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                              title="Lihat Pratinjau Dokumen"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Lihat</span>
                            </button>

                            <button
                              onClick={() => handleDownload(doc)}
                              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                              title="Unduh Berkas"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteRosterDoc(doc.id, doc.title)}
                              className="p-1 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                              title="Hapus dari Arsip"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {activeTab === 'calendar' && (
              <span>Roster Dinas Terintegrasi KP 326 &amp; Manual Operasi WHU CGK</span>
            )}
            {activeTab === 'upload' && (
              <span>Format didukung: Microsoft Excel (.xlsx / .xls) &amp; Adobe PDF (.pdf)</span>
            )}
            {activeTab === 'archive' && (
              <span>Total {rosterDocuments.length} berkas roster diarsipkan</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>

      {/* Embedded Preview Sub-Modal for Uploaded Roster (PDF & Excel) */}
      {previewRosterDoc && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${
                  previewRosterDoc.fileType === 'excel' ? 'bg-emerald-600' : 'bg-rose-600'
                }`}>
                  {previewRosterDoc.fileType === 'excel' ? (
                    <FileSpreadsheet className="w-5 h-5" />
                  ) : (
                    <FileText className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                      previewRosterDoc.fileType === 'excel'
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/30 text-rose-300 border border-rose-500/40'
                    }`}>
                      {previewRosterDoc.fileType === 'excel' ? 'EXCEL ROSTER SPREADSHEET' : 'PDF ROSTER DOCUMENT'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {previewRosterDoc.periodeBulan} {previewRosterDoc.periodeTahun}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-white truncate mt-0.5">
                    {previewRosterDoc.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {previewRosterDoc.personnelList && previewRosterDoc.personnelList.length > 0 && (
                  <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs mr-2">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('document')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        previewTab === 'document' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Berkas Asli ({previewRosterDoc.fileType.toUpperCase()})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('personnel')}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
                        previewTab === 'personnel' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Personil ({previewRosterDoc.personnelList.length})</span>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const mIdx = BULAN_OPTIONS.findIndex(b => b.toLowerCase() === previewRosterDoc.periodeBulan.toLowerCase());
                    if (mIdx !== -1) {
                      setCalendarMonth(mIdx);
                    }
                    setCalendarYear(previewRosterDoc.periodeTahun);
                    setPreviewRosterDoc(null);
                    setActiveTab('calendar');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  title="Buka Jadwal di Kalender Roster"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lihat di Kalender</span>
                </button>

                <button
                  onClick={() => handleDownload(previewRosterDoc)}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Unduh Berkas</span>
                </button>
                <button
                  onClick={() => setPreviewRosterDoc(null)}
                  className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Content */}
            <div className="flex-1 overflow-hidden bg-slate-100 p-3 sm:p-4 flex flex-col">
              {previewTab === 'personnel' && previewRosterDoc.personnelList ? (
                <div className="w-full h-full bg-white rounded-xl shadow border border-slate-200 overflow-hidden flex flex-col">
                  <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        <Users className="w-4 h-4 text-emerald-400" />
                        <span>Daftar Personil Dinas WHU ({previewRosterDoc.periodeBulan} {previewRosterDoc.periodeTahun})</span>
                      </h4>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Data Nama, NIK, dan Pleton yang diekstraksi dari berkas {previewRosterDoc.fileName}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {previewRosterDoc.personnelList.length} Personil Terverifikasi
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {previewRosterDoc.personnelList.map((person, idx) => (
                        <div 
                          key={`${person.nik}-${idx}`}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 shadow-2xs space-y-2 hover:bg-white hover:border-emerald-300 transition"
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
                              {person.pleton}
                            </span>
                            <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-300 text-slate-800">
                              NIK: {person.nik}
                            </span>
                          </div>
                          <div>
                            <h5 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                              {person.nama}
                            </h5>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {person.jabatan || 'Petugas Wildlife Hazard Unit'}
                            </p>
                          </div>
                          {person.shiftPattern && (
                            <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-600 font-mono">
                              Pola: <span className="font-bold">{person.shiftPattern}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {previewRosterDoc.parsedEntries && previewRosterDoc.parsedEntries.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-slate-200">
                        <h5 className="text-xs font-bold text-slate-800 mb-2.5 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-sky-600" />
                          <span>Rincian Rotasi Shift Harian (1 - {previewRosterDoc.parsedEntries.length}):</span>
                        </h5>
                        <div className="overflow-x-auto max-h-60 bg-white rounded-xl border border-slate-200 shadow-2xs">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                              <tr>
                                <th className="px-3 py-2 w-16">Tanggal</th>
                                <th className="px-3 py-2">Dinas Pagi (APME 08:00 - 20:00)</th>
                                <th className="px-3 py-2">Dinas Malam (APMG 20:00 - 08:00)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                              {previewRosterDoc.parsedEntries.map(entry => (
                                <tr key={entry.tanggal} className="hover:bg-slate-50">
                                  <td className="px-3 py-1.5 font-bold text-slate-900">
                                    Tgl {entry.tanggal}
                                  </td>
                                  <td className="px-3 py-1.5 text-sky-900">
                                    <span className="font-bold">{entry.pagiPleton}:</span> {entry.pagiPetugas}
                                  </td>
                                  <td className="px-3 py-1.5 text-purple-900">
                                    <span className="font-bold">{entry.malamPleton}:</span> {entry.malamPetugas}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : previewRosterDoc.fileType === 'pdf' && previewRosterDoc.fileData && previewRosterDoc.fileData.startsWith('data:') ? (
                <div className="w-full h-full rounded-xl overflow-hidden flex flex-col">
                  <PdfCanvasViewer
                    pdfData={previewRosterDoc.fileData}
                    title={previewRosterDoc.title}
                  />
                </div>
              ) : previewRosterDoc.fileType === 'excel' && previewSheetRows.length > 0 ? (
                <div className="w-full h-full bg-white rounded-xl shadow border border-slate-300 overflow-hidden flex flex-col">
                  {/* Sheets selector and table filter */}
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                        Sheet:
                      </span>
                      {previewSheetNames.map((name) => (
                        <button
                          key={name}
                          onClick={() => handlePreviewSheetSwitch(name)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                            previewActiveSheet === name
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={previewSearch}
                        onChange={(e) => setPreviewSearch(e.target.value)}
                        placeholder="Filter isi roster..."
                        className="pl-8 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 w-44"
                      />
                    </div>
                  </div>

                  {/* Excel Sheet Table */}
                  <div className="flex-1 overflow-auto p-4">
                    <table className="w-full border-collapse text-xs">
                      <tbody>
                        {filteredPreviewRows.map((row, rIdx) => (
                          <tr 
                            key={`r-${rIdx}`} 
                            className={rIdx === 0 ? 'bg-slate-100 font-bold text-slate-900 border-b-2 border-slate-300 sticky top-0' : 'hover:bg-slate-50/80 border-b border-slate-200'}
                          >
                            <td className="px-2.5 py-1.5 font-mono text-[10px] text-slate-400 bg-slate-50 border-r border-slate-200 w-8 text-center select-none">
                              {rIdx + 1}
                            </td>
                            {Array.isArray(row) && row.map((cell, cIdx) => (
                              <td key={`c-${rIdx}-${cIdx}`} className="px-3 py-2 text-slate-800 whitespace-nowrap border-r border-slate-100">
                                {cell !== undefined && cell !== null ? String(cell) : ''}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="max-w-md mx-auto my-auto text-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                    {previewRosterDoc.fileType === 'excel' ? <FileSpreadsheet className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
                  </div>
                  <h4 className="text-base font-bold text-slate-800">{previewRosterDoc.title}</h4>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    {previewRosterDoc.fileName} • {formatBytes(previewRosterDoc.fileSize)}
                  </p>
                  <button
                    onClick={() => handleDownload(previewRosterDoc)}
                    className="mt-4 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" /> Unduh Berkas
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {docToDelete && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 border border-rose-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">Hapus Berkas Roster?</h4>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Apakah Anda yakin ingin menghapus berkas <strong className="text-slate-700">"{docToDelete.title}"</strong> dari arsip?
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDeleteRosterDoc}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
