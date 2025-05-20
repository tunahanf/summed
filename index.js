import { registerRootComponent } from 'expo';
import { ExpoRoot } from 'expo-router';
import { Platform, StatusBar } from 'react-native';
import { configureSplashScreen } from './utils/splashScreen';

// Configure splash screen for fullscreen display
configureSplashScreen();

// Hide status bar on Android for splash screen
if (Platform.OS === 'android') {
  StatusBar.setHidden(true);
}

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./app');
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App); 