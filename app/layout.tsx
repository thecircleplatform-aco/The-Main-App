import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Inter, JetBrains_Mono } from "next/font/google";
import { BlockedUserChecker } from "@/components/BlockedUserChecker";
import { NotificationsBell } from "@/components/NotificationsBell";
import { SearchGlobal } from "@/components/SearchGlobal";
import { CapacitorProvider } from "@/components/CapacitorProvider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthAwareBackground } from "@/components/background/AuthAwareBackground";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
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
  description: "Circle platform",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

const themeScript = `
(function() {
  const key = 'circle-theme';
  const stored = localStorage.getItem(key);
  const dark = stored === 'dark' || (stored !== 'light' && (!stored || stored === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={[
          inter.variable,
          jetbrainsMono.variable,
          "min-h-dvh antialiased",
        ].join(" ")}
      >
        <ServiceWorkerRegistrar />
        <AuthAwareBackground />
        <ThemeProvider>
          <CapacitorProvider>
            <div className="relative z-[10]">
              <BlockedUserChecker>{children}</BlockedUserChecker>
            </div>
          </CapacitorProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

