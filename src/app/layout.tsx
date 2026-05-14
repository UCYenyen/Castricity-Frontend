import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { CursorGlow } from "@/components/features/landing/CursorGlow";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Castricity — Platform Prakiraan Listrik Cerdas Indonesia",
  description: "Platform AI transparan untuk prakiraan kebutuhan listrik nasional. Prediksi akurat, penjelasan yang dapat dipahami, dan kedaulatan digital penuh.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <CursorGlow />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
