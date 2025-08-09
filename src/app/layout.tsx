import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "MusclePal - フィットネスでつながる世界",
    template: "%s | MusclePal"
  },
  description: "トレーニング仲間と出会い、目標を共有し、一緒に成長しよう。フィットネス愛好者のための総合ソーシャルネットワーク。",
  keywords: ["フィットネス", "トレーニング", "ソーシャルネットワーク", "チャレンジ", "運動", "筋トレ", "ジム"],
  authors: [{ name: "MusclePal Team" }],
  creator: "MusclePal",
  publisher: "MusclePal",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "https://muscle-pal.fit",
    siteName: "MusclePal",
    title: "MusclePal - フィットネスでつながる世界",
    description: "トレーニング仲間と出会い、目標を共有し、一緒に成長しよう",
  },
  twitter: {
    card: "summary_large_image",
    title: "MusclePal - フィットネスでつながる世界",
    description: "トレーニング仲間と出会い、目標を共有し、一緒に成長しよう",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={inter.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
