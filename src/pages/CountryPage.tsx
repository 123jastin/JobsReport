// pages/CountryPage.tsx

import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import HomePage from './HomePage';
import { useCountry } from '../context/CountryContext';
import { COUNTRIES } from '../lib/countries';

export default function CountryPage() {
  const { slug } = useParams();
  const { setSelectedCountry } = useCountry();

  useEffect(() => {
    if (!slug) {
      setSelectedCountry('Worldwide');
      return;
    }

    const country = COUNTRIES.find(
      c =>
        c.name.toLowerCase().replace(/\s+/g, '-') ===
        slug.toLowerCase()
    );

    if (country) {
      setSelectedCountry(country.name);
    }
  }, [slug, setSelectedCountry]);

  const validCountry = COUNTRIES.find(
    c =>
      c.name.toLowerCase().replace(/\s+/g, '-') ===
      slug?.toLowerCase()
  );

  if (!validCountry) {
    return <Navigate to="/" replace />;
  }

  return <HomePage />;
}
