import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function TermsOfServicePage() {
  return (
    <>
      <SEO
        title="Terms of Service | JobsReport.online"
        description="Read the Terms of Service for JobsReport.online. Understand the rules, user responsibilities, liability limitations, and conditions for using our job platform."
        keywords="Terms of Service, JobsReport.online, job website terms, user agreement, Tanzania jobs, terms and conditions"
        canonicalUrl="https://jobsreport.online/terms-of-service"
        ogTitle="Terms of Service | JobsReport.online"
        ogDescription="Read the Terms of Service for JobsReport.online. Understand the rules, user responsibilities, and conditions for using our job platform."
        ogUrl="https://jobsreport.online/terms-of-service"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Terms of Service",
          "description": "Terms of Service for JobsReport.online outlining user responsibilities, liability limitations, and website usage conditions.",
          "url": "https://jobsreport.online/terms-of-service",
          "isPartOf": {
            "@type": "WebSite",
            "name": "JobsReport.online",
            "url": "https://jobsreport.online"
          }
        }}
      />

      <div className="min-h-screen space-y-8 pt-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <span className="text-blue-400">Terms of Service</span>
        </div>

        <div className="max-w-4xl space-y-6">
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tighter">
            Terms of Service
          </h1>

          <p className="text-gray-500 text-xs font-mono">
            Last Updated: June 2026
          </p>

          <p className="text-gray-400 text-sm leading-relaxed">
            By accessing or using JobsReport.online, you agree to these Terms of Service.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white mt-8">Website Purpose</h2>
            <p className="text-gray-400 text-sm">
              JobsReport.online provides job-related information, vacancy listings,
              career opportunities, and links to third-party application platforms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white mt-8">No Employment Guarantee</h2>
            <p className="text-gray-400 text-sm">
              JobsReport.online does not guarantee employment, interviews, job
              offers, or hiring outcomes.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white mt-8">Job Information</h2>
            <p className="text-gray-400 text-sm">
              We strive to provide accurate information. However, employers may
              modify, withdraw, or close vacancies without notice. Users should
              verify details directly with employers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white mt-8">User Responsibilities</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-400 text-sm">
              <li>Use the website lawfully.</li>
              <li>Provide accurate information when contacting us.</li>
              <li>Do not attempt to disrupt website operations.</li>
              <li>Do not copy content for commercial use without permission.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white mt-8">Intellectual Property</h2>
            <p className="text-gray-400 text-sm">
              All website content, branding, logos, design elements, and original
              materials belong to JobsReport.online unless otherwise stated.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white mt-8">Third-Party Websites</h2>
            <p className="text-gray-400 text-sm">
              The website may contain links to external websites and application
              portals. We are not responsible for their content, services, privacy
              practices, or availability.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white mt-8">Limitation of Liability</h2>
            <p className="text-gray-400 text-sm">
              JobsReport.online shall not be liable for any direct, indirect,
              incidental, consequential, or special damages arising from use of the
              website or reliance on information published on the platform.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white mt-8">Modifications</h2>
            <p className="text-gray-400 text-sm">
              We reserve the right to modify, suspend, or discontinue any part of
              the website at any time without prior notice.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white mt-8">Changes to Terms</h2>
            <p className="text-gray-400 text-sm">
              We may revise these Terms of Service periodically. Continued use of
              the website after updates are posted constitutes acceptance of the
              revised terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white mt-8">Contact</h2>
            <p className="text-gray-400 text-sm">
              Questions regarding these Terms may be submitted to{' '}
              <a href="mailto:jjovinatha@gmail.com" className="text-blue-400 hover:text-blue-300">
                jjovinatha@gmail.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </>
  );
}
