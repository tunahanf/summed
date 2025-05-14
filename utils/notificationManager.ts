import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medicine } from '../models/medicine';

// Check if we're running on web platform
const isWeb = Platform.OS === 'web';

// Configure notifications (only on native platforms)
if (!isWeb) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export const NotificationManager = {
  async requestPermissions() {
    if (isWeb) {
      console.log('Notifications are not available on web platforms');
      return false;
    }
    
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return false;
    }
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('medicine-reminders', {
        name: 'Medicine Reminders',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
    
    return true;
  },

  async scheduleMedicineReminders(medicine: Medicine) {
    if (isWeb) {
      console.log('Scheduling notifications is not available on web platforms');
      return;
    }
    
    // Cancel any existing notifications for this medicine
    await this.cancelMedicineReminders(medicine.id);
    
    const { days, times } = medicine.schedule;
    
    for (const day of days) {
      for (const time of times) {
        await this.scheduleReminder(medicine, day, time);
        await this.scheduleReminderBefore(medicine, day, time, 10); // 10 minutes before
      }
    }
  },

  async scheduleReminder(medicine: Medicine, day: string, time: string) {
    if (isWeb) return;
    
    const [hour, minute] = time.split(':').map(Number);
    
    // Calculate trigger date
    const trigger = this.calculateTriggerDate(day, hour, minute);
    
    // Schedule the notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Medicine Reminder: ${medicine.name}`,
        body: `It's time to take ${medicine.name} ${medicine.dosage}`,
        data: { medicineId: medicine.id },
      },
      trigger,
    });
  },

  async scheduleReminderBefore(medicine: Medicine, day: string, time: string, minutesBefore: number) {
    if (isWeb) return;
    
    const [hour, minute] = time.split(':').map(Number);
    
    // Calculate minutes for the reminder
    let reminderMinute = minute - minutesBefore;
    let reminderHour = hour;
    
    if (reminderMinute < 0) {
      reminderHour = hour - 1;
      if (reminderHour < 0) reminderHour = 23;
      reminderMinute = 60 + reminderMinute;
    }
    
    // Calculate trigger date
    const trigger = this.calculateTriggerDate(
      day, 
      reminderHour, 
      reminderMinute
    );
    
    // Schedule the notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Upcoming Medicine: ${medicine.name}`,
        body: `Remember to take ${medicine.name} ${medicine.dosage} in ${minutesBefore} minutes`,
        data: { medicineId: medicine.id },
      },
      trigger,
    });
  },

  async cancelMedicineReminders(medicineId: string) {
    if (isWeb) {
      console.log('Canceling notifications is not available on web platforms');
      return;
    }
    
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.medicineId === medicineId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  },

  calculateTriggerDate(day: string, hour: number, minute: number): Notifications.NotificationTriggerInput {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Handle special cases like "Every Day"
    if (day === 'Every Day') {
      return {
        hour,
        minute,
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
      };
    }
    
    // Handle specific weekday
    const dayIndex = daysOfWeek.findIndex(d => d === day);
    if (dayIndex !== -1) {
      // For specific weekdays, use weekly trigger
      return {
        weekday: dayIndex + 1, // API uses 1-7 for weekdays, not 0-6
        hour,
        minute,
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      };
    }
    
    // Default daily reminder
    return {
      hour,
      minute,
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
    };
  }
}; 