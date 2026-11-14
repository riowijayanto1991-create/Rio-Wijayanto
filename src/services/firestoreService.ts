import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc,
  onSnapshot, 
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testConnection } from '../lib/firebase';
import { RosterPersonnel, OFFICIAL_ROSTER_PERSONNEL } from '../utils/dutyRosterService';
import { 
  PatrolReport, 
  OccurrenceReport, 
  WildlifeStrikeReport, 
  ManagementRecipient, 
  NotificationLog,
  VehicleCheckReport,
  MonthlyReportDocument,
  DutyRosterDocument,
  ManualMonthlyWSREntry,
  ManualMonthlyWSRDoc
} from '../types';
import { 
  initialPatrolReports, 
  initialOccurrenceReports, 
  initialStrikeReports, 
  initialManagementRecipients, 
  initialNotificationLogs,
  initialMonthlyDocuments
} from '../data/mockData';

const PATROL_COLLECTION = 'patrol_reports';
const OCCURRENCE_COLLECTION = 'occurrence_reports';
const STRIKE_COLLECTION = 'strike_reports';
const VEHICLE_COLLECTION = 'vehicle_reports';
const RECIPIENTS_COLLECTION = 'management_recipients';
const NOTIFICATION_LOGS_COLLECTION = 'notification_logs';
const MONTHLY_DOCS_COLLECTION = 'monthly_report_documents';
const DUTY_ROSTER_COLLECTION = 'duty_roster_documents';
const ROSTER_CONFIG_COLLECTION = 'roster_config';
const MANUAL_WSR_COLLECTION = 'monthly_wsr_manual';
const WHMS_SETTINGS_COLLECTION = 'whms_settings';

/**
 * Remove legacy sample reports from Firestore if they exist
 */
export async function cleanSampleReportsFromFirestore() {
  const samplePatrolIds = ['patrol-001', 'patrol-002', 'patrol-003'];
  const sampleOccIds = ['occ-001', 'occ-002', 'occ-003'];
  const sampleStrikeIds = ['strike-001', 'strike-002'];
  const sampleNotifIds = ['notif-001', 'notif-002'];

  for (const id of samplePatrolIds) {
    try {
      await deleteDoc(doc(db, PATROL_COLLECTION, id));
    } catch {
      // ignore
    }
  }

  for (const id of sampleOccIds) {
    try {
      await deleteDoc(doc(db, OCCURRENCE_COLLECTION, id));
    } catch {
      // ignore
    }
  }

  for (const id of sampleStrikeIds) {
    try {
      await deleteDoc(doc(db, STRIKE_COLLECTION, id));
    } catch {
      // ignore
    }
  }

  for (const id of sampleNotifIds) {
    try {
      await deleteDoc(doc(db, NOTIFICATION_LOGS_COLLECTION, id));
    } catch {
      // ignore
    }
  }
}

/**
 * Initialize Firestore connection and ensure recipients are synced
 */
