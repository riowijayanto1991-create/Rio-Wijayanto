/**
 * Official Personnel Directory & Digital Signature Helpers
 * Unit Wildlife Hazard Management (WHU) & Airside Safety
 * Bandara Internasional Soekarno-Hatta (InJourney Airports)
 */

export interface OfficialOfficer {
  name: string;
  nip: string;
  role: string;
  title: string;
  status: 'ORGANIK' | 'PERBANTUAN';
}

export const OFFICIAL_PERSONNEL_LIST: OfficialOfficer[] = [
  {
    name: 'RACHMADITYA',
    nip: '20242233',
    role: 'supervisor',
    title: 'WILDLIFE HAZARD DEPARTMENT HEAD',
    status: 'ORGANIK'
  },
  {
    name: 'MOHAMAD DANIL',
    nip: '20244166',
    role: 'supervisor',
    title: 'WILDLIFE HAZARD SUPERVISOR',
    status: 'ORGANIK'
  },
  {
    name: 'KUKUH BRILIYANDHI',
    nip: '20242969',
    role: 'supervisor',
    title: 'WILDLIFE HAZARD SUPERVISOR',
    status: 'ORGANIK'
  },
  {
    name: 'NURJAYA',
    nip: '20242880',
    role: 'officer',
    title: 'WILDLIFE HAZARD OFFICER',
    status: 'ORGANIK'
  },
  {
    name: 'YUDHA ABADI',
    nip: '20246882',
    role: 'officer',
    title: 'WILDLIFE HAZARD OFFICER',
    status: 'ORGANIK'
  },
  {
    name: 'M. RIZKI ROMADHON S.',
    nip: '20245602',
    role: 'officer',
    title: 'WILDLIFE HAZARD OFFICER',
    status: 'ORGANIK'
  },
  {
    name: 'M. SYAFRIZAL L. TOBING',
    nip: '20245727',
    role: 'officer',
    title: 'WILDLIFE HAZARD OFFICER',
    status: 'ORGANIK'
  },
  {
    name: 'YUDISTIRA ADY PERMANA',
    nip: '20245256',
    role: 'officer',
    title: 'WILDLIFE HAZARD OFFICER',
    status: 'ORGANIK'
  },
  {
    name: 'RIO WIJAYANTO',
    nip: '20243777',
    role: 'officer',
    title: 'AIRCRAFT RFF SENIOR CHIEF',
    status: 'PERBANTUAN'
  }
];

/**
 * Standard NIP lookup for any given personnel name
 */
export const lookupPersonnelNip = (name?: string, fallbackRole?: 'supervisor' | 'receiver' | 'officer'): string => {
  if (!name || !name.trim()) {
    if (fallbackRole === 'supervisor') return '20242233';
    if (fallbackRole === 'receiver') return '20244166';
    return '20243777';
  }

  const clean = name.trim().toUpperCase();

  // Direct match
  const found = OFFICIAL_PERSONNEL_LIST.find(p => p.name.toUpperCase() === clean);
  if (found) return found.nip;

  // Fuzzy partial match
  const partial = OFFICIAL_PERSONNEL_LIST.find(p => clean.includes(p.name.toUpperCase()) || p.name.toUpperCase().includes(clean));
  if (partial) return partial.nip;

  // Specific common names
  if (clean.includes('RACHMADITYA') || clean.includes('DEPT HEAD')) return '20242233';
  if (clean.includes('DANIL')) return '20244166';
  if (clean.includes('KUKUH')) return '20242969';
  if (clean.includes('NURJAYA')) return '20242880';
  if (clean.includes('YUDHA')) return '20246882';
  if (clean.includes('RISKI') || clean.includes('SIREGAR')) return '20243786';
  if (clean.includes('SYAFRIZAL') || clean.includes('TOBING')) return '20245727';
  if (clean.includes('YUDISTIRA')) return '20245256';
  if (clean.includes('RIO') || clean.includes('WIJAYANTO')) return '20243777';

  // Default fallback according to role
  if (fallbackRole === 'supervisor') return '20242233'; // RACHMADITYA
  if (fallbackRole === 'receiver') return '20244166';   // MOHAMAD DANIL
  return '20243777';                                   // RIO WIJAYANTO
};
