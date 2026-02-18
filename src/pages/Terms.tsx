import { Link } from "react-router-dom";

const Terms = () => (
  <div className="min-h-screen bg-background text-foreground">
    <div className="max-w-2xl mx-auto px-6 py-16 space-y-8">
      <div className="space-y-2">
        <Link to="/" className="text-sm text-primary hover:underline">← Back to App</Link>
        <h1 className="font-display text-3xl text-foreground">Terms of Service</h1>
        <p className="text-sm text-muted-foreground">Last updated: February 18, 2026</p>
      </div>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed normal-case tracking-normal">
        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">1. Acceptance of Terms</h2>
          <p>By accessing or using Identity by Design ("the App"), you agree to be bound by these Terms of Service. If you do not agree, do not use the App.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">2. Description of Service</h2>
          <p>The App provides tools for recording, mixing, and playing personal affirmation audio programs. The App is provided "as is" and is intended for personal development purposes only. It is not a substitute for professional medical, psychological, or therapeutic advice.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">3. User Accounts & Content</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You retain ownership of all audio recordings and content you create within the App.</li>
            <li>By using the App, you grant us a limited license to process, store, and transmit your content solely for the purpose of providing the service.</li>
            <li>You grant us permission to analyze anonymized, aggregated transcription data to improve the product and inform content development, as described in our <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">4. Purchases & Refunds</h2>
          <p>Paid tiers (Pro and Elite) are one-time purchases that grant lifetime access to the specified features. All purchases are final. If you experience technical issues preventing access to purchased features, contact us for support.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">5. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Use the App for any unlawful purpose.</li>
            <li>Attempt to reverse engineer, decompile, or extract source code from the App.</li>
            <li>Upload content that infringes on third-party intellectual property rights.</li>
            <li>Attempt to gain unauthorized access to other users' accounts or data.</li>
            <li>Use the App to distribute spam or unsolicited communications.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">6. Intellectual Property</h2>
          <p>The App, including its design, code, branding, and default affirmation prompts, is the intellectual property of Self-Mastery for Men™. The 417Hz frequency audio and guided affirmation framework are proprietary. You may not reproduce, distribute, or create derivative works from the App's proprietary content.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">7. Disclaimer of Warranties</h2>
          <p>The App is provided "as is" without warranties of any kind, express or implied. We do not guarantee specific results from using the App. Personal development outcomes vary based on individual effort, consistency, and circumstances.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">8. Limitation of Liability</h2>
          <p>To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App, including but not limited to loss of data or recordings.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">9. Termination</h2>
          <p>We reserve the right to suspend or terminate your access to the App at our discretion if you violate these Terms. You may delete your account at any time by contacting us.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">10. Changes to Terms</h2>
          <p>We may modify these Terms at any time. Continued use of the App after changes constitutes acceptance of the updated Terms.</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-display text-foreground">11. Contact</h2>
          <p>For questions about these Terms, contact us at <a href="mailto:support@selfmasteryformen.com" className="text-primary hover:underline">support@selfmasteryformen.com</a>.</p>
        </section>
      </div>
    </div>
  </div>
);

export default Terms;
