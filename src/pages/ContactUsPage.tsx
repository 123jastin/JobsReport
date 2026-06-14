import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { Mail, MessageCircle, Facebook, MapPin, Phone, ArrowUpRight, Clock, Shield } from 'lucide-react';

export default function ContactUsPage() {
  return (
    <>
      <SEO
        title="Contact Us | JobsReport.online"
        description="Get in touch with JobsReport.online. Contact us via email, WhatsApp channel, or Facebook for job inquiries, support, advertising, and partnerships."
        keywords="Contact JobsReport, JobsReport.online contact, Tanzania jobs contact, job platform support, advertising inquiries"
        canonicalUrl="https://jobsreport.online/contact-us"
        ogTitle="Contact Us | JobsReport.online"
        ogDescription="Get in touch with JobsReport.online via email, WhatsApp, or Facebook."
        ogUrl="https://jobsreport.online/contact-us"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "name": "Contact Us",
          "description": "Contact JobsReport.online for job inquiries, support, advertising, and partnerships.",
          "url": "https://jobsreport.online/contact-us",
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
          <span className="text-blue-400">Contact Us</span>
        </div>

        <div className="max-w-4xl space-y-8">
          {/* Hero */}
          <div>
            <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-widest mb-4">
              <MessageCircle size={14} />
              <span>Get in Touch</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tighter">
              Contact Us
            </h1>
            <p className="text-gray-400 text-lg mt-4 max-w-2xl">
              Have questions, suggestions, or need assistance? We're here to help. 
              Reach out through any of the channels below.
            </p>
          </div>

          {/* Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* WhatsApp Channel */}
            <a
              href="https://whatsapp.com/channel/0029VaEGsli6LwHnfhKhO81k"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] hover:border-emerald-500/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <MessageCircle size={24} className="text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">WhatsApp Channel</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Follow our WhatsApp channel for instant job updates, career tips, 
                and opportunity alerts.
              </p>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider group-hover:gap-2 transition-all">
                Follow Channel
                <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </a>

            {/* Facebook Page */}
            <a
              href="https://www.facebook.com/J2Accessories"
              target="_blank"
              rel="noopener noreferrer"
              className="group p-6 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] hover:border-blue-500/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Facebook size={24} className="text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Facebook Page</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Like and follow our Facebook page for job postings, updates, 
                and community discussions.
              </p>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-400 uppercase tracking-wider group-hover:gap-2 transition-all">
                Visit Page
                <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </a>

            {/* Email */}
            <a
              href="mailto:jjovinatha@gmail.com"
              className="group p-6 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] hover:border-violet-500/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mail size={24} className="text-violet-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Email Us</h3>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                Send us an email for inquiries, support, advertising, 
                partnerships, or to report issues.
              </p>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-violet-400 uppercase tracking-wider group-hover:gap-2 transition-all">
                Send Email
                <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </span>
            </a>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email Detail */}
            <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                <Mail size={18} className="text-violet-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Email</h4>
                <a href="mailto:jjovinatha@gmail.com" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  jjovinatha@gmail.com
                </a>
                <p className="text-[10px] text-gray-500 mt-1">Response within 24-48 hours</p>
              </div>
            </div>

            {/* Phone */}
            <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Phone size={18} className="text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Phone / WhatsApp</h4>
                <a href="tel:+255616069692" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                  +255 616 069 692
                </a>
                <p className="text-[10px] text-gray-500 mt-1">Available during business hours</p>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <MapPin size={18} className="text-amber-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Location</h4>
              <p className="text-xs text-gray-400">Dar es Salaam, Tanzania</p>
              <p className="text-[10px] text-gray-500 mt-1">Serving job seekers across Tanzania and beyond</p>
            </div>
          </div>

          {/* What We Can Help With */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-6 bg-blue-500"></div>
              <h2 className="text-xl font-bold text-white">What We Can Help With</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { title: 'Job Inquiries', desc: 'Questions about specific job listings or application processes' },
                { title: 'Report Issues', desc: 'Report suspicious listings, scams, or inaccurate information' },
                { title: 'Advertising', desc: 'Advertise your job vacancies or promote your employer brand' },
                { title: 'Partnerships', desc: 'Partner with us to reach more job seekers across Tanzania' },
                { title: 'Technical Support', desc: 'Report bugs, broken links, or website issues' },
                { title: 'Feedback', desc: 'Suggestions to improve our platform and services' }
              ].map(item => (
                <div key={item.title} className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  <Shield size={14} className="text-blue-400 mb-2" />
                  <h3 className="text-xs font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Response Time */}
          <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <Clock size={18} className="text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Response Time</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                We strive to respond to all inquiries within 24-48 hours during business days. 
                WhatsApp and Facebook messages may receive faster responses.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center py-6 rounded-2xl bg-gradient-to-r from-blue-500/5 via-violet-500/5 to-emerald-500/5 border border-white/5">
            <h2 className="text-lg font-bold text-white mb-2">Ready to Connect?</h2>
            <p className="text-gray-400 text-sm mb-4">
              Choose your preferred channel and reach out today
            </p>
            <div className="flex items-center justify-center gap-3">
              <a
                href="https://whatsapp.com/channel/0029VaEGsli6LwHnfhKhO81k"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                WhatsApp Channel
              </a>
              <a
                href="mailto:jjovinatha@gmail.com"
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
              >
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
