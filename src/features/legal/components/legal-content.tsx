export type LegalPageType = "terms" | "cookies" | "privacy"

export const LEGAL_CONFIG: Record<LegalPageType, { titleKey: string }> = {
  terms: { titleKey: "legal.termsTitle" },
  cookies: { titleKey: "legal.cookiesTitle" },
  privacy: { titleKey: "legal.privacyTitle" },
}

export function TermsContent() {
  return (
    <div className="space-y-6 text-sm text-foreground-2 leading-relaxed">
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground-1">1. Introduction</h2>
        <p>
          Welcome to our platform. These Terms and Conditions govern your use of our website and
          services. By accessing or using our platform, you agree to be bound by these terms. If you
          do not agree, please do not use our services.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground-1">2. Use of Services</h2>
        <p>
          You agree to use our services only for lawful purposes and in accordance with these terms.
          You are responsible for maintaining the confidentiality of your account credentials and for
          all activities that occur under your account.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground-1">3. Account Registration</h2>
        <p>
          To access certain features, you must register an account. You agree to provide accurate,
          current, and complete information during registration and to update such information to
          keep it accurate, current, and complete.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground-1">4. Intellectual Property</h2>
        <p>
          All content, features, and functionality of our platform are owned by us and are protected
          by international copyright, trademark, patent, trade secret, and other intellectual
          property laws.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground-1">5. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by applicable law, we shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages, or any loss of profits or
          revenues.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground-1">6. Changes to Terms</h2>
        <p>
          We reserve the right to modify these terms at any time. We will notify you of any changes
          by posting the new terms on this page and updating the "Last updated" date.
        </p>
      </section>
    </div>
  )
}

export function CookiesContent() {
  return (
    <div className="space-y-6 text-sm text-foreground-2 leading-relaxed">
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground-1">1. What Are Cookies</h2>
        <p>
          Cookies are small text files that are placed on your device when you visit our website.
          They help us provide you with a better experience by remembering your preferences and
          understanding how you use our platform.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground-1">2. Types of Cookies We Use</h2>
        <p>
          <strong className="text-foreground-1">Essential Cookies:</strong> Required for the platform to
          function properly. These cannot be disabled.
        </p>
        <p>
          <strong className="text-foreground-1">Analytics Cookies:</strong> Help us understand how
          visitors interact with our platform by collecting and reporting information anonymously.
        </p>
        <p>
          <strong className="text-foreground-1">Functional Cookies:</strong> Enable enhanced functionality
          and personalization, such as remembering your language preference.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground-1">3. Managing Cookies</h2>
        <p>
          You can control and manage cookies through your browser settings. Please note that
          removing or blocking certain cookies may impact your experience on our platform.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground-1">4. Third-Party Cookies</h2>
        <p>
          Some cookies are placed by third-party services that appear on our pages. We do not
          control these cookies and recommend reviewing the respective third-party privacy policies.
        </p>
      </section>
    </div>
  )
}

export function PrivacyContent() {
  return (
    <div className="space-y-6 text-sm text-foreground-2 leading-relaxed">
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground-1">1. Information We Collect</h2>
        <p>
          We collect information you provide directly, such as your name, email address, and account
          details. We also collect information automatically when you use our platform, including
          usage data and device information.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground-1">2. How We Use Your Information</h2>
        <p>
          We use collected information to provide and improve our services, communicate with you,
          ensure security, and comply with legal obligations. We do not sell your personal
          information to third parties.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground-1">3. Data Storage and Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your personal
          data against unauthorized access, alteration, disclosure, or destruction.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground-1">4. Your Rights</h2>
        <p>
          You have the right to access, correct, or delete your personal data. You may also request
          data portability or object to processing. Contact us to exercise any of these rights.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground-1">5. Data Retention</h2>
        <p>
          We retain your personal data only for as long as necessary to fulfill the purposes for
          which it was collected, including to satisfy any legal, accounting, or reporting
          requirements.
        </p>
      </section>
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-foreground-1">6. Contact Us</h2>
        <p>
          If you have any questions about this Confidentiality Policy, please contact us through the
          support channels available on our platform.
        </p>
      </section>
    </div>
  )
}

export const CONTENT_MAP: Record<LegalPageType, React.FC> = {
  terms: TermsContent,
  cookies: CookiesContent,
  privacy: PrivacyContent,
}
