import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

if (typeof window !== 'undefined') {
  try {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
        import.meta.url
      ).href;
    }
  } catch (e) {
    console.warn('PDF.js worker initialization notice:', e);
  }
}
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Loader2, 
  AlertCircle,
  Download,
  FileText,
  Maximize2
} from 'lucide-react';

interface PdfCanvasViewerProps {
  pdfData: string; // Base64 data URL or raw URL
  title?: string;
  onDownload?: () => void;
  className?: string;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  pdfData,
  title = 'Dokumen PDF',
  onDownload,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fallbackText, setFallbackText] = useState<string | null>(null);

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;

    async function loadPdf() {
      if (!pdfData) {
        setErrorMessage('Data dokumen PDF tidak ditemukan atau kosong.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage(null);
      setFallbackText(null);

      try {
        let uint8Data: Uint8Array;

        if (pdfData.startsWith('data:')) {
          const base64Str = pdfData.split(',')[1] || '';
          const binaryStr = atob(base64Str);
          const len = binaryStr.length;
          uint8Data = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            uint8Data[i] = binaryStr.charCodeAt(i);
          }
        } else {
          // Normal fetch URL or base64 without prefix
          try {
            const res = await fetch(pdfData);
            const buf = await res.arrayBuffer();
            uint8Data = new Uint8Array(buf);
          } catch {
            const binaryStr = atob(pdfData);
            const len = binaryStr.length;
            uint8Data = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              uint8Data[i] = binaryStr.charCodeAt(i);
            }
          }
        }

        const loadingTask = pdfjsLib.getDocument({
          data: uint8Data,
          useSystemFonts: true
        });

        const doc = await loadingTask.promise;
        if (isCancelled) return;

        setPdfDoc(doc);
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err: any) {
        console.warn('PDF.js canvas viewer load error, preparing text fallback:', err);
        if (isCancelled) return;
        setErrorMessage('Pratinjau visual PDF sedang dimuat atau browser memerlukan format tampilan teks.');
        setLoading(false);
      }
    }

    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [pdfData]);

  // Render Current Page to Canvas
  useEffect(() => {
    let renderTask: any = null;
    let isCancelled = false;

    async function renderPage() {
      if (!pdfDoc || !canvasRef.current) return;

      try {
        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Dynamic scale adjustment based on container width if on mobile
        let actualScale = scale;
        if (containerRef.current) {
          const containerWidth = containerRef.current.clientWidth - 32;
          const unscaledViewport = page.getViewport({ scale: 1, rotation });
          if (unscaledViewport.width > containerWidth && containerWidth > 200) {
            actualScale = Math.min(scale, (containerWidth / unscaledViewport.width) * 0.95);
          }
        }

        const viewport = page.getViewport({ scale: actualScale, rotation });

        // High DPI sharpness
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = Math.floor(viewport.width) + 'px';
        canvas.style.height = Math.floor(viewport.height) + 'px';

        const transform = outputScale !== 1
          ? [outputScale, 0, 0, outputScale, 0, 0]
          : undefined;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          transform: transform
        };

        renderTask = page.render(renderContext);
        await renderTask.promise;
      } catch (renderErr: any) {
        if (renderErr?.name !== 'RenderingCancelledException') {
          console.warn('PDF render page warning:', renderErr);
        }
      }
    }

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, currentPage, scale, rotation]);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 2.5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.6));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  return (
    <div className={`flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden shadow border border-slate-700 ${className}`}>
      {/* Top PDF Controls Toolbar */}
      <div className="bg-slate-800 text-white px-4 py-2 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2 shrink-0 text-xs">
        {/* Title & Page Navigation */}
        <div className="flex items-center space-x-2">
          <span className="font-bold truncate max-w-[180px] sm:max-w-xs text-slate-200">
            {title}
          </span>
          {totalPages > 0 && (
            <div className="flex items-center space-x-1 bg-slate-900 px-2 py-1 rounded-md border border-slate-700">
              <button
                type="button"
                onClick={handlePrevPage}
                disabled={currentPage <= 1}
                className="p-0.5 rounded text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-[11px] px-1 text-slate-200">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={handleNextPage}
                disabled={currentPage >= totalPages}
                className="p-0.5 rounded text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Zoom & Rotation Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition cursor-pointer"
            title="Perkecil (Zoom Out)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-slate-300 px-1">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition cursor-pointer"
            title="Perbesar (Zoom In)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleRotate}
            className="p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white transition cursor-pointer ml-1"
            title="Putar Dokumen 90°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              className="px-2.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center gap-1 transition shadow-xs cursor-pointer ml-2"
              title="Unduh Berkas PDF Asli"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* Main PDF Canvas Display Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto bg-slate-950/90 p-4 flex items-center justify-center min-h-[300px]"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center text-slate-400 space-y-2 p-8">
            <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
            <p className="text-xs font-medium">Memuat dan merender halaman dokumen PDF...</p>
          </div>
        ) : errorMessage ? (
          <div className="flex flex-col items-center justify-center text-center p-6 max-w-md bg-slate-900 border border-slate-800 rounded-xl text-slate-300 space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-400" />
            <div>
              <h4 className="font-bold text-sm text-white">Pratinjau PDF Terbuka</h4>
              <p className="text-xs text-slate-400 mt-1">{errorMessage}</p>
            </div>
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Unduh &amp; Buka Berkas PDF Langsung</span>
              </button>
            )}
          </div>
        ) : (
          <div className="relative shadow-2xl rounded-lg overflow-hidden border border-slate-700 bg-white">
            <canvas ref={canvasRef} className="block mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
};
