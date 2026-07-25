"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Circle, Globe, Code, Check } from "lucide-react";
import { motion } from "motion/react";

const ONBOARD_VIDEO = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4";

function StepItem({ number, text, active }: { number: string; text: string; active?: boolean }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-4 py-3 transition-all"
      style={{
        backgroundColor: active ? "#ffffff" : "#1a1a1a",
        border: active ? "1px solid #ffffff" : "1px solid #262626",
        color: active ? "#0a0a0a" : "#ffffff",
      }}
    >
      <div
        className="flex items-center justify-center rounded-full flex-shrink-0"
        style={{
          width: 28,
          height: 28,
          backgroundColor: active ? "#0a0a0a" : "rgba(255,255,255,0.1)",
          color: active ? "#ffffff" : "rgba(255,255,255,0.4)",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {number}
      </div>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}

function SocialButton({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <button
      type="button"
      className="flex items-center justify-center gap-2 rounded-xl py-3 px-4 transition-colors"
      style={{ backgroundColor: "#1a1a1a", border: "1px solid #262626", color: "#ffffff" }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#222")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#1a1a1a")}
    >
      <Icon size={18} />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function InputGroup({
  label,
  placeholder,
  type,
  value,
  onChange,
  required,
  autoFocus,
  children,
}: {
  label: string;
  placeholder: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  autoFocus?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium" style={{ color: "#ffffff" }}>{label}</label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoFocus={autoFocus}
          className="w-full rounded-xl px-4 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          style={{ backgroundColor: "#1a1a1a", border: "1px solid #262626", height: 44, color: "#ffffff" }}
        />
        {children}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [country, setCountry] = useState("US");
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!termsAccepted) {
      setError("You must accept the Terms & Conditions to create an account");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, country, marketing_consent: marketingConsent }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("reg_password", password);
      const params = new URLSearchParams({ email, name });
      router.push(`/verify-otp?${params.toString()}`);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full selection:bg-white/30 p-2 transition-all duration-500 lg:h-screen lg:overflow-hidden lg:p-4" style={{ backgroundColor: "#0a0a0a" }}>
      {/* Left Column — Hero with video */}
      <div className="hidden lg:flex w-[52%] relative flex-col items-center justify-end pb-32 px-12 rounded-3xl overflow-hidden shadow-2xl h-full" style={{ backgroundColor: "#1a1a1a", border: "1px solid #262626" }}>
        <video className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop playsInline>
          <source src={ONBOARD_VIDEO} type="video/mp4" />
        </video>

        <motion.div
          className="z-10 w-full max-w-xs space-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.15, delayChildren: 0.2 }}
        >
          <motion.div
            className="flex items-center gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Circle size={20} className="fill-white text-white" />
            <span className="text-xl font-semibold tracking-tight" style={{ color: "#ffffff", fontFamily: "var(--font-display)" }}>ORTHO-PAY</span>
          </motion.div>

          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl font-medium tracking-tight whitespace-nowrap" style={{ color: "#ffffff", fontFamily: "var(--font-display)" }}>Join ORTHO-PAY</h2>
            <p className="text-sm leading-relaxed px-4" style={{ color: "rgba(255,255,255,0.6)" }}>
              Follow these 3 quick phases to activate your escrow account.
            </p>
          </motion.div>

          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <StepItem number="1" text="Register your identity" active />
            <StepItem number="2" text="Verify your email" />
            <StepItem number="3" text="Start sending & receiving" />
          </motion.div>
        </motion.div>
      </div>

      {/* Right Column — Sign Up Form */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 lg:py-6 px-4 sm:px-12 lg:px-16 xl:px-24 overflow-y-auto lg:overflow-hidden">
        <motion.div
          className="w-full max-w-xl space-y-8 lg:space-y-6 sm:space-y-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          {/* Header */}
          <div>
            <h1 className="text-3xl font-medium tracking-tight" style={{ color: "#ffffff", fontFamily: "var(--font-display)" }}>Create New Profile</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>Input your basic details to begin the journey.</p>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <SocialButton icon={Globe} label="Google" />
            <SocialButton icon={Code} label="Github" />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px" style={{ backgroundColor: "#262626" }} />
            <span className="px-4 text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)", backgroundColor: "#0a0a0a" }}>Or</span>
            <div className="flex-1 h-px" style={{ backgroundColor: "#262626" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="First Name" placeholder="Alice" type="text" value={name.split(" ")[0] || ""} onChange={(e) => setName(e.target.value + (name.split(" ").slice(1).length ? " " + name.split(" ").slice(1).join(" ") : ""))} required autoFocus />
              <InputGroup label="Last Name" placeholder="Carter" type="text" value={name.split(" ").slice(1).join(" ") || ""} onChange={(e) => setName((name.split(" ")[0] || "") + " " + e.target.value)} required />
            </div>

            {/* Email */}
            <InputGroup label="Email" placeholder="you@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />

            {/* Password */}
            <InputGroup label="Password" placeholder="At least 8 characters" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </InputGroup>
            <p className="text-xs -mt-3" style={{ color: "rgba(255,255,255,0.3)" }}>Requires at least 8 symbols.</p>

            {/* Confirm Password */}
            <InputGroup label="Confirm Password" placeholder="Re-enter password" type={showPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />

            {/* Country */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium" style={{ color: "#ffffff" }}>Country</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl px-4 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                style={{ backgroundColor: "#1a1a1a", border: "1px solid #262626", height: 44, color: "#ffffff" }}
              >
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="CA">Canada</option>
                <option value="AU">Australia</option>
                <option value="NZ">New Zealand</option>
                <option value="IE">Ireland</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="ES">Spain</option>
                <option value="IT">Italy</option>
                <option value="NL">Netherlands</option>
                <option value="BE">Belgium</option>
                <option value="PT">Portugal</option>
                <option value="CH">Switzerland</option>
                <option value="AT">Austria</option>
                <option value="SE">Sweden</option>
                <option value="NO">Norway</option>
                <option value="DK">Denmark</option>
                <option value="FI">Finland</option>
                <option value="PL">Poland</option>
                <option value="CZ">Czech Republic</option>
                <option value="GR">Greece</option>
                <option value="HU">Hungary</option>
                <option value="RO">Romania</option>
                <option value="BG">Bulgaria</option>
                <option value="HR">Croatia</option>
                <option value="SK">Slovakia</option>
                <option value="SI">Slovenia</option>
                <option value="LT">Lithuania</option>
                <option value="LV">Latvia</option>
                <option value="EE">Estonia</option>
                <option value="IS">Iceland</option>
                <option value="LU">Luxembourg</option>
                <option value="MT">Malta</option>
                <option value="CY">Cyprus</option>
                <option value="JP">Japan</option>
                <option value="KR">South Korea</option>
                <option value="SG">Singapore</option>
                <option value="HK">Hong Kong</option>
                <option value="TW">Taiwan</option>
                <option value="MY">Malaysia</option>
                <option value="TH">Thailand</option>
                <option value="PH">Philippines</option>
                <option value="ID">Indonesia</option>
                <option value="VN">Vietnam</option>
                <option value="IN">India</option>
                <option value="PK">Pakistan</option>
                <option value="BD">Bangladesh</option>
                <option value="AE">United Arab Emirates</option>
                <option value="SA">Saudi Arabia</option>
                <option value="QA">Qatar</option>
                <option value="KW">Kuwait</option>
                <option value="BH">Bahrain</option>
                <option value="OM">Oman</option>
                <option value="JO">Jordan</option>
                <option value="IL">Israel</option>
                <option value="TR">Turkey</option>
                <option value="ZA">South Africa</option>
                <option value="NG">Nigeria</option>
                <option value="KE">Kenya</option>
                <option value="GH">Ghana</option>
                <option value="EG">Egypt</option>
                <option value="MA">Morocco</option>
                <option value="BR">Brazil</option>
                <option value="MX">Mexico</option>
                <option value="AR">Argentina</option>
                <option value="CL">Chile</option>
                <option value="CO">Colombia</option>
                <option value="PE">Peru</option>
                <option value="UY">Uruguay</option>
                <option value="CR">Costa Rica</option>
                <option value="PA">Panama</option>
                <option value="DO">Dominican Republic</option>
                <option value="JM">Jamaica</option>
                <option value="TT">Trinidad and Tobago</option>
                <option value="BS">Bahamas</option>
                <option value="BB">Barbados</option>
              </select>
            </div>

            {/* Terms & Conditions acceptance */}
            <label className="flex items-start gap-3 cursor-pointer">
              <button
                type="button"
                onClick={() => setTermsAccepted(!termsAccepted)}
                className="flex-shrink-0 flex items-center justify-center rounded-md transition-colors mt-0.5"
                style={{
                  width: 20,
                  height: 20,
                  backgroundColor: termsAccepted ? "var(--color-primary)" : "#1a1a1a",
                  border: termsAccepted ? "none" : "1px solid #262626",
                }}
              >
                {termsAccepted && <Check size={12} style={{ color: "#0a0a0a" }} />}
              </button>
              <span className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                I have read and agree to the{" "}
                <Link href="/terms" target="_blank" className="underline" style={{ color: "var(--color-primary)" }}>Terms &amp; Conditions</Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className="underline" style={{ color: "var(--color-primary)" }}>Privacy Policy</Link>.
              </span>
            </label>

            {/* Marketing consent */}
            <label className="flex items-start gap-3 cursor-pointer">
              <button
                type="button"
                onClick={() => setMarketingConsent(!marketingConsent)}
                className="flex-shrink-0 flex items-center justify-center rounded-md transition-colors mt-0.5"
                style={{
                  width: 20,
                  height: 20,
                  backgroundColor: marketingConsent ? "var(--color-primary)" : "#1a1a1a",
                  border: marketingConsent ? "none" : "1px solid #262626",
                }}
              >
                {marketingConsent && <Check size={12} style={{ color: "#0a0a0a" }} />}
              </button>
              <span className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                Send me product updates, tips, and promotional offers. You can unsubscribe at any time.
              </span>
            </label>

            {/* Error */}
            {error && (
              <div className="text-sm rounded-xl p-3" style={{ color: "#ef4444", backgroundColor: "rgba(239,68,68,0.08)" }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 font-semibold rounded-xl hover:opacity-90 active:scale-[0.98] mt-4 transition-all disabled:opacity-50"
              style={{ backgroundColor: "var(--color-primary)", color: "#0a0a0a" }}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Footer */}
          <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
            Member of the team?{" "}
            <Link href="/login" className="font-medium hover:underline" style={{ color: "var(--color-primary)" }}>
              Log in
            </Link>
          </p>
        </motion.div>
      </div>
    </main>
  );
}