export async function initializeFirestoreDatabase() {
  await testConnection();

  try {
    // Clean up sample reports as requested
    await cleanSampleReportsFromFirestore();

    // Ensure management recipients in Firestore use official roles
    for (const r of initialManagementRecipients) {
      await setDoc(doc(db, RECIPIENTS_COLLECTION, r.id), r, { merge: true });
    }

    // Ensure baseline official monthly archive documents are present in Firestore
    try {
      const snap = await getDocs(collection(db, MONTHLY_DOCS_COLLECTION));
      if (snap.empty) {
        for (const m of initialMonthlyDocuments) {
          const cleaned = sanitizeForFirestore(m);
          await setDoc(doc(db, MONTHLY_DOCS_COLLECTION, m.id), cleaned);
        }
      }
    } catch (err) {
      console.warn('Notice seeding monthly documents to Firestore:', err);
    }

    // Ensure active roster personnel in Firestore is seeded with verified October 2026 personnel
    try {
      const persDocRef = doc(db, ROSTER_CONFIG_COLLECTION, 'active_roster_personnel');
      const persSnap = await getDoc(persDocRef);
      if (!persSnap.exists()) {
        await setDoc(persDocRef, {
          ...OFFICIAL_ROSTER_PERSONNEL,
          updatedAt: new Date().toISOString()
        });
      } else {
        const data = persSnap.data();
        const alphaHasNurjaya = data?.ALPHA?.some((p: any) => p.nama === 'NURJAYA');
        if (!alphaHasNurjaya) {
          await setDoc(persDocRef, {
            ...OFFICIAL_ROSTER_PERSONNEL,
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }
    } catch (e) {
      console.warn('Notice seeding active roster personnel to Firestore:', e);
    }
  } catch (error) {
    console.warn('Initial Firestore initialization notice:', error);
  }
}

/**
 * Real-time listener for Patrol Reports
 */
export function subscribeToPatrolReports(
  onUpdate: (reports: PatrolReport[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, PATROL_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const reports: PatrolReport[] = [];
      snapshot.forEach((docSnap) => {
        reports.push(docSnap.data() as PatrolReport);
      });
      // Sort newest first
      reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(reports);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, PATROL_COLLECTION);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for Occurrence Reports
 */
export function subscribeToOccurrenceReports(
  onUpdate: (reports: OccurrenceReport[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, OCCURRENCE_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const reports: OccurrenceReport[] = [];
      snapshot.forEach((docSnap) => {
        reports.push(docSnap.data() as OccurrenceReport);
      });
      reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(reports);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, OCCURRENCE_COLLECTION);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for Strike Reports
 */
export function subscribeToStrikeReports(
  onUpdate: (reports: WildlifeStrikeReport[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, STRIKE_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const reports: WildlifeStrikeReport[] = [];
      snapshot.forEach((docSnap) => {
        reports.push(docSnap.data() as WildlifeStrikeReport);
      });
      reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(reports);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, STRIKE_COLLECTION);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for Vehicle Inspection Reports (Serah Terima Tugas Dinas Pagi & Malam)
 */
export function subscribeToVehicleReports(
  onUpdate: (reports: VehicleCheckReport[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, VEHICLE_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const reports: VehicleCheckReport[] = [];
      snapshot.forEach((docSnap) => {
        reports.push(docSnap.data() as VehicleCheckReport);
      });
      reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(reports);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, VEHICLE_COLLECTION);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for Management Recipients
 */
export function subscribeToManagementRecipients(
  onUpdate: (recipients: ManagementRecipient[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, RECIPIENTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const recipients: ManagementRecipient[] = [];
      snapshot.forEach((docSnap) => {
        const item = docSnap.data() as ManagementRecipient;
        recipients.push({
          ...item,
          name: item.role || item.name
        });
      });
      if (recipients.length > 0) {
        onUpdate(recipients);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, RECIPIENTS_COLLECTION);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for Notification Logs
 */
export function subscribeToNotificationLogs(
  onUpdate: (logs: NotificationLog[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, NOTIFICATION_LOGS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const logs: NotificationLog[] = [];
      snapshot.forEach((docSnap) => {
        logs.push(docSnap.data() as NotificationLog);
      });
      logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      onUpdate(logs);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, NOTIFICATION_LOGS_COLLECTION);
      if (onError) onError(error);
    }
  );
}

/**
 * Deeply clean object so that no `undefined` values are sent to Firestore
 */
function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  const sanitized: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      sanitized[key] = sanitizeForFirestore(val);
    }
  }
  return sanitized;
}

/**
 * Save Patrol Report to Firestore
 */
export async function savePatrolReportToFirestore(report: PatrolReport) {
  try {
    const cleaned = sanitizeForFirestore(report);
    await setDoc(doc(db, PATROL_COLLECTION, report.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${PATROL_COLLECTION}/${report.id}`);
  }
}

/**
 * Save Occurrence Report to Firestore
 */
export async function saveOccurrenceReportToFirestore(report: OccurrenceReport) {
  try {
    const cleaned = sanitizeForFirestore(report);
    await setDoc(doc(db, OCCURRENCE_COLLECTION, report.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${OCCURRENCE_COLLECTION}/${report.id}`);
  }
}

/**
 * Save Wildlife Strike Report to Firestore
 */
export async function saveStrikeReportToFirestore(report: WildlifeStrikeReport) {
  try {
    const cleaned = sanitizeForFirestore(report);
    await setDoc(doc(db, STRIKE_COLLECTION, report.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${STRIKE_COLLECTION}/${report.id}`);
  }
}

/**
 * Save Notification Log to Firestore
 */
export async function saveNotificationLogToFirestore(log: NotificationLog) {
  try {
    const cleaned = sanitizeForFirestore(log);
    await setDoc(doc(db, NOTIFICATION_LOGS_COLLECTION, log.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${NOTIFICATION_LOGS_COLLECTION}/${log.id}`);
  }
}

/**
 * Update Recipients in Firestore
 */
export async function saveRecipientsToFirestore(recipients: ManagementRecipient[]) {
  try {
    for (const r of recipients) {
      const cleaned = sanitizeForFirestore(r);
      await setDoc(doc(db, RECIPIENTS_COLLECTION, r.id), cleaned);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, RECIPIENTS_COLLECTION);
  }
}

/**
 * Delete Patrol Report from Firestore
 */
export async function deletePatrolReportFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, PATROL_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${PATROL_COLLECTION}/${id}`);
  }
}

/**
 * Delete Occurrence Report from Firestore
 */
export async function deleteOccurrenceReportFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, OCCURRENCE_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${OCCURRENCE_COLLECTION}/${id}`);
  }
}

/**
 * Delete Wildlife Strike Report from Firestore
 */
export async function deleteStrikeReportFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, STRIKE_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${STRIKE_COLLECTION}/${id}`);
  }
}

/**
 * Save Vehicle Check Report to Firestore
 */
export async function saveVehicleReportToFirestore(report: VehicleCheckReport) {
  try {
    const cleaned = sanitizeForFirestore(report);
    await setDoc(doc(db, VEHICLE_COLLECTION, report.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${VEHICLE_COLLECTION}/${report.id}`);
  }
}

/**
 * Delete Vehicle Check Report from Firestore
 */
export async function deleteVehicleReportFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, VEHICLE_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${VEHICLE_COLLECTION}/${id}`);
  }
}

/**
 * Real-time listener for Monthly Report Documents (PDF & Word archives)
 */
export function subscribeToMonthlyDocuments(
  onUpdate: (documents: MonthlyReportDocument[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, MONTHLY_DOCS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const documents: MonthlyReportDocument[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as MonthlyReportDocument;
        if (data && data.id) {
          documents.push(data);
        }
      });
      // Sort newest upload first, then by year and month
      documents.sort((a, b) => {
        const timeA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const timeB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return timeB - timeA;
      });
      onUpdate(documents);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, MONTHLY_DOCS_COLLECTION);
      } catch (err) {
        console.warn('Monthly documents subscription notice:', err);
      }
      if (onError) onError(error);
    }
  );
}

/**
 * Save Monthly Report Document (PDF or Word) to Firestore
 * NOTE: Firestore documents have a strict 1MB size limit. For large attachments (>600KB),
 * the document metadata and operational metrics are saved to Firestore, while the file binary
 * is preserved in client IndexedDB storage.
 */
export async function saveMonthlyDocumentToFirestore(document: MonthlyReportDocument) {
  try {
    const cleaned = sanitizeForFirestore(document);
    // If base64 fileData exceeds 600KB, omit fileData from Firestore payload
    if (cleaned.fileData && typeof cleaned.fileData === 'string' && cleaned.fileData.length > 600000) {
      delete cleaned.fileData;
    }
    await setDoc(doc(db, MONTHLY_DOCS_COLLECTION, document.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${MONTHLY_DOCS_COLLECTION}/${document.id}`);
  }
}

/**
 * Delete Monthly Report Document from Firestore
 */
export async function deleteMonthlyDocumentFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, MONTHLY_DOCS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${MONTHLY_DOCS_COLLECTION}/${id}`);
  }
}

/**
 * Real-time listener for Duty Roster Documents (Excel & PDF)
 */
export function subscribeToDutyRosterDocuments(
  onUpdate: (documents: DutyRosterDocument[]) => void,
  onError?: (error: Error) => void
) {
  const colRef = collection(db, DUTY_ROSTER_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const documents: DutyRosterDocument[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as DutyRosterDocument;
        if (data && data.id) {
          documents.push(data);
        }
      });
      // Sort newest upload first
      documents.sort((a, b) => {
        const timeA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const timeB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return timeB - timeA;
      });
      onUpdate(documents);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, DUTY_ROSTER_COLLECTION);
      } catch (err) {
        console.warn('Duty roster subscription notice:', err);
      }
      if (onError) onError(error);
    }
  );
}

/**
 * Save Duty Roster Document (Excel or PDF) to Firestore
 */
export async function saveDutyRosterDocumentToFirestore(rosterDoc: DutyRosterDocument) {
  try {
    const cleaned = sanitizeForFirestore(rosterDoc);
    // If base64 fileData exceeds 600KB, omit fileData from Firestore payload
    if (cleaned.fileData && typeof cleaned.fileData === 'string' && cleaned.fileData.length > 600000) {
      delete cleaned.fileData;
    }
    await setDoc(doc(db, DUTY_ROSTER_COLLECTION, rosterDoc.id), cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${DUTY_ROSTER_COLLECTION}/${rosterDoc.id}`);
  }
}

