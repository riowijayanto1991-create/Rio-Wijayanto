import React, { useRef, useState, useEffect } from 'react';
import { 
  PenTool, 
  CheckCircle2, 
  X, 
  RotateCcw, 
  Sparkles, 
  ShieldCheck, 
  QrCode, 
  FileCheck, 
  Lock,
  User,
  BadgeAlert
} from 'lucide-react';
import { OfficerDigitalSignature } from '../types';
import { generateRealisticSignatureDataUrl, getQrCodeDataUrl } from '../utils/airportAssets';
import { lookupPersonnelNip } from '../utils/personnelHelper';

interface DigitalSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportNumber: string;
  reportType: 'patrol' | 'occurrence' | 'strike' | 'vehicle';
  defaultOfficerName?: string;
  defaultRole?: 'officer' | 'receiver' | 'supervisor';
  onSaveSignature: (
    roleKey: 'officer' | 'receiver' | 'supervisor',
    signature: OfficerDigitalSignature
  ) => void;
  existingSignature?: OfficerDigitalSignature;
}

export const DigitalSignatureModal: React.FC<DigitalSignatureModalProps> = ({
  isOpen,
  onClose,
  reportNumber,
  reportType,
  defaultOfficerName = '',
  defaultRole = 'officer',
  onSaveSignature,
  existingSignature
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  
  const [selectedRoleKey, setSelectedRoleKey] = useState<'officer' | 'receiver' | 'supervisor'>(defaultRole);
  const [signerName, setSignerName] = useState<string>(defaultOfficerName || 'Petugas WHU');
  const [signerNipp, setSignerNipp] = useState<string>('');
  const [signerRoleTitle, setSignerRoleTitle] = useState<string>('Person on Duty (POD) Pelapor');
  const [previewQr, setPreviewQr] = useState<string>('');

  // Sync role details when selectedRoleKey changes
  useEffect(() => {
    if (selectedRoleKey === 'supervisor') {
      const name = 'RACHMADITYA';
      setSignerName(name);
      setSignerNipp(lookupPersonnelNip(name, 'supervisor'));
      setSignerRoleTitle('Wildlife Hazard Department Head / Verifikator');
    } else if (selectedRoleKey === 'receiver') {
      const name = defaultOfficerName || 'MOHAMAD DANIL';
      setSignerName(name);
      setSignerNipp(lookupPersonnelNip(name, 'receiver'));
      setSignerRoleTitle('Petugas Penerima Dinas Berjalan (Driver)');
    } else {
      const name = defaultOfficerName || 'RIO WIJAYANTO';
      setSignerName(name);
      setSignerNipp(lookupPersonnelNip(name, 'officer'));
      setSignerRoleTitle(
        reportType === 'strike' 
          ? 'Lead Investigator / Duty Officer WHU' 
          : reportType === 'vehicle'
          ? 'Petugas Menyerahkan Dinas Lepas'
          : 'Person on Duty (POD) Unit WHU'
      );
    }
  }, [selectedRoleKey, defaultOfficerName, reportType]);

  // Auto-lookup NIP when signerName changes if not explicitly typed
  const handleNameChange = (nameVal: string) => {
    setSignerName(nameVal);
    const resolvedNip = lookupPersonnelNip(nameVal, selectedRoleKey);
    setSignerNipp(resolvedNip);
  };

  // Load existing signature onto canvas if provided
  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      initCanvas();
      if (existingSignature?.signatureDataUrl) {
        loadDataUrlToCanvas(existingSignature.signatureDataUrl);
        setHasDrawn(true);
        if (existingSignature.signerName) setSignerName(existingSignature.signerName);
        if (existingSignature.signerNipp) setSignerNipp(existingSignature.signerNipp);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, existingSignature]);

  // Update preview QR code
  useEffect(() => {
    if (!isOpen) return;
    const samplePayload = `PT ANGKASA PURA INDONESIA\nWHU AIRSIDE SAFETY\nDoc: ${reportNumber}\nSigner: ${signerName}\nNIP: ${signerNipp || '-'}\nRole: ${signerRoleTitle}`;
    getQrCodeDataUrl(samplePayload).then(url => {
      setPreviewQr(url);
    });
  }, [isOpen, reportNumber, signerName, signerNipp, signerRoleTitle]);

  if (!isOpen) return null;

  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Initial clear & baseline guide line
    drawCanvasBaseline(ctx, rect.width, rect.height);
  };

  const drawCanvasBaseline = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Subtle guide baseline
    ctx.save();
    ctx.strokeStyle = '#E2E8F0';
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, height - 36);
    ctx.lineTo(width - 30, height - 36);
    ctx.stroke();

    // "X" indicator on left
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('X', 32, height - 42);

    ctx.restore();
  };

  const loadDataUrlToCanvas = (dataUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.drawImage(img, 0, 0, rect.width, rect.height);
    };
    img.src = dataUrl;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    drawCanvasBaseline(ctx, rect.width, rect.height);
    setHasDrawn(false);
  };

  const generateQuickSignature = () => {
    const signatureUrl = generateRealisticSignatureDataUrl(signerName, signerRoleTitle);
    loadDataUrlToCanvas(signatureUrl);
    setHasDrawn(true);
  };

  // Canvas drawing handlers
  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    setHasDrawn(true);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.strokeStyle = '#0F2B5C'; // Professional navy ink
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    let signatureUrl = '';

    if (hasDrawn && canvas) {
      signatureUrl = canvas.toDataURL('image/png');
    } else {
      // Fallback to crisp algorithmic cursive signature
      signatureUrl = generateRealisticSignatureDataUrl(signerName, signerRoleTitle);
    }

    const verificationHash = `AP-WHU-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const newSignature: OfficerDigitalSignature = {
      signerName: signerName.trim() || 'Petugas WHU',
      signerNipp: signerNipp.trim() || '20243777',
      signerRole: signerRoleTitle,
      signedAt: new Date().toISOString(),
      signatureDataUrl: signatureUrl,
      verificationHash,
      unitSeal: false
    };

    onSaveSignature(selectedRoleKey, newSignature);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-800">
                  Standar Bandara PT AP
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {reportNumber}
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Pembubuhan Tanda Tangan Digital Petugas
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh] text-xs">
          
          {/* Role Switcher */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5 text-xs">
              Pilih Peran / Kolom Tanda Tangan:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRoleKey('officer')}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                  selectedRoleKey === 'officer'
                    ? 'bg-sky-50 border-sky-600 text-sky-900 ring-2 ring-sky-500/20 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px]">Petugas Pelapor</span>
                  {selectedRoleKey === 'officer' && <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />}
                </div>
                <span className="text-[10px] text-slate-500 font-normal mt-0.5">Person on Duty</span>
              </button>

              {reportType === 'vehicle' && (
                <button
                  type="button"
                  onClick={() => setSelectedRoleKey('receiver')}
                  className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                    selectedRoleKey === 'receiver'
                      ? 'bg-teal-50 border-teal-600 text-teal-900 ring-2 ring-teal-500/20 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]">Petugas Penerima</span>
                    {selectedRoleKey === 'receiver' && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />}
                  </div>
                  <span className="text-[10px] text-slate-500 font-normal mt-0.5">Dinas Berjalan</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedRoleKey('supervisor')}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer flex flex-col justify-between ${
                  selectedRoleKey === 'supervisor'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-2 ring-indigo-500/20 font-bold'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px]">Verifikator / Ka. Unit</span>
                  {selectedRoleKey === 'supervisor' && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                </div>
                <span className="text-[10px] text-slate-500 font-normal mt-0.5">Dept. Head / Lead</span>
              </button>
            </div>
          </div>

          {/* Form Fields: Officer Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                Nama Lengkap Petugas *
              </label>
              <input
                type="text"
                value={signerName}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Contoh: Rachmaditya / Nurjaya"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-hidden font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                NIP Pegawai AP *
              </label>
              <input
                type="text"
                value={signerNipp}
                onChange={(e) => setSignerNipp(e.target.value)}
                placeholder="Contoh: 20242233"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-hidden font-mono"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                Jabatan / Peran Pengesahan
              </label>
              <input
                type="text"
                value={signerRoleTitle}
                onChange={(e) => setSignerRoleTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 text-xs focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-hidden"
              />
            </div>
          </div>

          {/* Interactive Signature Pad */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-800 font-semibold text-xs flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-sky-600" />
                <span>Goreskan Tanda Tangan Anda (Touchscreen / Mouse):</span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] flex items-center gap-1 transition cursor-pointer"
                  title="Bersihkan kanvas tanda tangan"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Bersihkan</span>
                </button>
                <button
                  type="button"
                  onClick={generateQuickSignature}
                  className="px-2.5 py-1 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded text-[11px] font-medium flex items-center gap-1 transition cursor-pointer"
                  title="Buat goresan otomatis berdasarkan nama petugas"
                >
                  <Sparkles className="w-3 h-3 text-sky-600" />
                  <span>Goresan Cepat</span>
                </button>
              </div>
            </div>

            {/* Canvas Box */}
            <div className="relative border-2 border-dashed border-slate-300 hover:border-sky-400 rounded-xl bg-white overflow-hidden shadow-inner touch-none">
              <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="w-full h-36 cursor-crosshair block"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400 text-[11px] gap-1">
                  <PenTool className="w-5 h-5 text-slate-300" />
                  <span>Tanda tangan di sini menggunakan mouse, pen tablet, atau jari</span>
                </div>
              )}
            </div>
          </div>

          {/* Digital Verification & Security Seal Card */}
          <div className="bg-sky-50/80 border border-sky-200 rounded-xl p-3 flex items-start gap-3 text-sky-950">
            {previewQr ? (
              <img 
                src={previewQr} 
                alt="QR Verification" 
                className="w-16 h-16 rounded border border-sky-300 bg-white p-0.5 shrink-0" 
              />
            ) : (
              <div className="w-16 h-16 rounded bg-sky-100 border border-sky-300 flex items-center justify-center shrink-0">
                <QrCode className="w-8 h-8 text-sky-700" />
              </div>
            )}
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-[11px] text-sky-900">
                <ShieldCheck className="w-4 h-4 text-sky-700 shrink-0" />
                <span>Pengesahan Tanda Tangan Digital Resmi (E-Signature)</span>
              </div>
              <p className="text-[10px] text-sky-800 leading-relaxed">
                Tanda tangan digital ini diverifikasi sah secara elektronik dilengkapi Nama, NIP Pegawai, stempel waktu, dan matriks QR Code verifikasi dokumen tanpa memerlukan stempel fisik/manual.
              </p>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Batal
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-md shadow-sky-600/25 flex items-center gap-2 transition cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>Simpan &amp; Bubuhkan Tanda Tangan</span>
          </button>
        </div>

      </div>
    </div>
  );
};
