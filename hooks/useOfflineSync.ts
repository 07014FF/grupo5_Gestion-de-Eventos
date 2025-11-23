/**
 * Hook personalizado para sincronización offline automática
 * Sincroniza validaciones pendientes en segundo plano
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { ValidatorService } from '@/services/validator.service';

interface UseOfflineSyncReturn {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncDate: Date | null;
  syncNow: () => Promise<boolean>;
  refresh: () => void;
}

export function useOfflineSync(autoSync: boolean = true): UseOfflineSyncReturn {
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(true);

  const appState = useRef(AppState.currentState);
  const syncInterval = useRef<NodeJS.Timeout | null>(null);

  // Verificar conexión a internet
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
    });

    return () => unsubscribe();
  }, []);

  // Función para cargar información de sincronización
  const loadSyncInfo = useCallback(async () => {
    const validations = await ValidatorService.getOfflineValidations();
    const pending = validations.filter((v) => !v.synced).length;
    setPendingCount(pending);

    const lastSync = await ValidatorService.getLastSyncDate();
    setLastSyncDate(lastSync);
  }, []);

  // Función para sincronizar ahora
  const syncNow = useCallback(async (): Promise<boolean> => {
    if (isSyncing || !isConnected || pendingCount === 0) {
      return false;
    }

    setIsSyncing(true);

    try {
      const result = await ValidatorService.syncOfflineValidations();

      if (result.success) {
        console.log(`✅ Sincronizadas ${result.data} validaciones`);
        await loadSyncInfo();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error en sincronización:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, isConnected, pendingCount, loadSyncInfo]);

  // Manejar cambios de estado de la app
  const handleAppStateChange = useCallback(async (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active' &&
      isConnected
    ) {
      // App volvió a primer plano, sincronizar
      await syncNow();
    }
    appState.current = nextAppState;
  }, [isConnected, syncNow]);

  // Cargar información inicial
  useEffect(() => {
    loadSyncInfo();
  }, [loadSyncInfo]);

  // Auto-sincronización periódica
  useEffect(() => {
    if (autoSync && isConnected) {
      // Sincronizar cada 2 minutos
      syncInterval.current = setInterval(() => {
        syncNow();
      }, 2 * 60 * 1000) as unknown as NodeJS.Timeout;

      return () => {
        if (syncInterval.current) {
          clearInterval(syncInterval.current);
        }
      };
    }
  }, [autoSync, isConnected, syncNow]);

  // Sincronizar cuando la app vuelve a primer plano
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [handleAppStateChange]);

  const refresh = useCallback(() => {
    loadSyncInfo();
  }, [loadSyncInfo]);

  return {
    pendingCount,
    isSyncing,
    lastSyncDate,
    syncNow,
    refresh,
  };
}
