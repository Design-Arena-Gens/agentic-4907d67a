import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "500", "700"]
});

export const metadata: Metadata = {
  title: "روبوت رد رسائل إنستغرام",
  description:
    "صمّم سيناريوهات ذكية للرد على رسائل إنستغرام بشكل تلقائي، مع نصائح تكامل سريعة ونماذج جاهزة.",
  metadataBase: new URL("https://agentic-4907d67a.vercel.app"),
  icons: {
    icon: "/icon.svg"
  },
  alternates: {
    canonical: "/"
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className={tajawal.className}>{children}</body>
    </html>
  );
}
