import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  FileCheck2, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Layers, 
  User, 
  ShieldCheck, 
  FileCode,
  FileSpreadsheet,
  AlertTriangle,
  Info,
  Loader2,
  BarChart3,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { MonthlyReportDocument, MonthlyDocumentCategory, DocumentFormatType } from '../types';
import { parseMonthYearFromFilename } from '../utils/dateUtils';
import { parseMonthlyReportPdf } from '../utils/pdfParser';
import { 
  toNumber, 
  parseMonthlyAttachmentWorkbook, 
  ParsedMonthlyAttachmentResult, 
  ParsedMonthlyRecord 
} from '../utils/monthlyExcelParser';

interface UploadMonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveDocument: (doc: MonthlyReportDocument) => Promise<void> | void;
}

const BULAN_OPTIONS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const TAHUN_OPTIONS = [2027, 2026, 2025, 2024, 2023, 2022];

const KATEGORI_OPTIONS: MonthlyDocumentCategory[] = [
  'Laporan Bulanan Lengkap (Comprehensive WHMS)',
  'Rekapitulasi Wildlife Strike Bulanan (ICAO IBIS)',
  'Data Tabular & Logbook Operasional (Excel Spreadsheet)',
  'Laporan Evaluasi & Rekomendasi Habitat',
  'Laporan Inspeksi & Patroli Rutin Bulanan',
  'Laporan Kelaikan Armada & Peralatan WHU',
  'Dokumen Pendukung / Lampiran Teknis'
];

