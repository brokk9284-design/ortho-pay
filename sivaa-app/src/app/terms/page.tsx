export const metadata = {
  title: "Terms & Conditions — ORTHO-PAY",
  description: "Terms and Conditions for ORTHO-PAY escrow payment platform.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a0a0a", fontFamily: "var(--font-body)" }}>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-16" style={{ maxWidth: "800px" }}>
        <h1 className="font-display text-3xl font-bold mb-2" style={{ color: "#ffffff" }}>
          Terms &amp; Conditions
        </h1>
        <p className="text-sm mb-12" style={{ color: "rgba(255,255,255,0.4)" }}>
          Last updated: July 24, 2026
        </p>

        <div className="flex flex-col gap-8" style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.7, fontSize: 15 }}>
          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>1. Acceptance of Terms</h2>
            <p>By creating an account or using ORTHO-PAY (&quot;the Service&quot;), you agree to be bound by these Terms &amp; Conditions. If you do not agree, you must not register or use the Service. These terms constitute a legally binding agreement between you and ORTHO-PAY Inc. (&quot;ORTHO-PAY&quot;, &quot;we&quot;, &quot;us&quot;).</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>2. Eligibility</h2>
            <p>You must be at least 18 years old and legally capable of entering into binding contracts. By registering, you confirm that you meet these requirements. You are responsible for maintaining the accuracy of your account information.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>3. Escrow Service</h2>
            <p>ORTHO-PAY provides an escrow-based payment service. When you send money to a $paytag, funds are debited from your wallet and held in escrow. Our admin team reviews every transaction. Approved transactions release funds to the receiver. Rejected transactions refund the sender in full. ORTHO-PAY reserves the right to approve or reject any transaction at its sole discretion.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>4. KYC (Know Your Customer)</h2>
            <p>To use the Service for sending and receiving payments, you must complete identity verification by submitting at least one valid government-issued document. Accepted document types include passport, driver&apos;s license, utility bill, or bank statement. Your document will be reviewed by our compliance team. You will be notified of the outcome via email and in-app notification. Unverified accounts cannot send or receive payments.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>5. Fees</h2>
            <p>Transaction fees are based on the transaction amount: 3% for amounts under $50, 2% for $50–$499.99, and 1% for $500 and above. All transactions are in USD. Subscription plans (Business: $29/month, Enterprise: $199/month) offer reduced transaction fees. Fees are non-refundable once a transaction is approved.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>6. Prohibited Activities</h2>
            <p>You agree not to use the Service for: (a) illegal activities including money laundering, fraud, or terrorism financing; (b) purchasing or selling illegal goods or services; (c) circumventing escrow review processes; (d) creating multiple accounts to evade restrictions; (e) attempting to reverse, chargeback, or dispute approved transactions. Violations may result in account suspension, fund freezing, and legal action.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>7. Account Security</h2>
            <p>You are responsible for safeguarding your password, PIN, and 2FA codes. ORTHO-PAY will never ask for your password or PIN. Notify us immediately of any unauthorized access. We are not liable for losses resulting from your failure to protect your credentials.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>8. Limitation of Liability</h2>
            <p>ORTHO-PAY provides the Service on an &quot;as is&quot; and &quot;as available&quot; basis. We are not liable for indirect, incidental, or consequential damages arising from your use of the Service. Our maximum liability for any claim is limited to the total fees you have paid in the preceding 12 months.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>9. Account Suspension &amp; Termination</h2>
            <p>We may suspend or terminate your account at any time for violations of these Terms, suspicious activity, or legal requirements. Upon termination, any funds held in escrow will be processed according to their transaction status. Verified balances will be returned to you within 30 days, less any applicable fees.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>10. Governing Law</h2>
            <p>These Terms are governed by applicable international financial regulations, including the General Data Protection Regulation (GDPR) and the Nigeria Data Protection Regulation (NDPR). Disputes shall be resolved through binding arbitration.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>11. Changes to Terms</h2>
            <p>We may update these Terms at any time. Material changes will be notified via email and in-app notification. Continued use of the Service after changes constitutes acceptance of the updated Terms.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-semibold mb-3" style={{ color: "#ffffff" }}>12. Contact</h2>
            <p>For questions regarding these Terms, contact us at <span style={{ color: "var(--color-primary)" }}>legal@ortho-pay.com</span>.</p>
          </section>
        </div>

        <div className="mt-12 pt-8" style={{ borderTop: "1px solid #262626" }}>
          <a href="/" className="text-sm font-medium" style={{ color: "var(--color-primary)" }}>← Back to home</a>
        </div>
      </div>
    </div>
  );
}
