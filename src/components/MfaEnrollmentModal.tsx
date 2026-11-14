import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  KeyRound, 
  Copy, 
  Check, 
  Download, 
  AlertTriangle, 
  X, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MfaEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const MfaEnrollmentModal: React.FC<MfaEnrollmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { sessionToken, user, refreshUser } = useAuth();
  
  const [step, setStep] = useState<'qr' | 'codes'>('qr');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [totpCode, setTotpCode] = useState<string>('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState<boolean>(false);
  const [copiedCodes, setCopiedCodes] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setStep('qr');
      setError(null);
      setTotpCode('');
      setRecoveryCodes([]);
      fetchMfaEnrollment();
    }
  }, [isOpen]);

  const fetchMfaEnrollment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/enroll-mfa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken || ''}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Gagal memulai pendaftaran MFA.');
      }
      setSecret(data.secret);
      setQrCodeDataUrl(data.qrCodeDataUrl);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem saat memuat QR Code MFA.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totpCode.trim().length !== 6) {
      setError('Masukkan 6 digit angka kode verifikasi dari aplikasi authenticator.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/confirm-mfa-enrollment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken || ''}`
        },
        body: JSON.stringify({ totpCode: totpCode.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Kode verifikasi tidak cocok atau kedaluwarsa.');
      }
      setRecoveryCodes(data.recoveryCodes || []);
      setStep('codes');
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Gagal memverifikasi kode authenticator.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyCodes = () => {
    const text = recoveryCodes.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const handleDownloadCodes = () => {
    const content = `KODE PEMULIHAN CADANGAN (RECOVERY CODES) MFA - SOEKARNO-HATTA WHMS
Akun Pengguna: ${user?.email || 'User'}
Tanggal Terbit: ${new Date().toLocaleString('id-ID')}
Bandara: Bandara Internasional Soekarno-Hatta (CGK/WIII)

PERINGATAN:
1. Simpan kode ini di tempat yang aman dan rahasia.
2. Setiap kode hanya dapat digunakan 1 kali jika Anda kehilangan akses ke aplikasi authenticator.

DAFTAR KODE:
${recoveryCodes.map((code, idx) => `${idx + 1}. ${code}`).join('\n')}
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `MFA-Recovery-Codes-CGK-${user?.email || 'user'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFinish = () => {
    if (onSuccess) onSuccess();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                Aktivasi Multi-Factor Authentication (MFA)
              </h3>
              <p className="text-[11px] text-slate-400">
                Aplikasi Authenticator TOTP (Google Authenticator, Microsoft Authenticator)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'qr' ? (
            <div className="space-y-5">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Pindai kode QR di bawah ini menggunakan aplikasi authenticator di ponsel pintar Anda 
                (seperti <strong>Google Authenticator</strong> atau <strong>Microsoft Authenticator</strong>), 
                kemudian masukkan 6-digit kode verifikasi yang muncul.
              </p>

              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                  <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-500">Menyiapkan kunci enkripsi TOTP...</p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-xs shrink-0">
                    {qrCodeDataUrl ? (
                      <img 
                        src={qrCodeDataUrl} 
                        alt="QR Code MFA" 
                        className="w-36 h-36 object-contain"
                      />
                    ) : (
                      <div className="w-36 h-36 flex items-center justify-center text-xs text-slate-400 font-mono">
                        QR Placeholder
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-left min-w-0">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Atau masukkan kunci manual:
                    </span>
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono font-bold bg-white dark:bg-slate-900 px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 truncate select-all">
                        {secret || 'MEMUAT...'}
                      </code>
                      <button
                        type="button"
                        onClick={handleCopySecret}
                        className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-white rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 transition cursor-pointer"
                        title="Salin Kunci Manual"
                      >
                        {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Label: <code>WHMS-CGK ({user?.email})</code>
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={handleConfirmTotp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Masukkan 6 Digit Kode dari Authenticator:
                  </label>
                  <div className="relative">
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      maxLength={6}
                      inputMode="numeric"
                      value={totpCode}
                      onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="Contoh: 123456"
                      autoFocus
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm font-mono tracking-widest text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading || totpCode.length !== 6}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>Verifikasi &amp; Lanjutkan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-start gap-2.5 text-emerald-900 dark:text-emerald-300">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-bold">MFA TOTP Berhasil Diaktifkan!</p>
                  <p className="text-[11px] text-emerald-800 dark:text-emerald-400 mt-0.5">
                    Akun Anda sekarang dilindungi oleh verifikasi dua langkah. Simpan kode pemulihan darurat di bawah ini.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl p-3 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Penting: Kode Pemulihan Sekali Pakai</p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-400 mt-0.5">
                    Jika ponsel Anda hilang atau tidak dapat diakses, Anda dapat menggunakan salah satu kode ini untuk masuk. Kode hanya ditampilkan sekali ini.
                  </p>
                </div>
              </div>

              {/* 10 Recovery Codes Grid */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                {recoveryCodes.map((code, idx) => (
                  <div 
                    key={idx}
                    className="p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 font-mono text-xs font-bold text-center text-slate-800 dark:text-slate-200 select-all"
                  >
                    <span className="text-[10px] text-slate-400 mr-1.5">{idx + 1}.</span>
                    {code}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCodes}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedCodes ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCodes ? 'Tersalin!' : 'Salin Semua'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCodes}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-500" />
                    <span>Unduh TXT</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleFinish}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer"
                >
                  Selesai &amp; Tutup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
