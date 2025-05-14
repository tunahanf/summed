import { StyleSheet, TouchableOpacity, View, Text, SafeAreaView } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useState, useCallback } from 'react';
import { MedicineStore } from '../../utils/medicineStore';
import { Medicine } from '../../models/medicine';

export default function MedicineTab() {
  const [medicineCount, setMedicineCount] = useState(0);

  useEffect(() => {
    loadMedicineCount();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMedicineCount();
      return () => {};
    }, [])
  );

  const loadMedicineCount = async () => {
    const medicines = await MedicineStore.getMedicines();
    setMedicineCount(medicines.length);
  };

  const navigateToMedicineTracker = () => {
    router.push({
      pathname: '/medicine-tracker'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Medicines</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.medicineTrackerCard}
          onPress={navigateToMedicineTracker}
        >
          <MaterialIcons name="medication" size={32} color="#062C63" />
          <View style={styles.medicineTrackerInfo}>
            <Text style={styles.medicineTrackerTitle}>Medicine Tracker</Text>
            <Text style={styles.medicineTrackerSubtitle}>
              {medicineCount === 0
                ? "You don't have any tracked medicines"
                : `You have ${medicineCount} medicine${medicineCount !== 1 ? 's' : ''} tracked`}
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#062C63" />
        </TouchableOpacity>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About Medicine Tracking</Text>
          <Text style={styles.infoText}>
            Track your medicine schedule and get reminders 10 minutes before and at the scheduled time to never miss a dose.
          </Text>
          
          <Text style={styles.featureTitle}>Features:</Text>
          <View style={styles.featureItem}>
            <MaterialIcons name="check-circle" size={18} color="#e76f51" />
            <Text style={styles.featureText}>Add, edit, and remove medicines</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="check-circle" size={18} color="#e76f51" />
            <Text style={styles.featureText}>Schedule by day and time</Text>
          </View>
          <View style={styles.featureItem}>
            <MaterialIcons name="check-circle" size={18} color="#e76f51" />
            <Text style={styles.featureText}>Get timely reminders</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 25,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#062C63',
  },
  content: {
    flex: 1,
    padding: 25,
  },
  medicineTrackerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  medicineTrackerInfo: {
    flex: 1,
    marginHorizontal: 15,
  },
  medicineTrackerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#062C63',
    marginBottom: 5,
  },
  medicineTrackerSubtitle: {
    fontSize: 14,
    color: '#505050',
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#062C63',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#505050',
    lineHeight: 20,
    marginBottom: 20,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#062C63',
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#505050',
    marginLeft: 10,
  },
}); 