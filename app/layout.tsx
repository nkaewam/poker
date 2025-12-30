import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ReactQueryProvider } from "@/lib/react-query";
import { AuthProvider } from "@/components/auth/auth-provider";
import { OnboardingGuard } from "@/components/auth/onboarding-guard";
import { AuthButton } from "@/components/auth/auth-button";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Poker Accounting",
  description: "Track poker game buy-ins and calculate settlements",
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
          <ReactQueryProvider>
            <OnboardingGuard>
              <div className="h-screen bg-background flex flex-col">
                <div className="flex justify-end p-4">
                  <AuthButton />
                </div>
                <NuqsAdapter>
                  <div className="flex-1 flex">{children}</div>
                </NuqsAdapter>
              </div>
            </OnboardingGuard>
          </ReactQueryProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
