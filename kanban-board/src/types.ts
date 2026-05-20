export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type Status = 'To Do' | 'In Progress' | 'Done';

export interface Board {
  id: string;
  user_id: string;
  name: string;
  created_at: any; // Firestore Timestamp
}

export interface Task {
  id: string;
  user_id: string;
  board_id: string;
  status: Status;
  title: string;
  description?: string;
  due_date?: string | null; // Date ISO string or null
  priority_tags?: Priority;
  created_at: any; // Firestore Timestamp
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}
