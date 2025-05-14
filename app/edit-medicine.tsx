import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Medicine } from '../models/medicine';
import { MedicineStore } from '../utils/medicineStore';
import { NotificationManager } from '../utils/notificationManager';
import DateTimePicker from '@react-native-community/datetimepicker';

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

export default function EditMedicineScreen() {
  const { medicineId } = useLocalSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [medicine, setMedicine] = useState<Medicine | null>(null);
  
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [customTime, setCustomTime] = useState(new Date());
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);

  // For iOS time picker
  const [selectedHour, setSelectedHour] = useState(10);
  const [selectedMinute, setSelectedMinute] = useState(0);

  useEffect(() => {
    loadMedicine();
  }, [medicineId]);

  const loadMedicine = async () => {
    if (!medicineId) {
      Alert.alert('Error', 'No medicine ID provided');
      router.back();
      return;
    }

    setLoading(true);
    
    try {
      const medicines = await MedicineStore.getMedicines();
      const foundMedicine = medicines.find(m => m.id === medicineId);
      
      if (foundMedicine) {
        setMedicine(foundMedicine);
        setMedicineName(foundMedicine.name);
        setDosage(foundMedicine.dosage);
        setSelectedDays(foundMedicine.schedule.days);
        setSelectedTimes(foundMedicine.schedule.times);
      } else {
        Alert.alert('Error', 'Medicine not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading medicine:', error);
      Alert.alert('Error', 'Failed to load medicine details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!medicine) return;
    
    // Validate inputs
    if (!medicineName.trim()) {
      Alert.alert('Error', 'Please enter a medicine name');
      return;
    }

    if (selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    if (selectedTimes.length === 0) {
      Alert.alert('Error', 'Please select at least one time');
      return;
    }

    // Update medicine object
    const updatedMedicine: Medicine = {
      ...medicine,
      name: medicineName.trim(),
      dosage: dosage.trim(),
      schedule: {
        days: selectedDays,
        times: selectedTimes,
        customTimes: true, // Always set this flag to true since we now support mixed times
      },
    };

    // Save the medicine
    const success = await MedicineStore.saveMedicine(updatedMedicine);

    if (success) {
      // Update notifications
      await NotificationManager.cancelMedicineReminders(updatedMedicine.id);
      
      if (enableNotifications) {
        await NotificationManager.scheduleMedicineReminders(updatedMedicine);
      }

      // Navigate back to medicine tracker
      router.push('/medicine-tracker');
    } else {
      Alert.alert('Error', 'Failed to save medicine. Please try again.');
    }
  };

  const toggleDay = (day: string) => {
    if (day === 'Every Day') {
      if (selectedDays.includes(day)) {
        setSelectedDays(selectedDays.filter(d => d !== day));
      } else {
        setSelectedDays(['Every Day']);
      }
    } else {
      if (selectedDays.includes(day)) {
        setSelectedDays(selectedDays.filter(d => d !== day));
      } else {
        const newSelectedDays = selectedDays.filter(d => d !== 'Every Day');
        const updatedDays = [...newSelectedDays, day];
        
        const weekDays = dayOptions.filter(d => d !== 'Every Day');
        const allDaysSelected = weekDays.every(weekDay => 
          updatedDays.includes(weekDay) || weekDay === day
        );
        
        if (allDaysSelected) {
          setSelectedDays(['Every Day']);
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
      setShowTimePickerModal(false);
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
      // Set initial values for the custom picker
      const now = new Date();
      setSelectedHour(now.getHours());
      setSelectedMinute(now.getMinutes());
      setShowTimePickerModal(true);
    } else {
      setShowTimePicker(true);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e76f51" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#062C63" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Medicine</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Medicine Information</Text>
          
          <Text style={styles.inputLabel}>Medicine Name</Text>
          <TextInput
            style={styles.textInput}
            value={medicineName}
            onChangeText={setMedicineName}
            placeholder="Enter medicine name"
            placeholderTextColor="#a0a0a0"
          />
          
          <Text style={styles.inputLabel}>Dosage</Text>
          <TextInput
            style={styles.textInput}
            value={dosage}
            onChangeText={setDosage}
            placeholder="e.g., 100mg (optional)"
            placeholderTextColor="#a0a0a0"
          />
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          
          <Text style={styles.inputLabel}>Days</Text>
          <View style={styles.optionsContainer}>
            {dayOptions.map(day => (
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
            <Text style={styles.inputLabel}>Times</Text>
          </View>

          <View style={styles.optionsContainer}>
            {/* All times (predefined and custom) */}
            {getAllTimes().map(time => renderTimeOption(time))}
            
            {/* Add custom time button */}
            <TouchableOpacity 
              style={styles.addTimeOption}
              onPress={addCustomTime}
            >
              <MaterialIcons name="add" size={20} color="#555" />
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
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.notificationSetting}>
            <Text style={styles.notificationText}>Enable reminders</Text>
            <Switch
              value={enableNotifications}
              onValueChange={setEnableNotifications}
              trackColor={{ false: '#d1d1d1', true: '#e76f51' }}
              thumbColor={enableNotifications ? '#ffffff' : '#f4f3f4'}
              disabled={isWeb}
            />
          </View>
          
          <Text style={styles.notificationDescription}>
            {isWeb 
              ? 'Notifications are not available on web platforms.'
              : 'You will receive a notification 10 minutes before and at the scheduled time.'}
          </Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
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
                <Text style={styles.modalTitle}>Select Time</Text>
                <TouchableOpacity onPress={() => setShowTimePickerModal(false)}>
                  <MaterialIcons name="close" size={24} color="#062C63" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.customTimePickerContainer}>
                {/* Hour Selector */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Hour</Text>
                  <ScrollView 
                    style={styles.pickerScroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.pickerScrollContent}
                  >
                    {hours.map((hour) => (
                      <Pressable
                        key={hour}
                        style={[
                          styles.pickerItem,
                          selectedHour === parseInt(hour) && styles.selectedPickerItem
                        ]}
                        onPress={() => setSelectedHour(parseInt(hour))}
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
                
                <Text style={styles.timeSeparator}>:</Text>
                
                {/* Minute Selector */}
                <View style={styles.pickerColumn}>
                  <Text style={styles.pickerLabel}>Minute</Text>
                  <ScrollView 
                    style={styles.pickerScroll}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.pickerScrollContent}
                  >
                    {minutes.map((minute) => (
                      <Pressable
                        key={minute}
                        style={[
                          styles.pickerItem,
                          selectedMinute === parseInt(minute) && styles.selectedPickerItem
                        ]}
                        onPress={() => setSelectedMinute(parseInt(minute))}
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
              </View>
              
              <View style={styles.selectedTimePreview}>
                <Text style={styles.selectedTimeText}>
                  {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')}
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.confirmTimeButton}
                onPress={confirmIOSTimePicker}
              >
                <Text style={styles.confirmTimeText}>Add Time</Text>
              </TouchableOpacity>
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#062C63',
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#062C63',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#444',
    marginBottom: 8,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  optionItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    marginBottom: 8,
  },
  optionText: {
    color: '#555',
  },
  selectedOption: {
    backgroundColor: '#e76f51',
    borderColor: '#e76f51',
  },
  selectedOptionText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  notificationSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  notificationText: {
    fontSize: 16,
    color: '#444',
  },
  notificationDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#e76f51',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    marginRight: 8,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customTimesSection: {
    marginTop: 5,
    marginBottom: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  customTimeText: {
    fontSize: 14,
    color: '#555',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#062C63',
  },
  customTimePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
  },
  pickerColumn: {
    width: '40%',
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#062C63',
    marginBottom: 8,
  },
  pickerScroll: {
    height: 150,
    width: '100%',
  },
  pickerScrollContent: {
    alignItems: 'center',
    paddingVertical: 60, // Add padding to allow scrolling to all items
  },
  pickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginVertical: 2,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
  selectedPickerItem: {
    backgroundColor: '#e76f51',
  },
  pickerItemText: {
    fontSize: 18,
    color: '#444',
  },
  selectedPickerItemText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#062C63',
    marginHorizontal: 10,
    marginTop: 25,
  },
  selectedTimePreview: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  selectedTimeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#062C63',
  },
  confirmTimeButton: {
    backgroundColor: '#e76f51',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  confirmTimeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
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
}); 