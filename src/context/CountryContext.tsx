import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { COUNTRIES, Country } from '../lib/countries';

interface CountryContextType {
  selectedCountry: string; // 'Worldwide' or a country name e.g. 'Tanzania'
  setSelectedCountry: (country: string) => void;
  countriesList: Country[];
  currentFlag: string;
}

const CountryContext = createContext<CountryContextType | undefined>(undefined);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [selectedCountry, setSelectedCountryState] = useState<string>(() => {
    // Check localStorage first
    const saved = localStorage.getItem('user_selected_country');
    return saved || 'Worldwide';
  });

  const setSelectedCountry = (country: string) => {
    setSelectedCountryState(country);
    localStorage.setItem('user_selected_country', country);
  };

  // Resolve flag
  const [currentFlag, setCurrentFlag] = useState('🌍');

  useEffect(() => {
    if (selectedCountry === 'Worldwide') {
      setCurrentFlag('🌍');
    } else {
      const match = COUNTRIES.find(c => c.name.toLowerCase() === selectedCountry.toLowerCase());
      setCurrentFlag(match ? match.flag : '🌍');
    }
  }, [selectedCountry]);

  return (
    <CountryContext.Provider value={{
      selectedCountry,
      setSelectedCountry,
      countriesList: COUNTRIES,
      currentFlag
    }}>
      {children}
    </CountryContext.Provider>
  );
}

export function useCountry() {
  const context = useContext(CountryContext);
  if (!context) {
    throw new Error('useCountry must be used within a CountryProvider');
  }
  return context;
}
