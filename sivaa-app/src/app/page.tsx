import Link from "next/link";
import { Check } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--color-canvas)" }}>
      {/* 1. Header Navigation */}
      <header className="primary-nav">
        <Link href="/" className="primary-nav-logo">
          <span className="text-xl font-bold font-display tracking-tight" style={{ color: "var(--color-ink)" }}>
            ORTHO-PAY
          </span>
        </Link>

        <nav className="primary-nav-links">
          <Link href="#how-it-works" className="primary-nav-link">How it works</Link>
          <Link href="#pricing" className="primary-nav-link">Pricing</Link>
          <Link href="#faq" className="primary-nav-link">FAQ</Link>
        </nav>

        <div className="primary-nav-actions">
          <Link href="/login" className="btn btn-primary">
            Get started
          </Link>
          <Link href="/login" className="btn btn-secondary">
            Admin
          </Link>
        </div>
      </header>

      {/* 2. Hero + Content */}
      <main className="flex-1 w-full">
        {/* Hero */}
        <section className="mx-auto px-4 text-center flex flex-col items-center justify-center" style={{ maxWidth: "var(--space-content-max-width)", paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}>
          <div className="mb-8 rounded-full flex items-center justify-center" style={{ width: 80, height: 80, backgroundColor: "var(--color-ink)" }}>
            <span className="text-3xl font-display font-bold" style={{ color: "var(--color-canvas)" }}>$</span>
          </div>

          <h1 className="text-display-xl mb-4 max-w-[600px]" style={{ color: "var(--color-ink)" }}>
            Send money with confidence
          </h1>

          <p className="text-body-md mb-8 max-w-[500px]" style={{ color: "var(--color-body)" }}>
            ORTHO-PAY is an escrow payment platform for buyers and sellers. Send money to any $ORTHO tag — funds are held safely until our team verifies and approves the transaction.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-12">
            <Link href="/dashboard" className="btn btn-primary btn-lg">
              Get started
            </Link>
            <Link href="#how-it-works" className="btn btn-secondary btn-lg">
              See how it works
            </Link>
          </div>

          <div className="flex items-center gap-6 flex-wrap justify-center">
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-body)" }}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-code-sm" style={{ color: "var(--color-body)" }}>Escrow protected</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-body)" }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <span className="text-code-sm" style={{ color: "var(--color-body)" }}>USA &amp; England</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-body)" }}>
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span className="text-code-sm" style={{ color: "var(--color-body)" }}>USD only</span>
            </div>
          </div>
        </section>

        {/* 3. How It Works */}
        <section id="how-it-works" className="w-full" style={{ borderTop: "1px solid var(--color-hairline)", paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}>
          <div className="mx-auto px-4" style={{ maxWidth: "960px" }}>
            <h2 className="text-display-lg text-center mb-12" style={{ color: "var(--color-ink)" }}>
              How ORTHO-PAY works
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="mx-auto mb-4 rounded-full flex items-center justify-center" style={{ width: 56, height: 56, backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-ink)" }}>
                    <path d="M22 2L11 13" />
                    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </div>
                <h3 className="text-heading-sm mb-2" style={{ color: "var(--color-ink)" }}>Send to a $ORTHO tag</h3>
                <p className="text-body-sm" style={{ color: "var(--color-body)" }}>
                  Enter the recipient&apos;s $ORTHO tag and the amount. Funds are debited and held in escrow.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 rounded-full flex items-center justify-center" style={{ width: 56, height: 56, backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-ink)" }}>
                    <path d="M9 12l2 2 4-4" />
                    <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.39 0 4.68.94 6.36 2.64" />
                  </svg>
                </div>
                <h3 className="text-heading-sm mb-2" style={{ color: "var(--color-ink)" }}>Admin reviews &amp; approves</h3>
                <p className="text-body-sm" style={{ color: "var(--color-body)" }}>
                  Our team verifies every transaction. Approvals release funds; rejections refund the sender.
                </p>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-4 rounded-full flex items-center justify-center" style={{ width: 56, height: 56, backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-ink)" }}>
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <h3 className="text-heading-sm mb-2" style={{ color: "var(--color-ink)" }}>Receiver gets paid</h3>
                <p className="text-body-sm" style={{ color: "var(--color-body)" }}>
                  Once approved, funds are released from escrow and credited instantly to the receiver&apos;s wallet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. $ORTHO Tag Section */}
        <section className="w-full" style={{ borderTop: "1px solid var(--color-hairline)", paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}>
          <div className="mx-auto px-4 text-center" style={{ maxWidth: "var(--space-content-max-width)" }}>
            <div className="inline-flex items-center justify-center mb-6 rounded-full" style={{ width: 64, height: 64, backgroundColor: "var(--color-ink)" }}>
              <span className="text-2xl font-display font-bold" style={{ color: "var(--color-canvas)" }}>$</span>
            </div>
            <h2 className="text-display-lg mb-4" style={{ color: "var(--color-ink)" }}>
              Your $ORTHO tag is your identity
            </h2>
            <p className="text-body-md mb-8 max-w-[500px] mx-auto" style={{ color: "var(--color-body)" }}>
              Every ORTHO-PAY user gets a unique $ORTHO tag — like $alice or $bob. Share it to receive payments. No bank details, no phone numbers, just your tag.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="rounded-full px-6 py-3 flex items-center gap-2" style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
                <span className="font-display font-semibold" style={{ color: "var(--color-ink)" }}>$alice</span>
                <span className="text-code-sm" style={{ color: "var(--color-mute)" }}>— Verified</span>
              </div>
              <div className="rounded-full px-6 py-3 flex items-center gap-2" style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
                <span className="font-display font-semibold" style={{ color: "var(--color-ink)" }}>$bob</span>
                <span className="text-code-sm" style={{ color: "var(--color-mute)" }}>— Verified</span>
              </div>
              <div className="rounded-full px-6 py-3 flex items-center gap-2" style={{ backgroundColor: "var(--color-surface-soft)", border: "1px solid var(--color-hairline)" }}>
                <span className="font-display font-semibold" style={{ color: "var(--color-ink)" }}>$sarah</span>
                <span className="text-code-sm" style={{ color: "var(--color-mute)" }}>— Verified</span>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Security Section */}
        <section className="w-full" style={{ borderTop: "1px solid var(--color-hairline)", paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}>
          <div className="mx-auto px-4 text-center" style={{ maxWidth: "var(--space-content-max-width)" }}>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4" style={{ backgroundColor: "var(--color-surface-soft)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--color-ink)" }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h2 className="text-heading-lg mb-2" style={{ color: "var(--color-ink)" }}>Every transaction is escrow-protected</h2>
            <p className="text-body-md max-w-[500px] mx-auto" style={{ color: "var(--color-body)" }}>
              Funds never move directly between users. Every payment is held in escrow and reviewed by our admin team before release — protecting both buyers and sellers.
            </p>
          </div>
        </section>

        {/* 6. Pricing */}
        <section id="pricing" className="w-full" style={{ borderTop: "1px solid var(--color-hairline)", paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}>
          <div className="mx-auto px-4" style={{ maxWidth: "960px" }}>
            <h2 className="text-display-lg text-center mb-4" style={{ color: "var(--color-ink)" }}>
              Simple, transparent fees
            </h2>
            <p className="text-body-md text-center mb-12 max-w-[500px] mx-auto" style={{ color: "var(--color-body)" }}>
              Pay only when you send. No monthly fees, no hidden charges. All amounts in USD.
            </p>

            <div className="pricing-grid">
              {/* Personal */}
              <div className="pricing-card">
                <h3 className="pricing-card-tier-name">Personal</h3>
                <p className="pricing-card-description">For everyday payments between friends and small sellers.</p>
                <div className="pricing-card-price">
                  $0 <span className="pricing-card-period">/ month</span>
                </div>
                <div className="pricing-card-divider"></div>
                <div className="pricing-card-features-label">Includes:</div>
                <ul className="pricing-card-features">
                  <li className="feature-bullet"><span className="feature-bullet-check"><Check size={12} /></span> Free $ORTHO tag</li>
                  <li className="feature-bullet"><span className="feature-bullet-check"><Check size={12} /></span> Escrow-protected payments</li>
                  <li className="feature-bullet"><span className="feature-bullet-check"><Check size={12} /></span> 3% fee per transaction</li>
                </ul>
              </div>

              {/* Business */}
              <div className="pricing-card">
                <h3 className="pricing-card-tier-name">Business</h3>
                <p className="pricing-card-description">For growing businesses moving regular volume.</p>
                <div className="pricing-card-price">
                  $29 <span className="pricing-card-period">/ month</span>
                </div>
                <div className="pricing-card-divider"></div>
                <div className="pricing-card-features-label">Includes:</div>
                <ul className="pricing-card-features">
                  <li className="feature-bullet"><span className="feature-bullet-check"><Check size={12} /></span> Everything in Personal</li>
                  <li className="feature-bullet"><span className="feature-bullet-check"><Check size={12} /></span> Reduced 2% fee per transaction</li>
                  <li className="feature-bullet"><span className="feature-bullet-check"><Check size={12} /></span> Priority escrow review</li>
                </ul>
              </div>

              {/* Enterprise */}
              <div className="pricing-card-dark">
                <h3 className="pricing-card-tier-name">Enterprise</h3>
                <p className="pricing-card-description">For high-volume operations and marketplaces.</p>
                <div className="pricing-card-price">
                  $199 <span className="pricing-card-period">/ month</span>
                </div>
                <div className="pricing-card-divider"></div>
                <div className="pricing-card-features-label">Includes:</div>
                <ul className="pricing-card-features">
                  <li className="feature-bullet"><span className="feature-bullet-check"><Check size={12} /></span> Everything in Business</li>
                  <li className="feature-bullet"><span className="feature-bullet-check"><Check size={12} /></span> Lowest 1% fee per transaction</li>
                  <li className="feature-bullet"><span className="feature-bullet-check"><Check size={12} /></span> Dedicated account manager</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 7. FAQ */}
        <section id="faq" className="w-full" style={{ borderTop: "1px solid var(--color-hairline)", paddingTop: "var(--space-section)", paddingBottom: "var(--space-section)" }}>
          <div className="mx-auto px-4" style={{ maxWidth: "var(--space-content-max-width)" }}>
            <h2 className="text-display-lg text-center mb-12" style={{ color: "var(--color-ink)" }}>
              Frequently asked questions
            </h2>

            <div className="flex flex-col gap-2">
              <div className="faq-row">
                <h4 className="faq-row-question">What is a $ORTHO tag?</h4>
                <p className="faq-row-answer">
                  A $ORTHO tag is your unique ORTHO-PAY handle — like $alice or $bob. You pick it when you sign up, and anyone can send you money using just your tag. No bank details needed.
                </p>
              </div>
              <div className="faq-row">
                <h4 className="faq-row-question">How does the escrow work?</h4>
                <p className="faq-row-answer">
                  When you send money, funds are debited from your wallet and held in escrow. Our admin team reviews every transaction. Once approved, the funds are released to the receiver. If rejected, the funds are refunded to your wallet.
                </p>
              </div>
              <div className="faq-row">
                <h4 className="faq-row-question">What are the fees?</h4>
                <p className="faq-row-answer">
                  Fees are based on the transaction amount: 3% for amounts under $50, 2% for $50–$499.99, and 1% for $500 and above. All transactions are in USD.
                </p>
              </div>
              <div className="faq-row">
                <h4 className="faq-row-question">Which countries does ORTHO-PAY support?</h4>
                <p className="faq-row-answer">
                  ORTHO-PAY currently operates in the USA and England (UK). We are expanding to additional regions — stay tuned.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer text-center">
        <div className="footer-links">
          <Link href="#how-it-works" className="footer-link">How it works</Link>
          <Link href="#pricing" className="footer-link">Pricing</Link>
          <Link href="#faq" className="footer-link">FAQ</Link>
          <Link href="/dashboard" className="footer-link">Dashboard</Link>
          <Link href="/admin" className="footer-link">Admin</Link>
        </div>
        <p className="footer-copyright">
          &copy; 2026 ORTHO-PAY Inc. USA &amp; England. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
