import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function PrivacyPolicyPage() {
  return (
    <>
      <SEO
        title="Privacy Policy | JobsReport.online"
        description="Read the Privacy Policy of JobsReport.online to understand how we collect, use, protect and manage personal information, cookies, analytics, advertisements and notifications."
        keywords="Privacy Policy, JobsReport.online, job website privacy policy, Tanzania jobs, data protection, cookies policy"
        canonicalUrl="https://jobsreport.online/privacy-policy"
        ogTitle="Privacy Policy | JobsReport.online"
        ogDescription="Learn how JobsReport.online collects, uses, protects and manages personal information and website data."
        ogUrl="https://jobsreport.online/privacy-policy"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Privacy Policy",
          "description": "Privacy Policy for JobsReport.online explaining how personal information is collected, used, stored, and protected.",
          "url": "https://jobsreport.online/privacy-policy",
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
          <span className="text-blue-400">Privacy Policy</span>
        </div>

        <div className="max-w-4xl space-y-6">
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tighter">
            Privacy Policy
          </h1>

          <p className="text-gray-500 text-xs font-mono">
            Last Updated: June 14, 2026
          </p>

          <p className="text-gray-400 text-sm leading-relaxed">
            JobsReport.online (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;) values your privacy and is
            committed to protecting your personal information. This Privacy Policy
            explains how we collect, use, disclose, and safeguard information
            when you access or use our website, services, job listings,
            notifications, and related features.
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white mt-8">1. Information We Collect</h2>
            <p className="text-gray-400 text-sm">
              We may collect information directly from users, automatically through
              website usage, and from third-party service providers.
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400 text-sm">
              <li>Name and email address when contacting us.</li>
              <li>Browser type, operating system, and device information.</li>
              <li>IP address and approximate geographic location.</li>
              <li>Website usage statistics and analytics data.</li>
              <li>Notification subscription preferences.</li>
              <li>Information submitted through forms and feedback channels.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white mt-8">2. How We Use Your Information</h2>
            <p className="text-gray-400 text-sm">
              We use collected information for legitimate business purposes, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-400 text-sm">
              <li>Providing job listings and career opportunities.</li>
              <li>Improving website functionality and user experience.</li>
              <li>Sending job alerts and platform notifications.</li>
              <li>Monitoring website performance and security.</li>
              <li>Preventing abuse, fraud, and unauthorized access.</li>
              <li>Complying with legal obligations.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white mt-8">3. Cookies and Tracking Technologies</h2>
            <p className="text-gray-400 text-sm">
              JobsReport.online may use cookies, local storage, analytics tools,
              and similar technologies to improve performance, remember user
              preferences, analyze traffic patterns, and personalize content.
              Users can manage cookie preferences through browser settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white mt-8">4. Google AdSense and Advertising</h2>
            <p className="text-gray-400 text-sm">
              We may display advertisements through Google AdSense and other
              advertising networks. These providers may use cookies and similar
              technologies to deliver relevant advertisements based on browsing
              behavior and interests. Third-party advertising partners may collect
              information according to their own privacy policies.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white mt-8">5. Analytics Services</h2>
            <p className="text-gray-400 text-sm">
              We may use analytics tools, including Google Analytics, to understand
              visitor behavior, monitor website performance, and improve our
              services. Analytics providers may collect anonymized information about
              interactions with our website.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white mt-8">6. Push Notifications</h2>
            <p className="text-gray-400 text-sm">
              If you subscribe to push notifications, we may send updates regarding
              job opportunities, career news, platform announcements, and related
              information. You may unsubscribe at any time through browser or device
              notification settings.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white mt-8">7. Third-Party Links</h2>
            <p className="text-gray-400 text-sm">
              Job listings may contain links to external employer websites,
              application portals, and third-party services. We do not control and
              are not responsible for the privacy practices or content of those
              websites.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white mt-8">8. Data Security</h2>
            <p className="text-gray-400 text-sm">
              We implement reasonable technical and organizational measures to
              protect information from unauthorized access, alteration, disclosure,
              or destruction. However, no online platform can guarantee absolute
              security.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white mt-8">9. Data Retention</h2>
            <p className="text-gray-400 text-sm">
              Information is retained only for as long as necessary to fulfill the
              purposes described in this policy, comply with legal obligations,
              resolve disputes, and enforce agreements.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white mt-8">10. User Rights</h2>
            <p className="text-gray-400 text-sm">
              Depending on applicable laws, users may have rights to request access
              to, correction of, or deletion of personal information. Requests may
              be submitted through our contact channels.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white mt-8">11. Children&apos;s Privacy</h2>
            <p className="text-gray-400 text-sm">
              JobsReport.online is intended for general audiences seeking employment
              information and is not directed toward children under the age of 13.
              We do not knowingly collect personal information from children.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white mt-8">12. Changes to This Privacy Policy</h2>
            <p className="text-gray-400 text-sm">
              We may update this Privacy Policy from time to time. Updates will be
              posted on this page together with the revised effective date.
              Continued use of the website after updates constitutes acceptance of
              the revised policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white mt-8">13. Contact Us</h2>
            <p className="text-gray-400 text-sm">
              If you have questions regarding this Privacy Policy or your personal
              information, please contact us at{' '}
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
