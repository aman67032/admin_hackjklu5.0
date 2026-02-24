import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Scene3D from "@/components/Scene3D";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "HackJKLU 5.0 — Admin Portal",
  description: "Admin dashboard for managing HackJKLU 5.0 hackathon registrations, teams, and logistics",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <ClientLayoutWrapper interVariable={inter.variable}>
        <Scene3D />
        <div className="relative z-10 w-full min-h-screen">
          {children}
        </div>
      </ClientLayoutWrapper>
    </html>
  );
}
