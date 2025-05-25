import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  Vibration,
  Dimensions,
  PanResponder
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Medicine } from '../models/medicine';
import { MedicineStore } from '../utils/medicineStore';
import { router } from 'expo-router';
import { NotificationManager } from '../utils/notificationManager';
import { LanguageStore } from '../utils/languageStore';
import { translations } from '../utils/translations';

// Separate component for medicine item to properly use hooks
const MedicineItem = ({ 
  item, 
  onEdit, 
  onDelete,
  language
}: { 
  item: Medicine; 
  onEdit: (medicine: Medicine) => void; 
  onDelete: (id: string) => void;
  language: 'en' | 'tr';
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const pan = useRef(new Animated.ValueXY()).current;
  const t = translations[language];

  // Set up PanResponder
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        // Only allow left swipe
        if (gestureState.dx < 0) {
          pan.x.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dx < -40) {
          // Open the swipe view
          Animated.spring(pan.x, {
            toValue: -80,
            useNativeDriver: false
          }).start();
          setIsOpen(true);
        } else {
          // Reset
          Animated.spring(pan.x, {
            toValue: 0,
            useNativeDriver: false
          }).start();
          setIsOpen(false);
        }
      }
    })
  ).current;

  // Reset the position
  const closeSwipe = () => {
    Animated.spring(pan.x, {
      toValue: 0,
      useNativeDriver: false
    }).start();
    setIsOpen(false);
  };

  // Format the schedule for display
  const formattedSchedule = () => {
    const { days, times } = item.schedule;
    
    if (days.length === 1) {
      if (days[0] === 'Every Day') {
        return `${t.everyDay}, ${times.join(` ${t.and} `)}`;
      }
      return `${t.every} ${days[0]}, ${times.join(` ${t.and} `)}`;
    }
    
    // Handle specific days
    return `${t.every} ${days.join(', ')}, ${times.join(` ${t.and} `)}`;
  };

  return (
    <View style={styles.itemContainer}>
      {/* Delete button (behind the swipeable area) */}
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => {
          Vibration.vibrate(10);
          onDelete(item.id);
        }}
      >
        <MaterialIcons name="delete" size={24} color="white" />
      </TouchableOpacity>

      {/* Main card that can be swiped */}
      <Animated.View 
        style={[
          styles.medicineItemContainer,
          { transform: [{ translateX: pan.x }] }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity 
          style={styles.medicineItem}
          onPress={() => {
            if (isOpen) {
              closeSwipe();
            } else {
              onEdit(item);
            }
          }}
        >
          <View style={styles.medicineIcon}>
            <MaterialIcons name="medication" size={24} color="#062C63" />
          </View>
          <View style={styles.medicineDetails}>
            <Text style={styles.medicineName}>
              {item.name} {item.dosage ? item.dosage : ''}
            </Text>
            <Text style={styles.medicineSchedule}>{formattedSchedule()}</Text>
          </View>
          <View style={styles.swipeHint}>
            <MaterialIcons 
              name={isOpen ? "chevron-right" : "chevron-left"} 
              size={20} 
              color="#aaa" 
            />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default function MedicineTrackerScreen() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMedicineModalVisible, setAddMedicineModalVisible] = useState(false);
  const [language, setLanguage] = useState<'en' | 'tr'>(LanguageStore.getLanguage());
  
  const t = translations[language];

  useEffect(() => {
    loadMedicines();
    setupNotifications();
    
    // Update language when it changes in the store
    const intervalId = setInterval(() => {
      const currentLang = LanguageStore.getLanguage();
      if (currentLang !== language) {
        setLanguage(currentLang);
      }
    }, 300);
    
    return () => clearInterval(intervalId);
  }, []);

  const setupNotifications = async () => {
    await NotificationManager.requestPermissions();
  };

  const loadMedicines = async () => {
    setLoading(true);
    const storedMedicines = await MedicineStore.getMedicines();
    setMedicines(storedMedicines);
    setLoading(false);
  };

  const handleAddMedicine = () => {
    router.push('/add-medicine');
  };

  const handleEditMedicine = (medicine: Medicine) => {
    router.push({
      pathname: '/edit-medicine',
      params: { medicineId: medicine.id }
    });
  };

  const handleDeleteMedicine = async (medicineId: string) => {
    await MedicineStore.deleteMedicine(medicineId);
    await NotificationManager.cancelMedicineReminders(medicineId);
    loadMedicines();
  };

  // Render item now just passes the item to the MedicineItem component
  const renderMedicineItem = ({ item }: { item: Medicine }) => {
    return (
      <MedicineItem 
        item={item} 
        onEdit={handleEditMedicine} 
        onDelete={handleDeleteMedicine}
        language={language}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{t.trackYour}</Text>
            <Text style={styles.subtitle}>{t.medicines}</Text>
          </View>
        </View>

        {medicines.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="medication" size={60} color="#e0e0e0" />
            <Text style={styles.emptyText}>{t.noMedicines}</Text>
            <Text style={styles.emptySubtext}>{t.addYourFirst}</Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddMedicine}
            >
              <MaterialIcons name="add" size={24} color="white" />
              <Text style={styles.addButtonText}>{t.addMedicine}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <FlatList
              data={medicines}
              renderItem={renderMedicineItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
            
            <TouchableOpacity 
              style={styles.floatingButton}
              onPress={handleAddMedicine}
            >
              <MaterialIcons name="add" size={24} color="white" />
              <Text style={styles.floatingButtonText}>{t.addMedicine}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
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
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0e194d',
  },
  subtitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e76f51',
    marginBottom: 10,
  },
  listContainer: {
    paddingBottom: 80,
  },
  itemContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  medicineItemContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1,
  },
  medicineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  medicineIcon: {
    backgroundColor: '#e7f0ff',
    padding: 10,
    borderRadius: 10,
    marginRight: 15,
  },
  medicineDetails: {
    flex: 1,
  },
  medicineName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#062C63',
    marginBottom: 4,
  },
  medicineSchedule: {
    fontSize: 14,
    color: '#666',
  },
  swipeHint: {
    padding: 5,
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#ff5252',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    zIndex: 0,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#062C63',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e76f51',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#e76f51',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  floatingButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
}); 