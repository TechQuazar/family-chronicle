// Local messages and diary adapters

import type { MessageAdapter, DiaryAdapter } from '@/adapters/types';
import type { MessageToFuture, DiaryEntry, ApiResponse } from '@/types/models';
import { getFromStorage, setToStorage, generateId } from './storage';

const MESSAGES_KEY = 'messages';
const DIARY_KEY = 'diary_entries';

export const localMessageAdapter: MessageAdapter = {
  async createMessage(data): Promise<ApiResponse<MessageToFuture>> {
    const messages = getFromStorage<MessageToFuture[]>(MESSAGES_KEY) || [];
    
    const now = new Date();
    const newMessage: MessageToFuture = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    messages.push(newMessage);
    setToStorage(MESSAGES_KEY, messages);

    return { data: newMessage };
  },

  async getMessagesByBud(budId): Promise<ApiResponse<MessageToFuture[]>> {
    const messages = getFromStorage<MessageToFuture[]>(MESSAGES_KEY) || [];
    const budMessages = messages.filter(m => m.budId === budId);
    
    return { data: budMessages };
  },

  async updateMessage(id, data): Promise<ApiResponse<MessageToFuture>> {
    const messages = getFromStorage<MessageToFuture[]>(MESSAGES_KEY) || [];
    const index = messages.findIndex(m => m.id === id);

    if (index === -1) {
      return { error: { code: 'NOT_FOUND', message: 'Message not found' } };
    }

    messages[index] = {
      ...messages[index],
      ...data,
      updatedAt: new Date(),
    };

    setToStorage(MESSAGES_KEY, messages);
    return { data: messages[index] };
  },

  async deleteMessage(id): Promise<ApiResponse<void>> {
    const messages = getFromStorage<MessageToFuture[]>(MESSAGES_KEY) || [];
    const filtered = messages.filter(m => m.id !== id);
    setToStorage(MESSAGES_KEY, filtered);
    return { data: undefined };
  },
};

export const localDiaryAdapter: DiaryAdapter = {
  async createEntry(data): Promise<ApiResponse<DiaryEntry>> {
    const entries = getFromStorage<DiaryEntry[]>(DIARY_KEY) || [];
    
    const now = new Date();
    const newEntry: DiaryEntry = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    entries.push(newEntry);
    setToStorage(DIARY_KEY, entries);

    return { data: newEntry };
  },

  async getEntriesByBud(budId): Promise<ApiResponse<DiaryEntry[]>> {
    const entries = getFromStorage<DiaryEntry[]>(DIARY_KEY) || [];
    const budEntries = entries.filter(e => e.budId === budId);
    
    // Sort by date, newest first
    budEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return { data: budEntries };
  },

  async getEntry(id): Promise<ApiResponse<DiaryEntry>> {
    const entries = getFromStorage<DiaryEntry[]>(DIARY_KEY) || [];
    const entry = entries.find(e => e.id === id);

    if (!entry) {
      return { error: { code: 'NOT_FOUND', message: 'Entry not found' } };
    }

    return { data: entry };
  },

  async updateEntry(id, data): Promise<ApiResponse<DiaryEntry>> {
    const entries = getFromStorage<DiaryEntry[]>(DIARY_KEY) || [];
    const index = entries.findIndex(e => e.id === id);

    if (index === -1) {
      return { error: { code: 'NOT_FOUND', message: 'Entry not found' } };
    }

    entries[index] = {
      ...entries[index],
      ...data,
      updatedAt: new Date(),
    };

    setToStorage(DIARY_KEY, entries);
    return { data: entries[index] };
  },

  async deleteEntry(id): Promise<ApiResponse<void>> {
    const entries = getFromStorage<DiaryEntry[]>(DIARY_KEY) || [];
    const filtered = entries.filter(e => e.id !== id);
    setToStorage(DIARY_KEY, filtered);
    return { data: undefined };
  },
};
