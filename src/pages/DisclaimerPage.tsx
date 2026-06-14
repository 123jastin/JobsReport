import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Shield, AlertTriangle, FileText, Scale } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <>
      <SEO
        title="Disclaimer | JobsReport.online"
        description="Read the Disclaimer for JobsReport.online. Understand the limitations of liability, accuracy of information, third-party links, and terms of use for our job platform."
        keywords="Disclaimer, JobsReport.online, job website disclaimer, liability, accuracy, Tanzania jobs, legal"
        canonicalUrl="https://jobsreport.online/disclaimer"
        ogTitle="Disclaimer | JobsReport.online"
        ogDescription="Read the Disclaimer for JobsReport.online. Understand the limitations of liability and terms of use for our job platform."
        ogUrl="https://jobsreport.online/disclaimer"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Disclaimer",
          "description": "Disclaimer for JobsReport.online outlining limitations of liability, information accuracy, and terms of use.",
          "url": "https://jobsreport.online/disclaimer",
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
          <span className="text-blue-400">Disclaimer</span>
        </div>

        {/* Hero */}
        <div className="max-w-4xl space-y-8">
          <div>
            <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-widest mb-4">
              <Scale size={14} />
              <span>Legal Information</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tighter">
              Disclaimer
            </h1>
            <p className="text-gray-500 text-xs font-mono mt-2">
              Last Updated: June 14, 2026
            </p>
          </div>

          {/* Introduction */}
          <section className="p-6 rounded-2xl bg-white/[0.01] border border-white/5">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-white mb-2">General Disclaimer</h2>
                <p className="text-gray-400 text-sm leading-relaxed">
                  The information provided on JobsReport.online is for general informational 
                  and educational purposes only. While we strive to keep the information accurate 
                  and up to date, we make no representations or warranties of any kind, express 
                  or implied, about the completeness, accuracy, reliability, suitability, or 
                  availability of the information contained on the website.
                </p>
              </div>
            </div>
          </section>

          {/* Content Sections */}
          <div className="space-y-6">
            {/* Job Listings */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1.5 h-6 bg-blue-500"></div>
                <h2 className="text-xl font-bold text-white">Job Listings & Employment Information</h2>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                JobsReport.online publishes job vacancies, career opportunities, and employment-related 
                information sourced from various channels including employer websites, recruitment 
                portals, government announcements, and public notices. We do not guarantee that any 
                job listing will still be available at the time of application, as employers may 
                withdraw or modify vacancies without notice.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mt-3">
                Users are strongly advised to verify all job details, requirements, deadlines, and 
                application procedures directly with the respective employers or recruiting 
                organizations before applying.
              </p>
            </section>

            {/* No Employment Relationship */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1.5 h-6 bg-violet-500"></div>
                <h2 className="text-xl font-bold text-white">No Employment or Agency Relationship</h2>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                JobsReport.online is an independent information platform. We are not an employment 
                agency, recruitment firm, or hiring organization. We do not employ, recommend, or 
                endorse any job seeker, employer, or organization listed on our platform. Any 
                communication, application, or interaction between users and employers is solely 
                between those parties.
              </p>
            </section>

            {/* Third-Party Links */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1.5 h-6 bg-emerald-500"></div>
                <h2 className="text-xl font-bold text-white">Third-Party Links & External Websites</h2>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Our website may contain links to external websites, employer career portals, 
                application platforms, and third-party services. These links are provided for 
                convenience and informational purposes only. We have no control over the content, 
                availability, security, or privacy practices of external sites.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mt-3">
                The inclusion of any link does not imply endorsement, recommendation, or approval 
                by JobsReport.online. Users access external links at their own risk.
              </p>
            </section>

            {/* No Guarantees */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1.5 h-6 bg-rose-500"></div>
                <h2 className="text-xl font-bold text-white">No Guarantee of Results</h2>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                JobsReport.online does not guarantee that use of our website will result in 
                employment, interviews, job offers, scholarships, admissions, or any other 
                outcomes. Application outcomes depend entirely on the hiring decisions of 
                respective employers and organizations.
              </p>
            </section>

            {/* Financial Disclaimer */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1.5 h-6 bg-amber-500"></div>
                <h2 className="text-xl font-bold text-white">Financial & Payment Disclaimer</h2>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                JobsReport.online does not charge job seekers for accessing job listings or 
                career information. We do not request, collect, or process payments related to 
                job applications. Users should never pay money to any person or organization 
                claiming to offer employment through our platform.
              </p>
              <p className="text-gray-400 text-sm leading-relaxed mt-3">
                If you encounter any request for payment in connection with a job listing 
                found on JobsReport.online, please report it immediately.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="p-6 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10">
              <div className="flex items-start gap-3">
                <Shield size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-bold text-amber-400 mb-2">Limitation of Liability</h2>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Under no circumstances shall JobsReport.online, its owners, operators, 
                    contributors, or affiliates be liable for any direct, indirect, incidental, 
                    consequential, special, or exemplary damages arising from or in connection 
                    with the use of this website or reliance on any information provided.
                  </p>
                  <p className="text-gray-400 text-sm leading-relaxed mt-3">
                    This includes, but is not limited to, damages for loss of opportunities, 
                    loss of income, emotional distress, or any other losses resulting from:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-400 text-sm mt-3">
                    <li>Use or inability to use the website</li>
                    <li>Reliance on information published on the platform</li>
                    <li>Errors, omissions, or inaccuracies in job listings</li>
                    <li>Links to third-party websites or services</li>
                    <li>Actions taken based on information found on this website</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Changes */}
            <section>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-1.5 h-6 bg-cyan-500"></div>
                <h2 className="text-xl font-bold text-white">Changes to This Disclaimer</h2>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                We reserve the right to update or modify this Disclaimer at any time without 
                prior notice. Changes will be effective immediately upon posting. Continued 
                use of the website after modifications constitutes acceptance of the updated 
                Disclaimer.
              </p>
            </section>

            {/* Contact */}
            <section className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 text-center">
              <FileText size={24} className="text-blue-400 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-white mb-3">Questions About This Disclaimer?</h2>
              <p className="text-gray-400 text-sm leading-relaxed mb-4">
                If you have questions, concerns, or require clarification regarding this 
                Disclaimer, please contact us.
              </p>
              <a
                href="mailto:jjovinatha@gmail.com"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                Contact Us
              </a>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
