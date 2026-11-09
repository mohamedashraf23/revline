import type { Metadata } from "next";
import { Sora, Work_Sans } from "next/font/google";

import { AuthProvider } from "@/components/AuthProvider";
import { CartProvider } from "@/components/CartProvider";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-work-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Revline Auto Parts — Parts that fit, gear that performs",
  description:
    "OEM replacement parts and performance upgrades, backed by a fitment guarantee and people who actually know cars.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${workSans.variable}`}>
      <body>
        {/* AuthProvider wraps CartProvider: signing in reassigns the cart
            server-side, so the cart must reload when identity changes. */}
        <AuthProvider>
          <CartProvider>
            <div className="app-shell">
              <Header />
              <main>{children}</main>
              <Footer />
            </div>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
