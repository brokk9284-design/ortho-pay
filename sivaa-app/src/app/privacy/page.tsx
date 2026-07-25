export const metadata = {
  title: "Privacy Policy — ORTHO-PAY",
  description: "Privacy Policy for ORTHO-PAY escrow payment platform. GDPR and NDPR compliant.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0a0a", fontFamily: "var(--font-body)" }}>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-16" style={{ maxWidth: "800px" }}>
        <h1 className="font-display text-3xl font-bold mb-2" style={{ color: "#ffffff" }}>
          Privacy Policy
        </h1>
        <p className="text-sm mb-12" style={{ color: "rgba(255,255,255,0.4)" }}>
          Last updated: July 24, 2026
        </p>

        <div className="flex flex-col gap-8" style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.7, fontSize: 15 }}>
          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>1. Introduction</h2>
            <p>ORTHO-PAY Inc. (&quot;we&quot;, &quot;us&quot;) is committed to protecting your personal data. This Privacy Policy explains how we collect, use, store, and protect your information in compliance with the General Data Protection Regulation (GDPR) and the Nigeria Data Protection Regulation (NDPR).</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>2. Data We Collect</h2>
            <p><strong style={{ color: "#ffffff" }}>Account data:</strong> Name, email, phone number, country, $ORTHO tag, password (hashed).</p>
            <p><strong style={{ color: "#ffffff" }}>KYC data:</strong> Government-issued identity documents (passport, driver&apos;s license, utility bill, bank statement) uploaded for verification.</p>
            <p><strong style={{ color: "#ffffff" }}>Transaction data:</strong> Payment amounts, sender/receiver $ORTHO tags, timestamps, transaction status, escrow review notes.</p>
            <p><strong style={{ color: "#ffffff" }}>Technical data:</strong> IP address, browser type, device information, session logs.</p>
            <p><strong style={{ color: "#ffffff" }}>Marketing data:</strong> Your consent preference for receiving promotional communications.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>3. Legal Basis for Processing (GDPR Article 6)</h2>
            <p>We process your personal data under the following legal bases:</p>
            <p><strong style={{ color: "#ffffff" }}>(a) Contractual necessity:</strong> To provide the escrow payment service you requested.</p>
            <p><strong style={{ color: "#ffffff" }}>(b) Legal obligation:</strong> To comply with KYC/AML regulations, tax reporting, and law enforcement requests.</p>
            <p><strong style={{ color: "#ffffff" }}>(c) Legitimate interest:</strong> To prevent fraud, secure the platform, and improve our services.</p>
            <p><strong style={{ color: "#ffffff" }}>(d) Consent:</strong> For marketing communications and optional data collection. You may withdraw consent at any time.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>4. NDPR Compliance</h2>
            <p>In compliance with the Nigeria Data Protection Regulation (NDPR) and the Data Protection Act 2023, we ensure that: your data is processed lawfully and fairly; data collection is limited to what is necessary; your data is not retained longer than required; appropriate security measures are in place; and you have the right to access, correct, and delete your personal data. We have appointed a Data Protection Officer (DPO) who can be reached at <span style={{ color: "var(--color-primary)" }}>dpo@ortho-pay.com</span>.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>5. How We Use Your Data</h2>
            <p>We use your personal data to: verify your identity (KYC); process and review escrow transactions; maintain wallet balances and transaction history; prevent fraud and money laundering; send service notifications (transaction updates, security alerts); send marketing communications (only with your explicit consent); comply with legal and regulatory requirements.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>6. Data Sharing</h2>
            <p>We do not sell your personal data. We may share data with: regulatory authorities when legally required; law enforcement agencies for fraud or criminal investigations; payment processing partners for transaction execution; cloud storage providers for document storage. All third parties are bound by confidentiality agreements.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>7. Data Retention</h2>
            <p>Account data is retained for the duration of your account plus 7 years for regulatory compliance. KYC documents are retained for 5 years after account closure. Transaction records are retained for 7 years. Marketing data is retained until you withdraw consent or request deletion.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>8. Your Rights (GDPR &amp; NDPR)</h2>
            <p>You have the right to: <strong style={{ color: "#ffffff" }}>access</strong> your personal data; <strong style={{ color: "#ffffff" }}>rectify</strong> inaccurate data; <strong style={{ color: "#ffffff" }}>erase</strong> your data (right to be forgotten); <strong style={{ color: "#ffffff" }}>restrict</strong> processing; <strong style={{ color: "#ffffff" }}>data portability</strong>; <strong style={{ color: "#ffffff" }}>object</strong> to processing; <strong style={{ color: "#ffffff" }}>withdraw consent</strong> at any time. To exercise these rights, contact <span style={{ color: "var(--color-primary)" }}>privacy@ortho-pay.com</span>.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>9. Data Security</h2>
            <p>We implement industry-standard security measures including: AES-256 encryption for data at rest; TLS 1.3 for data in transit; bcrypt password hashing; two-factor authentication (2FA); role-based access control; regular security audits. Despite these measures, no system is 100% secure. We will notify you of any data breach within 72 hours as required by GDPR Article 34.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>10. International Data Transfers</h2>
            <p>Your data may be processed in countries outside your residence. We ensure appropriate safeguards are in place, including Standard Contractual Clauses (SCCs) approved by the European Commission, and we only transfer data to countries deemed to provide adequate protection.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>11. Children&apos;s Privacy</h2>
            <p>The Service is not available to anyone under 18. We do not knowingly collect data from minors. If we become aware that a minor has registered, we will delete the account and associated data immediately.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>12. Changes to This Policy</h2>
            <p>We may update this Privacy Policy at any time. Material changes will be notified via email and in-app notification. Continued use of the Service after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>13. Contact</h2>
            <p>For privacy questions or to exercise your rights, contact our Data Protection Officer at <span style={{ color: "var(--color-primary)" }}>dpo@ortho-pay.com</span>.</p>
          </section>
        </div>

        <div className="mt-12 pt-8" style={{ borderTop: "1px solid #262626" }}>
          <a href="/" className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>← Back to home</a>
        </div>
      </div>
    </div>
  );
}
