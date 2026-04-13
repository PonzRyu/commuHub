"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DepartmentFilterOption } from "./weekly-schedule";

export function DepartmentFilter({
  mondayParam,
  departmentId,
  departments,
  showLabel = true,
  toolbarStyle = false,
  className,
}: {
  mondayParam: string;
  departmentId: string | null;
  departments: DepartmentFilterOption[];
  showLabel?: boolean;
  toolbarStyle?: boolean;
  className?: string;
}) {
  const router = useRouter();

  function onChange(nextDeptId: string) {
    const sp = new URLSearchParams();
    sp.set("w", mondayParam);
    if (nextDeptId) sp.set("departmentId", nextDeptId);
    const qs = sp.toString();
    router.replace(qs ? `/?${qs}` : "/");
  }

  return (
    <div className={cn("flex max-w-md flex-col gap-2", className)}>
      <label
        htmlFor="department-filter"
        className={cn(
          "text-muted-foreground text-sm font-medium",
          showLabel ? null : "sr-only",
        )}
      >
        部署
      </label>
      <div className="relative">
        <select
          id="department-filter"
          value={departmentId ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            toolbarStyle
              ? cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "w-full appearance-none pl-2.5 pr-8 text-left",
                  "border-primary text-primary hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/15",
                  "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:border-ring",
                )
              : cn(
                  "border-input bg-background h-9 w-full rounded-lg border pl-3 pr-10 text-sm",
                  "appearance-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                ),
          )}
        >
          <option value="">すべての部署</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <ChevronDown
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2",
            toolbarStyle ? "text-primary" : "text-muted-foreground",
          )}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

