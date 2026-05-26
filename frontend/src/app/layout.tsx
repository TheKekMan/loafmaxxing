import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Orbitron } from "next/font/google";
import "./globals.css";

const sansFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const orbitronFont = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "LoafRate | Advanced AI Feline Batonization Lab",
  description: "Evaluate your cat's loafness and tuck discipline with the world's most advanced Neural Loaf Networks. Certified by the International Bread Institute.",
  keywords: ["loafrate", "cat loaf", "loafmaxxing", "tuckcel", "breadmogger", "feline evaluation", "AI cat scanner"],
  openGraph: {
    title: "LoafRate | Advanced AI Feline Batonization Lab",
    description: "Evaluate your cat's loafness and tuck discipline with our neural networks. 100% pseudo-scientific looksmaxxing.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${sansFont.variable} ${orbitronFont.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