/**
 * Delete Duty Roster Document from Firestore
 */
export async function deleteDutyRosterDocumentFromFirestore(id: string) {
  try {
    await deleteDoc(doc(db, DUTY_ROSTER_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${DUTY_ROSTER_COLLECTION}/${id}`);
  }
}

/**
 * Real-time listener for Active Roster Personnel across all devices
 */
export function subscribeToActiveRosterPersonnel(
  onUpdate: (personnel: Record<'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA', RosterPersonnel[]>) => void,
  onError?: (error: Error) => void
) {
  const docRef = doc(db, ROSTER_CONFIG_COLLECTION, 'active_roster_personnel');
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.ALPHA && data.BRAVO && data.CHARLIE && data.DELTA) {
          onUpdate(data as Record<'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA', RosterPersonnel[]>);
        }
      }
    },
    (error) => {
      console.warn('Active roster personnel subscription notice:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Save / Broadcast Active Roster Personnel update to Firestore (syncs across all devices)
 */
export async function saveActiveRosterPersonnelToFirestore(
  personnel: Record<'ALPHA' | 'BRAVO' | 'CHARLIE' | 'DELTA', RosterPersonnel[]>
) {
  try {
    const docRef = doc(db, ROSTER_CONFIG_COLLECTION, 'active_roster_personnel');
    await setDoc(docRef, {
      ...personnel,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ROSTER_CONFIG_COLLECTION}/active_roster_personnel`);
  }
}

/**
 * Local Storage key helper for Manual Monthly WSR
 */
const getManualWSRStorageKey = (year: number | string) => `whms_manual_wsr_${year}`;

/**
 * Get manual monthly WSR entries from localStorage cache
 */
export function getManualMonthlyWSRLocal(year: number | string): Record<number, ManualMonthlyWSREntry> | null {
  try {
    const raw = localStorage.getItem(getManualWSRStorageKey(year));
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Save manual monthly WSR entries to localStorage cache
 */
export function saveManualMonthlyWSRLocal(year: number | string, entries: Record<number, ManualMonthlyWSREntry>): void {
  try {
    localStorage.setItem(getManualWSRStorageKey(year), JSON.stringify(entries));
  } catch {
    // ignore
  }
}

/**
 * Real-time listener for Manual Monthly WSR entries across all devices
 */
export function subscribeToManualMonthlyWSR(
  year: number | string,
  onUpdate: (entries: Record<number, ManualMonthlyWSREntry>) => void,
  onError?: (error: Error) => void
): () => void {
  const yStr = String(year);
  const docRef = doc(db, WHMS_SETTINGS_COLLECTION, `manual_wsr_${yStr}`);

  // Emit immediate cached local value if present
  const cached = getManualMonthlyWSRLocal(yStr);
  if (cached && Object.keys(cached).length > 0) {
    onUpdate(cached);
  }

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && data.entries) {
          saveManualMonthlyWSRLocal(yStr, data.entries);
          onUpdate(data.entries as Record<number, ManualMonthlyWSREntry>);
        }
      }
    },
    (error) => {
      console.warn(`Manual monthly WSR subscription notice for year ${yStr}:`, error);
      if (onError) onError(error);
    }
  );
}

