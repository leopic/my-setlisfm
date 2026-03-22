import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SyncContextValue {
  lastSyncTimestamp: number;
  notifySyncComplete: () => void;
}

const SyncContext = createContext<SyncContextValue>({
  lastSyncTimestamp: 0,
  notifySyncComplete: () => {},
});

export function SyncProvider({ children }: { children: ReactNode }) {
  const [lastSyncTimestamp, setLastSyncTimestamp] = useState(Date.now());

  const notifySyncComplete = useCallback(() => {
    setLastSyncTimestamp(Date.now());
  }, []);

  return <SyncContext value={{ lastSyncTimestamp, notifySyncComplete }}>{children}</SyncContext>;
}

export function useSyncContext() {
  return useContext(SyncContext);
}
