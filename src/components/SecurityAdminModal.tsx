import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
  UserCheck,
  UserPlus,
  KeyRound,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  Building,
  Hash,
  Activity,
  Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole, AuditLogEntry, ChainVerificationResult, TwoPersonRequest } from '../types/security';

interface SecurityAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMfaEnrollment?: () => void;
  onOpenPasswordChange?: () => void;
}

export const SecurityAdminModal: React.FC<SecurityAdminModalProps> = ({
  isOpen,
  onClose,
  onOpenMfaEnrollment,
  onOpenPasswordChange
}) => {
  const { currentUser, sessionToken, hasPermission, activeSuperAdmins, superAdminWarning } = useAuth();

  const [activeTab, setActiveTab] = useState<'users' | 'twoperson' | 'audit' | 'system'>('users');

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Create user form state
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [createEmail, setCreateEmail] = useState('');
  const [createFullName, setCreateFullName] = useState('');
  const [createRole, setCreateRole] = useState<UserRole>('WildlifeOfficer');
  const [createAirports, setCreateAirports] = useState<string>('WIII');
  const [createPassword, setCreatePassword] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Two-Person requests state
  const [twoPersonRequests, setTwoPersonRequests] = useState<TwoPersonRequest[]>([]);
  const [loadingTwoPerson, setLoadingTwoPerson] = useState(false);
  const [showSubmit2PModal, setShowSubmit2PModal] = useState(false);
  const [targetUserFor2P, setTargetUserFor2P] = useState<any>(null);
  const [action2P, setAction2P] = useState<'PROMOTE_SUPERADMIN' | 'REVOKE_SUPERADMIN'>('PROMOTE_SUPERADMIN');
  const [reason2P, setReason2P] = useState('');
  const [actorPassword2P, setActorPassword2P] = useState('');
  const [submit2PError, setSubmit2PError] = useState<string | null>(null);
  const [submit2PSuccess, setSubmit2PSuccess] = useState<string | null>(null);

  // Approve request state
  const [approvingRequestId, setApprovingRequestId] = useState<string | null>(null);
  const [approverPassword, setApproverPassword] = useState('');
  const [approveError, setApproveError] = useState<string | null>(null);

  // Audit Log state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [auditActionFilter, setAuditActionFilter] = useState('');
  const [auditAirportFilter, setAuditAirportFilter] = useState('*');
  const [chainResult, setChainResult] = useState<ChainVerificationResult | null>(null);
  const [verifyingChain, setVerifyingChain] = useState(false);

  // Fetch Users
  const fetchUsers = async () => {
    if (!sessionToken) return;
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch Two-Person Requests
  const fetchTwoPersonRequests = async () => {
    if (!sessionToken) return;
    setLoadingTwoPerson(true);
    try {
      const res = await fetch('/api/superadmin-requests', {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTwoPersonRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Failed to fetch 2P requests:', err);
    } finally {
      setLoadingTwoPerson(false);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    if (!sessionToken) return;
    setLoadingLogs(true);
    try {
      let url = '/api/audit-logs?limit=150';
      if (auditAirportFilter && auditAirportFilter !== '*') {
        url += `&airportId=${encodeURIComponent(auditAirportFilter)}`;
      }
      if (auditActionFilter.trim()) {
        url += `&action=${encodeURIComponent(auditActionFilter.trim())}`;
      }
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  // Verify Cryptographic Hash Chain
  const handleVerifyChain = async () => {
    if (!sessionToken) return;
    setVerifyingChain(true);
    try {
      const res = await fetch('/api/audit-logs/verify-chain', {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      if (res.ok) {
        const data: ChainVerificationResult = await res.json();
        setChainResult(data);
      }
    } catch (err) {
      console.error('Failed to verify chain:', err);
    } finally {
      setVerifyingChain(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (activeTab === 'users') fetchUsers();
      if (activeTab === 'twoperson') fetchTwoPersonRequests();
      if (activeTab === 'audit') {
        fetchAuditLogs();
        handleVerifyChain();
      }
    }
  }, [isOpen, activeTab, sessionToken]);

  if (!isOpen) return null;

  // Handle Create User
  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(null);

    try {
      const airports = createAirports.split(',').map(a => a.trim().toUpperCase()).filter(Boolean);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          email: createEmail,
          fullName: createFullName,
          role: createRole,
          assignedAirports: airports,
          initialPassword: createPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat pengguna');
      }

      setCreateSuccess(`Pengguna ${data.user.email} berhasil dibuat.`);
      setShowCreateUser(false);
      setCreateEmail('');
      setCreateFullName('');
      setCreatePassword('');
      fetchUsers();
    } catch (err: any) {
      setCreateError(err.message || 'Gagal membuat pengguna');
    } finally {
      setCreateLoading(false);
    }
  };

  // Handle Submit Two-Person Request
  const handleSubmit2P = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmit2PError(null);
    setSubmit2PSuccess(null);

    if (!targetUserFor2P) return;

    try {
      const res = await fetch('/api/superadmin-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
          targetUserId: targetUserFor2P.id,
          action: action2P,
          reason: reason2P,
          actorPassword: actorPassword2P
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengajukan permintaan');
      }

      setSubmit2PSuccess(data.message || 'Permintaan Two-Person Rule berhasil diajukan.');
      setShowSubmit2PModal(false);
      setReason2P('');
      setActorPassword2P('');
      fetchTwoPersonRequests();
    } catch (err: any) {
      setSubmit2PError(err.message || 'Gagal mengajukan permintaan');
    }
  };

  // Handle Approve Two-Person Request
  const handleApprove2P = async (requestId: string) => {
    setApproveError(null);
    try {
      const res = await fetch(`/api/superadmin-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${sessionToken}`
        },
        body: JSON.stringify({ approverPassword })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyetujui permintaan');
      }

      setApprovingRequestId(null);
      setApproverPassword('');
      fetchTwoPersonRequests();
      fetchUsers();
    } catch (err: any) {
      setApproveError(err.message || 'Gagal memproses persetujuan');
    }
  };

  // Filtered users
  const filteredUsers = users.filter(u => {
    const matchSearch = (u.fullName + ' ' + u.email).toLowerCase().includes(userSearch.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-5xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Sistem Keamanan, RBAC &amp; Audit Log Bandara
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  WIII SAFETY REGULATION
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Role-Based Access Control, Multi-Airport Scope, Two-Person Rule, dan Rantai Hash Kriptografis SHA-256.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Tutup panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SuperAdmin Warning Banner if < 2 SuperAdmins (Requirement: Enforce min 2 recommendation) */}
        {superAdminWarning && (
          <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{superAdminWarning}</span>
            </div>
            <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
              {activeSuperAdmins} SuperAdmin Aktif
            </span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-t-xl transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'users'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 shadow-2xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Daftar Pengguna &amp; Peran ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('twoperson')}
            className={`px-3.5 py-2 rounded-t-xl transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'twoperson'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 shadow-2xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Persetujuan Two-Person Rule</span>
            {twoPersonRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-600 text-white">
                {twoPersonRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-2 rounded-t-xl transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 shadow-2xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Audit Log Rantai Hash SHA-256</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-3.5 py-2 rounded-t-xl transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'system'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-800 shadow-2xs'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Kebijakan Keamanan &amp; Sesi</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: USERS & ROLES */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="Cari nama atau email pengguna..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Role filter */}
                  <select
                    value={roleFilter}
                    onChange={e => setRoleFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    <option value="ALL">Semua Peran</option>
                    <option value="SuperAdmin">SuperAdmin</option>
                    <option value="AirportAdmin">AirportAdmin</option>
                    <option value="WildlifeOfficer">WildlifeOfficer</option>
                    <option value="DataReviewer">DataReviewer</option>
                    <option value="Viewer">Viewer</option>
                  </select>

                  <button
                    onClick={fetchUsers}
                    className="p-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300 cursor-pointer"
                    title="Segarkan daftar pengguna"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {hasPermission('Users.Manage') && (
                  <button
                    onClick={() => setShowCreateUser(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Tambah Pengguna Baru</span>
                  </button>
                )}
              </div>

              {/* Users Table */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Nama &amp; Email</th>
                      <th className="py-2.5 px-3">Peran (Role)</th>
                      <th className="py-2.5 px-3">Cakupan Bandara</th>
                      <th className="py-2.5 px-3">Status MFA</th>
                      <th className="py-2.5 px-3">Status Akun</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900">
                    {filteredUsers.map(u => {
                      const isSelf = currentUser?.id === u.id;
                      const isSuper = u.role === 'SuperAdmin';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.fullName}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              {u.email}
                            </div>
                          </td>

                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                              u.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200' :
                              u.role === 'AirportAdmin' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200' :
                              u.role === 'DataReviewer' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200' :
                              u.role === 'WildlifeOfficer' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200' :
                              'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {u.role}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 font-mono">
                            {u.assignedAirports.includes('*') ? (
                              <span className="text-emerald-600 font-bold">Semua Bandara (*)</span>
                            ) : (
                              <span className="text-slate-700 dark:text-slate-300 font-semibold">{u.assignedAirports.join(', ')}</span>
                            )}
                          </td>

                          <td className="py-2.5 px-3">
                            {u.mfaEnrolled ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Aktif (TOTP)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-slate-400 text-[11px]">
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Belum Aktif</span>
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3">
                            {u.isLocked ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">
                                Terkunci
                              </span>
                            ) : u.isActive ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Aktif
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
                                Nonaktif
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* If user is not SuperAdmin and current user is SuperAdmin, allow requesting promotion */}
                              {currentUser?.role === 'SuperAdmin' && !isSuper && !isSelf && (
                                <button
                                  onClick={() => {
                                    setTargetUserFor2P(u);
                                    setAction2P('PROMOTE_SUPERADMIN');
                                    setShowSubmit2PModal(true);
                                  }}
                                  className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold border border-purple-200 cursor-pointer"
                                  title="Ajukan promosi ke SuperAdmin via Two-Person Rule"
                                >
                                  Ajukan SuperAdmin
                                </button>
                              )}

                              {currentUser?.role === 'SuperAdmin' && isSuper && !isSelf && (
                                <button
                                  onClick={() => {
                                    setTargetUserFor2P(u);
                                    setAction2P('REVOKE_SUPERADMIN');
                                    setShowSubmit2PModal(true);
                                  }}
                                  className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200 cursor-pointer"
                                  title="Ajukan pencabutan SuperAdmin via Two-Person Rule"
                                >
                                  Cabut SuperAdmin
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: TWO-PERSON RULE APPROVALS */}
          {activeTab === 'twoperson' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-200 text-xs space-y-1">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <KeyRound className="w-4 h-4 text-purple-600" />
                  <span>Prosedur Keamanan Tingkat Tinggi (Two-Person Rule)</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Pemberian atau pencabutan hak istimewa <strong>SuperAdmin</strong> tidak dapat dilakukan oleh satu orang saja. Pengajuan membutuhkan input kata sandi aktor awal dan wajib disetujui oleh <strong>SuperAdmin kedua</strong> yang berbeda. Permintaan otomatis kedaluwarsa dalam 24 jam.
                </p>
              </div>

              {loadingTwoPerson ? (
                <div className="p-8 text-center text-slate-400">Memuat permintaan pending...</div>
              ) : twoPersonRequests.length === 0 ? (
                <div className="p-8 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Tidak Ada Permintaan Pending</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Semua pengajuan hak akses SuperAdmin telah diproses atau kedaluwarsa.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {twoPersonRequests.map(req => {
                    const isActor = currentUser?.id === req.actorUserId;

                    return (
                      <div
                        key={req.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                req.action === 'PROMOTE_SUPERADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {req.action === 'PROMOTE_SUPERADMIN' ? 'PROMOSI KE SUPERADMIN' : 'PENCABUTAN HAK SUPERADMIN'}
                              </span>
                              <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                Target: {req.targetEmail}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                              <strong>Alasan:</strong> {req.reason}
                            </p>
                          </div>

                          <div className="text-right text-[11px] text-slate-400">
                            <div>Diajukan oleh: <strong className="text-slate-700 dark:text-slate-300">{req.actorEmail}</strong></div>
                            <div>Kedaluwarsa: {new Date(req.expiresAt).toLocaleTimeString('id-ID')} WIB</div>
                          </div>
                        </div>

                        {/* Approval Controls */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                          {isActor ? (
                            <span className="text-amber-600 text-xs italic font-medium flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Anda adalah inisiator permintaan ini. Sesuai aturan Two-Person, SuperAdmin kedua harus menyetujuinya.</span>
                            </span>
                          ) : (
                            <div className="flex items-center gap-2 w-full justify-end">
                              {approvingRequestId === req.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="password"
                                    value={approverPassword}
                                    onChange={e => setApproverPassword(e.target.value)}
                                    placeholder="Masukkan kata sandi Anda..."
                                    className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                                  />
                                  <button
                                    onClick={() => handleApprove2P(req.id)}
                                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                                  >
                                    Konfirmasi Setuju
                                  </button>
                                  <button
                                    onClick={() => {
                                      setApprovingRequestId(null);
                                      setApproverPassword('');
                                    }}
                                    className="px-2 py-1 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                                  >
                                    Batal
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setApprovingRequestId(req.id)}
                                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Setujui Permintaan (SuperAdmin Ke-2)</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUDIT LOG & CRYPTOGRAPHIC HASH CHAIN */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              {/* Hash Chain Verification Status Box */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                chainResult?.isValid
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                  : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${chainResult?.isValid ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                    <Hash className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm flex items-center gap-2">
                      <span>Integritas Rantai Hash SHA-256 (Tamper-Evident Chain)</span>
                      <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold ${chainResult?.isValid ? 'bg-emerald-200 text-emerald-800' : 'bg-rose-200 text-rose-800'}`}>
                        {chainResult?.isValid ? 'VERIFIED INTACT' : 'TAMPER DETECTED'}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {chainResult?.message || 'Memverifikasi rantai hash matematis seluruh baris riwayat audit...'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleVerifyChain}
                  disabled={verifyingChain}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${verifyingChain ? 'animate-spin' : ''}`} />
                  <span>Jalankan Verifikasi Ulang</span>
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={auditActionFilter}
                    onChange={e => setAuditActionFilter(e.target.value)}
                    placeholder="Filter tindakan (misal: LOGIN, USER, ROLE)..."
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs bg-white dark:bg-slate-800 w-56"
                  />
                  <button
                    onClick={fetchAuditLogs}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    Cari
                  </button>
                </div>

                <span className="text-[11px] text-slate-400 font-mono">
                  Menampilkan {auditLogs.length} Entri Terbaru
                </span>
              </div>

              {/* Audit Table */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-2 px-3">Waktu (UTC / WIB)</th>
                      <th className="py-2 px-3">Aktor &amp; IP</th>
                      <th className="py-2 px-3">Tindakan (Action)</th>
                      <th className="py-2 px-3">Entitas</th>
                      <th className="py-2 px-3">Hasil</th>
                      <th className="py-2 px-3">Hash SHA-256 (64-bit)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px] bg-white dark:bg-slate-900">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString('id-ID')} WIB
                        </td>
                        <td className="py-2 px-3 font-sans">
                          <div className="font-bold text-slate-900 dark:text-white text-xs">{log.actorEmail}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.actorIp}</div>
                        </td>
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">
                          {log.action}
                        </td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                          {log.entityType} ({log.entityId})
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                            log.result === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {log.result}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[10px] text-slate-400 font-mono select-all">
                          {log.rowHash.slice(0, 12)}...{log.rowHash.slice(-8)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM SECURITY POLICIES */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                    <Lock className="w-4 h-4 text-blue-600" />
                    <span>Kebijakan Kata Sandi Enterprise</span>
                  </div>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                    <li>Panjang minimum 12 karakter.</li>
                    <li>Wajib kombinasi huruf besar, huruf kecil, angka, dan karakter khusus.</li>
                    <li>Pengecekan daftar hitam kata sandi rentan (*common breached blocklist*).</li>
                    <li>Penguncian otomatis (*lockout*) 15 menit setelah 5 kali gagal.</li>
                    <li>Pesan kesalahan generik untuk mencegah enumerasi akun (*anti-enumeration*).</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>Manajemen Sesi &amp; Security Stamp</span>
                  </div>
                  <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1 list-disc list-inside">
                    <li>*Idle session timeout* otomatis 30 menit.</li>
                    <li>*Absolute session lifetime* maksimum 12 jam.</li>
                    <li>Rotasi *Security Stamp* otomatis saat peran atau kata sandi diubah.</li>
                    <li>Semua sesi aktif target pengguna langsung hangus saat terjadi perubahan privilege.</li>
                  </ul>
                </div>
              </div>

              {/* Personal Quick Actions */}
              <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/20 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-sm text-blue-950 dark:text-blue-100">
                    Pengaturan Keamanan Akun Anda ({currentUser?.email})
                  </h4>
                  <p className="text-xs text-blue-800/80 dark:text-blue-300/80 mt-0.5">
                    MFA TOTP: {currentUser?.mfaEnrolled ? 'Aktif' : 'Belum Aktif'} • Peran: {currentUser?.role}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {onOpenMfaEnrollment && (
                    <button
                      onClick={onOpenMfaEnrollment}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                    >
                      {currentUser?.mfaEnrolled ? 'Atur Ulang MFA' : 'Aktifkan MFA Sekarang'}
                    </button>
                  )}
                  {onOpenPasswordChange && (
                    <button
                      onClick={onOpenPasswordChange}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 font-semibold text-xs cursor-pointer"
                    >
                      Ubah Kata Sandi
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
          <div className="text-[11px] text-slate-500 font-mono">
            Bandara Soekarno-Hatta (WIII) • Safety-Related Management System
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-700 text-white font-bold cursor-pointer hover:bg-slate-800"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* SUB-MODAL: Create User */}
      {showCreateUser && (
        <div className="fixed inset-0 z-70 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">Tambah Pengguna Baru</h4>
              <button onClick={() => setShowCreateUser(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            {createError && (
              <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Email Dinas</label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={e => setCreateEmail(e.target.value)}
                  placeholder="e.g. nama.petugas@cgk-airport.co.id"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={createFullName}
                  onChange={e => setCreateFullName(e.target.value)}
                  placeholder="e.g. Nurjaya (Pleton Alpha)"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Peran (Role)</label>
                <select
                  value={createRole}
                  onChange={e => setCreateRole(e.target.value as UserRole)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="WildlifeOfficer">WildlifeOfficer (Entri Laporan &amp; Permintaan Koreksi)</option>
                  <option value="DataReviewer">DataReviewer (Verifikasi &amp; Persetujuan Data)</option>
                  <option value="AirportAdmin">AirportAdmin (Pengelola Pengguna Bandara)</option>
                  <option value="Viewer">Viewer (Hanya Baca)</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1">
                  *Peran SuperAdmin hanya dapat diberikan via mekanisme Two-Person Rule.
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-1">Cakupan Bandara (Kode ICAO)</label>
                <input
                  type="text"
                  required
                  value={createAirports}
                  onChange={e => setCreateAirports(e.target.value)}
                  placeholder="e.g. WIII, WARR"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Kata Sandi Awal (Min. 12 Karakter)</label>
                <input
                  type="password"
                  required
                  value={createPassword}
                  onChange={e => setCreatePassword(e.target.value)}
                  placeholder="Min. 12 karakter, huruf besar, kecil, angka, simbol"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateUser(false)}
                  className="px-3 py-1.5 rounded-lg border text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  {createLoading ? 'Menyimpan...' : 'Buat Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: Two-Person Rule Submit */}
      {showSubmit2PModal && targetUserFor2P && (
        <div className="fixed inset-0 z-70 bg-black/60 flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3.5 text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Ajukan Perubahan Hak Akses SuperAdmin (Two-Person Rule)
              </h4>
              <button onClick={() => setShowSubmit2PModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-2.5 rounded-lg bg-purple-50 text-purple-900 text-[11px] leading-relaxed">
              Target: <strong>{targetUserFor2P.fullName}</strong> ({targetUserFor2P.email})<br/>
              Tindakan: <strong>{action2P === 'PROMOTE_SUPERADMIN' ? 'PROMOSI KE SUPERADMIN' : 'PENCABUTAN SUPERADMIN'}</strong>
            </div>

            {submit2PError && (
              <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                {submit2PError}
              </div>
            )}

            <form onSubmit={handleSubmit2P} className="space-y-3">
              <div>
                <label className="block font-semibold mb-1">Alasan Pengajuan Hak Istimewa</label>
                <textarea
                  required
                  rows={3}
                  value={reason2P}
                  onChange={e => setReason2P(e.target.value)}
                  placeholder="Jelaskan kebutuhan operasional resmi untuk perubahan peran SuperAdmin ini..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Konfirmasi Kata Sandi Anda (Re-Authentication)</label>
                <input
                  type="password"
                  required
                  value={actorPassword2P}
                  onChange={e => setActorPassword2P(e.target.value)}
                  placeholder="Masukkan kata sandi SuperAdmin Anda saat ini..."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowSubmit2PModal(false)}
                  className="px-3 py-1.5 rounded-lg border text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Kirim Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
