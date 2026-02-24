import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { NotificationService } from '@/lib/notifications';

export function useNotifications() {
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  useEffect(() => {
    initializeNotifications();
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, []);

  const initializeNotifications = async (): Promise<void> => {
    try {
      const granted = await NotificationService.requestPermissions();
      setHasPermission(granted);

      if (granted) {
        await NotificationService.trackAppOpen();
        
        await NotificationService.checkAndScheduleReminder();
      }
    } catch (error) {
    }
  };

  const handleAppStateChange = async (nextAppState: AppStateStatus): Promise<void> => {
    if (nextAppState === 'active') {
      
      const granted = await NotificationService.hasPermissions();
      if (granted) {
        await NotificationService.trackAppOpen();
        await NotificationService.checkAndScheduleReminder();
      }
    }
  };

  return {
    hasPermission,
    requestPermissions: initializeNotifications,
  };
}
