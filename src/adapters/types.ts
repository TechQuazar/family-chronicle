// Backend adapter interfaces - enables switching between providers

import type {
  User,
  Family,
  Bud,
  BudConnection,
  MessageToFuture,
  DiaryEntry,
  AuthCredentials,
  AuthSession,
  ApiResponse,
} from '@/types/models';

export interface AuthAdapter {
  signUp(credentials: AuthCredentials & { displayName: string }): Promise<ApiResponse<AuthSession>>;
  signIn(credentials: AuthCredentials): Promise<ApiResponse<AuthSession>>;
  signOut(): Promise<ApiResponse<void>>;
  getCurrentSession(): Promise<ApiResponse<AuthSession | null>>;
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void;
}

export interface UserAdapter {
  getUser(id: string): Promise<ApiResponse<User>>;
  updateUser(id: string, data: Partial<User>): Promise<ApiResponse<User>>;
}

export interface FamilyAdapter {
  createFamily(data: Omit<Family, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Family>>;
  getFamily(id: string): Promise<ApiResponse<Family>>;
  getFamiliesByUser(userId: string): Promise<ApiResponse<Family[]>>;
  updateFamily(id: string, data: Partial<Family>): Promise<ApiResponse<Family>>;
  deleteFamily(id: string): Promise<ApiResponse<void>>;
}

export interface BudAdapter {
  createBud(data: Omit<Bud, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Bud>>;
  getBud(id: string): Promise<ApiResponse<Bud>>;
  getBudsByFamily(familyId: string): Promise<ApiResponse<Bud[]>>;
  getBudByUserId(userId: string): Promise<ApiResponse<Bud | null>>;
  updateBud(id: string, data: Partial<Bud>): Promise<ApiResponse<Bud>>;
  deleteBud(id: string): Promise<ApiResponse<void>>;
}

export interface ConnectionAdapter {
  createConnection(data: Omit<BudConnection, 'id' | 'createdAt'>): Promise<ApiResponse<BudConnection>>;
  getConnectionsByFamily(familyId: string): Promise<ApiResponse<BudConnection[]>>;
  deleteConnection(id: string): Promise<ApiResponse<void>>;
}

export interface MessageAdapter {
  createMessage(data: Omit<MessageToFuture, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<MessageToFuture>>;
  getMessagesByBud(budId: string): Promise<ApiResponse<MessageToFuture[]>>;
  updateMessage(id: string, data: Partial<MessageToFuture>): Promise<ApiResponse<MessageToFuture>>;
  deleteMessage(id: string): Promise<ApiResponse<void>>;
}

export interface DiaryAdapter {
  createEntry(data: Omit<DiaryEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<DiaryEntry>>;
  getEntriesByBud(budId: string): Promise<ApiResponse<DiaryEntry[]>>;
  getEntry(id: string): Promise<ApiResponse<DiaryEntry>>;
  updateEntry(id: string, data: Partial<DiaryEntry>): Promise<ApiResponse<DiaryEntry>>;
  deleteEntry(id: string): Promise<ApiResponse<void>>;
}

// Combined backend adapter
export interface BackendAdapter {
  auth: AuthAdapter;
  users: UserAdapter;
  families: FamilyAdapter;
  buds: BudAdapter;
  connections: ConnectionAdapter;
  messages: MessageAdapter;
  diary: DiaryAdapter;
}

// Adapter factory type
export type AdapterType = 'local' | 'supabase' | 'aws';
