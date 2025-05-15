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
  const translateX = useRef(new Animated.Value(0)).current;
  const actionWidth = 100;
  const [showingActions, setShowingActions] = useState(false);
  
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal movements
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy * 2);
      },
      onPanResponderGrant: () => {
        // Start gesture
      },
      onPanResponderMove: (_, gestureState) => {
        // Allow only left swipe (negative delta)
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -actionWidth));
        } else {
          translateX.setValue(0);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -actionWidth / 3) {
          // Swipe past threshold - open action
          setShowingActions(true);
          Vibration.vibrate(10);
          Animated.spring(translateX, {
            toValue: -actionWidth,
            useNativeDriver: true,
            friction: 5,
            tension: 40
          }).start();
        } else {
          // Reset position
          setShowingActions(false);
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            friction: 5,
            tension: 40
          }).start();
        }
      }
    })
  ).current;

  // Reset function to close the actions
  const resetPosition = () => {
    setShowingActions(false);
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      friction: 5,
      tension: 40
    }).start();
  };

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

  // Handle delete action
  const handleDelete = () => {
    Vibration.vibrate(20);
    Animated.timing(translateX, {
      toValue: -Dimensions.get('window').width,
      duration: 250,
      useNativeDriver: true
    }).start(() => {
      onDelete(item.id);
    });
  };

  // Handle edit with reset
  const handleEdit = () => {
    resetPosition();
    onEdit(item);
  };

  return (
    <View style={styles.itemContainer}>
      {/* Delete action */}
      <View style={[styles.deleteAction, { width: actionWidth }]}>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <MaterialIcons name="delete" size={28} color="white" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
      
      {/* Main card that can be swiped */}
      <Animated.View 
        style={[
          styles.medicineItemContainer,
          { transform: [{ translateX }] }
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity 
          style={styles.medicineItem}
          onPress={handleEdit}
          activeOpacity={0.7}
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
          {!showingActions && (
            <View style={styles.swipeHintContainer}>
              <MaterialIcons name="chevron-left" size={24} color="#aaaaaa" />
              <Text style={styles.swipeHintText}>Swipe</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default function MedicineTrackerScreen() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [addMedicineModalVisible, setAddMedicineModalVisible] = useState(false);

  useEffect(() => {
    loadMedicines();
    setupNotifications();
    
    // Show help dialog on first load
    Alert.alert(
      "Tip",
      "Swipe medicine items left to delete them",
      [{ text: "Got it!" }]
    );
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
  itemContainer: {
    position: 'relative',
    marginBottom: 10,
    height: 80, // Fixed height for the item
  },
  deleteAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#e76f51',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 15,
  },
  deleteButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  deleteIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  deleteText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  medicineItemContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    zIndex: 1,
  },
  medicineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    height: 80, // Match container height
    overflow: 'hidden', // Ensure content stays within the borders
  },
  medicineIcon: {
    marginRight: 15,
    width: 30,
  },
  medicineDetails: {
    flex: 1,
    paddingRight: 10,
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
  swipeHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    opacity: 0.7,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  swipeHintText: {
    fontSize: 12,
    color: '#888888',
    marginLeft: 2,
    fontWeight: '500',
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