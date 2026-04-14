import * as React from "react";

import { cn } from "@/lib/utils";

export interface PageStackProps {
  children: React.ReactNode;
  className?: string;
}

export function PageStack({ children, className }: PageStackProps) {
  return <div className={cn("flex flex-col gap-6", className)}>{children}</div>;
}

