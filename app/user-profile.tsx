import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, TextInput, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { UserProfileStore } from '../utils/userProfileStore';
import { MaterialIcons } from '@expo/vector-icons';
import { UserProfile } from '../models/integrations';

export default function UserProfileScreen() {
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  // Check if user profile already exists
  useEffect(() => {
    const existingProfile = UserProfileStore.getUserProfile();
    if (existingProfile) {
      setAge(String(existingProfile.age));
      setHeight(String(existingProfile.height));
      setWeight(String(existingProfile.weight));
      setHasExistingProfile(true);
    }
  }, []);

  const saveUserProfile = async () => {
    if (!age || !height || !weight) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    // Validate inputs are numbers
    if (isNaN(Number(age)) || isNaN(Number(height)) || isNaN(Number(weight))) {
      Alert.alert('Invalid Input', 'Age, height, and weight must be numbers');
      return;
    }

    setIsSubmitting(true);

    try {
      const userProfile = {
        age: Number(age),
        height: Number(height),
        weight: Number(weight),
        lastUpdated: new Date().toISOString(),
      };

      UserProfileStore.saveUserProfile(userProfile);
      
      // Navigate to scan medicine screen
      router.push('/');
    } catch (error) {
      console.error('Error saving user profile:', error);
      Alert.alert('Error', 'Failed to save your information. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const skipProfile = () => {
    router.push('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Your profile</Text>
          <Text style={styles.subtitle}>
            {hasExistingProfile ? 'Review and update your information' : 'Please enter your information'}
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Age</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your age"
              placeholderTextColor="#757575"
              keyboardType="number-pad"
              value={age}
              onChangeText={setAge}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your height in cm"
              placeholderTextColor="#757575"
              keyboardType="number-pad"
              value={height}
              onChangeText={setHeight}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your weight in kg"
              placeholderTextColor="#757575"
              keyboardType="number-pad"
              value={weight}
              onChangeText={setWeight}
            />
          </View>
          
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveUserProfile}
            disabled={isSubmitting}
          >
            <Text style={styles.saveButtonText}>
              {hasExistingProfile ? 'Update' : 'Save'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.infoText}>
            Your age, height, and weight help us provide personalized medicine information. This data is used to tailor dosage recommendations and other important details specific to your profile.
          </Text>
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
  scrollContent: {
    flexGrow: 1,
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
    fontSize: 20,
    color: '#e76f51',
    marginBottom: 15,
  },
  infoContainer: {
    backgroundColor: '#f2f7ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 25,
    flexDirection: 'row',
    borderLeftWidth: 3,
    borderLeftColor: '#0e194d',
  },
  infoText: {
    fontSize: 13,
    color: '#758399',
    textAlign: 'center',
    marginTop: 30,
    fontStyle: 'italic',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#2c3e50',
  },
  saveButton: {
    backgroundColor: '#e76f51',
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 30,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 15,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#2c3e50',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
}); 