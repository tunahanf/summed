import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, Alert } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { UserProfileStore } from '../utils/userProfileStore';
import LinearGradient from 'react-native-linear-gradient';

// Mock function to simulate OCR processing
const processMedicineImageWithOCR = async (imageUri: string) => {
  console.log('Processing image:', imageUri);
  
  // For demo purposes, we'll return mock data after a short delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        medicineName: 'Zoretanin',
        dosage: '20mg',
        success: true
      });
    }, 1500); // simulate network delay
  });
};

export default function ScanMedicineScreen() {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCapture = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate taking a photo and processing with OCR
      const mockImageUri = 'mock-image-uri';
      const result = await processMedicineImageWithOCR(mockImageUri) as {
        medicineName: string;
        dosage: string;
        success: boolean;
      };
      
      if (result.success) {
        // Navigate to leaflet with the extracted data
        router.push({
          pathname: '/leaflet',
          params: {
            medicineName: result.medicineName,
            dosage: result.dosage
          }
        });
      } else {
        // Handle OCR failure
        Alert.alert('Could not recognize the medicine. Please try again.');
      }
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.content}>
        <Text style={styles.title}>Scan your</Text>
        <Text style={styles.subtitle}>medicine box</Text>

        <View style={styles.cameraContainer}>
          <LinearGradient
            colors={['#e76f51', '#ffc7bd', '#e76f51']}
            start={{x: 0.0, y: 0.25}} 
            end={{x: 0.5, y: 1.0}}
            style={styles.gradientBorderContainer}
          >
            <View style={styles.cameraInner}>
              {/* Placeholder for camera - to be integrated with Python OCR model */}
              <View style={styles.cameraPlaceholder}>
                {isProcessing ? (
                  <View style={styles.processingContainer}>
                    <ActivityIndicator size="large" color="#e76f51" />
                    <Text style={styles.processingText}>Processing...</Text>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={styles.captureButton}
                    onPress={handleCapture}
                  >
                    <MaterialIcons name="camera" size={32} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </LinearGradient>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e76f51',
    marginBottom: 20,
  },
  cameraContainer: {
    flex: 1,
    marginBottom: 25,
  },
  gradientBorderContainer: {
    flex: 1,
    borderRadius: 15,
    padding: 3, // Border kalınlığı
  },
  cameraInner: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e76f51',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    alignItems: 'center',
  },
  processingText: {
    marginTop: 10,
    color: '#2c3e50',
    fontSize: 16,
  },
}); 