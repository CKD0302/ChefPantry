import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = "Privacy Policy | Chef Pantry";
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-poppins font-bold text-neutral-900 mb-2">Privacy Policy</h1>
          <p className="text-neutral-500 mb-8">Last updated: January 2026</p>
          
          <div className="prose prose-neutral max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-poppins font-semibold text-neutral-900 mb-4">1. Who we are</h2>
              <p className="text-neutral-700 mb-4">
                Chef Pantry ("we", "us", "our") is a platform that connects culinary professionals with hospitality businesses looking for freelance or flexible chef talent.
              </p>
              <p className="text-neutral-700 mb-4">
                We are the data controller for the personal data we collect through our website, web application and related services.
              </p>
              <p className="text-neutral-700 mb-4">
                If you have any questions about this policy or how we handle your data, you can contact us at:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li>Email: privacy@thechefpantry.co</li>
                <li>Country: United Kingdom</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-poppins font-semibold text-neutral-900 mb-4">2. What this policy covers</h2>
              <p className="text-neutral-700 mb-4">
                This Privacy Policy explains how we collect, use, store and share your personal data when you:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li>Visit thechefpantry.co or any subdomains</li>
                <li>Create an account as a chef or a business</li>
                <li>Use the Chef Pantry platform to find work, post jobs, or manage bookings</li>
                <li>Communicate with us by email, contact forms or social media</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-poppins font-semibold text-neutral-900 mb-4">3. The data we collect</h2>
              <p className="text-neutral-700 mb-4">
                We may collect and process the following types of data:
              </p>
              
              <h3 className="text-xl font-poppins font-medium text-neutral-800 mt-6 mb-3">3.1 Information you provide to us directly</h3>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li><strong>Account details:</strong> name, email address, password, profile photo.</li>
                <li><strong>Profile information (chefs):</strong> skills, experience, qualifications, availability, location (city/region), rates and other details you choose to include.</li>
                <li><strong>Business information (clients):</strong> business name, contact name, role, business contact details, venue information.</li>
                <li><strong>Communication data:</strong> messages you send via contact forms or direct emails, feedback you provide, support queries.</li>
                <li><strong>Application and booking data:</strong> information related to jobs you apply for or post, and any relevant details you provide.</li>
              </ul>

              <h3 className="text-xl font-poppins font-medium text-neutral-800 mt-6 mb-3">3.2 Information we collect automatically</h3>
              <p className="text-neutral-700 mb-2">When you visit our website or app, we may automatically collect:</p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li><strong>Usage data:</strong> pages viewed, buttons clicked, referral URLs, time spent on the site.</li>
                <li><strong>Device and technical data:</strong> IP address, browser type, operating system, device type.</li>
                <li><strong>Cookie data:</strong> information stored in cookies and similar technologies (see Cookies section).</li>
              </ul>

              <h3 className="text-xl font-poppins font-medium text-neutral-800 mt-6 mb-3">3.3 Information from third parties</h3>
              <p className="text-neutral-700 mb-2">We may receive information about you from:</p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li>Authentication providers or single sign-on services (if used).</li>
                <li>Payment providers or invoicing tools (if integrated in future).</li>
                <li>Analytics and error monitoring tools that help us understand usage and stability.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-poppins font-semibold text-neutral-900 mb-4">4. How we use your data</h2>
              <p className="text-neutral-700 mb-4">
                We use your personal data for the following purposes:
              </p>

              <h3 className="text-xl font-poppins font-medium text-neutral-800 mt-6 mb-3">4.1 To operate and provide the Chef Pantry service</h3>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li>Creating and managing user accounts.</li>
                <li>Allowing chefs to build profiles that businesses can view.</li>
                <li>Allowing businesses to post roles, view chef profiles and manage bookings.</li>
                <li>Sending necessary service emails, such as account verification, security alerts or important platform updates.</li>
              </ul>

              <h3 className="text-xl font-poppins font-medium text-neutral-800 mt-6 mb-3">4.2 To improve and secure our platform</h3>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li>Monitoring performance, usage patterns and stability.</li>
                <li>Detecting, preventing and addressing technical issues or misuse.</li>
                <li>Developing new features and improving user experience.</li>
              </ul>

              <h3 className="text-xl font-poppins font-medium text-neutral-800 mt-6 mb-3">4.3 To communicate with you</h3>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li>Responding to your messages, questions and support requests.</li>
                <li>Sending information about changes to our terms, policies or services.</li>
                <li>With your consent, sending optional updates or news about Chef Pantry.</li>
              </ul>

              <h3 className="text-xl font-poppins font-medium text-neutral-800 mt-6 mb-3">4.4 Legal and compliance</h3>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li>Complying with legal obligations and regulatory requirements.</li>
                <li>Establishing, exercising or defending legal claims.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-poppins font-semibold text-neutral-900 mb-4">5. Legal bases for processing (UK and EU users)</h2>
              <p className="text-neutral-700 mb-4">
                If you are in the UK or EU, we rely on the following legal bases under UK GDPR / GDPR:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li><strong>Contract:</strong> where processing is necessary to provide our services (for example, creating an account, connecting chefs with businesses).</li>
                <li><strong>Legitimate interests:</strong> to operate, secure and improve the platform, prevent abuse and understand how users interact with it, where these interests are not overridden by your rights.</li>
                <li><strong>Consent:</strong> for optional uses such as certain cookies or marketing communications (where applicable). You can withdraw consent at any time.</li>
                <li><strong>Legal obligation:</strong> where we need to retain or share data to comply with legal or regulatory requirements.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-poppins font-semibold text-neutral-900 mb-4">6. How long we keep your data</h2>
              <p className="text-neutral-700 mb-4">
                We keep your personal data only for as long as it is needed for the purposes described in this policy, including:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li>For as long as you have an active account.</li>
                <li>For a reasonable period afterwards, where we have a legitimate need (for example, to keep records for legal, accounting or fraud-prevention purposes).</li>
              </ul>
              <p className="text-neutral-700 mb-4">
                We will either anonymise or securely delete data when it is no longer required.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-poppins font-semibold text-neutral-900 mb-4">7. Sharing your data</h2>
              <p className="text-neutral-700 mb-4">
                <strong>We do not sell your personal data.</strong>
              </p>
              <p className="text-neutral-700 mb-4">We may share your data with:</p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li><strong>Service providers and processors</strong> who help us run our platform (for example: hosting providers, email service providers, analytics tools, error monitoring, or authentication services). These providers only process your data on our instructions and under appropriate data protection agreements.</li>
                <li><strong>Other users of the platform,</strong> to the extent necessary to provide the service:
                  <ul className="list-disc pl-6 mt-2">
                    <li>Chefs: your profile and information you choose to share may be visible to registered businesses.</li>
                    <li>Businesses: certain business details may be shown to chefs where needed for job applications or bookings.</li>
                  </ul>
                </li>
                <li><strong>Professional advisers</strong> (such as lawyers or accountants), where necessary.</li>
                <li><strong>Authorities or regulators,</strong> if required by law or to protect our rights or the rights of others.</li>
              </ul>
              <p className="text-neutral-700 mb-4">
                If we undergo a business change, such as a merger, acquisition or asset sale, your data may be transferred as part of that transaction, subject to the same protections.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-poppins font-semibold text-neutral-900 mb-4">8. International transfers</h2>
              <p className="text-neutral-700 mb-4">
                Our service providers may be located in other countries. Where personal data is transferred outside the UK or EU, we will take appropriate steps to ensure that an equivalent level of protection is in place, such as using standard contractual clauses approved by regulators.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-poppins font-semibold text-neutral-900 mb-4">9. Cookies and similar technologies</h2>
              <p className="text-neutral-700 mb-4">We may use cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li>Keep you logged in and remember your preferences.</li>
                <li>Understand how visitors interact with our site and improve performance.</li>
                <li>Support security and fraud prevention.</li>
              </ul>
              <p className="text-neutral-700 mb-4">
                You can usually control cookies through your browser settings. Some cookies are essential for the site to function and cannot be disabled without affecting basic functionality.
              </p>
              <p className="text-neutral-700 mb-4">
                If we provide a separate Cookie Policy, that document will give more detail about the cookies we use.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-poppins font-semibold text-neutral-900 mb-4">10. Your rights (UK and EU users)</h2>
              <p className="text-neutral-700 mb-4">
                If you are in the UK or EU, you have the following rights over your personal data:
              </p>
              <ul className="list-disc pl-6 text-neutral-700 mb-4">
                <li><strong>Access:</strong> to request a copy of the personal data we hold about you.</li>
                <li><strong>Rectification:</strong> to ask us to correct inaccurate or incomplete data.</li>
                <li><strong>Erasure:</strong> to request deletion of your data in certain circumstances.</li>
                <li><strong>Restriction:</strong> to ask us to limit how we use your data in certain cases.</li>
                <li><strong>Objection:</strong> to object to processing based on our legitimate interests.</li>
                <li><strong>Data portability:</strong> to request a copy of your data in a usable format and, where feasible, to have it transferred to another service.</li>
              </ul>
              <p className="text-neutral-700 mb-4">
                To exercise any of these rights, contact us using the details above. We may need to verify your identity before responding.
              </p>
              <p className="text-neutral-700 mb-4">
                You also have the right to lodge a complaint with your local data protection authority. In the UK, this is the Information Commissioner's Office (ICO).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-poppins font-semibold text-neutral-900 mb-4">11. Children</h2>
              <p className="text-neutral-700 mb-4">
                Chef Pantry is not intended for children under 18, and we do not knowingly collect personal data from children. If you believe a child has provided us with personal data, please contact us so we can delete it.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-poppins font-semibold text-neutral-900 mb-4">12. Links to other websites</h2>
              <p className="text-neutral-700 mb-4">
                Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of those third parties. We encourage you to read the privacy policies of any site you visit.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-poppins font-semibold text-neutral-900 mb-4">13. Changes to this policy</h2>
              <p className="text-neutral-700 mb-4">
                We may update this Privacy Policy from time to time to reflect changes to our services, legal requirements or how we process data. When we make material changes, we will update the "Last updated" date at the top of this page.
              </p>
              <p className="text-neutral-700 mb-4">
                We encourage you to review this policy periodically to stay informed about how we protect your data.
              </p>
            </section>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
