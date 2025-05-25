// Simple in-memory store for language preference
class LanguageStoreClass {
  private language: 'en' | 'tr' = 'en';

  getLanguage(): 'en' | 'tr' {
    return this.language;
  }

  toggleLanguage(): 'en' | 'tr' {
    this.language = this.language === 'en' ? 'tr' : 'en';
    return this.language;
  }

  isEnglish(): boolean {
    return this.language === 'en';
  }

  isTurkish(): boolean {
    return this.language === 'tr';
  }
}

// Export a singleton instance
export const LanguageStore = new LanguageStoreClass(); 