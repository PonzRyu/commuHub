"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";

export function ScheduleTooltipProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <TooltipProvider delayDuration={250}>{children}</TooltipProvider>;
}
