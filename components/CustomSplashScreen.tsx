import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Dimensions, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { hideSplashScreen } from '@/utils/splashScreen';

const { width, height } = Dimensions.get('window');

interface CustomSplashScreenProps {
  onReady: () => void;
}

export default function CustomSplashScreen({ onReady }: CustomSplashScreenProps) {
  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make API calls, etc.
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        hideSplashScreen().then(() => onReady());
      }
    }

    prepare();
  }, [onReady]);

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Image
        source={require('../assets/images/splash-screen.png')}
        style={styles.image}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    ...Platform.select({
      android: {
        elevation: 999,
      },
    }),
  },
  image: {
    width,
    height,
    flex: 1,
  },
}); 