import type { Metadata } from "next";
import { Titillium_Web } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { AppShell } from "@/components/layout/app-shell";

// Titillium Web is the typeface the official F1 web presence is built on —
// one family for everything keeps the look grounded rather than "techy".
const titillium = Titillium_Web({
  variable: "--font-titillium",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "F1 Insight AI",
    template: "%s · F1 Insight AI",
  },
  description: "Intelligent Formula One Analytics & Performance Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${titillium.variable} h-full antialiased`}>
      <body className="min-h-full">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
