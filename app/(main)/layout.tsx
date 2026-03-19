import type { ReactNode } from "react";
import { MainAppFrame } from "@/components/navigation/MainAppFrame";

export default function MainAppLayout({ children }: { children: ReactNode }) {
  return <MainAppFrame>{children}</MainAppFrame>;
}

