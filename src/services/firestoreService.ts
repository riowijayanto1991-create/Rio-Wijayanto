import { 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  getDocs 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, testConnection } from '../lib/firebase';
import { 
  PatrolReport, 
  OccurrenceReport, 
  WildlifeStrikeReport, 
  ManagementRecipient, 
  NotificationLog 
} from '../types';
import { 
  initialPatrolReports, 
  initialOccurrenceReports, 
  initialStrikeReports, 
  initialManagementRecipients, 
  initialNotificationLogs 
} from '../data/mockData';

const PATROL_COLLECTION = 'patrol_reports';
const OCCURRENCE_COLLECTION = 'occurrence_reports';
const STRIKE_COLLECTION = 'strike_reports';
const RECIPIENTS_COLLECTION = 'management_recipients';
const NOTIFICATION_LOGS_COLLECTION = 'notification_logs';

/**
 * Initialize Firestore connection and bootstrap initial mock data if empty
 */
export async function initializeFirestoreDatabase() {
  await testConnection();

  try {
    // Check if initial data already exists in patrol reports
    const patrolSnap = await getDocs(collection(db, PATROL_COLLECTION));
    if (patrolSnap.empty) {
      console.log('Seeding initial baseline data to Firestore for multi-device sync...');
      
      // Seed patrols
      for (const p of initialPatrolReports) {
        await setDoc(doc(db, PATROL_COLLECTION, p.id), p);
      }
      
      // Seed occurrences
      for (const o of initialOccurrenceReports) {
        await setDoc(doc(db, OCCURRENCE_COLLECTION, o.id), o);
      }
      
      // Seed strikes
      for (const s of initialStrikeReports) {
        await setDoc(doc(db, STRIKE_COLLECTION, s.id), s);
      }
      
      // Seed recipients
      for (const r of initialManagementRecipients) {
        await setDoc(doc(db, RECIPIENTS_COLLECTION, r.id), r);
      }
      
      // Seed initial logs
      for (const l of initialNotificationLogs) {
        await setDoc(doc(db, NOTIFICATION_LOGS_COLLECTION, l.id), l);
      }
      console.log('Firestore baseline sync complete.');
    }

    // Always ensure management recipients in Firestore use official roles without personal names
    for (const r of initialManagementRecipients) {
      await setDoc(doc(db, RECIPIENTS_COLLECTION, r.id), r, { merge: true });
    }
  } catch (error) {
    console.warn('Initial Firestore check/seed notice:', error);
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
 * Save Patrol Report to Firestore
 */
export async function savePatrolReportToFirestore(report: PatrolReport) {
  try {
    await setDoc(doc(db, PATROL_COLLECTION, report.id), report);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${PATROL_COLLECTION}/${report.id}`);
  }
}

/**
 * Save Occurrence Report to Firestore
 */
export async function saveOccurrenceReportToFirestore(report: OccurrenceReport) {
  try {
    await setDoc(doc(db, OCCURRENCE_COLLECTION, report.id), report);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${OCCURRENCE_COLLECTION}/${report.id}`);
  }
}

/**
 * Save Wildlife Strike Report to Firestore
 */
export async function saveStrikeReportToFirestore(report: WildlifeStrikeReport) {
  try {
    await setDoc(doc(db, STRIKE_COLLECTION, report.id), report);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${STRIKE_COLLECTION}/${report.id}`);
  }
}

/**
 * Save Notification Log to Firestore
 */
export async function saveNotificationLogToFirestore(log: NotificationLog) {
  try {
    await setDoc(doc(db, NOTIFICATION_LOGS_COLLECTION, log.id), log);
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
      await setDoc(doc(db, RECIPIENTS_COLLECTION, r.id), r);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, RECIPIENTS_COLLECTION);
  }
}