export const UploadMonthlyReportModal: React.FC<UploadMonthlyReportModalProps> = ({
  isOpen,
  onClose,
  onSaveDocument
}) => {
  const currentMonthIdx = new Date().getMonth();
  const defaultMonth = BULAN_OPTIONS[currentMonthIdx]; // Default active current month (e.g. Oktober)
  const defaultYear = new Date().getFullYear();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [fileFormat, setFileFormat] = useState<DocumentFormatType>('pdf');
  const [periodeBulan, setPeriodeBulan] = useState<string>(defaultMonth);
  const [periodeTahun, setPeriodeTahun] = useState<number>(defaultYear);
  const [kategoriLaporan, setKategoriLaporan] = useState<MonthlyDocumentCategory>('Laporan Bulanan Lengkap (Comprehensive WHMS)');
  const [title, setTitle] = useState<string>(`Laporan Bulanan WHMS - ${defaultMonth} ${defaultYear}`);
  const [uploadedBy, setUploadedBy] = useState<string>('Staff / Petugas WHU');
  const [pleton, setPleton] = useState<string>('Pleton Alpha');
  const [statusVerifikasi, setStatusVerifikasi] = useState<'Arsip Resmi' | 'Terverifikasi' | 'Menunggu Review'>('Arsip Resmi');
  const [catatanRingkasan, setCatatanRingkasan] = useState<string>('');
  const [totalStrike, setTotalStrike] = useState<string>('');
  const [strikeWithDamage, setStrikeWithDamage] = useState<string>('');
  const [totalPatroli, setTotalPatroli] = useState<string>('');
  const [totalOccurrence, setTotalOccurrence] = useState<string>('');
  const [totalSatwa, setTotalSatwa] = useState<string>('');
  const [spesiesDominan, setSpesiesDominan] = useState<string>('');
  const [areaRawanUtama, setAreaRawanUtama] = useState<string>('');

  // Excel specifics
  const [excelSheetNames, setExcelSheetNames] = useState<string[]>([]);
  const [excelTotalRows, setExcelTotalRows] = useState<number>(0);
  const [excelDetectedNotice, setExcelDetectedNotice] = useState<string | null>(null);
  const [pdfDetectedNotice, setPdfDetectedNotice] = useState<string | null>(null);
  const [parsedAttachmentResult, setParsedAttachmentResult] = useState<ParsedMonthlyAttachmentResult | null>(null);
  const [showBreakdownTable, setShowBreakdownTable] = useState<boolean>(true);

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelection = async (file: File) => {
    setErrorMessage(null);
    setExcelDetectedNotice(null);
    setPdfDetectedNotice(null);
    setExcelSheetNames([]);
    setExcelTotalRows(0);
    setParsedAttachmentResult(null);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isPdf = ext === 'pdf' || file.type.includes('pdf');
    const isWord = ext === 'doc' || ext === 'docx' || file.type.includes('word') || file.type.includes('officedocument.wordprocessingml');
    const isExcel = ext === 'xlsx' || ext === 'xls' || ext === 'csv' || file.type.includes('spreadsheet') || file.type.includes('excel') || file.type.includes('csv');

    if (!isPdf && !isWord && !isExcel) {
      setErrorMessage('Format file tidak didukung. Mohon unggah dokumen dalam format Excel (.xlsx / .xls), PDF (.pdf), atau Word (.docx / .doc).');
      return;
    }

    // Check size (Max 25MB)
    const maxSizeBytes = 25 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setErrorMessage(`Ukuran file terlalu besar (${(file.size / (1024 * 1024)).toFixed(1)} MB). Batas maksimum adalah 25 MB.`);
      return;
    }

    setSelectedFile(file);
    const detectedFormat: DocumentFormatType = isExcel ? 'excel' : isWord ? 'word' : 'pdf';
    setFileFormat(detectedFormat);

    if (isExcel) {
      setKategoriLaporan('Data Tabular & Logbook Operasional (Excel Spreadsheet)');
    }

    // Auto-detect Month and Year from filename if present
    const parsedDate = parseMonthYearFromFilename(file.name);
    let effectiveMonth = periodeBulan;
    let effectiveYear = periodeTahun;
    if (parsedDate.month) {
      effectiveMonth = parsedDate.month;
      setPeriodeBulan(parsedDate.month);
    }
    if (parsedDate.year) {
      effectiveYear = parsedDate.year;
      setPeriodeTahun(parsedDate.year);
    }

    // Auto-populate Title
    if (!title || title.startsWith('Laporan Bulanan WHMS')) {
      setTitle(`Laporan Bulanan WHMS - ${effectiveMonth} ${effectiveYear}`);
    }

    // If Excel, inspect sheets and rows with SheetJS (XLSX) and run monthlyExcelParser
    if (isExcel) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheets = workbook.SheetNames || [];
        setExcelSheetNames(sheets);

        // Run comprehensive multi-month parser (handling Sep-Agt period text & flawed merged headers)
        const parsedResult = parseMonthlyAttachmentWorkbook(workbook);
        setParsedAttachmentResult(parsedResult);

        if (sheets.length > 0) {
          const firstSheet = workbook.Sheets[sheets[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
          setExcelTotalRows(rows.length);
        }

        if (parsedResult.monthlyRecords.length > 0) {
          // If filename explicitly specified a month, match it; otherwise use the latest/most recent period from the workbook
          const latestRecord = parsedResult.monthlyRecords[parsedResult.monthlyRecords.length - 1];
          let matched = parsedDate.month
            ? (parsedResult.monthlyRecords.find(
                r => r.bulan.toLowerCase() === effectiveMonth.toLowerCase() && r.tahun === effectiveYear
              ) || latestRecord)
            : latestRecord;

          if (matched) {
            setPeriodeBulan(matched.bulan);
            setPeriodeTahun(matched.tahun);
            setTitle(`Laporan Bulanan WHMS - ${matched.bulan} ${matched.tahun}`);
            setTotalStrike(String(matched.totalStrike));
            setStrikeWithDamage(String(matched.strikeWithDamage));
            setTotalOccurrence(String(matched.totalOccurrence));
            setTotalSatwa(String(matched.totalSatwa));
            if (matched.spesiesDominan) setSpesiesDominan(matched.spesiesDominan);
          }

          const hasBirdSheet = sheets.some(s => s.toUpperCase().includes('POPULASI') || s.toUpperCase().includes('1.7.2'));
          setExcelDetectedNotice(
            `Excel Berhasil Diparsing: ${sheets.length} Sheet (${sheets.slice(0, 3).join(', ')}${sheets.length > 3 ? '...' : ''}) • Terdeteksi ${parsedResult.monthlyRecords.length} Periode Historis (${parsedResult.summary.startPeriod} s.d. ${parsedResult.summary.endPeriod}) • Total ${parsedResult.summary.totalStrikesAllPeriods} Strike, ${parsedResult.summary.totalOccurrencesAllPeriods} Occurrence${hasBirdSheet ? `, ${parsedResult.summary.totalBirdPopulationAllPeriods} Populasi Burung` : ''} • Nilai NIL disanitasi ke 0 otomatis`
          );
        } else if (sheets.length > 0) {
          // Fallback legacy scanner if specific sheets are not present
          const firstSheet = workbook.Sheets[sheets[0]];
          const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
          let foundStrike: number | null = null;
          let foundDamage: number | null = null;
          let foundPatrol: number | null = null;
          let foundOcc: number | null = null;
          let foundSatwa: number | null = null;

          for (const row of rows) {
            if (!Array.isArray(row)) continue;
            for (let i = 0; i < row.length; i++) {
              const cellStr = String(row[i] || '').toLowerCase().trim();
              const nextVal = toNumber(row[i + 1]);
              const isNum = row[i + 1] !== null && row[i + 1] !== '' && !isNaN(nextVal);

              if (cellStr.includes('total strike') || cellStr === 'strike' || cellStr === 'strikes') {
                if (isNum && foundStrike === null) foundStrike = nextVal;
              }
              if (cellStr.includes('kerusakan') || cellStr.includes('damage')) {
                if (isNum && foundDamage === null) foundDamage = nextVal;
              }
              if (cellStr.includes('total patroli') || cellStr.includes('patroli') || cellStr.includes('inspeksi')) {
                if (isNum && foundPatrol === null) foundPatrol = nextVal;
              }
              if (cellStr.includes('occurrence') || cellStr.includes('kejadian satwa') || cellStr.includes('perjumpaan')) {
                if (isNum && foundOcc === null) foundOcc = nextVal;
              }
              if (cellStr.includes('total satwa') || cellStr.includes('populasi') || cellStr.includes('jumlah satwa')) {
                if (isNum && foundSatwa === null) foundSatwa = nextVal;
              }
            }
          }

          if (foundStrike !== null) setTotalStrike(String(foundStrike));
          if (foundDamage !== null) setStrikeWithDamage(String(foundDamage));
          if (foundPatrol !== null) setTotalPatroli(String(foundPatrol));
          if (foundOcc !== null) setTotalOccurrence(String(foundOcc));
          if (foundSatwa !== null) setTotalSatwa(String(foundSatwa));

          setExcelDetectedNotice(
            `Excel Berhasil Dibaca: ${sheets.length} Sheet (${sheets.slice(0, 3).join(', ')}${sheets.length > 3 ? '...' : ''}) • ${rows.length} baris data${foundStrike !== null || foundPatrol !== null ? ' • Metrik operasional otomatis terdeteksi!' : ''}`
          );
        }
      } catch (err) {
        console.warn('Excel parse warning:', err);
      }
    }

    // If PDF, inspect text, tables, and operational metrics
    if (isPdf) {
      try {
        setIsProcessing(true);
        const pdfResult = await parseMonthlyReportPdf(file);
        if (pdfResult.bulan) {
          effectiveMonth = pdfResult.bulan;
          setPeriodeBulan(pdfResult.bulan);
        }
        if (pdfResult.tahun) {
          effectiveYear = pdfResult.tahun;
          setPeriodeTahun(pdfResult.tahun);
        }
        setTitle(`Laporan Bulanan WHMS - ${effectiveMonth} ${effectiveYear}`);

        if (pdfResult.totalStrike !== undefined) setTotalStrike(String(pdfResult.totalStrike));
        if (pdfResult.strikeWithDamage !== undefined) setStrikeWithDamage(String(pdfResult.strikeWithDamage));
        if (pdfResult.totalOccurrence !== undefined) setTotalOccurrence(String(pdfResult.totalOccurrence));
        if (pdfResult.totalPatroli !== undefined) setTotalPatroli(String(pdfResult.totalPatroli));
        if (pdfResult.totalSatwa !== undefined) setTotalSatwa(String(pdfResult.totalSatwa));
        if (pdfResult.spesiesDominan) setSpesiesDominan(pdfResult.spesiesDominan);
        if (pdfResult.areaRawanUtama) setAreaRawanUtama(pdfResult.areaRawanUtama);
        if (pdfResult.catatanRingkasan) setCatatanRingkasan(pdfResult.catatanRingkasan);

        if (pdfResult.monthlyBreakdown && pdfResult.monthlyBreakdown.length > 0) {
          setParsedAttachmentResult({
            monthlyRecords: pdfResult.monthlyBreakdown,
            birdPopulationData: pdfResult.birdPopulationData || { periods: [], species: [], totalByPeriod: {}, grandTotal: 0 },
            detectedSheets: ['Dokumen PDF Terunggah (AP2 WHMS)'],
            summary: {
              totalPeriods: pdfResult.monthlyBreakdown.length,
              startPeriod: pdfResult.monthlyBreakdown[0].periodKey,
              endPeriod: pdfResult.monthlyBreakdown[pdfResult.monthlyBreakdown.length - 1].periodKey,
              totalStrikesAllPeriods: pdfResult.monthlyBreakdown.reduce((a, b) => a + b.totalStrike, 0),
              totalOccurrencesAllPeriods: pdfResult.monthlyBreakdown.reduce((a, b) => a + b.totalOccurrence, 0),
              totalBirdPopulationAllPeriods: pdfResult.birdPopulationData?.grandTotal || pdfResult.monthlyBreakdown.reduce((a, b) => a + b.totalSatwa, 0)
            }
          });
        }

        setPdfDetectedNotice(pdfResult.detectedMetricsSummary);
      } catch (pdfErr) {
        console.warn('PDF parse warning:', pdfErr);
      }
    }

    // Read as Base64 data URL
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFileBase64(result || '');
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setErrorMessage('Gagal membaca isi berkas. Silakan coba kembali.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleMonthOrYearChange = (newMonth: string, newYear: number) => {
    setPeriodeBulan(newMonth);
    setPeriodeTahun(newYear);
    setTitle(`Laporan Bulanan WHMS - ${newMonth} ${newYear}`);

    // If we have parsed breakdown from Excel, auto-update input fields for selected month
    if (parsedAttachmentResult && parsedAttachmentResult.monthlyRecords.length > 0) {
      const matched = parsedAttachmentResult.monthlyRecords.find(
        r => r.bulan.toLowerCase() === newMonth.toLowerCase() && r.tahun === newYear
      );
      if (matched) {
        setTotalStrike(String(matched.totalStrike));
        setStrikeWithDamage(String(matched.strikeWithDamage));
        setTotalOccurrence(String(matched.totalOccurrence));
        if (matched.totalPatroli !== undefined) setTotalPatroli(String(matched.totalPatroli));
        setTotalSatwa(String(matched.totalSatwa));
        if (matched.spesiesDominan) setSpesiesDominan(matched.spesiesDominan);
      }
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage('Silakan pilih berkas PDF atau Word yang ingin diunggah terlebih dahulu.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('Judul dokumen tidak boleh kosong.');
      return;
    }

    setIsProcessing(true);
    try {
      const docId = `monthly-${periodeTahun}-${String(BULAN_OPTIONS.indexOf(periodeBulan) + 1).padStart(2, '0')}-${Date.now()}`;
      
      const newDoc: MonthlyReportDocument = {
        id: docId,
        title: title.trim(),
        periodeBulan,
        periodeTahun,
        kategoriLaporan,
        fileName: selectedFile.name,
        fileType: fileFormat,
        fileMime: selectedFile.type || (
          fileFormat === 'pdf' 
            ? 'application/pdf' 
            : fileFormat === 'excel' 
              ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ),
        fileSize: selectedFile.size,
        fileData: fileBase64,
        uploadedAt: new Date().toISOString(),
        uploadedBy: uploadedBy.trim() || 'Staff WHU',
        pleton,
        catatanRingkasan: catatanRingkasan.trim(),
        totalStrikeBulanIni: totalStrike.trim() !== '' ? toNumber(totalStrike) : undefined,
        strikeWithDamageBulanIni: strikeWithDamage.trim() !== '' ? toNumber(strikeWithDamage) : undefined,
        totalPatroliBulanIni: totalPatroli.trim() !== '' ? toNumber(totalPatroli) : undefined,
        totalOccurrenceBulanIni: totalOccurrence.trim() !== '' ? toNumber(totalOccurrence) : undefined,
        totalSatwaBulanIni: totalSatwa.trim() !== '' ? toNumber(totalSatwa) : undefined,
        spesiesDominan: spesiesDominan.trim() || undefined,
        areaRawanUtama: areaRawanUtama.trim() || undefined,
        statusVerifikasi,
        sheetNames: excelSheetNames.length > 0 ? excelSheetNames : undefined,
        totalRows: excelTotalRows > 0 ? excelTotalRows : undefined,
        monthlyBreakdown: parsedAttachmentResult?.monthlyRecords,
        birdPopulationData: parsedAttachmentResult?.birdPopulationData
      };

      await onSaveDocument(newDoc);
      setIsProcessing(false);
      onClose();
    } catch (err) {
      console.error('Error uploading monthly report:', err);
      setErrorMessage('Terjadi kendala saat menyimpan dokumen ke arsip. Pastikan koneksi stabil.');
      setIsProcessing(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-indigo-900 text-white px-6 py-4 flex items-center justify-between border-b border-sky-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-sky-200 border border-white/10 shadow-inner">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                Unggah Dokumen / Laporan Bulanan
              </h3>
              <p className="text-xs text-sky-200/90">
                Mendukung berkas Excel Spreadsheet (.xlsx / .xls), PDF (.pdf), atau Word (.docx / .doc)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 p-2 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Perhatian</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Excel Auto-Detection Notice Banner */}
          {excelDetectedNotice && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in">
              <Sparkles className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Analisis Berkas Excel Berhasil</p>
                <p className="mt-0.5">{excelDetectedNotice}</p>
              </div>
            </div>
          )}

          {/* PDF Auto-Detection Notice Banner */}
          {pdfDetectedNotice && (
            <div className="p-3.5 bg-rose-50/90 border border-rose-200 text-rose-900 text-xs rounded-xl flex items-start gap-2.5 animate-in fade-in">
              <Sparkles className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-rose-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Analisis &amp; Pembacaan Dokumen PDF Berhasil</span>
                </p>
                <p className="mt-0.5 leading-relaxed text-slate-700">{pdfDetectedNotice}</p>
              </div>
            </div>
          )}

          {/* Drag & Drop File Zone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Berkas Dokumen (Excel, PDF, atau Word) <span className="text-rose-500">*</span>
            </label>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv,.pdf,.doc,.docx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelection(e.target.files[0]);
                }
              }}
            />

            {!selectedFile ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-sky-500 bg-sky-50/80 scale-[0.99]'
                    : 'border-slate-300 hover:border-sky-400 bg-slate-50/60 hover:bg-sky-50/30'
                }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex flex-col items-center justify-center border border-emerald-200 shadow-sm">
                    <FileSpreadsheet className="w-5 h-5" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">EXCEL</span>
                  </div>
                  <span className="text-slate-300 font-bold text-xs">•</span>
                  <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-700 flex flex-col items-center justify-center border border-rose-200 shadow-sm">
                    <FileText className="w-5 h-5" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">PDF</span>
                  </div>
                  <span className="text-slate-300 font-bold text-xs">•</span>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex flex-col items-center justify-center border border-blue-200 shadow-sm">
                    <FileCode className="w-5 h-5" />
                    <span className="text-[9px] font-black uppercase tracking-tighter">WORD</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Tarik dan lepas file di sini, atau <span className="text-sky-600 underline">klik untuk memilih berkas</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Mendukung format <span className="font-semibold text-emerald-700">Excel (.xlsx, .xls)</span>, <span className="font-semibold text-rose-700">PDF (.pdf)</span>, dan <span className="font-semibold text-blue-700">Word (.docx)</span> (Maks. 25 MB)
                  </p>
                </div>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white shrink-0 shadow-sm ${
                    fileFormat === 'excel' 
                      ? 'bg-emerald-600' 
                      : fileFormat === 'pdf' 
                        ? 'bg-rose-600' 
                        : 'bg-blue-600'
                  }`}>
                    {fileFormat === 'excel' ? (
                      <FileSpreadsheet className="w-5 h-5" />
                    ) : fileFormat === 'pdf' ? (
                      <FileText className="w-5 h-5" />
                    ) : (
                      <FileCode className="w-5 h-5" />
                    )}
                    <span className="text-[9px] font-black tracking-wider uppercase">
                      {fileFormat === 'excel' ? 'EXCEL' : fileFormat === 'pdf' ? 'PDF' : 'DOCX'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {selectedFile.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-slate-500">
                      <span className="font-mono">{formatBytes(selectedFile.size)}</span>
                      <span>•</span>
                      {fileFormat === 'excel' && excelTotalRows > 0 && (
                        <>
                          <span className="text-emerald-700 font-medium">
                            {excelSheetNames.length} Sheet ({excelTotalRows} baris)
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
                    setExcelDetectedNotice(null);
                    setPdfDetectedNotice(null);
                    setExcelSheetNames([]);
                    setExcelTotalRows(0);
                    setParsedAttachmentResult(null);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-white text-xs font-semibold text-slate-700 transition cursor-pointer shrink-0"
                >
                  Ganti File
                </button>
              </div>
            )}
          </div>

          {/* Parsed Multi-Month Excel Attachment Breakdown Preview */}
          {parsedAttachmentResult && parsedAttachmentResult.monthlyRecords.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-50/80 via-sky-50/70 to-indigo-50/60 border border-emerald-200/90 rounded-2xl p-4 space-y-3 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                      <span>Data Historis Dokumen Terdeteksi ({parsedAttachmentResult.summary.totalPeriods} Periode)</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {parsedAttachmentResult.summary.startPeriod} – {parsedAttachmentResult.summary.endPeriod}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600">
                      Rincian periode operasional bulanan (nilai "NIL" / "Nihil" disanitasi menjadi 0 dan terhubung ke chart tren).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowBreakdownTable(!showBreakdownTable)}
                  className="self-start sm:self-auto px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                >
                  {showBreakdownTable ? 'Sembunyikan Tabel' : 'Lihat Detail Tabel'}
                </button>
              </div>

              {/* Summary Stats Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white/90 p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-medium block">Total Strike Semua Periode</span>
                  <span className="text-sm font-bold text-rose-600">{parsedAttachmentResult.summary.totalStrikesAllPeriods} insiden</span>
                </div>
                <div className="bg-white/90 p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-medium block">Total Wildlife Occurrence</span>
                  <span className="text-sm font-bold text-amber-600">{parsedAttachmentResult.summary.totalOccurrencesAllPeriods} perjumpaan</span>
                </div>
                <div className="bg-white/90 p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-medium block">Total Populasi Satwa/Burung</span>
                  <span className="text-sm font-bold text-emerald-600">{parsedAttachmentResult.summary.totalBirdPopulationAllPeriods.toLocaleString('id-ID')} ekor</span>
                </div>
                <div className="bg-white/90 p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-medium block">Spesies Burung di Sheet 1.7.2</span>
                  <span className="text-sm font-bold text-indigo-600">{parsedAttachmentResult.birdPopulationData.species.length} taksa spesies</span>
                </div>
              </div>

              {/* Breakdown Table */}
              {showBreakdownTable && (
                <div className="border border-slate-200/90 rounded-xl overflow-hidden bg-white shadow-2xs">
                  <div className="max-h-52 overflow-y-auto">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-slate-100/90 text-slate-700 sticky top-0 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-3 py-1.5">Periode (Bulan-Tahun)</th>
                          <th className="px-2 py-1.5 text-center">Strike</th>
                          <th className="px-2 py-1.5 text-center">Damage</th>
                          <th className="px-2 py-1.5 text-center">Occurrence</th>
                          <th className="px-2 py-1.5 text-center">Populasi Burung</th>
                          <th className="px-2 py-1.5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedAttachmentResult.monthlyRecords.map((rec) => {
                          const isCurrentActive = rec.bulan.toLowerCase() === periodeBulan.toLowerCase() && rec.tahun === periodeTahun;
                          return (
                            <tr key={rec.periodKey} className={isCurrentActive ? 'bg-sky-50/80 font-semibold' : 'hover:bg-slate-50/70'}>
                              <td className="px-3 py-1.5 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3 text-sky-600" />
                                <span>{rec.bulan} {rec.tahun}</span>
                                {isCurrentActive && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] bg-sky-600 text-white font-bold">
                                    Aktif
                                  </span>
                                )}
                              </td>
                              <td className="px-2 py-1.5 text-center font-mono">
                                <span className={rec.totalStrike > 0 ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                                  {rec.totalStrike}
                                </span>
                              </td>
                              <td className="px-2 py-1.5 text-center font-mono">
                                <span className={rec.strikeWithDamage > 0 ? 'text-amber-700 font-bold' : 'text-slate-400'}>
                                  {rec.strikeWithDamage}
                                </span>
                              </td>
                              <td className="px-2 py-1.5 text-center font-mono text-slate-700">
                                {rec.totalOccurrence}
                              </td>
                              <td className="px-2 py-1.5 text-center font-mono text-emerald-700 font-semibold">
                                {rec.totalSatwa > 0 ? rec.totalSatwa.toLocaleString('id-ID') : '0'}
                              </td>
                              <td className="px-2 py-1.5 text-right">
                                {!isCurrentActive ? (
                                  <button
                                    type="button"
                                    onClick={() => handleMonthOrYearChange(rec.bulan, rec.tahun)}
                                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-sky-100 text-sky-800 text-[10px] font-semibold transition cursor-pointer"
                                  >
                                    Pilih
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-sky-700 font-semibold">Terpilih</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Periode Bulan & Tahun */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                Periode Bulan <span className="text-rose-500">*</span>
              </label>
              <select
                value={periodeBulan}
                onChange={(e) => handleMonthOrYearChange(e.target.value, periodeTahun)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              >
                {BULAN_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-sky-600" />
                Periode Tahun <span className="text-rose-500">*</span>
              </label>
              <select
                value={periodeTahun}
                onChange={(e) => handleMonthOrYearChange(periodeBulan, parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              >
                {TAHUN_OPTIONS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Kategori Laporan & Status Verifikasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-600" />
                Kategori Laporan <span className="text-rose-500">*</span>
              </label>
              <select
                value={kategoriLaporan}
                onChange={(e) => setKategoriLaporan(e.target.value as MonthlyDocumentCategory)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              >
                {KATEGORI_OPTIONS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                Status Verifikasi Laporan
              </label>
              <select
                value={statusVerifikasi}
                onChange={(e) => setStatusVerifikasi(e.target.value as any)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              >
                <option value="Arsip Resmi">Arsip Resmi (Disahkan)</option>
                <option value="Terverifikasi">Terverifikasi (Verifikasi Unit)</option>
                <option value="Menunggu Review">Menunggu Review Manajemen</option>
              </select>
            </div>
          </div>

          {/* Judul Dokumen */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Judul Dokumen Arsip <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Laporan Bulanan WHMS - Desember 2025"
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              required
            />
          </div>

          {/* Pengunggah & Pleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sky-600" />
                Petugas / Pengunggah
              </label>
              <input
                type="text"
                value={uploadedBy}
                onChange={(e) => setUploadedBy(e.target.value)}
                placeholder="Nama personel pengunggah"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Unit / Pleton
              </label>
              <select
                value={pleton}
                onChange={(e) => setPleton(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
              >
                <option value="Pleton Alpha">Pleton Alpha</option>
                <option value="Pleton Bravo">Pleton Bravo</option>
                <option value="Pleton Charlie">Pleton Charlie</option>
                <option value="Pleton Delta">Pleton Delta</option>
                <option value="Staf Evaluasi & Data WHU">Staf Evaluasi & Data WHU</option>
                <option value="Wildlife Hazard Dept Head">Wildlife Hazard Dept Head</option>
              </select>
            </div>
          </div>

          {/* Operational Metrics for Direct Dashboard & Chart Synchronization */}
          <div className="bg-sky-50/60 border border-sky-200 rounded-2xl p-4.5 space-y-3.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-sky-900">
                  <BarChart3 className="w-4 h-4 text-sky-600" />
                  <span>Data Rekapitulasi Operasional Bulan {periodeBulan} {periodeTahun}</span>
                </div>
                <p className="text-[11px] text-sky-700 mt-0.5">
                  Angka di bawah ini akan <strong>langsung ditampilkan di KPI Dashboard, grafik perbandingan MoM/YoY Recharts, dan tabel rekapitulasi data bulanan</strong>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Total Wildlife Strike
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalStrike}
                  onChange={(e) => setTotalStrike(e.target.value)}
                  placeholder="e.g. 2 kasus"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Strike Ada Kerusakan (Damage)
                </label>
                <input
                  type="number"
                  min="0"
                  value={strikeWithDamage}
                  onChange={(e) => setStrikeWithDamage(e.target.value)}
                  placeholder="e.g. 0 kasus"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Total Patroli &amp; Inspeksi
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalPatroli}
                  onChange={(e) => setTotalPatroli(e.target.value)}
                  placeholder="e.g. 90 shift"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Total Laporan Occurrence
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalOccurrence}
                  onChange={(e) => setTotalOccurrence(e.target.value)}
                  placeholder="e.g. 8 kejadian"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Total Satwa Teramati (Ekor)
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalSatwa}
                  onChange={(e) => setTotalSatwa(e.target.value)}
                  placeholder="e.g. 1450 ekor"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Area Rawan Utama
                </label>
                <input
                  type="text"
                  value={areaRawanUtama}
                  onChange={(e) => setAreaRawanUtama(e.target.value)}
                  placeholder="e.g. Runway 07L / Holding Pond"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Spesies Satwa Dominan di Bulan Tersebut
              </label>
              <input
                type="text"
                value={spesiesDominan}
                onChange={(e) => setSpesiesDominan(e.target.value)}
                placeholder="e.g. Burung Kuntul Kerbau (Bubulcus ibis), Burung Layang-layang (Hirundo rustica)"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-sky-500 outline-none"
              />
            </div>
          </div>

          {/* Catatan Ringkasan Eksekutif */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Ringkasan Eksekutif / Catatan Penting Dokumen
            </label>
            <textarea
              rows={3}
              value={catatanRingkasan}
              onChange={(e) => setCatatanRingkasan(e.target.value)}
              placeholder="Contoh: Laporan bulanan rekapitulasi mitigasi periode musim hujan, tren kenaikan burung kuntul kerbau di infield Runway 07L, status strike nihil insiden kerusakan struktural."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs sm:text-sm font-semibold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isProcessing || !selectedFile}
              className={`px-5 py-2 rounded-xl text-white text-xs sm:text-sm font-semibold shadow-sm transition flex items-center gap-2 cursor-pointer ${
                isProcessing || !selectedFile
                  ? 'bg-sky-400 cursor-not-allowed opacity-70'
                  : 'bg-sky-600 hover:bg-sky-700 shadow-sky-600/30'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memproses Dokumen...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  <span>Simpan &amp; Arsipkan Dokumen</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
