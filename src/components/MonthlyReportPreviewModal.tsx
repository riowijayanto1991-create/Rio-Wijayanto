import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Download, 
  FileText, 
  FileCode, 
  FileSpreadsheet,
  Calendar, 
  User, 
  ShieldCheck, 
  Layers, 
  ExternalLink,
  Info,
  CheckCircle2,
  Clock,
  Table,
  Search
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { MonthlyReportDocument } from '../types';
import { PdfCanvasViewer } from './PdfCanvasViewer';

interface MonthlyReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: MonthlyReportDocument | null;
  onDownload: (doc: MonthlyReportDocument) => void;
}

export const MonthlyReportPreviewModal: React.FC<MonthlyReportPreviewModalProps> = ({
  isOpen,
  onClose,
  document: docItem,
  onDownload
}) => {
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [sheetData, setSheetData] = useState<any[][]>([]);
  const [excelSearch, setExcelSearch] = useState<string>('');

  const isPdf = docItem?.fileType === 'pdf';
  const isExcel = docItem?.fileType === 'excel';
  const isWord = docItem?.fileType === 'word';
  const hasEmbeddedData = Boolean(docItem?.fileData && docItem.fileData.startsWith('data:'));

  // Parse Excel if embedded fileData exists
  useEffect(() => {
    if (isExcel && docItem?.fileData && docItem.fileData.startsWith('data:')) {
      try {
        const base64Content = docItem.fileData.split(',')[1] || docItem.fileData;
        const workbook = XLSX.read(base64Content, { type: 'base64' });
        const sheets = workbook.SheetNames || [];
        setSheetNames(sheets);
        if (sheets.length > 0) {
          setActiveSheet(sheets[0]);
          const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheets[0]], { header: 1 }) as any[][];
          setSheetData(rows);
        }
      } catch (err) {
        console.warn('Gagal membaca Excel data untuk preview:', err);
      }
    } else {
      setSheetNames([]);
      setSheetData([]);
    }
  }, [docItem, isExcel]);

  const handleSheetSwitch = (sheetName: string) => {
    if (!docItem?.fileData) return;
    try {
      setActiveSheet(sheetName);
      const base64Content = docItem.fileData.split(',')[1] || docItem.fileData;
      const workbook = XLSX.read(base64Content, { type: 'base64' });
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 }) as any[][];
      setSheetData(rows);
    } catch (err) {
      console.warn('Gagal switch sheet:', err);
    }
  };

  const filteredSheetRows = useMemo(() => {
    if (!excelSearch.trim()) return sheetData;
    const q = excelSearch.toLowerCase();
    return sheetData.filter((row) => 
      Array.isArray(row) && row.some(cell => String(cell || '').toLowerCase().includes(q))
    );
  }, [sheetData, excelSearch]);

  if (!isOpen || !docItem) return null;

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-3 sm:p-6 overflow-hidden">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm ${
              isPdf ? 'bg-rose-600' : isExcel ? 'bg-emerald-600' : 'bg-blue-600'
            }`}>
              {isPdf ? (
                <FileText className="w-5 h-5" />
              ) : isExcel ? (
                <FileSpreadsheet className="w-5 h-5" />
              ) : (
                <FileCode className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded tracking-wider ${
                  isPdf 
                    ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40' 
                    : isExcel
                      ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                      : 'bg-blue-500/30 text-blue-300 border border-blue-500/40'
                }`}>
                  {isPdf ? 'PDF DOCUMENT' : isExcel ? 'EXCEL SPREADSHEET (.XLSX)' : 'WORD DOCUMENT (.DOCX)'}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {docItem.periodeBulan} {docItem.periodeTahun}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold text-white truncate mt-0.5">
                {docItem.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => onDownload(docItem)}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh Berkas Asli</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Metadata Strip */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-600" />
              <span className="font-semibold text-slate-800">{docItem.kategoriLaporan}</span>
            </span>
            <span className="hidden md:inline text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Pengunggah: <strong>{docItem.uploadedBy}</strong> ({docItem.pleton || 'WHU'})</span>
            </span>
            <span className="hidden md:inline text-slate-300">•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Diarsipkan: {new Date(docItem.uploadedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-1 text-[11px]">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              {docItem.statusVerifikasi}
            </span>
            <span className="font-mono text-slate-500 text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
              {formatBytes(docItem.fileSize)}
            </span>
          </div>
        </div>

        {/* Content Viewer Area */}
        <div className="flex-1 overflow-auto bg-slate-100 p-4 flex flex-col">
          {isPdf && hasEmbeddedData ? (
            <div className="w-full h-full rounded-xl overflow-hidden flex flex-col">
              <PdfCanvasViewer
                pdfData={docItem.fileData!}
                title={docItem.title}
                onDownload={() => onDownload(docItem)}
              />
            </div>
          ) : isExcel && hasEmbeddedData && sheetData.length > 0 ? (
            <div className="w-full h-full bg-white rounded-xl shadow border border-slate-300 overflow-hidden flex flex-col">
              {/* Excel Sheets bar & search */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                    Sheet:
                  </span>
                  {sheetNames.map((name) => (
                    <button
                      key={name}
                      onClick={() => handleSheetSwitch(name)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                        activeSheet === name
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
                    value={excelSearch}
                    onChange={(e) => setExcelSearch(e.target.value)}
                    placeholder="Filter isi tabel..."
                    className="pl-8 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 w-44"
                  />
                </div>
              </div>

              {/* Excel Table display */}
              <div className="flex-1 overflow-auto p-4">
                <table className="w-full border-collapse text-xs">
                  <tbody>
                    {filteredSheetRows.map((row, rIdx) => (
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
            <div className="max-w-2xl mx-auto my-auto w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
              <div className={`w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-white mb-4 shadow-md ${
                isPdf ? 'bg-rose-600' : isExcel ? 'bg-emerald-600' : 'bg-blue-600'
              }`}>
                {isPdf ? (
                  <FileText className="w-10 h-10" />
                ) : isExcel ? (
                  <FileSpreadsheet className="w-10 h-10" />
                ) : (
                  <FileCode className="w-10 h-10" />
                )}
              </div>

              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2 ${
                isPdf 
                  ? 'bg-rose-100 text-rose-700' 
                  : isExcel 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'bg-blue-100 text-blue-700'
              }`}>
                {isPdf ? 'Dokumen PDF Resmi' : isExcel ? 'Dokumen Microsoft Excel (.xlsx / .xls)' : 'Dokumen Microsoft Word (.docx / .doc)'}
              </span>

              <h3 className="text-xl font-bold text-slate-900 mb-1">
                {docItem.title}
              </h3>
              <p className="text-xs text-slate-500 font-mono mb-4">
                Nama Berkas: {docItem.fileName} ({formatBytes(docItem.fileSize)})
              </p>

              {docItem.catatanRingkasan ? (
                <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 mb-6">
                  <p className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-sky-600" />
                    Ringkasan Eksekutif / Catatan Dokumen:
                  </p>
                  <p className="leading-relaxed">{docItem.catatanRingkasan}</p>
                </div>
              ) : null}

              {/* Operational Metrics Grid */}
              {(docItem.totalStrikeBulanIni !== undefined || 
                docItem.totalPatroliBulanIni !== undefined || 
                docItem.totalOccurrenceBulanIni !== undefined || 
                docItem.totalSatwaBulanIni !== undefined) && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5 text-left">
                  <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-xl">
                    <span className="text-[10px] text-rose-700 font-semibold block">Total Strike</span>
                    <span className="text-lg font-black text-rose-900 font-mono">
                      {docItem.totalStrikeBulanIni ?? 0}
                    </span>
                    {docItem.strikeWithDamageBulanIni !== undefined && (
                      <span className="text-[9px] text-rose-600 block mt-0.5">
                        ({docItem.strikeWithDamageBulanIni} berkerusakan)
                      </span>
                    )}
                  </div>
                  <div className="bg-sky-50 border border-sky-100 p-2.5 rounded-xl">
                    <span className="text-[10px] text-sky-700 font-semibold block">Total Patroli</span>
                    <span className="text-lg font-black text-sky-900 font-mono">
                      {docItem.totalPatroliBulanIni ?? 0}
                    </span>
                    <span className="text-[9px] text-sky-600 block mt-0.5">inspeksi lapangan</span>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-xl">
                    <span className="text-[10px] text-amber-700 font-semibold block">Occurrence</span>
                    <span className="text-lg font-black text-amber-900 font-mono">
                      {docItem.totalOccurrenceBulanIni ?? 0}
                    </span>
                    <span className="text-[9px] text-amber-600 block mt-0.5">laporan satwa</span>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">
                    <span className="text-[10px] text-emerald-700 font-semibold block">Satwa Teramati</span>
                    <span className="text-lg font-black text-emerald-900 font-mono">
                      {docItem.totalSatwaBulanIni ? docItem.totalSatwaBulanIni.toLocaleString('id-ID') : 0}
                    </span>
                    <span className="text-[9px] text-emerald-600 block mt-0.5">ekor satwa</span>
                  </div>
                </div>
              )}

              {/* Dominant Species & Vulnerable Area if present */}
              {(docItem.spesiesDominan || docItem.areaRawanUtama) && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left text-xs mb-5 space-y-1.5">
                  {docItem.spesiesDominan && (
                    <p className="text-slate-700">
                      <span className="font-semibold text-slate-900">Spesies Dominan:</span> {docItem.spesiesDominan}
                    </p>
                  )}
                  {docItem.areaRawanUtama && (
                    <p className="text-slate-700">
                      <span className="font-semibold text-slate-900">Area Rawan Utama:</span> {docItem.areaRawanUtama}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => onDownload(docItem)}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Dokumen {isPdf ? 'PDF' : 'Word'} Sekarang</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-sm transition cursor-pointer"
                >
                  Tutup Pratinjau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
