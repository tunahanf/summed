import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, StatusBar, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { UserProfileStore } from '../utils/userProfileStore';
import { UserProfile } from '../models/integrations';

export default function ManualMedicineEntryScreen() {
  const [medicineName, setMedicineName] = useState('');
  const [dosage, setDosage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasUserProfile, setHasUserProfile] = useState(false);

  // Check if user profile exists
  useEffect(() => {
    const profile = UserProfileStore.getUserProfile();
    setHasUserProfile(!!profile);
  }, []);

  const handleSubmit = async () => {
    // Validate inputs
    if (!medicineName.trim()) {
      Alert.alert('Error', 'Please enter the medicine name');
      return;
    }

    if (!dosage.trim()) {
      Alert.alert('Error', 'Please enter the dosage information');
      return;
    }

    // Check if user profile exists, if not, prompt to create one
    if (!hasUserProfile) {
      Alert.alert(
        'Profile Information',
        'To get personalized medicine information, you need to set up your profile first.',
        [
          {
            text: 'Setup Profile',
            onPress: () => {
              router.push('/user-profile');
            },
          }
        ]
      );
      return;
    }
    
    proceedWithSubmission();
  };
  
  const proceedWithSubmission = async () => {
    setIsSubmitting(true);
    
    try {
      // Navigate to leaflet with the entered data
      router.push({
        pathname: '/leaflet',
        params: {
          medicineName: medicineName.trim(),
          dosage: dosage.trim()
        }
      });
    } catch (error) {
      console.error('Error submitting data:', error);
      Alert.alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#0e194d" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manual medicine entry</Text>
      </View>
      
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Enter medicine details</Text>
        <Text style={styles.subtitle}>Please provide the medicine information</Text>

        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Medicine name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Parol"
            value={medicineName}
            onChangeText={setMedicineName}
            autoCapitalize="words"
          />

          <Text style={styles.inputLabel}>Dosage(mg)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 500"
            value={dosage}
            onChangeText={setDosage}
            keyboardType="number-pad"
          />

          <TouchableOpacity 
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.submitButtonText}>Get summarized leaflet</Text>
            )}
          </TouchableOpacity>
          
          {!hasUserProfile && (
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => router.push('/user-profile')}
            >
              <MaterialIcons name="person" size={20} color="white" />
              <Text style={styles.profileButtonText}>Set up your profile</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0e194d',
    marginLeft: 15,
  },
  content: {
    flex: 1,
    padding: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0e194d',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  formContainer: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0e194d',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  submitButton: {
    backgroundColor: '#e76f51',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 10,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileButton: {
    backgroundColor: '#0e194d',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: 'bold',
  },
}); 