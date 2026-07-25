import type { Metadata } from "next";
import { Nunito, Anton, Condiment } from "next/font/google";
import "./globals.css";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";

const nunito = Nunito({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
});

const anton = Anton({
  variable: "--font-grotesk",
  subsets: ["latin"],
  weight: "400",
});

const condiment = Condiment({
  variable: "--font-condiment",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "ORTHO-PAY — Escrow Payments with Paytags",
  description: "An escrow payment platform for buyers and sellers. Send money to any $paytag — funds are held safely until approved. USD only.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.svg",
  },
  manifest: "/manifest.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${anton.variable} ${condiment.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ortho-pay-theme');if(!t){if(window.matchMedia('(prefers-color-scheme: dark)').matches){t='dark'}else{t='light'}}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var obs=new MutationObserver(function(){var t=document.documentElement.getAttribute('data-theme');});obs.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <ErrorBoundary>
          <ThemeProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
