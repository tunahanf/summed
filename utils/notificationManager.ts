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
  // Define predefined times as a constant at the class level
  predefinedTimes: ['08:00', '10:00', '12:00', '15:00', '18:00', '20:00', '22:00'],

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
    
    // Sort times to ensure they're processed in chronological order
    const sortedTimes = [...times].sort((a, b) => {
      const [aHours, aMinutes] = a.split(':').map(Number);
      const [bHours, bMinutes] = b.split(':').map(Number);
      
      if (aHours !== bHours) {
        return aHours - bHours;
      }
      return aMinutes - bMinutes;
    });
    
    console.log(`Scheduling reminders for ${medicine.name}:`);
    console.log(`- Days: ${days.join(', ')}`);
    console.log(`- Times: ${sortedTimes.join(', ')}`);
    console.log(`- Custom times: ${sortedTimes.filter(t => !this.predefinedTimes.includes(t)).join(', ') || 'None'}`);
    
    for (const day of days) {
      for (const time of sortedTimes) {
        // Parse the time format which is in "HH:MM" format
        const [hour, minute] = time.split(':').map(Number);
        const isCustomTime = !this.predefinedTimes.includes(time);
        
        console.log(`Scheduling ${isCustomTime ? 'custom' : 'predefined'} time: ${time} for ${day}`);
        
        // Schedule the notifications
        await this.scheduleReminder(medicine, day, time);
        await this.scheduleReminderBefore(medicine, day, time, 10); // 10 minutes before
      }
    }
  },

  async scheduleReminder(medicine: Medicine, day: string, time: string) {
    if (isWeb) return;
    
    // Ensure we're working with numeric hour and minute values
    const [hourStr, minuteStr] = time.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    
    // Validate the time values
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      console.error(`Invalid time format for reminder: ${time}`);
      return;
    }
    
    // Calculate trigger date
    const trigger = this.calculateTriggerDate(day, hour, minute);
    const isCustomTime = !this.predefinedTimes.includes(time);
    
    // Schedule the notification with identifier for debugging
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Medicine Reminder: ${medicine.name}`,
          body: `It's time to take ${medicine.name} ${medicine.dosage}`,
          data: { 
            medicineId: medicine.id,
            isCustomTime: isCustomTime
          },
        },
        trigger,
      });
      console.log(`Scheduled ${isCustomTime ? 'custom' : 'predefined'} reminder for ${medicine.name} at ${time} with ID: ${identifier}`);
    } catch (error) {
      console.error(`Failed to schedule reminder for ${medicine.name} at ${time}:`, error);
    }
  },

  async scheduleReminderBefore(medicine: Medicine, day: string, time: string, minutesBefore: number) {
    if (isWeb) return;
    
    // Ensure we're working with numeric hour and minute values
    const [hourStr, minuteStr] = time.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    
    // Validate the time values
    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      console.error(`Invalid time format for reminder: ${time}`);
      return;
    }
    
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
    
    const isCustomTime = !this.predefinedTimes.includes(time);
    
    // Schedule the notification with identifier for debugging
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: `Upcoming Medicine: ${medicine.name}`,
          body: `Remember to take ${medicine.name} ${medicine.dosage} in ${minutesBefore} minutes`,
          data: { 
            medicineId: medicine.id,
            isCustomTime: isCustomTime
          },
        },
        trigger,
      });
      console.log(`Scheduled ${isCustomTime ? 'custom' : 'predefined'} reminder before for ${medicine.name} at ${reminderHour}:${reminderMinute} with ID: ${identifier}`);
    } catch (error) {
      console.error(`Failed to schedule reminder before for ${medicine.name} at ${time}:`, error);
    }
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
      // For daily triggers
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
    
    // Default to daily reminder if we don't recognize the day pattern
    // This ensures backward compatibility
    console.log(`Unrecognized day pattern: ${day}, defaulting to daily reminder`);
    return {
      hour,
      minute,
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
    };
  }
}; 