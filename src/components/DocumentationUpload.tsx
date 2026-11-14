import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Eye, 
  X, 
  AlertCircle, 
  Image as ImageIcon,
  CheckCircle2,
  ZoomIn
} from 'lucide-react';

interface DocumentationUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  keterangan?: string;
  onKeteranganChange?: (keterangan: string) => void;
  maxPhotos?: number;
  sectionNumber?: string;
  title?: string;
  subtitle?: string;
  placeholderKeterangan?: string;
  themeColor?: 'sky' | 'amber' | 'red' | 'teal';
}

/**
 * Utility to compress an image file to high-efficiency base64 JPEG
 * Resizes max dimension to 1280px and quality 0.8 to preserve crispness
 * while keeping file sizes small (~60-120 KB) for reliable Firestore storage and PDF rendering.
 */
export const compressImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Check if valid image
    if (!file.type.startsWith('image/')) {
      reject(new Error('File bukan gambar yang valid'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memproses gambar'));
      img.onload = () => {
        const MAX_DIMENSION = 1280;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIMENSION) {
            height = Math.round((height * MAX_DIMENSION) / width);
            width = MAX_DIMENSION;
          }
        } else {
          if (height > MAX_DIMENSION) {
            width = Math.round((width * MAX_DIMENSION) / height);
            height = MAX_DIMENSION;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original data url
          resolve(e.target?.result as string);
          return;
        }

        // Fill with white background in case of transparent PNG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const DocumentationUpload: React.FC<DocumentationUploadProps> = ({
  photos = [],
  onPhotosChange,
  keterangan = '',
  onKeteranganChange,
  maxPhotos = 5,
  sectionNumber,
  title = 'DOKUMENTASI & FOTO LAPANGAN',
  subtitle = 'Unggah hingga maksimal 5 foto bukti dokumentasi fisik di lapangan.',
  placeholderKeterangan = 'Deskripsi dokumentasi (misal: Foto 1: Bangkai satwa liar di runway 25L, Foto 2: Pengusiran dengan sirine)...',
  themeColor = 'sky'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [previewModalIndex, setPreviewModalIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const remainingSlots = Math.max(0, maxPhotos - photos.length);

  // Theme styling helpers
  const themeClasses = {
    sky: {
      borderLeft: 'border-sky-600',
      bgHeader: 'bg-slate-100',
      textHeader: 'text-slate-800',
      badge: 'bg-sky-100 text-sky-800 border-sky-300',
      activeRing: 'focus:ring-sky-500',
      buttonBg: 'bg-sky-600 hover:bg-sky-700 text-white',
      dropActive: 'border-sky-500 bg-sky-50/60'
    },
    amber: {
      borderLeft: 'border-amber-600',
      bgHeader: 'bg-amber-50',
      textHeader: 'text-amber-900',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      activeRing: 'focus:ring-amber-500',
      buttonBg: 'bg-amber-600 hover:bg-amber-700 text-white',
      dropActive: 'border-amber-500 bg-amber-50/60'
    },
    red: {
      borderLeft: 'border-red-600',
      bgHeader: 'bg-red-50',
      textHeader: 'text-red-900',
      badge: 'bg-red-100 text-red-800 border-red-300',
      activeRing: 'focus:ring-red-500',
      buttonBg: 'bg-red-600 hover:bg-red-700 text-white',
      dropActive: 'border-red-500 bg-red-50/60'
    },
    teal: {
      borderLeft: 'border-teal-600',
      bgHeader: 'bg-teal-50',
      textHeader: 'text-teal-900',
      badge: 'bg-teal-100 text-teal-800 border-teal-300',
      activeRing: 'focus:ring-teal-500',
      buttonBg: 'bg-teal-600 hover:bg-teal-700 text-white',
      dropActive: 'border-teal-500 bg-teal-50/60'
    }
  }[themeColor];

  const handleFiles = async (files: FileList | File[]) => {
    setErrorMessage(null);
    const fileArray = Array.from(files);

    if (fileArray.length === 0) return;

    if (photos.length >= maxPhotos) {
      setErrorMessage(`Batas maksimal ${maxPhotos} foto telah tercapai. Hapus foto sebelum mengunggah yang baru.`);
      return;
    }

    const allowedFiles = fileArray.slice(0, remainingSlots);
    if (fileArray.length > remainingSlots) {
      setErrorMessage(`Hanya ${remainingSlots} foto yang ditambahkan karena batas maksimal adalah ${maxPhotos} foto.`);
    }

    setIsProcessing(true);
    try {
      const processedDataUrls: string[] = [];
      for (const file of allowedFiles) {
        if (!file.type.startsWith('image/')) {
          setErrorMessage('Beberapa berkas dilewati karena bukan berkas gambar yang didukung.');
          continue;
        }
        const compressed = await compressImageFile(file);
        processedDataUrls.push(compressed);
      }

      if (processedDataUrls.length > 0) {
        onPhotosChange([...photos, ...processedDataUrls]);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses berkas gambar.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    const next = photos.filter((_, idx) => idx !== indexToRemove);
    onPhotosChange(next);
    if (previewModalIndex === indexToRemove) {
      setPreviewModalIndex(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (photos.length < maxPhotos) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3.5 py-2 rounded-lg border-l-4 ${themeClasses.borderLeft} ${themeClasses.bgHeader}`}>
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-slate-700 shrink-0" />
          <span className={`text-sm font-bold ${themeClasses.textHeader}`}>
            {sectionNumber ? `${sectionNumber}. ` : ''}{title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border font-mono ${themeClasses.badge}`}>
            {photos.length} / {maxPhotos} Foto
          </span>
          {photos.length >= maxPhotos && (
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Maksimal Tercapai
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-slate-500 -mt-2">
        {subtitle}
      </p>

      {/* Error / Notification Banner */}
      {errorMessage && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">{errorMessage}</div>
          <button 
            type="button" 
            onClick={() => setErrorMessage(null)} 
            className="text-amber-700 hover:text-amber-900 p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Photo Grid Preview */}
      {photos.length > 0 && (
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            Foto Terunggah ({photos.length} item) :
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {photos.map((url, idx) => (
              <div 
                key={idx}
                className="group relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 shadow-xs hover:shadow-md transition"
              >
                <img 
                  src={url} 
                  alt={`Dokumentasi ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Index badge */}
                <div className="absolute top-1.5 left-1.5 bg-slate-900/80 text-white font-mono text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                  Foto {idx + 1}
                </div>

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-1">
                  <button
                    type="button"
                    onClick={() => setPreviewModalIndex(idx)}
                    className="p-1.5 bg-white/90 hover:bg-white text-slate-800 rounded-full transition shadow hover:scale-105 cursor-pointer"
                    title="Perbesar Foto"
                  >
                    <ZoomIn className="w-4 h-4 text-sky-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition shadow hover:scale-105 cursor-pointer"
                    title="Hapus Foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Empty slots placeholders if less than maxPhotos */}
            {Array.from({ length: maxPhotos - photos.length }).map((_, slotIdx) => (
              <div 
                key={`empty-${slotIdx}`}
                onClick={() => photos.length < maxPhotos && fileInputRef.current?.click()}
                className={`rounded-lg border-2 border-dashed border-slate-200 aspect-4/3 flex flex-col items-center justify-center text-slate-400 p-2 text-center transition cursor-pointer hover:border-slate-300 hover:bg-slate-50/50 ${
                  photos.length >= maxPhotos ? 'pointer-events-none opacity-40' : ''
                }`}
              >
                <ImageIcon className="w-5 h-5 mb-1 text-slate-300" />
                <span className="text-[10px] font-medium text-slate-400">
                  Slot Foto {photos.length + slotIdx + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Dropzone / Button Area */}
      {photos.length < maxPhotos ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center transition cursor-pointer flex flex-col items-center justify-center gap-2 ${
            isDragging 
              ? themeClasses.dropActive 
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files);
              }
            }}
          />

          <div className="p-3 bg-white rounded-full shadow-xs border border-slate-200 text-slate-600">
            {isProcessing ? (
              <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-6 h-6 text-slate-600" />
            )}
          </div>

          <div>
            <p className="text-xs font-bold text-slate-800">
              {isProcessing 
                ? 'Mengompres & memproses foto...' 
                : 'Klik untuk memilih foto atau seret berkas ke sini'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Format: JPG, PNG, atau WebP (Maksimal 5 foto • Tersisa {remainingSlots} slot).
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Foto otomatis dikompres secara optimal untuk ketajaman cetak PDF &amp; efisiensi memori.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500 flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Batas maksimal <strong>5 foto dokumentasi</strong> telah terunggah secara lengkap.</span>
        </div>
      )}

      {/* Keterangan / Deskripsi Dokumentasi */}
      {onKeteranganChange && (
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">
            Keterangan &amp; Catatan Dokumentasi :
          </label>
          <textarea
            value={keterangan}
            onChange={(e) => onKeteranganChange(e.target.value)}
            rows={2}
            placeholder={placeholderKeterangan}
            className={`w-full p-2.5 border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 outline-hidden transition ${themeClasses.activeRing} focus:ring-1 focus:border-transparent`}
          />
        </div>
      )}

      {/* Full Size Image Preview Modal */}
      {previewModalIndex !== null && photos[previewModalIndex] && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewModalIndex(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 py-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-bold font-mono">
                  Pratinjau Foto {previewModalIndex + 1} dari {photos.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(previewModalIndex)}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded flex items-center gap-1 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Hapus Foto
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewModalIndex(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Image */}
            <div className="p-3 bg-slate-100 flex items-center justify-center overflow-auto max-h-[75vh]">
              <img 
                src={photos[previewModalIndex]} 
                alt={`Pratinjau Foto ${previewModalIndex + 1}`}
                className="max-h-[70vh] max-w-full object-contain rounded border border-slate-300 shadow-sm"
              />
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span>Gunakan tombol panah atau tutup untuk kembali ke formulir.</span>
              <div className="flex items-center gap-2">
                {previewModalIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => setPreviewModalIndex(previewModalIndex - 1)}
                    className="px-2.5 py-1 border border-slate-300 rounded hover:bg-slate-50 cursor-pointer font-medium"
                  >
                    ← Sebelumnya
                  </button>
                )}
                {previewModalIndex < photos.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setPreviewModalIndex(previewModalIndex + 1)}
                    className="px-2.5 py-1 border border-slate-300 rounded hover:bg-slate-50 cursor-pointer font-medium"
                  >
                    Selanjutnya →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
