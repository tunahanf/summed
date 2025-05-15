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
  PanResponder
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Medicine } from '../models/medicine';
import { MedicineStore } from '../utils/medicineStore';
import { router } from 'expo-router';
import { NotificationManager } from '../utils/notificationManager';

// Separate component for medicine item to properly use hooks
const MedicineItem = ({ 
  item, 
  onEdit, 
  onDelete 
}: { 
  item: Medicine; 
  onEdit: (medicine: Medicine) => void; 
  onDelete: (id: string) => void; 
}) => {
  const swipeAnim = useRef(new Animated.Value(0)).current;
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dx < 0) { // Only allow swiping left
          swipeAnim.setValue(Math.max(gestureState.dx, -100));
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx < -50) { // Threshold to show delete button
          Animated.spring(swipeAnim, {
            toValue: -100,
            useNativeDriver: false,
          }).start();
        } else {
          Animated.spring(swipeAnim, {
            toValue: 0,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  // Format the schedule for display
  const formattedSchedule = () => {
    const { days, times } = item.schedule;
    
    if (days.length === 1) {
      if (days[0] === 'Every Day') {
        return `Every Day, ${times.join(' and ')}`;
      }
      return `Every ${days[0]}, ${times.join(' and ')}`;
    }
    
    // Handle specific days
    return `Every ${days.join(', ')}, ${times.join(' and ')}`;
  };

  return (
    <Animated.View 
      style={[
        styles.medicineItemContainer,
        { transform: [{ translateX: swipeAnim }] }
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity 
        style={styles.medicineItem}
        onPress={() => onEdit(item)}
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
      </TouchableOpacity>
      
      <Animated.View style={[
        styles.deleteContainer,
        { width: Animated.subtract(0, swipeAnim) }
      ]}>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => onDelete(item.id)}
        >
          <MaterialIcons name="delete" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

export default function MedicineTrackerScreen() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMedicineModalVisible, setAddMedicineModalVisible] = useState(false);

  useEffect(() => {
    loadMedicines();
    setupNotifications();
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
    Alert.alert(
      'Delete Medicine',
      'Are you sure you want to delete this medicine?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await MedicineStore.deleteMedicine(medicineId);
            await NotificationManager.cancelMedicineReminders(medicineId);
            loadMedicines();
          },
        },
      ]
    );
  };

  // Render item now just passes the item to the MedicineItem component
  const renderMedicineItem = ({ item }: { item: Medicine }) => {
    return (
      <MedicineItem 
        item={item} 
        onEdit={handleEditMedicine} 
        onDelete={handleDeleteMedicine} 
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.content}>
        <Text style={styles.title}>Track your</Text>
        <Text style={styles.subtitle}>medicines</Text>

        {medicines.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              There is no medicine that can be tracked.
            </Text>
            <Text style={styles.emptySubtext}>Add to track</Text>
          </View>
        ) : (
          <FlatList
            data={medicines}
            renderItem={renderMedicineItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.medicineList}
          />
        )}

        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddMedicine}
        >
          <MaterialIcons name="add" size={24} color="#062C63" />
          <Text style={styles.addButtonText}>Add Medicine</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.saveButton}
          onPress={() => router.push('/')}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
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
    padding: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#062C63',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e76f51',
    marginBottom: 20,
  },
  medicineList: {
    flexGrow: 1,
  },
  medicineItemContainer: {
    flexDirection: 'row',
    marginBottom: 10,
    borderRadius: 15,
    overflow: 'hidden',
  },
  medicineItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  medicineIcon: {
    marginRight: 15,
  },
  medicineDetails: {
    flex: 1,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#062C63',
    marginBottom: 5,
  },
  medicineSchedule: {
    fontSize: 14,
    color: '#505050',
  },
  deleteContainer: {
    position: 'absolute',
    right: 0,
    height: '100%',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: '100%',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 25,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#062C63',
  },
  addButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '600',
    color: '#062C63',
  },
  saveButton: {
    backgroundColor: '#e76f51',
    borderRadius: 25,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#505050',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#505050',
    textAlign: 'center',
  },
}); 