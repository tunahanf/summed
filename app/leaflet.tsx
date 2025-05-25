import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons, FontAwesome5, Fontisto } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';

// Simple in-memory storage
import { UserProfileStore } from '../utils/userProfileStore';
import { UserProfile, LeafletData, getSummarizedLeaflet } from '../models/integrations';
import { LanguageStore } from '../utils/languageStore';
import { translations } from '../utils/translations';

// Function to format text with bold labels
const formatHowToUseText = (text: string, t: any) => {
  // List of prefixes that should be bold with their translations
  const boldPrefixMap: Record<string, string> = {
    'Initial dose:': t.initialDose,
    'Administration:': t.administration,
    'Dosage adjustment:': t.dosageAdjustment,
    'Treatment duration:': t.treatmentDuration,
    'Possible side effects:': t.possibleSideEffects
  };

  // Check if the text starts with any of the bold prefixes
  for (const [englishPrefix, translatedPrefix] of Object.entries(boldPrefixMap)) {
    if (text.startsWith(englishPrefix)) {
      const prefixEnd = englishPrefix.length;
      const restOfText = text.substring(prefixEnd);
      
      return (
        <Text>
          <Text style={styles.boldLabel}>{translatedPrefix}</Text>
          <Text>{restOfText}</Text>
        </Text>
      );
    }
  }

  // If no prefix matches, return the text as is
  return <Text>{text}</Text>;
};

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

export default function LeafletScreen() {
  const params = useLocalSearchParams();
  const medicineName = params.medicineName as string || 'Zoretanin';
  const dosage = params.dosage as string || '20 mg';
  
  const [leafletData, setLeafletData] = useState<LeafletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [language, setLanguage] = useState<'en' | 'tr'>(LanguageStore.getLanguage());
  
  const t = translations[language];

  // Function to format the dosage display
  const formatDosage = (dosageString: string) => {
    // Check if dosage already contains 'mg', 'ml', 'g', or other unit
    const hasUnit = /mg|ml|milligram|miligram|milliliter|mililitre|g\b|gram/i.test(dosageString);
    
    // Return as is if it has a unit, otherwise append 'mg' as default
    return hasUnit ? dosageString : `${dosageString} mg`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user profile
        const profile = UserProfileStore.getUserProfile();
        setUserProfile(profile);
        
        // Get the summarized leaflet data from the NLP model
        const data = await getSummarizedLeaflet(medicineName, dosage, profile);
        setLeafletData(data);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Use fallback data if there's an error
        setLeafletData({
          name: medicineName,
          dosage: dosage,
          intendedUse: 'Used for treating severe, treatment-resistant acne.',
          howToUse: [
            'Usage should follow the doctor\'s instructions.',
            'Initial dose: 40 mg/day (0.5 mg/kg/day) for adults.',
            'Administration: Take capsules with food, once or twice daily. Swallow whole with a drink or meal.',
            'Dosage adjustment: May be modified based on response. Typically ranges between 40-80 mg/day (0.5-1.0 mg/kg/day).',
            'Treatment duration: Usually lasts 16-24 weeks.',
            'Possible side effects: Acne may worsen in the first weeks. Improvement occurs with continued treatment.'
          ],
          notRecommendedFor: 'Not recommended for pregnant women or those who may be pregnant.'
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    
    // Update language when it changes in the store
    const intervalId = setInterval(() => {
      const currentLang = LanguageStore.getLanguage();
      if (currentLang !== language) {
        setLanguage(currentLang);
      }
    }, 300);
    
    return () => clearInterval(intervalId);
  }, [medicineName, dosage]);

  if (isLoading || !leafletData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <HealthIconsLoading />
        <Text style={styles.loadingText}>{t.summarizingLeaflet}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>{t.summarizedLeafletFor}</Text>
          <Text style={styles.medicineName}>{leafletData.name} {formatDosage(leafletData.dosage)}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.intendedUse}</Text>
            <Text style={styles.sectionText}>{leafletData.intendedUse}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.howToUse}</Text>
            {leafletData.howToUse.map((item: string, index: number) => (
              <View key={index} style={styles.bulletPoint}>
                <MaterialIcons name="fiber-manual-record" size={8} color="#0e194d" style={styles.bullet} />
                <Text style={styles.bulletText}>
                  {formatHowToUseText(item, t)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t.notRecommendedFor}</Text>
            <Text style={styles.sectionText}>{leafletData.notRecommendedFor}</Text>
          </View>

          <Text style={styles.disclaimerText}>{t.disclaimer}</Text>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => router.push({
              pathname: '/'
            })}
          >
            <Text style={styles.nextButtonText}>{t.next}</Text>
          </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    padding: 25,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0e194d',
    marginBottom: 5,
  },
  medicineName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e76f51',
    marginBottom: 20,
  },
  warningContainer: {
    backgroundColor: '#ffecec',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ffcdcd',
  },
  warningText: {
    fontSize: 14,
    color: '#d32f2f',
    fontWeight: 'bold',
  },
  warningContent: {
    fontSize: 12,
    color: '#d32f2f',
    marginTop: 5,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0e194d',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    marginTop: 6,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50',
  },
  boldLabel: {
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    marginVertical: 10,
    fontStyle: 'italic',
  },
  nextButton: {
    backgroundColor: '#e76f51',
    paddingVertical: 15,
    borderRadius: 25,
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  iconContainer: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 