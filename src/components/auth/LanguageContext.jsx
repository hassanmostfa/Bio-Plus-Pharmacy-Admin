import React, { createContext, useState, useEffect } from "react";
import i18n from "../../i18n";

export const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Get saved language from localStorage or default to 'en'
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('i18n_language') || 'en';
    return savedLanguage;
  });

  const toggleLanguage = () => {
    const newLanguage = language === "en" ? "ar" : "en";
    setLanguage(newLanguage);
    // Update i18n language
    i18n.changeLanguage(newLanguage);
    // Save to localStorage
    localStorage.setItem('i18n_language', newLanguage);
  };

  // Sync language with i18n on mount
  useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};