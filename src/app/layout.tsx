import type { Metadata } from "next";
import { Archivo, Manrope } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ARTO Studio AI — Prompts, Skills, Agents",
  description:
    "Your creative studio, powered by AI. 3,000 production-grade prompts in EN / ES, AI-powered creative skills, and autonomous agents. Built on 15+ years of real agency methodology.",
  openGraph: {
    title: "ARTO Studio AI — Prompts, Skills, Agents",
    description:
      "3,000 bilingual prompts, AI-powered creative skills, and autonomous agents — the same methodology we use with Google, Nike, Uber.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
