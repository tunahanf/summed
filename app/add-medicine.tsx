import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  Switch,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Medicine } from '../models/medicine';
import { MedicineStore } from '../utils/medicineStore';
import { NotificationManager } from '../utils/notificationManager';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LanguageStore } from '../utils/languageStore';
import { translations } from '../utils/translations';

const dayOptions = [
  'Every Day',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const dayOptionsTR = [
  'Her Gün',
  'Pazartesi',
  'Salı',
  'Çarşamba',
  'Perşembe',
  'Cuma',
  'Cumartesi',
  'Pazar',
];

const timeOptions = [
  '08:00',
  '10:00',
  '12:00',
  '15:00',
  '18:00',
  '20:00',
  '22:00',
];

// Check if we're running on web platform
const isWeb = Platform.OS === 'web';

export default function AddMedicineScreen() {
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [enableNotifications, setEnableNotifications] = useState(!isWeb);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [customTime, setCustomTime] = useState(new Date());
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [language, setLanguage] = useState<'en' | 'tr'>('en');
  
  // For iOS time picker
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState(0);

  const [hourScrollRef, setHourScrollRef] = useState<ScrollView | null>(null);
  const [minuteScrollRef, setMinuteScrollRef] = useState<ScrollView | null>(null);

  // Load language setting
  useEffect(() => {
    const loadLanguage = async () => {
      const userLanguage = await LanguageStore.getLanguage();
      setLanguage(userLanguage);
    };
    loadLanguage();
  }, []);
  
  // Get translations for current language
  const t = translations[language];
  
  // Get proper day options based on language
  const getDayOptions = useCallback(() => {
    return language === 'tr' ? dayOptionsTR : dayOptions;
  }, [language]);
  
  // Map english day to turkish day and vice versa
  const mapDay = useCallback((day: string) => {
    const dayMap: { [key: string]: string } = {
      'Every Day': 'Her Gün',
      'Monday': 'Pazartesi',
      'Tuesday': 'Salı',
      'Wednesday': 'Çarşamba',
      'Thursday': 'Perşembe',
      'Friday': 'Cuma',
      'Saturday': 'Cumartesi',
      'Sunday': 'Pazar',
      'Her Gün': 'Every Day',
      'Pazartesi': 'Monday',
      'Salı': 'Tuesday',
      'Çarşamba': 'Wednesday',
      'Perşembe': 'Thursday',
      'Cuma': 'Friday',
      'Cumartesi': 'Saturday',
      'Pazar': 'Sunday',
    };
    return dayMap[day] || day;
  }, []);
  
  // Add effect to scroll to current time when modal appears
  useEffect(() => {
    if (showTimePickerModal && hourScrollRef && minuteScrollRef) {
      // Calculate scroll position (40 is the height of each item)
      const hourScrollPos = selectedHour * 40;
      const minuteScrollPos = selectedMinute * 40;
      
      // Delay scrolling slightly to ensure the modal is visible
      setTimeout(() => {
        hourScrollRef.scrollTo({ y: hourScrollPos, animated: false });
        minuteScrollRef.scrollTo({ y: minuteScrollPos, animated: false });
      }, 100);
    }
  }, [showTimePickerModal, hourScrollRef, minuteScrollRef]);

  const handleSave = async () => {
    // Validate inputs
    if (!medicineName.trim()) {
      Alert.alert(language === 'tr' ? 'Hata' : 'Error', 
                 language === 'tr' ? 'Lütfen bir ilaç adı girin' : 'Please enter a medicine name');
      return;
    }

    if (selectedDays.length === 0) {
      Alert.alert(language === 'tr' ? 'Hata' : 'Error', 
                 language === 'tr' ? 'Lütfen en az bir gün seçin' : 'Please select at least one day');
      return;
    }

    if (selectedTimes.length === 0) {
      Alert.alert(language === 'tr' ? 'Hata' : 'Error', 
                 language === 'tr' ? 'Lütfen en az bir zaman seçin' : 'Please select at least one time');
      return;
    }

    // Map selected days to English for storage if in Turkish
    const daysToStore = language === 'tr' 
      ? selectedDays.map(day => mapDay(day))
      : selectedDays;

    // Create medicine object
    const newMedicine: Medicine = {
      id: Date.now().toString(),
      name: medicineName.trim(),
      dosage: dosage.trim(),
      schedule: {
        days: daysToStore,
        times: selectedTimes,
        customTimes: true, // Always set this flag to true since we now support mixed times
      },
    };

    // Save the medicine
    const success = await MedicineStore.saveMedicine(newMedicine);

    if (success) {
      // Schedule notifications if enabled and not on web
      if (enableNotifications && !isWeb) {
        try {
          await NotificationManager.scheduleMedicineReminders(newMedicine);
        } catch (error) {
          console.log('Failed to schedule notifications:', error);
          // Continue with saving even if notifications failed
        }
      }

      // Navigate back to medicine tracker
      router.push('/medicine-tracker');
    } else {
      Alert.alert(language === 'tr' ? 'Hata' : 'Error', 
                 language === 'tr' ? 'İlaç kaydedilemedi. Lütfen tekrar deneyin.' : 'Failed to save medicine. Please try again.');
    }
  };

  const toggleDay = (day: string) => {
    if (day === (language === 'tr' ? 'Her Gün' : 'Every Day')) {
      if (selectedDays.includes(day)) {
        setSelectedDays(selectedDays.filter(d => d !== day));
      } else {
        setSelectedDays([day]);
      }
    } else {
      if (selectedDays.includes(day)) {
        setSelectedDays(selectedDays.filter(d => d !== day));
      } else {
        const newSelectedDays = selectedDays.filter(d => d !== (language === 'tr' ? 'Her Gün' : 'Every Day'));
        const updatedDays = [...newSelectedDays, day];
        
        const weekDays = getDayOptions().filter(d => d !== (language === 'tr' ? 'Her Gün' : 'Every Day'));
        const allDaysSelected = weekDays.every(weekDay => 
          updatedDays.includes(weekDay) || weekDay === day
        );
        
        if (allDaysSelected) {
          setSelectedDays([language === 'tr' ? 'Her Gün' : 'Every Day']);
        } else {
          setSelectedDays(updatedDays);
        }
      }
    }
  };

  const toggleTime = (time: string) => {
    if (selectedTimes.includes(time)) {
      setSelectedTimes(selectedTimes.filter(t => t !== time));
    } else {
      setSelectedTimes([...selectedTimes, time]);
    }
  };

  const handleTimePickerChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    
    if (event.type === 'dismissed') {
      return;
    }
    
    const currentDate = selectedDate || customTime;
    setCustomTime(currentDate);
    
    if (event.type === 'set' && selectedDate) {
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      if (!selectedTimes.includes(timeString)) {
        setSelectedTimes([...selectedTimes, timeString]);
      }
    }
  };

  const addCustomTime = () => {
    if (Platform.OS === 'ios') {
      // Set initial values for the custom picker to current time
      const now = new Date();
      setSelectedHour(now.getHours());
      setSelectedMinute(now.getMinutes());
      setShowTimePickerModal(true);
    } else {
      setShowTimePicker(true);
      // Create a new Date object to ensure the time picker resets properly
      setCustomTime(new Date());
    }
  };

  const confirmIOSTimePicker = () => {
    const hours = selectedHour.toString().padStart(2, '0');
    const minutes = selectedMinute.toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;
    
    if (!selectedTimes.includes(timeString)) {
      setSelectedTimes([...selectedTimes, timeString]);
    }
    
    setShowTimePickerModal(false);
  };

  const removeTime = (time: string) => {
    setSelectedTimes(selectedTimes.filter(t => t !== time));
  };

  // Function to render a time option - used for both predefined and custom times
  const renderTimeOption = (time: string) => (
    <TouchableOpacity
      key={time}
      style={[
        styles.optionItem,
        selectedTimes.includes(time) && styles.selectedOption,
      ]}
      onPress={() => toggleTime(time)}
    >
      <Text
        style={[
          styles.optionText,
          selectedTimes.includes(time) && styles.selectedOptionText,
        ]}
      >
        {time}
      </Text>
      {!timeOptions.includes(time) && (
        <TouchableOpacity 
          style={styles.removeTimeButton}
          onPress={(e) => {
            e.stopPropagation();
            removeTime(time);
          }}
        >
          <MaterialIcons 
            name="delete" 
            size={18} 
            color="#e74c3c" 
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  // Get all selected times and sort them
  const getAllTimes = () => {
    const allTimes = [...selectedTimes].sort((a, b) => {
      const [aHours, aMinutes] = a.split(':').map(Number);
      const [bHours, bMinutes] = b.split(':').map(Number);
      
      if (aHours !== bHours) {
        return aHours - bHours;
      }
      return aMinutes - bMinutes;
    });
    
    return allTimes;
  };

  // Check if a time is one of the predefined times
  const isPredefinedTime = (time: string) => timeOptions.includes(time);

  // Get custom times (times that aren't in the predefined list)
  const customTimes = selectedTimes.filter(time => !isPredefinedTime(time));

  // Helper function to generate hours and minutes arrays
  const generateHours = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push(i.toString().padStart(2, '0'));
    }
    return hours;
  };

  const generateMinutes = () => {
    const minutes = [];
    for (let i = 0; i < 60; i++) {
      minutes.push(i.toString().padStart(2, '0'));
    }
    return minutes;
  };

  const hours = generateHours();
  const minutes = generateMinutes();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#062C63" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{language === 'tr' ? 'İlaç Ekle' : 'Add Medicine'}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>{language === 'tr' ? 'İlaç Bilgileri' : 'Medicine Information'}</Text>
          
          <Text style={styles.inputLabel}>{language === 'tr' ? 'İlaç Adı' : 'Medicine Name'}</Text>
          <TextInput
            style={styles.textInput}
            value={medicineName}
            onChangeText={setMedicineName}
            placeholder={language === 'tr' ? 'İlaç adını girin' : 'Enter medicine name'}
            placeholderTextColor="#a0a0a0"
          />
          
          <Text style={styles.inputLabel}>{language === 'tr' ? 'Dozaj' : 'Dosage'}</Text>
          <TextInput
            style={styles.textInput}
            value={dosage}
            onChangeText={setDosage}
            placeholder={language === 'tr' ? 'örn., 100mg (isteğe bağlı)' : 'e.g., 100mg (optional)'}
            placeholderTextColor="#a0a0a0"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>{language === 'tr' ? 'Program' : 'Schedule'}</Text>
          
          <Text style={styles.inputLabel}>{language === 'tr' ? 'Günler' : 'Days'}</Text>
          <View style={styles.optionsContainer}>
            {getDayOptions().map(day => (
              <TouchableOpacity
                key={day}
                style={[
                  styles.optionItem,
                  selectedDays.includes(day) && styles.selectedOption,
                ]}
                onPress={() => toggleDay(day)}
              >
                <Text
                  style={[
                    styles.optionText,
                    selectedDays.includes(day) && styles.selectedOptionText,
                  ]}
                >
                  {day}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.timesHeader}>
            <Text style={styles.inputLabel}>{language === 'tr' ? 'Zamanlar' : 'Times'}</Text>
          </View>

          <View style={styles.optionsContainer}>
            {/* Predefined times */}
            {timeOptions.map(time => renderTimeOption(time))}
            
            {/* Custom times */}
            {customTimes.map(time => renderTimeOption(time))}
            
            {/* Add time button (always at the end) */}
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={addCustomTime}
            >
              <Text style={styles.optionText}>
                <MaterialIcons name="add" size={16} color="#505050" /> 
              </Text>
            </TouchableOpacity>
          </View>

          {showTimePicker && Platform.OS === 'android' && (
            <View style={styles.androidPickerContainer}>
              <DateTimePicker
                value={customTime}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={handleTimePickerChange}
                themeVariant="light"
              />
            </View>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>{language === 'tr' ? 'Bildirimler' : 'Notifications'}</Text>
          
          <View style={styles.notificationSetting}>
            <Text style={styles.notificationText}>{language === 'tr' ? 'Hatırlatıcıları etkinleştir' : 'Enable reminders'}</Text>
            <Switch
              value={enableNotifications}
              onValueChange={setEnableNotifications}
              trackColor={{ false: '#d1d1d1', true: '#e76f51' }}
              thumbColor={enableNotifications ? '#ffffff' : '#f4f3f4'}
              disabled={isWeb} // Disable on web platforms
            />
          </View>
          
          <Text style={styles.notificationDescription}>
            {isWeb 
              ? (language === 'tr' ? 'Web platformlarında bildirimler kullanılamaz.' : 'Notifications are not available on web platforms.')
              : (language === 'tr' ? 'Planlanan zamandan 10 dakika önce ve zamanında bildirim alacaksınız.' : 'You will receive a notification 10 minutes before and at the scheduled time.')}
          </Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{language === 'tr' ? 'Kaydet' : 'Save'}</Text>
        </TouchableOpacity>

        {/* Time Picker Modal for iOS */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showTimePickerModal}
          onRequestClose={() => setShowTimePickerModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowTimePickerModal(false)}>
                  <Text style={styles.modalCancelButton}>{language === 'tr' ? 'İptal' : 'Cancel'}</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{language === 'tr' ? 'Zaman Seçin' : 'Choose Time'}</Text>
                <TouchableOpacity onPress={confirmIOSTimePicker}>
                  <Text style={styles.modalDoneButton}>{language === 'tr' ? 'Tamam' : 'Done'}</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.customTimePickerContainer}>
                {/* Hour Selector - styled like iOS wheel */}
                <View style={styles.pickerColumn}>
                  <ScrollView 
                    ref={ref => setHourScrollRef(ref)}
                    style={styles.pickerScroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.pickerScrollContent}
                    snapToInterval={40}
                    decelerationRate="fast"
                    onMomentumScrollEnd={(event) => {
                      // Calculate which item is centered in the indicator
                      const y = event.nativeEvent.contentOffset.y;
                      const index = Math.floor(y / 40);
                      if (index >= 0 && index < 24) {
                        setSelectedHour(index);
                      }
                    }}
                    onScroll={(event) => {
                      // Update selection in real-time while scrolling
                      const y = event.nativeEvent.contentOffset.y;
                      const index = Math.floor(y / 40);
                      if (index >= 0 && index < 24) {
                        setSelectedHour(index);
                      }
                    }}
                    scrollEventThrottle={16}
                  >
                    {hours.map((hour) => (
                      <Pressable
                        key={hour}
                        style={[
                          styles.pickerItem,
                          selectedHour === parseInt(hour) && styles.selectedPickerItem
                        ]}
                        onPress={() => {
                          setSelectedHour(parseInt(hour));
                          hourScrollRef?.scrollTo({ y: parseInt(hour) * 40, animated: true });
                        }}
                      >
                        <Text 
                          style={[
                            styles.pickerItemText,
                            selectedHour === parseInt(hour) && styles.selectedPickerItemText
                          ]}
                        >
                          {hour}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
                
                {/* Hour-minute separator */}
                <Text style={styles.timeSeparator}>:</Text>
                
                {/* Minute Selector - styled like iOS wheel */}
                <View style={styles.pickerColumn}>
                  <ScrollView 
                    ref={ref => setMinuteScrollRef(ref)}
                    style={styles.pickerScroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.pickerScrollContent}
                    snapToInterval={40}
                    decelerationRate="fast"
                    onMomentumScrollEnd={(event) => {
                      // Calculate which item is centered in the indicator
                      const y = event.nativeEvent.contentOffset.y;
                      const index = Math.floor(y / 40);
                      if (index >= 0 && index < 60) {
                        setSelectedMinute(index);
                      }
                    }}
                    onScroll={(event) => {
                      // Update selection in real-time while scrolling
                      const y = event.nativeEvent.contentOffset.y;
                      const index = Math.floor(y / 40);
                      if (index >= 0 && index < 60) {
                        setSelectedMinute(index);
                      }
                    }}
                    scrollEventThrottle={16}
                  >
                    {minutes.map((minute) => (
                      <Pressable
                        key={minute}
                        style={[
                          styles.pickerItem,
                          selectedMinute === parseInt(minute) && styles.selectedPickerItem
                        ]}
                        onPress={() => {
                          setSelectedMinute(parseInt(minute));
                          minuteScrollRef?.scrollTo({ y: parseInt(minute) * 40, animated: true });
                        }}
                      >
                        <Text 
                          style={[
                            styles.pickerItemText,
                            selectedMinute === parseInt(minute) && styles.selectedPickerItemText
                          ]}
                        >
                          {minute}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                {/* Selection indicator overlay */}
                <View style={styles.selectionIndicator}>
                  <View style={styles.selectionLine} />
                </View>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 25,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#062C63',
  },
  formSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#062C63',
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    color: '#505050',
    marginBottom: 10,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  optionItem: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    margin: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  optionText: {
    fontSize: 14,
    color: '#505050',
  },
  selectedOption: {
    backgroundColor: '#e76f51',
    borderColor: '#e76f51',
  },
  selectedOptionText: {
    color: '#ffffff',
  },
  notificationSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  notificationText: {
    fontSize: 16,
    color: '#505050',
  },
  notificationDescription: {
    fontSize: 14,
    color: '#8c8c8c',
    marginBottom: 20,
  },
  saveButton: {
    backgroundColor: '#e76f51',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  timesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addTimeButton: {
    padding: 5,
  },
  addTimeOption: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    margin: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customTimesSection: {
    marginTop: 5,
    marginBottom: 20,
  },
  customTimesLabel: {
    fontSize: 14,
    color: '#777',
    marginBottom: 8,
  },
  customTimesContainer: {
    marginTop: 5,
  },
  customTimeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1, 
    borderColor: '#e0e0e0',
    marginBottom: 8,
  },
  customTimeText: {
    fontSize: 14,
    color: '#505050',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    alignItems: 'center',
    paddingBottom: 30,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalCancelButton: {
    fontSize: 17,
    color: '#ffffff',
    opacity: 0.7,
  },
  modalDoneButton: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0A84FF',
  },
  customTimePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: 'transparent',
    position: 'relative',
    height: 260,
  },
  pickerColumn: {
    width: '35%',
    alignItems: 'center',
    height: 220,
    justifyContent: 'center',
  },
  pickerScroll: {
    height: 220,
    width: '100%',
  },
  pickerScrollContent: {
    alignItems: 'center',
    paddingVertical: 90,
  },
  pickerItem: {
    paddingVertical: 5,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    display: 'flex',
  },
  selectedPickerItem: {
    backgroundColor: 'transparent',
  },
  pickerItemText: {
    fontSize: 22,
    color: '#999999',
    fontWeight: '400',
    textAlign: 'center',
    width: '100%',
    lineHeight: 40,
    textAlignVertical: 'center',
  },
  selectedPickerItemText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '500',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: '500',
    color: '#ffffff',
    marginHorizontal: 5,
    height: 40,
    textAlignVertical: 'center',
    lineHeight: 40,
  },
  selectionIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    pointerEvents: 'none',
    paddingBottom: 0,
  },
  selectionLine: {
    width: '90%',
    height: 40,
    backgroundColor: 'rgba(40, 40, 40, 0.05)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(8px)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    marginTop: 0,
    top: 0,
  },
  androidPickerContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    marginVertical: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  removeTimeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'white',
    padding: 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  timeGroupLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#062C63',
    marginBottom: 10,
  },
  predefinedTimesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  addTimeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginLeft: 5,
  },
}); 