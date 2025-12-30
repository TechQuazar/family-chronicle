// Local bud adapter

import type { BudAdapter, ConnectionAdapter } from '@/adapters/types';
import type { Bud, BudConnection, ApiResponse } from '@/types/models';
import { getFromStorage, setToStorage, generateId } from './storage';

const BUDS_KEY = 'buds';
const CONNECTIONS_KEY = 'connections';

export const localBudAdapter: BudAdapter = {
  async createBud(data): Promise<ApiResponse<Bud>> {
    const buds = getFromStorage<Bud[]>(BUDS_KEY) || [];
    
    const now = new Date();
    const newBud: Bud = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    buds.push(newBud);
    setToStorage(BUDS_KEY, buds);

    return { data: newBud };
  },

  async getBud(id): Promise<ApiResponse<Bud>> {
    const buds = getFromStorage<Bud[]>(BUDS_KEY) || [];
    const bud = buds.find(b => b.id === id);

    if (!bud) {
      return { error: { code: 'NOT_FOUND', message: 'Bud not found' } };
    }

    return { data: bud };
  },

  async getBudsByFamily(familyId): Promise<ApiResponse<Bud[]>> {
    const buds = getFromStorage<Bud[]>(BUDS_KEY) || [];
    const familyBuds = buds.filter(b => b.familyId === familyId);
    
    return { data: familyBuds };
  },

  async getBudByUserId(userId): Promise<ApiResponse<Bud | null>> {
    const buds = getFromStorage<Bud[]>(BUDS_KEY) || [];
    const bud = buds.find(b => b.userId === userId);
    
    return { data: bud || null };
  },

  async updateBud(id, data): Promise<ApiResponse<Bud>> {
    const buds = getFromStorage<Bud[]>(BUDS_KEY) || [];
    const index = buds.findIndex(b => b.id === id);

    if (index === -1) {
      return { error: { code: 'NOT_FOUND', message: 'Bud not found' } };
    }

    buds[index] = {
      ...buds[index],
      ...data,
      updatedAt: new Date(),
    };

    setToStorage(BUDS_KEY, buds);
    return { data: buds[index] };
  },

  async deleteBud(id): Promise<ApiResponse<void>> {
    const buds = getFromStorage<Bud[]>(BUDS_KEY) || [];
    const filtered = buds.filter(b => b.id !== id);
    setToStorage(BUDS_KEY, filtered);
    return { data: undefined };
  },
};

export const localConnectionAdapter: ConnectionAdapter = {
  async createConnection(data): Promise<ApiResponse<BudConnection>> {
    const connections = getFromStorage<BudConnection[]>(CONNECTIONS_KEY) || [];
    
    const newConnection: BudConnection = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
    };

    connections.push(newConnection);
    setToStorage(CONNECTIONS_KEY, connections);

    return { data: newConnection };
  },

  async getConnectionsByFamily(familyId): Promise<ApiResponse<BudConnection[]>> {
    const connections = getFromStorage<BudConnection[]>(CONNECTIONS_KEY) || [];
    const familyConnections = connections.filter(c => c.familyId === familyId);
    
    return { data: familyConnections };
  },

  async deleteConnection(id): Promise<ApiResponse<void>> {
    const connections = getFromStorage<BudConnection[]>(CONNECTIONS_KEY) || [];
    const filtered = connections.filter(c => c.id !== id);
    setToStorage(CONNECTIONS_KEY, filtered);
    return { data: undefined };
  },
};
