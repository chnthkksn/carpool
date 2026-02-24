import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carpool LK",
  description: "Find or offer intercity rides in Sri Lanka.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <div className="relative min-h-screen bg-[#f6efe5] text-slate-900">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,#0f172a_0%,#1e293b_72%,#f6efe5_100%)]" />
          <Header />
          <div className="relative z-10 pt-20">{children}</div>
        </div>
      </body>
    </html>
  );
}
