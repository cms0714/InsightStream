import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { ToastProvider } from "@/lib/toast-context";
import Toast from "@/components/Toast";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
});

export const metadata: Metadata = {
  title: "InsightStream_",
  description: "공유는 가볍게, 인사이트는 묵직하게. 학술 피드 커뮤니티.",
  openGraph: {
    title: "InsightStream_",
    description: "공유는 가볍게, 인사이트는 묵직하게. 학술 피드 커뮤니티.",
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
      <body className={`${notoSansKR.variable} font-sans antialiased`}>
        <ToastProvider>
          {children}
          <Toast />
        </ToastProvider>
      </body>
    </html>
  );
}
