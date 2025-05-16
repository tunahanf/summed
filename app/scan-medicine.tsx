import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, SafeAreaView, StatusBar, Alert, Image } from 'react-native';
import { router, useNavigation } from 'expo-router';
import { MaterialIcons, FontAwesome5, Fontisto } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { UserProfileStore } from '../utils/userProfileStore';
import { CameraView, CameraCapturedPicture, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import the HealthIconsLoading component from Leaflet or recreate it here
// Health icons loading component
const HealthIconsLoading = () => {
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Define health-related icons that are available in the libraries
  type FA5IconName = React.ComponentProps<typeof FontAwesome5>['name'];
  type FontistoIconName = React.ComponentProps<typeof Fontisto>['name'];
  
  interface IconInfo {
    name: FA5IconName | FontistoIconName;
    type: 'FontAwesome5' | 'Fontisto';
  }
  
  const healthIcons: IconInfo[] = [
    { name: 'pills', type: 'FontAwesome5' },
    { name: 'heartbeat', type: 'FontAwesome5' },
    { name: 'hospital', type: 'FontAwesome5' },
    { name: 'medkit', type: 'FontAwesome5' },
    { name: 'stethoscope', type: 'FontAwesome5' }
  ];

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIconIndex((prevIndex) => (prevIndex + 1) % healthIcons.length);
    }, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const currentIcon = healthIcons[currentIconIndex];
  
  return (
    <View style={styles.iconContainer}>
      {currentIcon.type === 'FontAwesome5' ? (
        <FontAwesome5 name={currentIcon.name as FA5IconName} size={45} color="#e76f51" />
      ) : (
        <Fontisto name={currentIcon.name as FontistoIconName} size={45} color="#e76f51" />
      )}
    </View>
  );
};

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
  const [hasUserProfile, setHasUserProfile] = useState(false);
  const [scanResult, setScanResult] = useState<null | { medicineName: string, dosage: string }>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanningActive, setScanningActive] = useState(false);
  const cameraRef = useRef<any>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [takingPicture, setTakingPicture] = useState(false);
  const hasNavigated = useRef(false);
  const navigation = useNavigation();
  const waitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if user profile exists and handle navigation events
  useEffect(() => {
    const profile = UserProfileStore.getUserProfile();
    setHasUserProfile(!!profile);
    
    // Reset state when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('Screen focused, resetting states');
      setIsProcessing(false);
      setScanningActive(false);
      setCapturedImage(null);
      setScanResult(null);
      hasNavigated.current = false;
      
      // Clear any pending timeouts
      if (waitTimeoutRef.current) {
        clearTimeout(waitTimeoutRef.current);
        waitTimeoutRef.current = null;
      }
    });
    
    // Cleanup function to clear interval when component unmounts
    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      if (waitTimeoutRef.current) {
        clearTimeout(waitTimeoutRef.current);
        waitTimeoutRef.current = null;
      }
      unsubscribe();
    };
  }, [navigation]);

  const startScanningProcess = () => {
    if (scanningActive || hasNavigated.current) return;
    
    console.log('Starting scanning process...');
    setScanningActive(true);
    setScanResult(null);
    
    // Set a 2-second delay before taking the picture
    console.log('Waiting 2 seconds before capturing image...');
    waitTimeoutRef.current = setTimeout(() => {
      if (!hasNavigated.current) {
        captureAndProcessImage();
      }
    }, 2000);
  };

  const stopScanningProcess = () => {
    console.log('Stopping scanning process...');
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (waitTimeoutRef.current) {
      clearTimeout(waitTimeoutRef.current);
      waitTimeoutRef.current = null;
    }
    
    setScanningActive(false);
  };

  const captureAndProcessImage = async () => {
    console.log('Attempting to capture image...');
    console.log('Camera ready state:', cameraReady);
    console.log('Camera ref exists:', !!cameraRef.current);
    
    if (hasNavigated.current) {
      console.log('Already navigated, skipping capture');
      return;
    }
    
    if (!cameraRef.current) {
      console.error('Camera reference is not available');
      Alert.alert(
        'Camera Error', 
        'Could not access the camera. Do you want to use test data instead?',
        [
          {
            text: 'Use Test Data',
            onPress: () => {
              // Use mock data to navigate to leaflet
              console.log('Using test data instead');
              
              hasNavigated.current = true;
              // Navigate to leaflet with mock data
              router.push({
                pathname: '/leaflet',
                params: {
                  medicineName: 'Zoretanin',
                  dosage: '20mg'
                }
              });
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setIsProcessing(false);
              stopScanningProcess();
            }
          }
        ]
      );
      return;
    }
    
    if (isProcessing || takingPicture) {
      console.log('Already processing an image, skipping');
      return;
    }
    
    try {
      setTakingPicture(true);
      // Now set processing to true when we're actually taking the picture
      setIsProcessing(true);
      
      // Capture photo with shutter sound disabled
      console.log('Taking picture...');
      const photo: CameraCapturedPicture = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
        skipProcessing: false,
        shutterSound: false, // Disable shutter sound
      });
      
      console.log('Photo captured:', photo.uri);
      
      // Compress and resize the image to reduce size
      console.log('Manipulating image...');
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      console.log('Image manipulated:', manipulatedImage.uri);
      setCapturedImage(manipulatedImage.uri);
      setTakingPicture(false);
      
      // Keep scanning process active
      // stopScanningProcess(); // Comment out this line
      
      // Don't show fullscreen loading - instead keep the camera view with processing indicator
      // setShowFullscreenLoading(true); // Remove this line
      
      // Process with Gemini API
      console.log('Processing with Gemini API...');
      processMedicineImageWithGemini(manipulatedImage.uri).then(result => {
        console.log('Gemini API result:', result);
        if (result.success && !hasNavigated.current) {
          setScanResult(result);
          
          // Prevent multiple navigations
          hasNavigated.current = true;
          setIsProcessing(false); // Stop processing indicator
          
          // Navigate to leaflet with the extracted data
          console.log('Navigating to leaflet screen...');
          router.push({
            pathname: '/leaflet',
            params: {
              medicineName: result.medicineName,
              dosage: result.dosage
            }
          });
        } else if (!hasNavigated.current) {
          console.error('Medicine recognition failed');
          // Hide loading screen
          // setShowFullscreenLoading(false); // Remove this line
          setIsProcessing(false); // Stop processing indicator
          
          // Offer to use test data when medicine recognition fails
          Alert.alert(
            'Recognition Failed', 
            'Could not recognize the medicine. Would you like to use test data instead?',
            [
              {
                text: 'Use Test Data',
                onPress: () => {
                  // Navigate with test data
                  hasNavigated.current = true;
                  router.push({
                    pathname: '/leaflet',
                    params: {
                      medicineName: 'Zoretanin',
                      dosage: '20mg'
                    }
                  });
                }
              },
              {
                text: 'Try Again',
                onPress: () => {
                  setIsProcessing(false);
                  // Clear captured image to allow taking a new photo
                  setCapturedImage(null);
                  // Keep scanning active so user can try again
                  // setScanningActive(false); // Comment out this line
                }
              }
            ]
          );
        }
      }).catch(error => {
        if (hasNavigated.current) return;
        
        console.error('Error processing image with Gemini:', error);
        // Hide loading screen
        // setShowFullscreenLoading(false); // Remove this line
        setIsProcessing(false); // Stop processing indicator
        
        // Offer to use test data when API processing fails
        Alert.alert(
          'Processing Error', 
          'An error occurred when processing the image. Would you like to use test data instead?',
          [
            {
              text: 'Use Test Data',
              onPress: () => {
                // Navigate with test data
                hasNavigated.current = true;
                router.push({
                  pathname: '/leaflet',
                  params: {
                    medicineName: 'Zoretanin',
                    dosage: '20mg'
                  }
                });
              }
            },
            {
              text: 'Try Again',
              onPress: () => {
                setIsProcessing(false);
                // Clear captured image to allow taking a new photo
                setCapturedImage(null);
                // Keep scanning active so user can try again
                // setScanningActive(false); // Comment out this line
              }
            }
          ]
        );
      });
      
    } catch (error) {
      if (hasNavigated.current) return;
      
      console.error('Error capturing or processing image:', error);
      // Hide loading screen
      // setShowFullscreenLoading(false); // Remove this line
      setIsProcessing(false); // Stop processing indicator
      
      Alert.alert(
        'Camera Error', 
        'Could not capture image. Would you like to use test data instead?',
        [
          {
            text: 'Use Test Data',
            onPress: () => {
              // Navigate with test data
              hasNavigated.current = true;
              router.push({
                pathname: '/leaflet',
                params: {
                  medicineName: 'Zoretanin',
                  dosage: '20mg'
                }
              });
            }
          },
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => {
              setIsProcessing(false);
              setTakingPicture(false);
              stopScanningProcess();
            }
          }
        ]
      );
    }
  };

  const processMedicineImageWithGemini = async (imageUri: string) => {
    try {
      // Convert image to base64
      const base64Image = await convertImageToBase64(imageUri);
      
      // Get API key from .env
      const API_KEY = process.env.API_KEY;
      const API_URL = process.env.API_URL;
      
      console.log('API_KEY exists:', !!API_KEY);
      console.log('API_URL exists:', !!API_URL);
      
      if (!API_KEY || !API_URL) {
        console.error('Missing API configuration. API_KEY or API_URL is missing.');
        throw new Error('Missing API configuration');
      }
      
      // Prepare request for Gemini API
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: "Analyze this image of a medicine box. Extract and return ONLY the medicine name and dosage in JSON format like this: {\"medicineName\": \"Drug Name\", \"dosage\": \"Dosage Information\"}. Do not include any other text in your response."
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }
        ]
      };
      
      console.log('Sending request to Gemini API...');
      
      // Call Gemini API
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': API_KEY
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error details:', errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('API response received with data');
      
      // Parse the response to extract medicine name and dosage
      const textResponse = data.candidates[0]?.content?.parts[0]?.text;
      
      if (!textResponse) {
        console.error('API response is missing expected text content:', data);
        throw new Error('Invalid API response');
      }
      
      console.log('Text response from API:', textResponse);
      
      // Extract JSON from the response
      let jsonMatch;
      try {
        // Try to parse the entire response as JSON
        const result = JSON.parse(textResponse);
        console.log('Successfully parsed JSON response');
        return {
          medicineName: result.medicineName || 'Unknown',
          dosage: result.dosage || 'Unknown',
          success: true
        };
      } catch (e) {
        console.log('Failed to parse entire response as JSON, trying to extract JSON from text');
        // If that fails, try to find JSON in the text
        jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          try {
            const result = JSON.parse(jsonStr);
            console.log('Successfully extracted and parsed JSON from text');
            return {
              medicineName: result.medicineName || 'Unknown',
              dosage: result.dosage || 'Unknown',
              success: true
            };
          } catch (jsonError) {
            console.error('Error parsing extracted JSON:', jsonError);
          }
        }
      }
      
      console.log('Falling back to regex extraction');
      // If we couldn't parse JSON, extract using regex as fallback
      const medicineNameMatch = textResponse.match(/medicineName["']?\s*:\s*["']([^"']+)["']/i);
      const dosageMatch = textResponse.match(/dosage["']?\s*:\s*["']([^"']+)["']/i);
      
      if (medicineNameMatch || dosageMatch) {
        console.log('Extracted with regex: Medicine:', medicineNameMatch?.[1], 'Dosage:', dosageMatch?.[1]);
      } else {
        console.log('No matches found with regex');
      }
      
      return {
        medicineName: medicineNameMatch ? medicineNameMatch[1] : 'Unknown',
        dosage: dosageMatch ? dosageMatch[1] : 'Unknown',
        success: true
      };
      
    } catch (error) {
      console.error('Error in Gemini API processing:', error);
      return { medicineName: '', dosage: '', success: false };
    }
  };

  const convertImageToBase64 = async (uri: string): Promise<string> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result as string;
          // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
          const base64 = base64String.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw error;
    }
  };

  const handleStartScan = async () => {
    // Check if already navigated
    if (hasNavigated.current) {
      console.log('Already navigated, ignoring scan start');
      return;
    }
    
    // Check if user profile exists, if not, prompt to create one
    if (!hasUserProfile) {
      Alert.alert(
        'Profile Information',
        'To get personalized medicine information, you need to set up your profile first.',
        [
          {
            text: 'Go to Profile',
            onPress: () => {
              router.push('/user-profile');
            },
          }
        ]
      );
      return;
    }
    
    // Check camera permission
    if (!cameraPermission?.granted) {
      console.log('Requesting camera permission...');
      const permission = await requestCameraPermission();
      if (!permission.granted) {
        Alert.alert(
          'Camera Access Required',
          permission.canAskAgain 
            ? 'Please grant camera access to scan medicine boxes.'
            : 'Camera permission is required but has been denied. Please enable it in your device settings.',
          permission.canAskAgain ? [
            {
              text: 'Grant Permission',
              onPress: requestCameraPermission
            },
            { text: 'Cancel', style: 'cancel' }
          ] : [
            { text: 'OK' }
          ]
        );
        return;
      }
    }
    
    console.log('Camera permission granted, starting scan...');
    startScanningProcess();
  };

  const handleStopScan = () => {
    stopScanningProcess();
    setIsProcessing(false);
    setTakingPicture(false);
    // setShowFullscreenLoading(false); // Remove this line
  };

  const handleCameraReady = () => {
    console.log('Camera is now ready');
    setCameraReady(true);
  };

  // Render fullscreen loading overlay when needed
  /*
  if (showFullscreenLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <HealthIconsLoading />
        <Text style={styles.loadingText}>Processing medicine information...</Text>
      </SafeAreaView>
    );
  }
  */

  if (cameraPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#e76f51" />
          <Text style={styles.processingText}>Checking camera permission...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Render UI based on permission status
  const renderCameraContent = () => {
    if (scanningActive) {
      if (!cameraPermission?.granted) {
        return (
          <View style={styles.cameraPlaceholder}>
            <ActivityIndicator size="large" color="#e76f51" />
            <Text style={styles.cameraInstructionText}>
              Camera permission required
            </Text>
          </View>
        );
      }
      
      return (
        <View style={styles.camera}>
          {/* Show camera when not processing, or capturedImage when processing */}
          {!capturedImage ? (
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject}
              facing="back"
              onCameraReady={handleCameraReady}
            />
          ) : (
            <Image 
              source={{ uri: capturedImage }} 
              style={StyleSheet.absoluteFillObject} 
              resizeMode="cover"
            />
          )}
          
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.processingOverlayText}>Processing medicine information...</Text>
            </View>
          )}
        </View>
      );
    } else {
      return (
        <View style={styles.cameraPlaceholder}>
          <TouchableOpacity 
            style={styles.captureButton}
            onPress={handleStartScan}
          >
            <MaterialIcons name="camera" size={32} color="white" />
          </TouchableOpacity>
          <Text style={styles.cameraInstructionText}>
            Tap to start scanning
          </Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.content}>
        <Text style={styles.title}>Scan your</Text>
        <Text style={styles.subtitle}>medicine box</Text>

        <View style={styles.cameraContainer}>
          {renderCameraContent()}
        </View>
        
        {scanningActive && (
          <TouchableOpacity 
            style={styles.stopScanButton}
            onPress={handleStopScan}
          >
            <MaterialIcons name="stop" size={20} color="white" />
            <Text style={styles.stopScanButtonText}>Stop Scanning</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.manualEntryButton}
          onPress={() => router.push('/manual-medicine-entry')}
        >
          <MaterialIcons name="edit" size={20} color="white" />
          <Text style={styles.manualEntryButtonText}>Manual Medicine Entry</Text>
        </TouchableOpacity>
        
        {!hasUserProfile && (
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/user-profile')}
          >
            <MaterialIcons name="person" size={20} color="white" />
            <Text style={styles.profileButtonText}>Set Up Your Profile</Text>
          </TouchableOpacity>
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
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e76f51',
    marginBottom: 25,
  },
  camera: {
    flex: 1,
    position: 'relative',
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
    marginBottom: 15,
  },
  processingContainer: {
    alignItems: 'center',
  },
  processingText: {
    marginTop: 10,
    color: '#2c3e50',
    fontSize: 16,
    textAlign: 'center',
  },
  cameraInstructionText: {
    color: '#2c3e50',
    fontSize: 16,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingOverlayText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 10,
  },
  manualEntryButton: {
    backgroundColor: '#0e194d',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualEntryButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  profileButton: {
    backgroundColor: '#0e194d',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 25,
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
  stopScanButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopScanButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#2c3e50',
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 