import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { ToastProvider } from "@/lib/toast-context";
import Toast from "@/components/Toast";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
});

export const viewport: Viewport = {
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "InsightStream_",
  description: "공유는 가볍게, 인사이트는 쏙쏙. 학술 피드 커뮤니티.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "InsightStream",
  },
  openGraph: {
    title: "InsightStream_",
    description: "공유는 가볍게, 인사이트는 쏙쏙. 학술 피드 커뮤니티.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${notoSansKR.variable} font-sans antialiased`}>
        <ToastProvider>
          {children}
          <Toast />
          <ServiceWorkerRegister />
        </ToastProvider>
      </body>
    </html>
  );
}
