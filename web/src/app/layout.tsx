import type { Metadata } from "next";
import { Space_Grotesk, Plus_Jakarta_Sans } from "next/font/google";
import { TradeModeProvider } from "../context/TradeModeContext";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "KodaTrade — AI-Powered AfCFTA & Import/Export Compliance for Nigeria",
  description: "Accelerate your African cross-border trade. Automated Form M, NXP & COO drafting, Rules of Origin checklists, and instant HS code compliance checks.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${plusJakartaSans.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-black text-slate-100 selection:bg-cyan-500/30 selection:text-white">
        <TradeModeProvider>
          {children}
        </TradeModeProvider>
      </body>
    </html>
  );
}
