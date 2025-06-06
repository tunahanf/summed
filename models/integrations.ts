/**
 * This file provides integration points with Python backends for OCR and NLP functionality.
 * In a real implementation, these would communicate with Python servers.
 */

import { API_KEY, API_URL } from '@env';

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

export interface UserProfile {
  age: number;
  height: number;
  weight: number;
  lastUpdated: string;
}

// Google Gemini API Key
const GEMINI_API_KEY = API_KEY || "";
const GEMINI_API_URL = API_URL || "";

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
 * @param {UserProfile | null} userProfile - Optional user profile data for personalization
 * @returns {Promise<LeafletData>} Summarized leaflet information
 */
export const getSummarizedLeaflet = async (medicineName: string, dosage: string, userProfile: UserProfile | null = null): Promise<LeafletData> => {
  console.log('Getting leaflet for:', medicineName, dosage);
  console.log('User profile:', userProfile);
  
  try {
    // Default values for user profile if not available
    const age = userProfile?.age || 25;
    const height = userProfile?.height || 170;
    const weight = userProfile?.weight || 70;
    
    // Create the prompt for Gemini
    const prompt = `Sen profesyonel bir ecza yardım asistanısın. İlgili prospektüsleri https://www.ilacprospektusu.com/ internet sitesinden bulabilirsin. "${medicineName} ${dosage} mg" -> Bu ilacın prospektüsünü internette ara ve sana verilen başlıklara ve kişisel özelliklere göre bir özet çıkar.
      
      Özet çıkarman gereken ana başlıklar bunlar, bunların dışına asla çıkma ve çıkardığın özet çok uzun olmasın her bir başlık için kısa ve anlaşılır özet çıkar:
      
      "Intended use:" başlığı altında ilacın ne için kullanıldığını açıkla. Asla maddeler halinde yazma, asla markdownda ** veya * gibi karakterler kullanma, düz metin şeklinde yaz.
      
      "How to use:" başlığı altında aşağıdaki alt başlıkları kullan:
      "Initial dose:" başlığı altında başlangıç dozunu açıkla. Prospektüsteki dozajı kullan kişinin bilgilerini göz önünde bulundurarak söyle. Prospektüste bulunan dozajı uygula diyorsun faka senin görevin zaten bana prospektüsü okuyup özetlemek. Yani prospektüste önerilen dozajı söylemen lazım bana.
      "Administration:" başlığı altında ilacın nasıl alınacağını açıkla
      "Dosage adjustment:" başlığı altında doz ayarlamasını açıkla
      "Treatment duration:" başlığı altında tedavi süresini açıkla
      "Possible side effects:" başlığı altında olası yan etkileri açıkla
      
      "Not recommended for:" başlığı altında ilacın kimlere önerilmediğini açıkla. Asla maddeler halinde yazma, asla markdownda ** veya * gibi karakterler kullanma, düz metin şeklinde yaz.
      
      Kişinin boyu ${height} cm, kilosu ${weight} kg ve yaşı ${age}. Bu bilgileri kullanarak kişiselleştirilmiş bir özet çıkar. 
      
      Yanıtını tam olarak yukarıdaki formatta ver, başlıkları değiştirme ve her başlığı belirttiğim şekilde kullan. Markdown formatı kullanma, markdown işaretleri kullanma. Asla başlıkları kalın (bold) veya italik yapmaya çalışma. Asla "*", "**", "#", "-", "+" veya "> " işaretleri kullanma, sadece düz metin kullan. Ayrıca hazırladığın özette her başlık altında direkt ilacın adını özne olarak kullanama! Bu yapıyı ve bütünlüğü bozuyor.`;
    
    console.log('Sending prompt to Gemini API:', prompt);
    
    // Make the API request to Google Gemini API directly
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 800,
        }
      }),
    });
    
    console.log('API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error details:', errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }
    
    // Parse the response
    const data = await response.json();
    console.log('API response data:', JSON.stringify(data, null, 2));
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts || !data.candidates[0].content.parts[0]) {
      console.error('Unexpected API response format:', data);
      throw new Error('Unexpected API response format');
    }
    
    const content = data.candidates[0].content.parts[0].text;
    console.log('Extracted content:', content);
    
    // Parse the text response into the format our app expects
    const sections = parseSummaryText(content);
    
    // Return in our app's expected format
    return {
      name: medicineName,
      dosage: dosage,
      intendedUse: sections.intendedUse || 'Information not available',
      howToUse: sections.howToUse || ['Information not available'],
      notRecommendedFor: sections.notRecommendedFor || 'Information not available'
    };
  } catch (error) {
    console.error('Error fetching leaflet data:', error);
    
    // Return fallback data in case of error
    return {
      name: medicineName,
      dosage: dosage,
      intendedUse: 'Could not retrieve information. Please check your connection and try again.',
      howToUse: [
        'Initial dose: Information not available',
        'Administration: Information not available',
        'Dosage adjustment: Information not available',
        'Treatment duration: Information not available',
        'Possible side effects: Information not available'
      ],
      notRecommendedFor: 'Information not available'
    };
  }
};

