import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

// Configure splash screen to be fullscreen
export const configureSplashScreen = async () => {
  try {
    // Configure the splash screen to be fullscreen
    await SplashScreen.preventAutoHideAsync();
    
    if (Platform.OS === 'android') {
      // On Android, we need to make sure the splash screen is truly fullscreen
      SplashScreen.setKeepVisibleForTesting(true);
    }
  } catch (e) {
    console.warn('Error configuring splash screen:', e);
  }
};

// Hide the splash screen
export const hideSplashScreen = async () => {
  try {
    await SplashScreen.hideAsync();
  } catch (e) {
    console.warn('Error hiding splash screen:', e);
  }
}; 