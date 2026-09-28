import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UNC Online MBA | Centralized Course Hub & Calendar",
  description:
    "Unified weekly resource management, readings, homework deliverables, and master calendar for UNC Kenan-Flagler Online MBA students.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#13294B",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased text-slate-900 bg-[#F4F7FA]">
        {children}
      </body>
    </html>
  );
}
