import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Globe, Target, Eye, CheckCircle, Zap, Users, Shield } from 'lucide-react';

export default function AboutUsPage() {
  return (
    <>
      <SEO
        title="About Us | JobsReport.online"
        description="Learn about JobsReport.online, our mission, vision, and commitment to helping job seekers discover employment opportunities, internships, scholarships, and career resources across Tanzania and beyond."
        keywords="About JobsReport, JobsReport.online, Tanzania jobs, career opportunities, employment platform, internships, scholarships"
        canonicalUrl="https://jobsreport.online/about-us"
        ogTitle="About Us | JobsReport.online"
        ogDescription="Learn about JobsReport.online and our mission to help job seekers discover opportunities across Tanzania and beyond."
        ogUrl="https://jobsreport.online/about-us"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About JobsReport.online",
          "description": "Learn about JobsReport.online, our mission, vision, and commitment to helping job seekers discover employment opportunities.",
          "url": "https://jobsreport.online/about-us",
          "mainEntity": {
            "@type": "Organization",
            "name": "JobsReport.online",
            "url": "https://jobsreport.online",
            "description": "JobsReport.online is an online employment and career information platform dedicated to helping job seekers discover opportunities across Tanzania and beyond."
          }
        }}
      />

      <div className="min-h-screen space-y-12 pt-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono uppercase tracking-wider">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <span className="text-blue-400">About Us</span>
        </div>

        {/* Hero */}
        <section className="text-center py-8 border-b border-white/5">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tighter">
            About JobsReport<span className="text-blue-500">.online</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl mx-auto leading-relaxed">
            Helping job seekers discover employment opportunities, internships, 
            scholarships, and career resources across Tanzania and beyond.
          </p>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 text-center">
            <Globe size={20} className="text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-mono text-white font-bold">15+</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Countries</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 text-center">
            <Target size={20} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-mono text-white font-bold">500+</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Job Listings</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 text-center">
            <Users size={20} className="text-violet-400 mx-auto mb-2" />
            <p className="text-2xl font-mono text-white font-bold">50+</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Companies</p>
          </div>
          <div className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 text-center">
            <Zap size={20} className="text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-mono text-white font-bold">24/7</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">Updates</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl space-y-12">
          {/* Who We Are */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-6 bg-blue-500"></div>
              <h2 className="text-2xl font-bold text-white">Who We Are</h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              JobsReport.online is an online employment and career information platform dedicated 
              to helping job seekers access the latest job opportunities, internships, scholarships, 
              training programs, government vacancies, and career-related updates.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mt-3">
              Our goal is to make opportunity discovery simple, accessible, and reliable by providing 
              timely information that helps individuals take the next step in their professional journey.
            </p>
          </section>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="p-6 rounded-2xl bg-white/[0.01] border border-white/5">
              <Eye size={24} className="text-blue-400 mb-3" />
              <h2 className="text-xl font-bold text-white mb-3">Our Mission</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                To connect job seekers with valuable employment opportunities by providing accurate, 
                timely, and easy-to-access career information. We believe access to opportunity can 
                transform lives and support economic growth.
              </p>
            </section>

            <section className="p-6 rounded-2xl bg-white/[0.01] border border-white/5">
              <Target size={24} className="text-emerald-400 mb-3" />
              <h2 className="text-xl font-bold text-white mb-3">Our Vision</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                To become one of the most trusted online sources of employment and career opportunity 
                information in Tanzania and across Africa, empowering individuals through access to 
                meaningful opportunities.
              </p>
            </section>
          </div>

          {/* What We Do */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-6 bg-emerald-500"></div>
              <h2 className="text-2xl font-bold text-white">What We Do</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                'Government Jobs',
                'Private Sector',
                'NGO & International',
                'Graduate Programs',
                'Internships',
                'Scholarships',
                'Career Guidance',
                'Employment News'
              ].map(item => (
                <div key={item} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center">
                  <CheckCircle size={14} className="text-blue-400 mx-auto mb-1" />
                  <span className="text-[11px] text-gray-400">{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Commitment */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-6 bg-violet-500"></div>
              <h2 className="text-2xl font-bold text-white">Our Commitment to Accuracy</h2>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              We strive to ensure that information published on JobsReport.online is accurate, 
              relevant, and up to date. Job opportunities are sourced from official employer 
              announcements, company career portals, government institutions, recruitment agencies, 
              and publicly available employment notices.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mt-3">
              While we work hard to maintain accuracy, employers may update, withdraw, or close 
              opportunities without notice. We encourage users to verify important information 
              directly with the recruiting organization before applying.
            </p>
          </section>

          {/* Independent Platform */}
          <section className="p-6 rounded-2xl bg-white/[0.01] border border-white/5">
            <Shield size={24} className="text-blue-400 mb-3" />
            <h2 className="text-xl font-bold text-white mb-3">Independent Platform</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              JobsReport.online is an independent information platform. Unless explicitly stated, 
              we are not affiliated with, endorsed by, or acting on behalf of employers, government 
              agencies, universities, recruitment firms, or organizations whose opportunities are 
              published on our website.
            </p>
          </section>

          {/* Why Choose Us */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-6 bg-amber-500"></div>
              <h2 className="text-2xl font-bold text-white">Why Use JobsReport.online?</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Timely Updates', desc: 'We regularly publish newly announced opportunities to help users stay informed.' },
                { title: 'Easy Access', desc: 'Our platform is designed to make finding opportunities simple, fast, and efficient.' },
                { title: 'Wide Coverage', desc: 'We cover opportunities from government, private companies, NGOs, and international organizations.' },
                { title: 'User-Focused', desc: 'We continuously improve our platform to provide a better experience for job seekers.' }
              ].map(item => (
                <div key={item.title} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <h3 className="text-sm font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Disclaimer */}
          <section className="p-6 rounded-2xl bg-amber-500/[0.03] border border-amber-500/10">
            <h2 className="text-xl font-bold text-amber-400 mb-3">Disclaimer</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              JobsReport.online provides employment information for informational and educational 
              purposes only. We do not guarantee employment, interviews, recruitment outcomes, or 
              job offers. Application and hiring decisions are made solely by the respective employers 
              and recruiting organizations.
            </p>
          </section>

          {/* Contact */}
          <section className="p-6 rounded-2xl bg-white/[0.01] border border-white/5 text-center">
            <h2 className="text-xl font-bold text-white mb-3">Contact Us</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              We welcome questions, suggestions, corrections, partnership inquiries, and feedback 
              regarding our platform and published opportunities.
            </p>
            <a
              href="mailto:jjovinatha@gmail.com"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              Get in Touch
            </a>
          </section>
        </div>
      </div>
    </>
  );
}
