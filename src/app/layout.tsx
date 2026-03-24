import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LiveCuration - ライブ配信・ライブコマース最新ニュース",
  description:
    "TikTok、Instagram、Pococha、REALITY、SHOWROOMなど主要ライブ配信プラットフォームの最新情報をキュレーション",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
