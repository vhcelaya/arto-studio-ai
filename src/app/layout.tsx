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
  title: "ARTO Studio AI — The marketing agency that never sleeps",
  description:
    "Access ARTO's real methodology — strategy, creativity, narrative, and production — through 3,000 prompts, AI skills, and autonomous agents. Built on 15+ years with Google, Nike, Uber.",
  openGraph: {
    title: "ARTO Studio AI — The marketing agency that never sleeps",
    description:
      "3,000 prompts, AI-powered creative skills, autonomous agents. The same methodology we use with Google, Nike, Uber — now self-serve.",
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
