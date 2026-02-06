"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { WcBridge } from "@/components/WcBridge";

const OnChainProvider = dynamic(
  () => import("../state/onchain").then((m) => m.OnChainProvider),
  { ssr: false }
);

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <OnChainProvider>
      <WcBridge />
      {children}
    </OnChainProvider>
  );
}
