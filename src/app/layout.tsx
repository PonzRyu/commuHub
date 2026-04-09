import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DeveloperFooter } from "@/components/developer-footer";
import { getAppDisplayName } from "@/lib/app-display-name";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const appName = await getAppDisplayName();
  return {
    title: {
      default: appName,
      template: `%s | ${appName}`,
    },
    description: "チーム内予定表でメンバーの週間日程を把握するアプリ",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-screen flex-col">
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <DeveloperFooter />
      </body>
    </html>
  );
}
