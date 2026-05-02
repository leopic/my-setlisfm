// jest.mock() is hoisted above all imports, so factory functions must use
// inline jest.fn() — outer const variables are in the temporal dead zone
// when the factory runs. Access mock refs through the imported modules instead.

jest.mock('@/services/setlistApi', () => ({
  SetlistApiService: jest.fn().mockImplementation(() => ({
    getUserAttendedConcerts: jest.fn(),
  })),
}));

jest.mock('@/services/dataProcessor', () => ({
  DataProcessor: jest.fn().mockImplementation(() => ({
    importSetlistsFromResponse: jest.fn(),
  })),
}));

jest.mock('@/database/operations', () => ({
  dbOperations: {
    getMetadata: jest.fn(),
    upsertMetadata: jest.fn(),
    updateLastFetchedAt: jest.fn(),
  },
}));

jest.mock('@/database/database', () => ({
  databaseManager: { getDatabase: jest.fn() },
}));

import { syncConcertData, getStoredUsername, setStoredUsername } from '@/services/syncService';
import { SetlistApiService } from '@/services/setlistApi';
import { DataProcessor } from '@/services/dataProcessor';
import { dbOperations } from '@/database/operations';

// syncService creates singletons at module load time via `new SetlistApiService()` and
// `new DataProcessor()`. The factory returns a plain object literal, so the mock methods live
// on results[0].value (the returned object), not instances[0] (the `this` context).
const apiInstance = (SetlistApiService as jest.MockedClass<typeof SetlistApiService>).mock
  .results[0].value as jest.Mocked<InstanceType<typeof SetlistApiService>>;
const processorInstance = (DataProcessor as jest.MockedClass<typeof DataProcessor>).mock.results[0]
  .value as jest.Mocked<InstanceType<typeof DataProcessor>>;
const mockDbOps = dbOperations as jest.Mocked<typeof dbOperations>;

beforeEach(() => {
  jest.clearAllMocks();
  mockDbOps.updateLastFetchedAt.mockResolvedValue(undefined);
});

describe('syncConcertData', () => {
  it('returns success with new concert count when sync completes', async () => {
    apiInstance.getUserAttendedConcerts.mockResolvedValue({
      setlist: [{ id: 'a' }, { id: 'b' }],
      total: 2,
      itemsPerPage: 20,
      page: 1,
    } as never);
    processorInstance.importSetlistsFromResponse.mockResolvedValue(2);

    const result = await syncConcertData('leopic');

    expect(result.success).toBe(true);
    expect(result.newConcerts).toBe(2);
  });

  it('returns success with zero new concerts when already caught up', async () => {
    apiInstance.getUserAttendedConcerts.mockResolvedValue({
      setlist: [{ id: 'a' }],
      total: 1,
      itemsPerPage: 20,
      page: 1,
    } as never);
    processorInstance.importSetlistsFromResponse.mockResolvedValue(0);

    const result = await syncConcertData('leopic');

    expect(result.success).toBe(true);
    expect(result.newConcerts).toBe(0);
  });

  it('returns failure with "User not found" when the API throws that error', async () => {
    apiInstance.getUserAttendedConcerts.mockRejectedValue(new Error('User not found'));

    const result = await syncConcertData('unknown-user');

    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });

  it('returns failure when no username is provided or stored', async () => {
    mockDbOps.getMetadata.mockResolvedValue(null);

    const result = await syncConcertData();

    expect(result.success).toBe(false);
    expect(result.error).toBe('No username configured');
    expect(apiInstance.getUserAttendedConcerts).not.toHaveBeenCalled();
  });

  it('uses stored username when no override is given', async () => {
    mockDbOps.getMetadata.mockResolvedValue('storeduser');
    apiInstance.getUserAttendedConcerts.mockResolvedValue({
      setlist: [],
      total: 0,
      itemsPerPage: 20,
      page: 1,
    } as never);

    await syncConcertData();

    expect(apiInstance.getUserAttendedConcerts).toHaveBeenCalledWith('storeduser', 1);
  });

  it('calls onProgress callback during sync', async () => {
    apiInstance.getUserAttendedConcerts.mockResolvedValue({
      setlist: [{ id: 'a' }],
      total: 1,
      itemsPerPage: 20,
      page: 1,
    } as never);
    processorInstance.importSetlistsFromResponse.mockResolvedValue(1);

    const onProgress = jest.fn();
    await syncConcertData('leopic', onProgress);

    expect(onProgress).toHaveBeenCalled();
  });
});

describe('getStoredUsername', () => {
  it('returns the stored username', async () => {
    mockDbOps.getMetadata.mockResolvedValue('leopic');

    const result = await getStoredUsername();

    expect(result).toBe('leopic');
    expect(mockDbOps.getMetadata).toHaveBeenCalledWith('username');
  });

  it('returns null when no username is stored', async () => {
    mockDbOps.getMetadata.mockResolvedValue(null);

    const result = await getStoredUsername();

    expect(result).toBeNull();
  });
});

describe('setStoredUsername', () => {
  it('writes username to the metadata table', async () => {
    mockDbOps.upsertMetadata.mockResolvedValue(undefined);

    await setStoredUsername('leopic');

    expect(mockDbOps.upsertMetadata).toHaveBeenCalledWith('username', 'leopic');
  });
});
