import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import SEO from '../components/SEO';
import HomePage from './HomePage';
import { useCountry } from '../context/CountryContext';
import { COUNTRIES } from '../lib/countries';

const countryToSlug = (name: string) =>
  name.toLowerCase().replace(/\s+/g, '-');

const findCountryBySlug = (slug: string) =>
  COUNTRIES.find(c => countryToSlug(c.name) === slug.toLowerCase());

export default function CountryPage() {
  const { slug } = useParams();
  const { setSelectedCountry } = useCountry();

  const validCountry = slug ? findCountryBySlug(slug) : null;
  const countryName = validCountry?.name || 'Worldwide';
  const canonicalSlug = validCountry ? countryToSlug(validCountry.name) : '';

  useEffect(() => {
    if (!slug) {
      setSelectedCountry('Worldwide');
      return;
    }

    const country = findCountryBySlug(slug);
    if (country) {
      setSelectedCountry(country.name);
    }
  }, [slug, setSelectedCountry]);

  if (slug && !validCountry) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <SEO
        title={countryName === 'Worldwide'
          ? 'Jobs Worldwide | Latest Vacancies & Career Opportunities | JobsReport'
          : `Jobs in ${countryName} | Latest Vacancies & Career Opportunities | JobsReport`}
        description={countryName === 'Worldwide'
          ? 'Find the latest job vacancies, internships, and career opportunities worldwide.'
          : `Find the latest jobs, internships, and career opportunities in ${countryName}.`}
        keywords={`jobs in ${countryName}, ${countryName} vacancies, ${countryName} careers`}
        canonicalUrl={`https://jobsreport.online/country/${canonicalSlug}`}
        ogTitle={`Jobs in ${countryName} | JobsReport`}
        ogDescription={`Find the latest jobs and career opportunities in ${countryName}.`}
        ogUrl={`https://jobsreport.online/country/${canonicalSlug}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": `Jobs in ${countryName}`,
          "description": `Find the latest job vacancies and career opportunities in ${countryName}.`,
          "url": `https://jobsreport.online/country/${canonicalSlug}`,
          "isPartOf": {
            "@type": "WebSite",
            "name": "JobsReport",
            "url": "https://jobsreport.online"
          }
        }}
      />
      <HomePage />
    </>
  );
}
