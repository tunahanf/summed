import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { FontAwesome5, FontAwesome } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { UserProfileStore } from '../utils/userProfileStore';
import { LanguageStore } from '../utils/languageStore';
import { translations } from '../utils/translations';

export default function WelcomeScreen() {
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'tr'>(LanguageStore.getLanguage());

  const handleButtonPress = (buttonId: string) => {
    setActiveButton(buttonId);
    
    setTimeout(() => {
      if (buttonId === 'leaflet') {
        if (UserProfileStore.hasUserProfile()) {
          router.push('/scan-medicine');
        } else {
          router.push('/user-profile');
        }
      } else if (buttonId === 'profile') {
        router.push({
          pathname: '/user-profile'
        });
      } else if (buttonId === 'medicines') {
        router.push({
          pathname: '/medicine-tracker'
        });
      } else if (buttonId === 'manual-entry') {
        if (UserProfileStore.hasUserProfile()) {
          router.push('/manual-medicine-entry');
        } else {
          router.push('/user-profile');
        }
      }
    }, 150); // Kısa bir gecikme ekleyerek butonun aktif halinin görülebilmesini sağlıyoruz
  };

  const toggleLanguage = () => {
    const newLanguage = LanguageStore.toggleLanguage();
    setLanguage(newLanguage);
  };

  const t = translations[language];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.languageButton}
          onPress={toggleLanguage}
        >
          <Text style={styles.languageButtonText}>
            {language === 'en' ? 'TR' : 'EN'}
          </Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>{t.welcome}</Text>
        <Text style={styles.brandName}>SumMed</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[
              styles.button,
              activeButton === 'leaflet' ? styles.activeLeafletButton : styles.leafletButton
            ]}
            onPress={() => handleButtonPress('leaflet')}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <FontAwesome5 
                name="book-medical" 
                size={24} 
                color={activeButton === 'leaflet' ? "white" : "#0e194d"}
              />
            </View>
            <Text style={[
              styles.buttonText,
              activeButton === 'leaflet' && styles.activeButtonText,
              {fontWeight: activeButton === 'leaflet' ? 'bold' : 'normal'}
            ]}>{language === 'en' ? 'Get summarized leaflet' : t.getSummarizedLeaflet}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.button,
              activeButton === 'manual-entry' ? styles.activeManualEntryButton : styles.manualEntryButton
            ]}
            onPress={() => handleButtonPress('manual-entry')}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <FontAwesome5 
                name="edit" 
                size={24} 
                color={activeButton === 'manual-entry' ? "white" : "#0e194d"}
              />
            </View>
            <Text style={[
              styles.buttonText,
              activeButton === 'manual-entry' && styles.activeButtonText,
              {fontWeight: activeButton === 'manual-entry' ? 'bold' : 'normal'}
            ]}>{language === 'en' ? 'Manual medicine entry' : t.manualMedicineEntry}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.button,
              activeButton === 'medicines' ? styles.activeMedicinesButton : styles.medicinesButton
            ]}
            onPress={() => handleButtonPress('medicines')}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <FontAwesome5 
                name="pills" 
                size={24} 
                color={activeButton === 'medicines' ? "white" : "#0e194d"}
              />
            </View>
            <Text style={[
              styles.buttonText,
              activeButton === 'medicines' && styles.activeButtonText,
              {fontWeight: activeButton === 'medicines' ? 'bold' : 'normal'}
            ]}>{language === 'en' ? 'Track your medicines' : t.trackYourMedicines}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.button,
              activeButton === 'profile' ? styles.activeProfileButton : styles.profileButton
            ]}
            onPress={() => handleButtonPress('profile')}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <FontAwesome 
                name="user" 
                size={24} 
                color={activeButton === 'profile' ? "white" : "#0e194d"} 
              />
            </View>
            <Text style={[
              styles.buttonText,
              activeButton === 'profile' && styles.activeButtonText,
              {fontWeight: activeButton === 'profile' ? 'bold' : 'normal'}
            ]}>{language === 'en' ? 'Your profile' : t.yourProfile}</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0e194d',
    marginBottom: 5,
  },
  brandName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e76f51',
    marginBottom: 50,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 50,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderRadius: 25,
    padding: 16,
    marginVertical: 8,
  },
  iconContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 15,
  },
  // Leaflet button styles
  leafletButton: {
    borderColor: '#0e194d',
  },
  activeLeafletButton: {
    backgroundColor: '#e76f51',
    borderColor: '#e76f51',
  },
  // Manual Entry button styles
  manualEntryButton: {
    borderColor: '#0e194d',
  },
  activeManualEntryButton: {
    backgroundColor: '#e76f51',
    borderColor: '#e76f51',
  },
  // Medicines button styles
  medicinesButton: {
    borderColor: '#0e194d',
  },
  activeMedicinesButton: {
    backgroundColor: '#e76f51',
    borderColor: '#e76f51',
  },
  // Profile button styles
  profileButton: {
    borderColor: '#0e194d',
  },
  activeProfileButton: {
    backgroundColor: '#e76f51',
    borderColor: '#e76f51',
  },
  buttonText: {
    fontSize: 16,
    color: '#424242',
  },
  activeButtonText: {
    color: 'white',
  },
  nextButton: {
    backgroundColor: '#e76f51',
    paddingVertical: 15,
    paddingHorizontal: 50,
    width: '100%',
    borderRadius: 25,
    marginTop: 20,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  languageButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#0e194d',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 10,
  },
  languageButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
}); 