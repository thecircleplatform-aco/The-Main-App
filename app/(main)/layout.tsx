import type { ReactNode } from "react";
import { Header } from "@/components/navigation/Header";
import { FooterNav } from "@/components/navigation/FooterNav";

export default function MainAppLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-dvh w-full"
      style={{
        paddingTop: "calc(56px + env(safe-area-inset-top))",
        paddingBottom: "calc(64px + env(safe-area-inset-bottom))",
      }}
    >
      <Header />

      <main className="mx-auto w-full max-w-6xl px-4 py-4">{children}</main>

      <FooterNav />
    </div>
  );
}

