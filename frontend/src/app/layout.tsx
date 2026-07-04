import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",   // was --font-geist-sans; globals.css reads --font-sans
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",   // was --font-geist-mono; globals.css reads --font-mono
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Not Found Project | Premium Task Board & Image Annotation Tool",
  description: "A premium, unified workplace tool for Kanban task scheduling and multi-image vector polygon annotations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
