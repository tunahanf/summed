import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import CustomSplashScreen from '@/components/CustomSplashScreen';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appIsReady, setAppIsReady] = useState(false);
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Wait a bit to ensure fonts are loaded
      setTimeout(() => {
        setAppIsReady(true);
      }, 100);
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  if (!appIsReady) {
    return <CustomSplashScreen onReady={() => setAppIsReady(true)} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="medicine-tracker" />
        <Stack.Screen name="add-medicine" />
        <Stack.Screen name="edit-medicine" />
        <Stack.Screen name="manual-medicine-entry" />
        <Stack.Screen name="user-profile" />
        <Stack.Screen name="scan-medicine" />
        <Stack.Screen name="leaflet" />
        <Stack.Screen name="+not-found" options={{ headerShown: true, title: 'Not Found' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
