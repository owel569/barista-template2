import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'fr' | 'en' | 'zh' | 'hi' | 'es';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'fr';
  });

  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    localStorage.setItem('language', language);
    loadTranslations(language);
  }, [language]);

  const loadTranslations = async (lang: Language) => {
    try {
      let translations;
      switch (lang) {
        case 'fr':
          translations = (await import('../translations/fr')).default;
          break;
        case 'en':
          translations = (await import('../translations/en')).default;
          break;
        case 'zh':
          translations = (await import('../translations/zh')).default;
          break;
        case 'hi':
          translations = (await import('../translations/hi')).default;
          break;
        case 'es':
          translations = (await import('../translations/es')).default;
          break;
        default:
          translations = (await import('../translations/fr')).default;
      }
      setTranslations(translations);
    } catch (error) {
      console.error(`Failed to load translations for ${lang}:`, error);
      // Fallback to French
      const fallback = (await import('../translations/fr')).default;
      setTranslations(fallback);
    }
  };

  const t = (key: string): string => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};