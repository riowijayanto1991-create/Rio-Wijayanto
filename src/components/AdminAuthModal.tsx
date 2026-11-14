import React, { useState } from 'react';
import { Shield, KeyRound, Lock, AlertCircle, X, Check, Info } from 'lucide-react';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Verifikasi Otorisasi Administrator',
  description = 'Penghapusan arsip dan rekapitulasi laporan memerlukan otorisasi khusus Administrator / Wildlife Hazard Department Head.'
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPin = localStorage.getItem('whu_admin_pin') || '8888';
    
    // Accept user customized PIN, default PIN 8888, or default passwords
    if (
      pin === storedPin || 
      pin === '8888' || 
      pin.toLowerCase() === 'adminwhu' || 
      pin.toLowerCase() === 'admin123'
    ) {
      localStorage.setItem('whu_admin_mode', 'true');
      setError('');
      setPin('');
      onSuccess();
      onClose();
    } else {
      setError('PIN atau Sandi Admin salah. Silakan coba lagi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{title}</h3>
              <p className="text-[11px] text-slate-400">Unit Wildlife Hazard Management (WHU)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            {description}
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 mb-4 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Perlindungan Integritas Data ICAO</p>
              <p className="text-[11px] text-amber-800 mt-0.5">
                Penghapusan arsip hanya diizinkan untuk Admin demi menjaga rekam jejak audit keselamatan penerbangan.
              </p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>PIN / Sandi Administrator:</span>
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="text-[11px] text-sky-600 hover:underline font-normal cursor-pointer"
                >
                  {showHint ? 'Sembunyikan Bantuan' : 'Lihat Bantuan PIN'}
                </button>
              </label>
              
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value);
                    if (error) setError('');
                  }}
                  autoFocus
                  placeholder="Masukkan 4 digit PIN atau sandi admin..."
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm tracking-wider font-mono focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none"
                />
              </div>

              {showHint && (
                <div className="mt-2 p-2 bg-slate-100 rounded text-[11px] text-slate-600 border border-slate-200">
                  💡 <strong>Kredensial Default Admin:</strong> Masukkan PIN <code className="font-mono font-bold text-sky-700 bg-sky-50 px-1 py-0.5 rounded">8888</code> atau sandi <code className="font-mono font-bold text-sky-700 bg-sky-50 px-1 py-0.5 rounded">adminwhu</code>
                </div>
              )}

              {error && (
                <div className="mt-2 text-xs text-rose-600 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1.5 shadow-sm"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Otorisasi &amp; Masuk Admin</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
