import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, TextInput, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { UserProfileStore } from '../utils/userProfileStore';
import { MaterialIcons } from '@expo/vector-icons';
import { UserProfile } from '../models/integrations';
import { LanguageStore } from '../utils/languageStore';
import { translations } from '../utils/translations';

export default function UserProfileScreen() {
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [language, setLanguage] = useState<'en' | 'tr'>(LanguageStore.getLanguage());

  // Check if user profile already exists
  useEffect(() => {
    const existingProfile = UserProfileStore.getUserProfile();
    if (existingProfile) {
      setAge(String(existingProfile.age));
      setHeight(String(existingProfile.height));
      setWeight(String(existingProfile.weight));
      setHasExistingProfile(true);
    }
    
    // Update language when it changes in the store
    const intervalId = setInterval(() => {
      const currentLang = LanguageStore.getLanguage();
      if (currentLang !== language) {
        setLanguage(currentLang);
      }
    }, 300);
    
    return () => clearInterval(intervalId);
  }, []);

  const t = translations[language];

  const saveUserProfile = async () => {
    if (!age || !height || !weight) {
      Alert.alert(t.missingInfo, t.fillAllFields);
      return;
    }

    // Validate inputs are numbers
    if (isNaN(Number(age)) || isNaN(Number(height)) || isNaN(Number(weight))) {
      Alert.alert(t.invalidInput, t.numberValidation);
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
      Alert.alert(t.error, t.failedToSave);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>{t.yourProfileTitle}</Text>
          <Text style={styles.subtitle}>{t.yourProfileSubtitle}</Text>
          <Text style={styles.subInfo}>{hasExistingProfile ? "" : t.pleaseEnterInfo}</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t.age}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.enterYourAge}
              placeholderTextColor="#757575"
              keyboardType="number-pad"
              value={age}
              onChangeText={setAge}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t.height}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.enterYourHeight}
              placeholderTextColor="#757575"
              keyboardType="number-pad"
              value={height}
              onChangeText={setHeight}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t.weight}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.enterYourWeight}
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
              {hasExistingProfile ? t.update : t.save}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.infoText}>
            {t.profileInfoText}
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e76f51',
    marginBottom: 0,
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
  subInfo: {
    fontSize: 20,
    color: '#758399',
    marginBottom: 15,
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
  }
}); 