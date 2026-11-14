import React, { useState } from 'react';
import { Smartphone, Download, Share2, PlusSquare, X, CheckCircle2, ChevronRight, ShieldCheck } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar' | 'banner' | 'pill' | 'menu-item';
  className?: string;
  onItemClick?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  className = '',
  onItemClick
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return sessionStorage.getItem('whu_pwa_banner_dismissed') === 'true';
  });

  // If already running inside standalone installed app, do not show install prompt
  if (isInstalled) {
    if (variant === 'sidebar') {
      return (
        <div className="mx-3 my-2 p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center space-x-2 text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">Aplikasi Terpasang di Smartphone</span>
        </div>
      );
    }
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        // If user cancelled prompt or error, fallback to guide
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  const handleDismissBanner = () => {
    setIsDismissed(true);
    sessionStorage.setItem('whu_pwa_banner_dismissed', 'true');
  };

  // Render Guide Modal
  const renderGuideModal = () => {
    if (!showGuideModal) return null;

    return (
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200"
        onClick={() => setShowGuideModal(false)}
      >
        <div 
          className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-sky-900 to-indigo-900 p-5 flex items-start justify-between border-b border-slate-700">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shadow-inner">
                <img src="/pwa-192x192.png" alt="WHU App Icon" className="w-8 h-8 rounded-lg object-contain" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Pasang Aplikasi WHU di HP</h3>
                <p className="text-xs text-sky-200">PT Angkasa Pura Indonesia • Bandara SHIA</p>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Pasang aplikasi ini langsung di layar utama smartphone Android atau iPhone Anda agar dapat diakses cepat layaknya aplikasi native, mendukung kerja lapangan, dan hemat kuota data.
            </p>

            {isIOS ? (
              /* iOS Safari Instructions */
              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-semibold text-amber-300">
                  <Share2 className="w-4 h-4" />
                  <span>Petunjuk untuk iPhone / iPad (Safari):</span>
                </div>
                <ol className="text-xs text-slate-200 space-y-2 list-decimal list-inside pl-1">
                  <li>
                    Buka halaman ini menggunakan browser <strong>Safari</strong>.
                  </li>
                  <li>
                    Tekan tombol <strong>Bagikan (Share)</strong> <Share2 className="w-3.5 h-3.5 inline mx-1 text-sky-400" /> di menu bar bawah.
                  </li>
                  <li>
                    Gulir ke bawah dan pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-emerald-400" />.
                  </li>
                  <li>
                    Tekan <strong>Tambah (Add)</strong> di pojok kanan atas untuk menyelesaikan instalasi.
                  </li>
                </ol>
              </div>
            ) : (
              /* Android / Chrome Instructions */
              <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 space-y-3">
                <div className="flex items-center space-x-2 text-xs font-semibold text-sky-300">
                  <Smartphone className="w-4 h-4" />
                  <span>Petunjuk untuk Android / Google Chrome:</span>
                </div>
                {isInstallable ? (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-300">
                      Browser Anda mendukung instalasi langsung 1-klik:
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        install();
                        setShowGuideModal(false);
                      }}
                      className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg transition text-sm cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Pasang Sekarang (Instal)</span>
                    </button>
                  </div>
                ) : (
                  <ol className="text-xs text-slate-200 space-y-2 list-decimal list-inside pl-1">
                    <li>
                      Ketuk tombol menu <strong>titik tiga (⋮)</strong> di sudut kanan atas browser Chrome.
                    </li>
                    <li>
                      Pilih menu <strong>"Instal Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.
                    </li>
                    <li>
                      Konfirmasi dengan menekan <strong>Instal</strong>.
                    </li>
                  </ol>
                )}
              </div>
            )}

            {/* Feature highlights */}
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-400">
              <div className="flex items-center space-x-1.5 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Bekerja Cepat & Ringan</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-slate-800/50 p-2 rounded-lg border border-slate-700/50">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>Akses Offline Mandiri</span>
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Mengerti & Tutup
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Menu-item Variant (inside dropdown menu like 'Lainnya')
  if (variant === 'menu-item') {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            onItemClick?.();
            handleInstallClick();
          }}
          className={`w-full px-3 py-2 text-left flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-xs ${className}`}
        >
          <Smartphone className="w-4 h-4 text-sky-600" />
          <span>Pasang Aplikasi di HP</span>
        </button>
        {renderGuideModal()}
      </>
    );
  }

  // Sidebar Variant (inside sidebar navigation)
  if (variant === 'sidebar') {
    return (
      <>
        <div className={`mx-3 my-2.5 p-3 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-sky-500/30 shadow-lg ${className}`}>
          <div className="flex items-center space-x-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Pasang di Smartphone</h4>
              <p className="text-[10px] text-slate-400">Akses cepat dinas lapangan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full flex items-center justify-center space-x-2 bg-sky-600 hover:bg-sky-500 text-white font-medium py-1.5 px-3 rounded-xl transition text-xs shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>{isInstallable ? 'Instal Aplikasi' : 'Petunjuk Pasang di HP'}</span>
          </button>
        </div>
        {renderGuideModal()}
      </>
    );
  }

  // Mobile Bottom Banner Variant
  if (variant === 'banner') {
    if (isDismissed) return null;

    return (
      <>
        <div className="md:hidden fixed bottom-3 left-3 right-3 z-40 bg-slate-900/95 backdrop-blur-md border border-sky-500/40 rounded-2xl p-3 shadow-2xl flex items-center justify-between space-x-3 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-sky-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Instal Aplikasi WHU</p>
              <p className="text-[11px] text-slate-300 truncate">Pasang di layar utama HP Anda</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              className="bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs px-3 py-1.5 rounded-xl shadow-xs transition cursor-pointer"
            >
              Pasang
            </button>
            <button
              type="button"
              onClick={handleDismissBanner}
              className="text-slate-400 hover:text-slate-200 p-1 rounded-lg"
              title="Tutup banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        {renderGuideModal()}
      </>
    );
  }

  return null;
};
