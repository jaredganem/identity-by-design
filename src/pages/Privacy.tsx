import { Link } from "react-router-dom";

const Privacy = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="max-w-2xl mx-auto px-6 py-16 space-y-8">
      <div className="space-y-2">
        <Link to="/" className="text-sm text-primary hover:underline">← Back to App</Link>
        <h1 className="font-display text-3xl text-foreground">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: February 18, 2026</p>
      </div>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed normal-case tracking-normal">
        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">1. Information We Collect</h2>
          <p>When you use Identity by Design ("the App"), we may collect the following information:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong className="text-foreground">Contact Information:</strong> Name and email address provided during registration or lead capture.</li>
            <li><strong className="text-foreground">Audio Recordings:</strong> Voice recordings you create within the App, stored securely in cloud storage associated with your account.</li>
            <li><strong className="text-foreground">Usage Data:</strong> Anonymous session identifiers, page views, feature usage events, device type, and browser information.</li>
            <li><strong className="text-foreground">Referral Data:</strong> Referral codes and UTM campaign parameters from your visit.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">2. How We Use Your Information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To provide and maintain the App's functionality, including saving and syncing your recordings.</li>
            <li>To communicate with you about your account, updates, and relevant content.</li>
            <li>To improve the App experience through analytics and usage patterns.</li>
            <li><strong className="text-foreground">Product Improvement:</strong> Anonymized transcription content from recordings may be analyzed in aggregate to identify common themes, improve affirmation prompts, and enhance the product. Individual recordings are never shared publicly or with third parties.</li>
            <li>To attribute referrals and track marketing campaign performance.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">3. Data Storage & Security</h2>
          <p>Your recordings and personal data are stored using industry-standard encrypted cloud infrastructure. Audio recordings are stored in private, user-scoped storage buckets accessible only to your authenticated account. We implement appropriate technical and organizational measures to protect your data.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">4. Data Sharing</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. We may share anonymized, aggregated data for analytics purposes. We use third-party service providers (cloud hosting, authentication) that process data on our behalf under strict data protection agreements.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction or deletion of your data.</li>
            <li>Export your recordings at any time.</li>
            <li>Withdraw consent for data processing.</li>
            <li>Request deletion of your account and all associated data.</li>
          </ul>
          <p>To exercise these rights, contact us at <a href="mailto:support@selfmasteryformen.com" className="text-primary hover:underline">support@selfmasteryformen.com</a>.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">6. Cookies & Local Storage</h2>
          <p>The App uses browser local storage and IndexedDB to cache recordings for offline access and improve performance. Session identifiers are stored to maintain your experience across visits. No third-party advertising cookies are used.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">7. Children's Privacy</h2>
          <p>The App is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from minors.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">8. California Residents (CCPA)</h2>
          <p>If you are a California resident, you have the right to know what personal information we collect, request deletion of your data, and opt out of the sale of personal information. We do not sell personal information.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">9. European Residents (GDPR)</h2>
          <p>If you are located in the European Economic Area, we process your data based on legitimate interest (providing the service) and your explicit consent (for recording and data collection). You may withdraw consent at any time by contacting us.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">10. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page with an updated revision date.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">11. Contact</h2>
          <p>For questions about this Privacy Policy, contact us at <a href="mailto:support@selfmasteryformen.com" className="text-primary hover:underline">support@selfmasteryformen.com</a>.</p>
        </section>
      </div>
    </div>
  </div>
);

export default Privacy;
