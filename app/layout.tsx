import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { BlockedUserChecker } from "@/components/BlockedUserChecker";
import { CapacitorProvider } from "@/components/CapacitorProvider";
import "@/app/globals.css";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Circle",
  description: "AI council platform for discussing ideas",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={[
          inter.variable,
          jetbrainsMono.variable,
          "min-h-dvh bg-black text-white antialiased",
        ].join(" ")}
      >
        <CapacitorProvider>
          <BlockedUserChecker>{children}</BlockedUserChecker>
        </CapacitorProvider>
      </body>
    </html>
  );
}

