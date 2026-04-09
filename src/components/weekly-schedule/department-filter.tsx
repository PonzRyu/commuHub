"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DepartmentFilterOption } from "./weekly-schedule";

export function DepartmentFilter({
  mondayParam,
  departmentId,
  departments,
}: {
  mondayParam: string;
  departmentId: string | null;
  departments: DepartmentFilterOption[];
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
    <div className="flex max-w-md flex-col gap-2">
      <label htmlFor="department-filter" className="text-sm font-medium">
        部署で絞り込み
      </label>
      <div className="relative">
        <select
          id="department-filter"
          value={departmentId ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "border-input bg-background h-9 w-full rounded-lg border pl-3 pr-10 text-sm",
            "appearance-none outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
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
          className="text-muted-foreground pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2"
          aria-hidden="true"
        />
      </div>
    </div>
  );
}

