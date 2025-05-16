import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';

// Simple in-memory storage
import { UserProfileStore } from '../utils/userProfileStore';
import { UserProfile, LeafletData, getSummarizedLeaflet } from '../models/integrations';

// Function to format text with bold labels
const formatHowToUseText = (text: string) => {
  // List of prefixes that should be bold
  const boldPrefixes = [
    'Initial dose:',
    'Administration:',
    'Dosage adjustment:',
    'Treatment duration:',
    'Possible side effects:'
  ];

  // Check if the text starts with any of the bold prefixes
  for (const prefix of boldPrefixes) {
    if (text.startsWith(prefix)) {
      const prefixEnd = prefix.length;
      const restOfText = text.substring(prefixEnd);
      
      return (
        <Text>
          <Text style={styles.boldLabel}>{prefix}</Text>
          <Text>{restOfText}</Text>
        </Text>
      );
    }
  }

  // If no prefix matches, return the text as is
  return <Text>{text}</Text>;
};

export default function LeafletScreen() {
  const params = useLocalSearchParams();
  const medicineName = params.medicineName as string || 'Zoretanin';
  const dosage = params.dosage as string || '20mg';
  
  const [leafletData, setLeafletData] = useState<LeafletData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

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
  }, [medicineName, dosage]);

  if (isLoading || !leafletData) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color="#e76f51" />
        <Text style={styles.loadingText}>Summarizing leaflet information...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Summarized leaflet for</Text>
          <Text style={styles.medicineName}>{leafletData.name} {leafletData.dosage} mg</Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Intended use</Text>
            <Text style={styles.sectionText}>{leafletData.intendedUse}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>How to use</Text>
            {leafletData.howToUse.map((item: string, index: number) => (
              <View key={index} style={styles.bulletPoint}>
                <MaterialIcons name="fiber-manual-record" size={8} color="#0e194d" style={styles.bullet} />
                <Text style={styles.bulletText}>
                  {formatHowToUseText(item)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Not recommended for</Text>
            <Text style={styles.sectionText}>{leafletData.notRecommendedFor}</Text>
          </View>

          <Text style={styles.disclaimerText}>Bu özet, genel bir bilgilendirme amaçlıdır. Hastanın özel durumu, tıbbi geçmişi ve diğer ilaçları dikkate alınarak doktor tarafından kişiye özel bir tedavi planı oluşturulmalıdır.</Text>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => router.push({
              pathname: '/'
            })}
          >
            <Text style={styles.nextButtonText}>Next</Text>
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
}); 