/**
 * Save / Broadcast Manual Monthly WSR entries to Firestore and local storage
 */
export async function saveManualMonthlyWSRToFirestore(
  year: number | string,
  entries: Record<number, ManualMonthlyWSREntry>,
  updatedBy: string = 'Petugas Unit WHU'
): Promise<void> {
  const yStr = String(year);
  const nowIso = new Date().toISOString();

  // 1. Immediately cache locally
  saveManualMonthlyWSRLocal(yStr, entries);

  // 2. Persist to Firestore
  try {
    const docRefSettings = doc(db, WHMS_SETTINGS_COLLECTION, `manual_wsr_${yStr}`);
    const payload = {
      id: `manual_wsr_${yStr}`,
      year: Number(year),
      entries,
      updatedAt: nowIso,
      updatedBy
    };

    await setDoc(docRefSettings, payload, { merge: true });

    // Also mirror to monthly_wsr_manual collection
    try {
      const docRefManual = doc(db, MANUAL_WSR_COLLECTION, yStr);
      await setDoc(docRefManual, payload, { merge: true });
    } catch {
      // ignore mirror error if main settings succeed
    }
  } catch (error) {
    console.error('Failed to save manual monthly WSR to Firestore:', error);
    handleFirestoreError(error, OperationType.UPDATE, `${WHMS_SETTINGS_COLLECTION}/manual_wsr_${yStr}`);
  }
}

/**
 * Clear manual monthly WSR entries for a specific year
 */
export async function clearManualMonthlyWSRFromFirestore(year: number | string): Promise<void> {
  const yStr = String(year);
  try {
    localStorage.removeItem(getManualWSRStorageKey(yStr));
  } catch {
    // ignore
  }

  try {
    const docRefSettings = doc(db, WHMS_SETTINGS_COLLECTION, `manual_wsr_${yStr}`);
    await deleteDoc(docRefSettings);
  } catch (error) {
    console.warn('Error deleting manual monthly WSR settings doc:', error);
  }

  try {
    const docRefManual = doc(db, MANUAL_WSR_COLLECTION, yStr);
    await deleteDoc(docRefManual);
  } catch {
    // ignore
  }
}



