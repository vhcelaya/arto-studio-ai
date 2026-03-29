import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand Roast — Free Brand Analysis | ARTO Studio AI",
  description:
    "Get a brutally honest analysis of your brand — scored across Strategy, Creativity, Narrative, and Digital — using the same methodology used with Fortune 500 clients. Free, no signup required.",
  openGraph: {
    title: "Brand Roast — How strong is your brand, really?",
    description:
      "Get your brand roasted by ARTO's methodology. Scored across Strategy, Creativity, Narrative, and Digital. Free and instant.",
    type: "website",
    images: [
      {
        url: "/roast/og?brand=Your+Brand&score=5.2&s=6&c=4&n=5&d=4",
        width: 1200,
        height: 630,
        alt: "ARTO Brand Roast — Free Brand Analysis",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brand Roast — How strong is your brand, really?",
    description:
      "Get your brand roasted by ARTO's methodology. Free and instant.",
  },
};

export default function RoastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