// Helper function to parse the text response from Gemini
const parseSummaryText = (summary: string): { intendedUse: string, howToUse: string[], notRecommendedFor: string } => {
  console.log('Parsing summary text:', summary); // Add logging to see the raw response
  
  const lines = summary.split('\n');
  const result = {
    intendedUse: '',
    howToUse: [] as string[],
    notRecommendedFor: ''
  };
  
  let currentSection = '';
  
  // Adım 1: Her satırı işle ve hangi bölüme ait olduğunu belirle
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    console.log('Processing line:', trimmedLine); // Log each line being processed
    
    // Ana başlıkları tanımla
    if (trimmedLine.toLowerCase().includes('intended use:') || 
        trimmedLine.toLowerCase().includes('kullanım amacı:')) {
      currentSection = 'intendedUse';
      // Başlık ve içerik aynı satırda ise, içeriği çıkar
      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex !== -1) {
        result.intendedUse = trimmedLine.substring(colonIndex + 1).trim();
      }
      console.log('Found intended use section');
    } else if (trimmedLine.toLowerCase().includes('intended use') || 
               trimmedLine.toLowerCase().includes('kullanım amacı')) {
      currentSection = 'intendedUse';
      console.log('Found intended use section without colon');
    } else if (trimmedLine.toLowerCase().includes('how to use:') || 
               trimmedLine.toLowerCase().includes('nasıl kullanılır:')) {
      currentSection = 'howToUse';
      console.log('Found how to use section');
    } else if (trimmedLine.toLowerCase().includes('how to use') || 
               trimmedLine.toLowerCase().includes('nasıl kullanılır')) {
      currentSection = 'howToUse';
      console.log('Found how to use section without colon');
    } else if (trimmedLine.toLowerCase().includes('not recommended for:') || 
               trimmedLine.toLowerCase().includes('önerilmediği durumlar:')) {
      currentSection = 'notRecommendedFor';
      // Başlık ve içerik aynı satırda ise, içeriği çıkar
      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex !== -1) {
        result.notRecommendedFor = trimmedLine.substring(colonIndex + 1).trim();
      }
      console.log('Found not recommended section');
    } else if (trimmedLine.toLowerCase().includes('not recommended for') || 
               trimmedLine.toLowerCase().includes('önerilmediği durumlar')) {
      currentSection = 'notRecommendedFor';
      console.log('Found not recommended section without colon');
    } 
    // How to Use altındaki alt başlıkları tanımla
    else if (trimmedLine.toLowerCase().includes('initial dose:')) {
      if (currentSection === 'howToUse') {
        result.howToUse.push(trimmedLine.trim());
      }
    } else if (trimmedLine.toLowerCase().includes('administration:')) {
      if (currentSection === 'howToUse') {
        result.howToUse.push(trimmedLine.trim());
      }
    } else if (trimmedLine.toLowerCase().includes('dosage adjustment:')) {
      if (currentSection === 'howToUse') {
        result.howToUse.push(trimmedLine.trim());
      }
    } else if (trimmedLine.toLowerCase().includes('treatment duration:')) {
      if (currentSection === 'howToUse') {
        result.howToUse.push(trimmedLine.trim());
      }
    } else if (trimmedLine.toLowerCase().includes('possible side effects:')) {
      if (currentSection === 'howToUse') {
        result.howToUse.push(trimmedLine.trim());
      }
    }
    // Her bölüm için içerik işlemleri
    else if (currentSection === 'intendedUse') {
      // Eğer madde işareti (* veya -) ile başlıyorsa, temizle
      if (trimmedLine.startsWith('*') || trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
        const cleanText = trimmedLine.substring(1).trim();
        if (result.intendedUse === '') {
          result.intendedUse = cleanText;
        } else {
          result.intendedUse += ' ' + cleanText;
        }
      } else {
        // Madde işareti yoksa, metni olduğu gibi ekle
        if (result.intendedUse === '') {
          result.intendedUse = trimmedLine;
        } else {
          result.intendedUse += ' ' + trimmedLine;
        }
      }
    } else if (currentSection === 'howToUse') {
      // How to Use alt başlıkları dışındaki içerik için
      // Eğer bir alt başlık yoksa ve mevcut satır önceki bir maddenin devamı olabilir
      const isSubheader = trimmedLine.toLowerCase().includes('initial dose:') ||
                         trimmedLine.toLowerCase().includes('administration:') ||
                         trimmedLine.toLowerCase().includes('dosage adjustment:') ||
                         trimmedLine.toLowerCase().includes('treatment duration:') ||
                         trimmedLine.toLowerCase().includes('possible side effects:');
                          
      if (!isSubheader) {
        // Madde işareti ile başlayan satırları işle
        if (trimmedLine.startsWith('*') || trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
          result.howToUse.push(trimmedLine.substring(1).trim());
        } 
        // Eğer satır iki nokta içeriyorsa, muhtemelen bir alt başlıktır
        else if (trimmedLine.includes(':')) {
          result.howToUse.push(trimmedLine.trim());
        } 
        // Eğer zaten bazı maddeler eklenmiş ve bu bir devam satırı olabilir
        else if (result.howToUse.length > 0) {
          const lastIndex = result.howToUse.length - 1;
          result.howToUse[lastIndex] = result.howToUse[lastIndex] + ' ' + trimmedLine;
        } 
        // Eğer hiçbir madde henüz eklenmemişse, yeni bir madde olarak ekle
        else {
          result.howToUse.push(trimmedLine);
        }
      }
    } else if (currentSection === 'notRecommendedFor') {
      // Eğer madde işareti (* veya -) ile başlıyorsa, temizle
      if (trimmedLine.startsWith('*') || trimmedLine.startsWith('-') || trimmedLine.startsWith('•')) {
        const cleanText = trimmedLine.substring(1).trim();
        if (result.notRecommendedFor === '') {
          result.notRecommendedFor = cleanText;
        } else {
          result.notRecommendedFor += ' ' + cleanText;
        }
      } else {
        // Madde işareti yoksa, metni olduğu gibi ekle
        if (result.notRecommendedFor === '') {
          result.notRecommendedFor = trimmedLine;
        } else {
          result.notRecommendedFor += ' ' + trimmedLine;
        }
      }
    }
  }
  
  // Adım 2: How to Use altındaki alt başlıkların eksik olanlarını kontrol et
  const requiredSubheaders = [
    'Initial dose:',
    'Administration:',
    'Dosage adjustment:',
    'Treatment duration:',
    'Possible side effects:'
  ];
  
  // Eksik alt başlıkları tespit et
  for (const header of requiredSubheaders) {
    const hasHeader = result.howToUse.some(item => 
      item.toLowerCase().includes(header.toLowerCase())
    );
    
    if (!hasHeader) {
      result.howToUse.push(`${header} Information not available`);
    }
  }
  
  // Adım 3: Hiçbir bölüm bulunamadıysa, metinden bilgi çıkarmaya çalış
  if (result.intendedUse === '' && result.howToUse.length === 0 && result.notRecommendedFor === '') {
    console.log('No sections found, trying to extract from raw text');
    
    // Amaç (Intended Use) ile ilgili bilgi bulmaya çalış
    for (const line of lines) {
      const trimmedLine = line.trim().toLowerCase();
      if (trimmedLine.includes('kullanım') || trimmedLine.includes('use') || 
          trimmedLine.includes('tedavi') || trimmedLine.includes('treatment')) {
        result.intendedUse = line.trim();
        break;
      }
    }
    
    // Kullanım (How to Use) ile ilgili bilgi bulmaya çalış
    const howToUseLines = lines.filter(line => {
      const trimmedLine = line.trim().toLowerCase();
      return trimmedLine.includes('doz') || trimmedLine.includes('dose') || 
             trimmedLine.includes('kullanım') || trimmedLine.includes('administration') ||
             trimmedLine.includes('yan etki') || trimmedLine.includes('side effect');
    });
    
    if (howToUseLines.length > 0) {
      result.howToUse = howToUseLines.map(line => line.trim());
    }
    
    // Önerilmediği durumlar (Not Recommended For) ile ilgili bilgi bulmaya çalış
    for (const line of lines) {
      const trimmedLine = line.trim().toLowerCase();
      if (trimmedLine.includes('önerilmez') || trimmedLine.includes('not recommended') || 
          trimmedLine.includes('kontrendike') || trimmedLine.includes('contraindicated')) {
        result.notRecommendedFor = line.trim();
        break;
      }
    }
  }
  
  // Adım 4: Eksik bölümler için varsayılan değerler sağla
  if (result.intendedUse === '') {
    result.intendedUse = 'Information not available';
  }
  
  if (result.howToUse.length === 0) {
    result.howToUse = [
      'Initial dose: Information not available',
      'Administration: Information not available',
      'Dosage adjustment: Information not available',
      'Treatment duration: Information not available',
      'Possible side effects: Information not available'
    ];
  }
  
  if (result.notRecommendedFor === '') {
    result.notRecommendedFor = 'Information not available';
  }
  
  // Adım 5: Metin başındaki gereksiz karakterleri temizleyelim
  
  // Metin temizleme yardımcı fonksiyonu
  const cleanText = (text: string): string => {
    // İlk olarak başındaki yıldız, tire veya diğer işaretleri temizle
    let cleaned = text.replace(/^[\*\-\•\#\"\'\`]+\s*/, '');
    
    // Sonundaki yıldız, tire veya diğer işaretleri temizle
    cleaned = cleaned.replace(/\s*[\*\-\•\#\"\'\`]+$/, '');
    
    // Başındaki ve sonundaki boşlukları temizle
    cleaned = cleaned.trim();
    
    // "**", "* *" gibi kalıpları temizle (metin içinde olabilir)
    cleaned = cleaned.replace(/\*\*|\*\s\*|\#\#|__|--/g, '');
    
    return cleaned;
  };
  
  // Intended Use temizliği
  result.intendedUse = cleanText(result.intendedUse);
  
  // How to Use temizliği
  result.howToUse = result.howToUse.map(item => cleanText(item));
  
  // Not Recommended For temizliği
  result.notRecommendedFor = cleanText(result.notRecommendedFor);
  
  console.log('Parsed result:', result); // Log the final parsed result
  
  return result;
}; 