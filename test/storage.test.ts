/**
 * storage.test.ts
 *
 * Unit tests for storage helpers.
 * Mocks chrome.storage.sync.
 */

import { addLabel, removeLabel, getSettings, Settings } from '../src/utils/storage';

// Mock chrome.storage.sync
const mockStorage: any = {
  labels: []
};

global.chrome = {
  storage: {
    sync: {
      get: jest.fn((defaults, callback) => {
        callback(mockStorage);
      }),
      set: jest.fn((items, callback) => {
        Object.assign(mockStorage, items);
        callback();
      })
    }
  }
} as any;

describe('Storage Utils', () => {
  beforeEach(() => {
    mockStorage.labels = [];
    jest.clearAllMocks();
  });

  test('addLabel adds a new label', async () => {
    await addLabel('Work');
    expect(mockStorage.labels).toHaveLength(1);
    expect(mockStorage.labels[0].name).toBe('Work');
  });

  test('addLabel does not add duplicate', async () => {
    await addLabel('Work');
    await addLabel('Work');
    expect(mockStorage.labels).toHaveLength(1);
  });

  test('removeLabel removes a label', async () => {
    await addLabel('Work');
    const id = mockStorage.labels[0].id;
    await removeLabel(id);
    expect(mockStorage.labels).toHaveLength(0);
  });
});
