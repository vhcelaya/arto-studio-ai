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
  title: "ARTO Studio AI — La agencia de marketing que nunca duerme",
  description:
    "Accede a la metodología de ARTO Group — strategy, creativity, narrative y production — a través de un agente AI entrenado con 15+ años de experiencia real. Desde $99/mes.",
  openGraph: {
    title: "ARTO Studio AI — La agencia de marketing que nunca duerme",
    description:
      "La misma metodología que usamos con Google, Nike y Uber. Ahora accesible para todos.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${archivo.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
