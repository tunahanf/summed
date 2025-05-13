/**
 * This file provides integration points with Python backends for OCR and NLP functionality.
 * In a real implementation, these would communicate with Python servers.
 */

export interface OCRResult {
  medicineName: string;
  dosage: string;
  success: boolean;
}

export interface LeafletData {
  name: string;
  dosage: string;
  intendedUse: string;
  howToUse: string[];
  notRecommendedFor: string;
}

/**
 * Processes an image to extract medication name and dosage using OCR
 * @param {string} imageUri - URI of the captured medicine box image
 * @returns {Promise<OCRResult>} Object containing medicine name and dosage
 */
export const processMedicineImageWithOCR = async (imageUri: string): Promise<OCRResult> => {
  // This is a mock implementation. In a real app, this would:
  // 1. Send the image to a Python OCR server
  // 2. Process the image to extract text
  // 3. Identify the medicine name and dosage
  
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

/**
 * Gets summarized leaflet information using NLP
 * @param {string} medicineName - Name of the medicine
 * @param {string} dosage - Dosage of the medicine
 * @returns {Promise<LeafletData>} Summarized leaflet information
 */
export const getSummarizedLeaflet = async (medicineName: string, dosage: string): Promise<LeafletData> => {
  // This is a mock implementation. In a real app, this would:
  // 1. Send the medicine name and dosage to a Python NLP server
  // 2. Use NLP to extract and summarize relevant information
  // 3. Format according to required sections
  
  console.log('Getting leaflet for:', medicineName, dosage);
  
  // For demo purposes, we'll return mock data after a short delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: medicineName,
        dosage: dosage,
        intendedUse: 'Used for treating severe, treatment-resistant acne.',
        howToUse: [
          'Usage should follow the doctor\'s instructions.',
          'Initial dose: 40 mg/day (0.5 mg/kg/day) for a 19-year-old weighing 80 kg.',
          'Administration: Take capsules with food, once or twice daily. Swallow whole with a drink or meal.',
          'Dosage adjustment: May be modified based on response. Typically ranges between 40-80 mg/day (0.5-1.0 mg/kg/day).',
          'Treatment duration: Usually lasts 16-24 weeks.',
          'Possible side effects: Acne may worsen in the first weeks. Improvement occurs with continued treatment.'
        ],
        notRecommendedFor: 'Not recommended for pregnant women or those who may be pregnant.'
      });
    }, 2000); // simulate network delay
  });
}; 