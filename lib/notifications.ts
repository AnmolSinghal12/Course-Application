import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

if (__DEV__) {
  const originalWarn = console.warn;
  const originalError = console.error;
  
  console.warn = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (message.includes('expo-notifications') && (message.includes('Expo Go') || message.includes('SDK 53'))) {
   
      return;
    }
    originalWarn(...args);
  };
  
  console.error = (...args: any[]) => {
    const message = args[0]?.toString() || '';
    if (message.includes('expo-notifications') && (message.includes('Expo Go') || message.includes('SDK 53'))) {
      return;
    }
    if (message.includes('Image failed to load') || 
        message.includes('Failed to load resource') ||
        message.includes('status code: 404') ||
        args.some(arg => typeof arg === 'string' && (arg.includes('cdn.dummyjson.com') || arg.includes('thumbnail')))) {
      return;
    }
    if (message.includes('Invalid access token') || 
        message.includes('Invalid token') ||
        (args.some(arg => typeof arg === 'object' && arg !== null && 
          (arg.message?.includes('Invalid access token') || 
           arg.message?.includes('Invalid token') ||
           (arg.statusCode === 401 && arg.message?.includes('Invalid')))))) {
      return;
    }
    originalError(...args);
  };
}

const LAST_APP_OPEN_KEY = '@last_app_open';
const NOTIFICATION_PERMISSION_KEY = '@notification_permission_requested';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
 
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      await AsyncStorage.setItem(NOTIFICATION_PERMISSION_KEY, finalStatus);

      if (finalStatus !== 'granted') {
        return false;
      }

     
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  static async hasPermissions(): Promise<boolean> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      return false;
    }
  }

  
  static async scheduleNotification(
    title: string,
    body: string,
    data?: Record<string, any>,
    trigger?: Notifications.NotificationTriggerInput
  ): Promise<string> {
    try {
      const hasPermission = await this.hasPermissions();
      if (!hasPermission) {
        return '';
      }

      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: true,
        },
        trigger: trigger || null,
      });

      return identifier;
    } catch (error) {
      return '';
    }
  }

  
  static async notifyBookmarkMilestone(bookmarkCount: number): Promise<void> {
    if (bookmarkCount >= 5) {
      await this.scheduleNotification(
        '🎉 Great Collection!',
        `You've bookmarked ${bookmarkCount} courses! Keep exploring to find more amazing content.`,
        {
          type: 'bookmark_milestone',
          count: bookmarkCount,
        }
      );
    }
  }

  
  static async trackAppOpen(): Promise<void> {
    try {
      const now = new Date().toISOString();
      await AsyncStorage.setItem(LAST_APP_OPEN_KEY, now);
      
      await this.cancelReminderNotifications();
    } catch (error) {
    }
  }

  
  static async checkAndScheduleReminder(): Promise<void> {
    try {
      const lastOpenStr = await AsyncStorage.getItem(LAST_APP_OPEN_KEY);
      
      if (!lastOpenStr) {
     
        await this.trackAppOpen();
        return;
      }

      const lastOpen = new Date(lastOpenStr);
      const now = new Date();
      const hoursSinceLastOpen = (now.getTime() - lastOpen.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastOpen >= 24) {
        const hasPermission = await this.hasPermissions();
        if (hasPermission) {
          await this.scheduleReminderNotification();
        }
      }
    } catch (error) {
    }
  }

  
  static async scheduleReminderNotification(): Promise<void> {
    try {
      await this.cancelReminderNotifications();

      const trigger: Notifications.TimeIntervalTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 24 * 60 * 60, // 24 hours in seconds
      };

      await this.scheduleNotification(
        '📚 We Miss You!',
        "You haven't opened the app in a while. Come back to continue your learning journey!",
        {
          type: 'reminder',
        },
        trigger
      );
    } catch (error) {
    }
  }

 
  static async cancelReminderNotifications(): Promise<void> {
    try {
      const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const reminderNotifications = allNotifications.filter(
        (notification) => notification.content.data?.type === 'reminder'
      );

      for (const notification of reminderNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    } catch (error) {
    }
  }

  static async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
    }
  }

  
  static async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      return [];
    }
  }
}
