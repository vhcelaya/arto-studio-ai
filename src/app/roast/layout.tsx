import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brand Roast — Free Brand Analysis | ARTO Studio AI",
  description:
    "Get a brutally honest analysis of your brand — scored across Strategy, Creativity, Narrative, and Digital — using the same methodology we use with Fortune 500 clients.",
  openGraph: {
    title: "Brand Roast — Free Brand Analysis | ARTO Studio AI",
    description:
      "Get a brutally honest brand analysis scored across Strategy, Creativity, Narrative, and Digital.",
    type: "website",
    images: [
      {
        url: "/roast/og?brand=Your+Brand&score=5.2&s=6&c=4&n=5&d=4",
        width: 1200,
        height: 630,
        alt: "ARTO Brand Roast",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brand Roast — Free Brand Analysis | ARTO Studio AI",
    description:
      "Get a brutally honest brand analysis scored across Strategy, Creativity, Narrative, and Digital.",
    images: ["/roast/og?brand=Your+Brand&score=5.2&s=6&c=4&n=5&d=4"],
  },
};

export default function RoastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
