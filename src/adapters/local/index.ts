// Local adapter - combines all local adapters into a single backend adapter

import type { BackendAdapter, UserAdapter } from '@/adapters/types';
import type { User, ApiResponse } from '@/types/models';
import { localAuthAdapter } from './auth';
import { localFamilyAdapter } from './family';
import { localBudAdapter, localConnectionAdapter } from './bud';
import { localMessageAdapter, localDiaryAdapter } from './messages';
import { getFromStorage, setToStorage } from './storage';

const USERS_KEY = 'users';

interface StoredUser extends User {
  passwordHash: string;
}

const localUserAdapter: UserAdapter = {
  async getUser(id): Promise<ApiResponse<User>> {
    const users = getFromStorage<StoredUser[]>(USERS_KEY) || [];
    const user = users.find(u => u.id === id);

    if (!user) {
      return { error: { code: 'NOT_FOUND', message: 'User not found' } };
    }

    const { passwordHash: _, ...safeUser } = user;
    return { data: safeUser };
  },

  async updateUser(id, data): Promise<ApiResponse<User>> {
    const users = getFromStorage<StoredUser[]>(USERS_KEY) || [];
    const index = users.findIndex(u => u.id === id);

    if (index === -1) {
      return { error: { code: 'NOT_FOUND', message: 'User not found' } };
    }

    users[index] = {
      ...users[index],
      ...data,
      updatedAt: new Date(),
    };

    setToStorage(USERS_KEY, users);
    
    const { passwordHash: _, ...safeUser } = users[index];
    return { data: safeUser };
  },
};

export const localAdapter: BackendAdapter = {
  auth: localAuthAdapter,
  users: localUserAdapter,
  families: localFamilyAdapter,
  buds: localBudAdapter,
  connections: localConnectionAdapter,
  messages: localMessageAdapter,
  diary: localDiaryAdapter,
};
