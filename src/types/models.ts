// Core data models for Buds application

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Family {
  id: string;
  name: string;
  description?: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bud {
  id: string;
  familyId: string;
  userId?: string; // Optional - bud may not have an account yet
  name: string;
  birthDate?: Date;
  deathDate?: Date;
  bio?: string;
  avatarUrl?: string;
  // Position will be computed by auto-layout, but stored for persistence
  position: { x: number; y: number };
  createdAt: Date;
  updatedAt: Date;
}

export interface BudConnection {
  id: string;
  familyId: string;
  fromBudId: string;
  toBudId: string;
  relationshipType: RelationshipType;
  createdAt: Date;
}

export type RelationshipType = 
  | 'parent'
  | 'child'
  | 'spouse'
  | 'sibling';

export interface MessageToFuture {
  id: string;
  budId: string;
  authorId: string; // The user who wrote this
  content: string; // Will be encrypted in Phase 2
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiaryEntry {
  id: string;
  budId: string;
  content: string; // Will be encrypted in Phase 2
  date: Date;
  mood?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DiaryAccessKey {
  id: string;
  budId: string;
  grantedToUserId: string;
  keyHash: string; // Hashed password for diary access
  createdAt: Date;
  expiresAt?: Date;
}

// Auth related types
export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
}
