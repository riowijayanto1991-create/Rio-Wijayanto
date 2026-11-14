import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  KeyRound, 
  Smartphone, 
  AlertCircle, 
  X, 
  Check, 
  ArrowRight,
  Shield,
  LifeBuoy
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/security';

interface SecurityLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SecurityLoginModal: React.FC<SecurityLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { login, verifyMfa, loginAsDemoUser } = useAuth();

  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [isRecoveryCode, setIsRecoveryCode] = useState(false);
  const [mfaTicket, setMfaTicket] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(email.trim(), password);
      if (res.requiresMfa) {
        setMfaTicket(res.mfaToken || '');
        setStep('mfa');
      } else {
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRecoveryCode) {
        await verifyMfa(mfaTicket, undefined, mfaCode.trim());
      } else {
        await verifyMfa(mfaTicket, mfaCode.trim(), undefined);
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Kode otentikasi salah atau telah kadaluwarsa.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoSwitch = async (role: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      await loginAsDemoUser(role);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal beralih ke akun demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {step === 'credentials' ? 'Masuk Sistem WHMS (RBAC)' : 'Verifikasi Multi-Factor (MFA)'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Otentikasi Keselamatan Penerbangan WIII
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
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'credentials' ? (
            <div>
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Pengguna:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama@cgk-airport.co.id"
                      required
                      autoFocus
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kata Sandi:
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi..."
                      required
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Verifikasi Kredensial</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Quick Switch for Testing / Operational Evaluation */}
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 block mb-2 uppercase tracking-wider">
                  Beralih Cepat Akun Demo (Simulasi Peran RBAC):
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => handleQuickDemoSwitch('SuperAdmin')}
                    className="p-2 text-left bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 rounded-lg text-purple-900 dark:text-purple-300 font-medium transition cursor-pointer"
                  >
                    <div className="font-bold">SuperAdmin</div>
                    <div className="text-[10px] text-purple-700 dark:text-purple-400">Semua Wewenang + Audit</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoSwitch('AirportAdmin')}
                    className="p-2 text-left bg-sky-50 dark:bg-sky-950/30 hover:bg-sky-100 dark:hover:bg-sky-900/50 border border-sky-200 dark:border-sky-800 rounded-lg text-sky-900 dark:text-sky-300 font-medium transition cursor-pointer"
                  >
                    <div className="font-bold">AirportAdmin</div>
                    <div className="text-[10px] text-sky-700 dark:text-sky-400">Admin CGK / WIII</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoSwitch('WildlifeOfficer')}
                    className="p-2 text-left bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-900 dark:text-emerald-300 font-medium transition cursor-pointer"
                  >
                    <div className="font-bold">WildlifeOfficer</div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400">Input Data Patroli/Strike</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDemoSwitch('DataReviewer')}
                    className="p-2 text-left bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-900 dark:text-amber-300 font-medium transition cursor-pointer"
                  >
                    <div className="font-bold">DataReviewer</div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-400">Persetujuan Koreksi Data</div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 rounded-xl text-xs text-sky-900 dark:text-sky-300">
                <p className="font-semibold">Peran Anda Mewajibkan MFA</p>
                <p className="text-[11px] text-sky-800 dark:text-sky-400 mt-0.5">
                  Buka aplikasi authenticator di ponsel Anda dan masukkan 6-digit kode keamanan.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isRecoveryCode ? 'Masukkan Kode Pemulihan Darurat:' : 'Kode Authenticator (TOTP):'}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecoveryCode(!isRecoveryCode);
                      setMfaCode('');
                      setError(null);
                    }}
                    className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    {isRecoveryCode ? 'Gunakan Kode 6-Digit' : 'Gunakan Kode Pemulihan'}
                  </button>
                </div>

                <div className="relative">
                  {isRecoveryCode ? (
                    <LifeBuoy className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  ) : (
                    <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  )}
                  <input
                    type="text"
                    maxLength={isRecoveryCode ? 10 : 6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    placeholder={isRecoveryCode ? '8 digit kode pemulihan...' : 'Contoh: 123456'}
                    autoFocus
                    required
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-sm font-mono tracking-widest text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={loading || !mfaCode.trim()}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Selesaikan Masuk</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
