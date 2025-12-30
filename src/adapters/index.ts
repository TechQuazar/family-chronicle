// Backend adapter factory - allows switching between different backend implementations

import type { BackendAdapter, AdapterType } from './types';
import { localAdapter } from './local';

// Current adapter configuration
let currentAdapterType: AdapterType = 'local';
let currentAdapter: BackendAdapter = localAdapter;

export function getAdapter(): BackendAdapter {
  return currentAdapter;
}

export function getAdapterType(): AdapterType {
  return currentAdapterType;
}

export function setAdapter(type: AdapterType): void {
  currentAdapterType = type;
  
  switch (type) {
    case 'local':
      currentAdapter = localAdapter;
      break;
    case 'supabase':
      // TODO: Implement Supabase adapter
      console.warn('Supabase adapter not yet implemented, falling back to local');
      currentAdapter = localAdapter;
      break;
    case 'aws':
      // TODO: Implement AWS adapter
      console.warn('AWS adapter not yet implemented, falling back to local');
      currentAdapter = localAdapter;
      break;
    default:
      currentAdapter = localAdapter;
  }
}

// Re-export types
export type { BackendAdapter, AdapterType } from './types';
