export const metadata = {
  title: "Cookie Policy — ORTHO-PAY",
  description: "Cookie Policy for ORTHO-PAY escrow payment platform. GDPR compliant.",
};

export default function CookiePage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0a0a", fontFamily: "var(--font-body)" }}>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-16" style={{ maxWidth: "800px" }}>
        <h1 className="font-display text-3xl font-bold mb-2" style={{ color: "#ffffff" }}>
          Cookie Policy
        </h1>
        <p className="text-sm mb-12" style={{ color: "rgba(255,255,255,0.4)" }}>
          Last updated: July 24, 2026
        </p>

        <div className="flex flex-col gap-8" style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.7, fontSize: 15 }}>
          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>1. What Are Cookies</h2>
            <p>Cookies are small text files stored on your device when you visit a website. They help us authenticate your session, remember preferences, and understand how you use our Service. This policy explains what cookies we use and how you can control them, in compliance with the GDPR ePrivacy Directive.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>2. Types of Cookies We Use</h2>
            <p><strong style={{ color: "#ffffff" }}>Essential cookies:</strong> Required for the Service to function. These include authentication session tokens, security tokens, and CSRF protection. Without these, you cannot log in or use the Service.</p>
            <p><strong style={{ color: "#ffffff" }}>Functional cookies:</strong> Remember your preferences such as theme selection (light/dark mode) and language. These are optional.</p>
            <p><strong style={{ color: "#ffffff" }}>Analytics cookies:</strong> Help us understand how visitors use our website so we can improve it. These are only set with your consent.</p>
            <p><strong style={{ color: "#ffffff" }}>Marketing cookies:</strong> Used to deliver relevant advertisements. These are only set with your explicit consent and can be withdrawn at any time.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>3. Cookie Duration</h2>
            <p><strong style={{ color: "#ffffff" }}>Session cookies:</strong> Deleted when you close your browser. Used for authentication during your active session.</p>
            <p><strong style={{ color: "#ffffff" }}>Persistent cookies:</strong> Remain on your device until they expire or you delete them. Used for remembering preferences (e.g., theme: 365 days).</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>4. Third-Party Cookies</h2>
            <p>We do not allow third-party advertising networks to set cookies on our Service. Any third-party services we use (such as analytics or payment processors) operate under their own privacy policies and require your consent before setting cookies.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>5. Managing Cookies</h2>
            <p>You can control and delete cookies through your browser settings. Disabling essential cookies will prevent you from logging in or using the Service. Disabling non-essential cookies will not affect core functionality. Most browsers allow you to: view all cookies; delete individual cookies; block cookies from specific sites; block all cookies; delete all cookies when closing the browser.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>6. Your Consent</h2>
            <p>Under the GDPR ePrivacy Directive, we require your consent before setting non-essential cookies. When you first visit our website, you will be presented with a cookie consent banner allowing you to accept or reject non-essential cookies. You can change your preference at any time.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>7. Updates to This Policy</h2>
            <p>We may update this Cookie Policy when we add, remove, or change cookies. Material changes will be notified on the website.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>8. Contact</h2>
            <p>For questions about our use of cookies, contact <span style={{ color: "var(--color-primary)" }}>privacy@ortho-pay.com</span>.</p>
          </section>
        </div>

        <div className="mt-12 pt-8" style={{ borderTop: "1px solid #262626" }}>
          <a href="/" className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>← Back to home</a>
        </div>
      </div>
    </div>
  );
}
