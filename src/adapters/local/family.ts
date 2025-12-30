// Local family adapter

import type { FamilyAdapter } from '@/adapters/types';
import type { Family, ApiResponse } from '@/types/models';
import { getFromStorage, setToStorage, generateId } from './storage';

const FAMILIES_KEY = 'families';

export const localFamilyAdapter: FamilyAdapter = {
  async createFamily(data): Promise<ApiResponse<Family>> {
    const families = getFromStorage<Family[]>(FAMILIES_KEY) || [];
    
    const now = new Date();
    const newFamily: Family = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    families.push(newFamily);
    setToStorage(FAMILIES_KEY, families);

    return { data: newFamily };
  },

  async getFamily(id): Promise<ApiResponse<Family>> {
    const families = getFromStorage<Family[]>(FAMILIES_KEY) || [];
    const family = families.find(f => f.id === id);

    if (!family) {
      return { error: { code: 'NOT_FOUND', message: 'Family not found' } };
    }

    return { data: family };
  },

  async getFamiliesByUser(userId): Promise<ApiResponse<Family[]>> {
    const families = getFromStorage<Family[]>(FAMILIES_KEY) || [];
    const userFamilies = families.filter(f => f.createdById === userId);
    
    return { data: userFamilies };
  },

  async updateFamily(id, data): Promise<ApiResponse<Family>> {
    const families = getFromStorage<Family[]>(FAMILIES_KEY) || [];
    const index = families.findIndex(f => f.id === id);

    if (index === -1) {
      return { error: { code: 'NOT_FOUND', message: 'Family not found' } };
    }

    families[index] = {
      ...families[index],
      ...data,
      updatedAt: new Date(),
    };

    setToStorage(FAMILIES_KEY, families);
    return { data: families[index] };
  },

  async deleteFamily(id): Promise<ApiResponse<void>> {
    const families = getFromStorage<Family[]>(FAMILIES_KEY) || [];
    const filtered = families.filter(f => f.id !== id);
    setToStorage(FAMILIES_KEY, filtered);
    return { data: undefined };
  },
};
