import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, Permission, UserAccount } from '../types/security';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  assignedAirports: string[];
  permissions: Permission[];
  mustChangePassword: boolean;
  mfaEnrolled: boolean;
  isMfaMandatory: boolean;
}

export interface AuthContextType {
  currentUser: AuthUser | null;
  user: AuthUser | null;
  sessionToken: string | null;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
  isAirportAdmin: boolean;
  activeSuperAdmins: number;
  activeSuperAdminCount: number;
  superAdminWarning: string | null;
  login: (email: string, password: string) => Promise<{ requiresMfa?: boolean; mfaToken?: string; user?: any }>;
  verifyMfa: (mfaToken: string, totpCode?: string, recoveryCode?: string) => Promise<boolean>;
  loginAsDemoUser: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  hasPerm: (permission: Permission) => boolean;
  hasPermission: (permission: Permission) => boolean;
  isScopedToAirport: (airportId: string) => boolean;
  refreshCurrentUser: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('whms_auth_token');
    } catch {
      return null;
    }
  });
  const [activeSuperAdmins, setActiveSuperAdmins] = useState<number>(2);
  const [superAdminWarning, setSuperAdminWarning] = useState<string | null>(null);

  const refreshCurrentUser = async () => {
    if (!sessionToken) {
      setCurrentUser(null);
      return;
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${sessionToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        if (data.systemSecurity) {
          setActiveSuperAdmins(data.systemSecurity.activeSuperAdmins);
          setSuperAdminWarning(data.systemSecurity.superAdminWarning);
        }
      } else {
        // Session invalid or expired
        setCurrentUser(null);
        setSessionToken(null);
        localStorage.removeItem('whms_auth_token');
      }
    } catch (err) {
      console.error('Failed to fetch auth me:', err);
    }
  };

  useEffect(() => {
    refreshCurrentUser();
  }, [sessionToken]);

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Autentikasi gagal');
    }

    if (data.requiresMfa) {
      return { requiresMfa: true, mfaToken: data.mfaToken };
    }

    if (data.sessionToken) {
      setSessionToken(data.sessionToken);
      setCurrentUser(data.user);
      localStorage.setItem('whms_auth_token', data.sessionToken);
    }

    return { user: data.user };
  };

  const verifyMfa = async (mfaToken: string, totpCode?: string, recoveryCode?: string) => {
    const res = await fetch('/api/auth/verify-mfa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mfaToken, totpCode, recoveryCode })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Verifikasi MFA gagal');
    }

    if (data.sessionToken) {
      setSessionToken(data.sessionToken);
      setCurrentUser(data.user);
      localStorage.setItem('whms_auth_token', data.sessionToken);
      return true;
    }
    return false;
  };

  const logout = async () => {
    if (sessionToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${sessionToken}` }
        });
      } catch {}
    }
    setSessionToken(null);
    setCurrentUser(null);
    localStorage.removeItem('whms_auth_token');
  };

  const hasPerm = (permission: Permission): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'SuperAdmin') return true;
    return currentUser.permissions?.includes(permission) || false;
  };

  const isScopedToAirport = (airportId: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'SuperAdmin' || currentUser.assignedAirports.includes('*')) return true;
    return currentUser.assignedAirports.includes(airportId.toUpperCase());
  };

  const loginAsDemoUser = async (role: UserRole) => {
    let email = 'superadmin.whms@cgk-airport.co.id';
    let pass = 'SoekarnoHatta2026!#WhmsSecure';

    if (role === 'AirportAdmin') {
      email = 'airportadmin.cgk@cgk-airport.co.id';
      pass = 'AirportAdmin2026!#Wiii';
    } else if (role === 'WildlifeOfficer') {
      email = 'officer.whms@cgk-airport.co.id';
      pass = 'WildlifeOfficer2026!#Wiii';
    } else if (role === 'DataReviewer') {
      email = 'reviewer.whms@cgk-airport.co.id';
      pass = 'DataReviewer2026!#Wiii';
    } else if (role === 'Viewer') {
      email = 'viewer.whms@cgk-airport.co.id';
      pass = 'ViewerAccess2026!#Wiii';
    }

    const res = await login(email, pass);
    if (res.requiresMfa && res.mfaToken) {
      // For demo convenience, get the TOTP from server or verify directly
      // In production, user enters their TOTP app
      await verifyMfa(res.mfaToken, '123456');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        user: currentUser,
        sessionToken,
        isAuthenticated: !!currentUser,
        isSuperAdmin: currentUser?.role === 'SuperAdmin',
        isAirportAdmin: currentUser?.role === 'AirportAdmin',
        activeSuperAdmins,
        activeSuperAdminCount: activeSuperAdmins,
        superAdminWarning,
        login,
        verifyMfa,
        loginAsDemoUser,
        logout,
        hasPerm,
        hasPermission: hasPerm,
        isScopedToAirport,
        refreshCurrentUser,
        refreshUser: refreshCurrentUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};
