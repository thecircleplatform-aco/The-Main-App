import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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
        <div className="pointer-events-none fixed inset-0 bg-hero" />
        <div className="relative">{children}</div>
      </body>
    </html>
  );
}

