import type { Metadata } from "next";
import { Barlow_Condensed, Orbitron, Titillium_Web } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/layout/app-shell";

// Broadcast typography, three roles:
//  · Titillium Web — the official F1 web typeface: nav, body, labels.
//  · Barlow Condensed — aggressive condensed display: hero + section titles.
//  · Orbitron — reserved for showcase timing numbers only.
const titillium = Titillium_Web({
  variable: "--font-titillium",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
});

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

const orbitron = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Racecraft",
    template: "%s · Racecraft",
  },
  description: "Formula One Analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${titillium.variable} ${barlow.variable} ${orbitron.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
