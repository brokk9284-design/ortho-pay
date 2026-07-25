"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Shield, Globe, DollarSign, Check, Lock, Users } from "lucide-react";
import { BrandIcon } from "@/components/BrandIcon";

const HERO_VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_045634_e1c98c76-1265-4f5c-882a-4276f2080894.mp4";
const ABOUT_VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_151551_992053d1-3d3e-4b8c-abac-45f22158f411.mp4";
const CTA_VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055729_72d66327-b59e-4ae9-bb70-de6ccb5ecdb0.mp4";

const FEATURE_VIDEOS = [
  { url: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_053923_22c0a6a5-313c-474c-85ff-3b50d25e944a.mp4", title: "Escrow Protection", desc: "Every payment is held in escrow and reviewed by our team before release. Senders get refund protection, receivers get guaranteed funds.", icon: Lock },
  { url: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_054411_511c1b7a-fb2f-42ef-bf6c-32c0b1a06e79.mp4", title: "$ORTHO Paytags", desc: "Send money to anyone with a $paytag. No bank details, no email lookups. Just type $alice and the payment is on its way.", icon: Users },
  { url: "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_055427_ac7035b5-9f3b-4289-86fc-941b2432317d.mp4", title: "Admin-Reviewed Transfers", desc: "Our compliance team verifies every transaction. Approvals release funds instantly, rejections refund the sender in full.", icon: Shield },
];

const SPONSORS = [
  { name: "Cash App", iconKey: "cashapp" },
  { name: "Venmo", iconKey: "venmo" },
  { name: "PayPal", iconKey: "paypal" },
  { name: "Stripe", iconKey: "stripe" },
  { name: "Binance", iconKey: "binance" },
  { name: "Bitcoin", iconKey: "bitcoin" },
];

function LazyVideo({ src, className, eager }: { src: string; className?: string; eager?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(!!eager);

  useEffect(() => {
    if (eager) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [eager]);

  return (
    <video
      ref={ref}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload={eager ? "auto" : "none"}
    >
      {visible && <source src={src} type="video/mp4" />}
    </video>
  );
}

export default function LandingPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: "#0a0a0a" }}>
      {/* SECTION 1: HERO */}
      <section className="relative min-h-screen w-full overflow-hidden rounded-b-[32px]">
        <LazyVideo src={HERO_VIDEO} className="absolute inset-0 w-full h-full object-cover" eager />

        <div className="relative z-10 mx-auto px-4 sm:px-6 lg:px-8" style={{ maxWidth: "1831px" }}>
          {/* Header */}
          <header className="flex items-center justify-between pt-6 pb-4">
            <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
              <img src="/favicon.svg" alt="ORTHO-PAY" style={{ width: 32, height: 32, borderRadius: 6 }} />
              <span className="font-display font-extrabold tracking-tight" style={{ fontSize: 18, color: "#ffffff" }}>
                ORTHO-PAY
              </span>
            </Link>

            <nav className="hidden lg:flex items-center gap-8 rounded-2xl px-8 py-3" style={{ backgroundColor: "#1a1a1a", border: "1px solid #262626" }}>
              {["Homepage", "How it works", "Pricing", "FAQ", "Contact"].map((label) => (
                <a
                  key={label}
                  href={label === "Homepage" ? "/" : `#${label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="font-display text-[13px] uppercase tracking-wide transition-colors hover:text-[var(--color-primary)]"
                  style={{ color: "#ffffff" }}
                >
                  {label}
                </a>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden sm:flex items-center rounded-xl px-5 py-3 text-[13px] uppercase tracking-wide transition-colors hover:bg-white/5" style={{ color: "#ffffff", backgroundColor: "#1a1a1a", border: "1px solid #262626" }}
              >
                Sign in
              </Link>
              <button
                className="lg:hidden flex items-center justify-center rounded-xl w-11 h-11" style={{ backgroundColor: "#1a1a1a", border: "1px solid #262626" }}
                onClick={() => setDrawerOpen(!drawerOpen)}
                aria-label="Toggle menu"
              >
                <span className="font-display text-[13px] uppercase" style={{ color: "#ffffff" }}>Menu</span>
              </button>
            </div>
          </header>

          {/* Mobile drawer */}
          {drawerOpen && (
            <div className="lg:hidden fixed inset-0 z-50 flex flex-col items-center justify-center gap-6" style={{ backgroundColor: "rgba(10,10,10,0.95)" }} onClick={() => setDrawerOpen(false)}>
              {["Homepage", "How it works", "Pricing", "FAQ", "Contact"].map((label) => (
                <a
                  key={label}
                  href={label === "Homepage" ? "/" : `#${label.toLowerCase().replace(/\s+/g, "-")}`}
                  className="font-display text-[20px] uppercase tracking-wide"
                  style={{ color: "#ffffff" }}
                  onClick={() => setDrawerOpen(false)}
                >
                  {label}
                </a>
              ))}
              <Link href="/login" className="font-display text-[20px] uppercase" style={{ color: "var(--color-primary)" }}>Sign in</Link>
              <Link href="/register" className="font-display text-[20px] uppercase" style={{ color: "var(--color-primary)" }}>Get started</Link>
            </div>
          )}

          {/* Hero Content */}
          <div className="flex flex-col items-start justify-center pt-16 sm:pt-24 lg:pt-32 pb-20 lg:pb-40">
            <div className="relative lg:ml-32" style={{ maxWidth: "780px" }}>
              <h1
                className="font-display font-black uppercase leading-[1.05] sm:leading-[1]"
                style={{ fontSize: "clamp(40px, 8vw, 90px)", color: "#ffffff", fontWeight: 900 }}
              >
                Send money safely
                <br />
                with escrow protection
              </h1>
              <span
                className="font-display absolute -right-2 sm:right-0 lg:right-4 -bottom-8 sm:-bottom-10 lg:-bottom-12 -rotate-1 opacity-90"
                style={{ fontSize: "clamp(20px, 4vw, 40px)", color: "var(--color-primary)", mixBlendMode: "exclusion" }}
              >
                $ORTHO paytags
              </span>
            </div>

            <p
              className="font-body mt-6 lg:ml-32"
              style={{ fontSize: "clamp(14px, 1.8vw, 18px)", color: "rgba(255,255,255,0.7)", maxWidth: "520px", lineHeight: 1.6 }}
            >
              ORTHO-PAY is an escrow payment platform for buyers and sellers. Send money to any $paytag and funds are held safely until our team reviews and approves the transaction. USD only.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-12 lg:ml-32">
              <Link
                href="/register"
                className="font-display flex items-center justify-center uppercase tracking-wide px-8 py-4 rounded-[16px] transition-transform active:scale-[0.98]"
                style={{ backgroundColor: "var(--color-primary)", color: "#0a0a0a", fontSize: "15px" }}
              >
                Get started
              </Link>
              <Link
                href="#how-it-works"
                className="flex items-center justify-center uppercase tracking-wide px-8 py-4 rounded-xl transition-colors hover:bg-white/5" style={{ color: "#ffffff", backgroundColor: "#1a1a1a", border: "1px solid #262626", fontSize: "15px" }}
              >
                See how it works
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-6 flex-wrap mt-8 lg:ml-32">
              {[
                { icon: Shield, label: "Escrow protected" },
                { icon: Globe, label: "Global access" },
                { icon: DollarSign, label: "USD only" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon size={16} style={{ color: "rgba(255,255,255,0.7)" }} />
                  <span className="font-body text-[11px] uppercase" style={{ color: "rgba(255,255,255,0.7)" }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: ABOUT / INTRO */}
      <section className="relative min-h-screen w-full overflow-hidden">
        <LazyVideo src={ABOUT_VIDEO} className="absolute inset-0 w-full h-full object-cover" />

        <div className="relative z-10 mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32" style={{ maxWidth: "1831px" }}>
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 mb-16 lg:mb-32">
            <div className="relative flex-shrink-0">
              <h2
                className="font-display uppercase leading-[1]"
                style={{ fontSize: "clamp(32px, 6vw, 60px)", color: "#ffffff" }}
              >
                What we do
              </h2>
              <span
                className="font-display absolute -bottom-4 -right-8 lg:-right-12 -rotate-2"
                style={{ fontSize: "clamp(36px, 7vw, 68px)", color: "var(--color-primary)", mixBlendMode: "exclusion" }}
              >
                escrow
              </span>
            </div>
            <div className="flex items-end">
              <p
                className="font-body"
                style={{ fontSize: "clamp(14px, 1.5vw, 17px)", color: "#ffffff", maxWidth: "480px", lineHeight: "1.7" }}
              >
                ORTHO-PAY is a payment platform built on trust. When you send money to a $paytag, funds are held in escrow until our admin team reviews the transaction. Approved payments release instantly to the receiver. Rejected payments refund the sender in full. No chargebacks. No fraud. No surprises.
              </p>
            </div>
          </div>

          {/* Key points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            {[
              { icon: Shield, title: "Buyer Protection", desc: "Funds stay in escrow until the transaction is verified. If something goes wrong, you get your money back." },
              { icon: DollarSign, title: "Seller Confidence", desc: "No chargebacks or payment reversals. Once approved, the money is yours and credited to your wallet." },
              { icon: Globe, title: "Global Access", desc: "Available worldwide. All transactions in USD. Send and receive from anywhere." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex flex-col gap-3">
                <Icon size={28} style={{ color: "var(--color-primary)" }} />
                <h3 className="font-display uppercase" style={{ fontSize: "clamp(18px, 2vw, 22px)", color: "#ffffff" }}>{title}</h3>
                <p className="font-body text-[13px]" style={{ color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: FEATURES GRID + HOW IT WORKS */}
      <section id="how-it-works" className="w-full" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-32" style={{ maxWidth: "1831px" }}>
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8 mb-12 lg:mb-16">
            <h2 className="font-display uppercase leading-[1]" style={{ fontSize: "clamp(32px, 6vw, 60px)", color: "#ffffff" }}>
              Three core
              <br />
              <span className="ml-12 sm:ml-24 lg:ml-32 inline-block">
                <span className="font-display" style={{ color: "var(--color-primary)" }}>platform</span>{" "}
                <span style={{ color: "#ffffff" }}>features</span>
              </span>
            </h2>
          </div>

          {/* Feature Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURE_VIDEOS.map((feature, i) => {
              const FeatureIcon = feature.icon;
              return (
              <div key={i} className="rounded-3xl p-[18px] transition-colors hover:bg-white/5" style={{ backgroundColor: "#1a1a1a", border: "1px solid #262626" }}>
                <div className="relative w-full rounded-[24px] overflow-hidden" style={{ paddingBottom: "100%" }}>
                  <LazyVideo src={feature.url} className="absolute inset-0 w-full h-full object-cover" />
                </div>
                <div className="flex flex-col gap-3 rounded-2xl px-5 py-5 mt-4" style={{ backgroundColor: "#0a0a0a", border: "1px solid #262626" }}>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center rounded-full" style={{ width: 40, height: 40, backgroundColor: "rgba(59,130,246,0.1)" }}>
                      <FeatureIcon size={20} style={{ color: "var(--color-primary)" }} />
                    </div>
                    <span className="font-display text-[15px] uppercase" style={{ color: "#ffffff" }}>{feature.title}</span>
                  </div>
                  <p className="font-body text-[12px]" style={{ color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>{feature.desc}</p>
                </div>
              </div>
              );
            })}
          </div>

          {/* Sponsors / Partners */}
          <div className="mt-20 lg:mt-32">
            <p className="font-body text-center uppercase mb-8" style={{ fontSize: "clamp(12px, 1.5vw, 14px)", color: "rgba(255,255,255,0.5)", letterSpacing: "0.5px" }}>
              Compatible with the payment platforms you already use
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              {SPONSORS.map((sponsor) => (
                <div key={sponsor.name} className="flex items-center gap-3 rounded-xl px-5 py-3" style={{ backgroundColor: "#1a1a1a", border: "1px solid #262626" }}>
                  <BrandIcon iconKey={sponsor.iconKey} size={28} />
                  <span className="font-display font-bold" style={{ fontSize: 15, color: "#ffffff" }}>{sponsor.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How it works steps */}
          <div className="mt-20 lg:mt-32">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { num: "01", title: "Send to a $ORTHO tag", desc: "Enter the recipient's $ORTHO tag and the amount. Funds are debited and held in escrow." },
                { num: "02", title: "Admin reviews & approves", desc: "Our team verifies every transaction. Approvals release funds; rejections refund the sender." },
                { num: "03", title: "Receiver gets paid", desc: "Once approved, funds are released from escrow and credited instantly to the receiver's wallet." },
              ].map((step) => (
                <div key={step.num} className="flex flex-col gap-3">
                  <span className="font-display text-[14px] uppercase" style={{ color: "var(--color-primary)" }}>{step.num}</span>
                  <h3 className="font-display uppercase" style={{ fontSize: "clamp(20px, 2.5vw, 28px)", color: "#ffffff" }}>{step.title}</h3>
                  <p className="font-body text-[13px] uppercase" style={{ color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="w-full" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24" style={{ maxWidth: "1831px" }}>
          <h2 className="font-display uppercase text-center mb-4" style={{ fontSize: "clamp(32px, 6vw, 60px)", color: "#ffffff" }}>
            Simple, transparent fees
          </h2>
          <p className="font-body text-center mb-12 uppercase mx-auto" style={{ fontSize: "clamp(13px, 1.5vw, 15px)", color: "rgba(255,255,255,0.6)", maxWidth: "500px" }}>
            Pay only when you send. No monthly fees, no hidden charges. All amounts in USD.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Personal", price: "$0", period: "/ month", desc: "For everyday payments between friends and small sellers.", features: ["Free $ORTHO tag", "Escrow-protected payments", "3% fee per transaction"] },
              { name: "Business", price: "$29", period: "/ month", desc: "For growing businesses moving regular volume.", features: ["Everything in Personal", "Reduced 2% fee per transaction", "Priority escrow review"] },
              { name: "Enterprise", price: "$199", period: "/ month", desc: "For high-volume operations and marketplaces.", features: ["Everything in Business", "Lowest 1% fee per transaction", "Dedicated account manager"] },
            ].map((tier, i) => (
              <div key={tier.name} className="rounded-3xl p-8" style={{ backgroundColor: "#1a1a1a", border: "1px solid #262626", ...(i === 2 ? { outline: "1px solid rgba(59,130,246,0.3)" } : {}) }}>
                <h3 className="font-display uppercase mb-2" style={{ fontSize: "20px", color: "#ffffff" }}>{tier.name}</h3>
                <p className="font-body text-[12px] uppercase mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>{tier.desc}</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-display" style={{ fontSize: "36px", color: "#ffffff" }}>{tier.price}</span>
                  <span className="font-body text-[13px]" style={{ color: "rgba(255,255,255,0.5)" }}>{tier.period}</span>
                </div>
                <div className="w-full mb-6" style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.1)" }} />
                <ul className="flex flex-col gap-3">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2">
                      <Check size={14} style={{ color: "var(--color-primary)" }} />
                      <span className="font-body text-[13px]" style={{ color: "#ffffff" }}>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className="font-display flex items-center justify-center uppercase tracking-wide mt-8 px-6 py-3 rounded-[12px] transition-transform active:scale-[0.98]"
                  style={{
                    backgroundColor: i === 2 ? "var(--color-primary)" : "transparent",
                    color: i === 2 ? "#0a0a0a" : "#ffffff",
                    border: i === 2 ? "none" : "1px solid rgba(255,255,255,0.15)",
                    fontSize: "13px",
                  }}
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="w-full" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24" style={{ maxWidth: "800px" }}>
          <h2 className="font-display uppercase text-center mb-12" style={{ fontSize: "clamp(32px, 6vw, 60px)", color: "#ffffff" }}>
            Frequently asked questions
          </h2>
          <div className="flex flex-col gap-3">
            {[
              { q: "What is a $ORTHO tag?", a: "A $ORTHO tag is your unique ORTHO-PAY handle — like $alice or $bob. You pick it when you sign up, and anyone can send you money using just your tag. No bank details needed." },
              { q: "How does the escrow work?", a: "When you send money, funds are debited from your wallet and held in escrow. Our admin team reviews every transaction. Once approved, the funds are released to the receiver. If rejected, the funds are refunded to your wallet." },
              { q: "What are the fees?", a: "Fees are based on the transaction amount: 3% for amounts under $50, 2% for $50–$499.99, and 1% for $500 and above. All transactions are in USD." },
              { q: "Which countries does ORTHO-PAY support?", a: "ORTHO-PAY is available worldwide. All transactions are in USD. Send and receive from anywhere." },
            ].map((faq) => (
              <div key={faq.q} className="rounded-2xl px-6 py-5" style={{ backgroundColor: "#1a1a1a", border: "1px solid #262626" }}>
                <h4 className="font-display uppercase mb-2" style={{ fontSize: "16px", color: "#ffffff" }}>{faq.q}</h4>
                <p className="font-body text-[13px]" style={{ color: "rgba(255,255,255,0.6)", lineHeight: "1.6" }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: CTA / FINAL */}
      <section id="contact" className="relative w-full overflow-hidden">
        <LazyVideo src={CTA_VIDEO} className="w-full h-auto block" />

        <div className="absolute inset-0 flex items-center justify-end lg:pr-[20%] lg:pl-[15%]">
          <div className="relative text-right">
            <span
              className="font-display absolute -top-8 -left-8 lg:-top-16 lg:-left-16 -rotate-1"
              style={{ fontSize: "clamp(17px, 5vw, 68px)", color: "var(--color-primary)", mixBlendMode: "exclusion" }}
            >
              Get started
            </span>
            <h2 className="font-display uppercase leading-[1.1]" style={{ fontSize: "clamp(16px, 5vw, 60px)", color: "#ffffff" }}>
              <span className="block mb-4 sm:mb-8 lg:mb-12">SEND MONEY.</span>
              <span className="block">RECEIVE MONEY.</span>
              <span className="block">TRUST THE PROCESS.</span>
            </h2>
            <Link
              href="/register"
              className="font-display inline-flex items-center justify-center uppercase tracking-wide mt-8 px-8 py-4 rounded-[16px] transition-transform active:scale-[0.98]"
              style={{ backgroundColor: "var(--color-primary)", color: "#0a0a0a", fontSize: "15px" }}
            >
              Create your free account
            </Link>
          </div>
        </div>

      </section>

      {/* Footer */}
      <footer className="w-full py-8 px-4" style={{ backgroundColor: "#0a0a0a" }}>
        <div className="mx-auto flex flex-col sm:flex-row items-center justify-between gap-4" style={{ maxWidth: "1831px" }}>
          <div className="flex items-center gap-2">
            <img src="/favicon.svg" alt="ORTHO-PAY" style={{ width: 24, height: 24, borderRadius: 4 }} />
            <span className="font-display font-extrabold uppercase tracking-tight text-[14px]" style={{ color: "#ffffff" }}>ORTHO-PAY</span>
          </div>
          <div className="flex items-center gap-6 flex-wrap justify-center">
            <a href="#how-it-works" className="font-body text-[11px] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>How it works</a>
            <a href="#pricing" className="font-body text-[11px] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>Pricing</a>
            <a href="#faq" className="font-body text-[11px] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>FAQ</a>
            <Link href="/dashboard" className="font-body text-[11px] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>Dashboard</Link>
            <Link href="/terms" className="font-body text-[11px] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>Terms</Link>
            <Link href="/privacy" className="font-body text-[11px] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>Privacy</Link>
            <Link href="/cookies" className="font-body text-[11px] uppercase" style={{ color: "rgba(255,255,255,0.5)" }}>Cookies</Link>
          </div>
          <span className="font-body text-[11px] uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>
            © 2026 ORTHO-PAY Inc. All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
