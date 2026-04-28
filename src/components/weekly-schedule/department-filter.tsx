"use client";

import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEMO_SENSITIVE_BLUR_CLASS } from "@/lib/demo-redaction";
import { cn } from "@/lib/utils";
import type { DepartmentFilterOption } from "./weekly-schedule";

const ALL_DEPARTMENT_VALUE = "すべての部署";

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
  const selectedDepartmentName =
    departments.find((department) => department.id === departmentId)?.name ??
    "";

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
      <Select
        value={departmentId && departmentId.length > 0 ? departmentId : ALL_DEPARTMENT_VALUE}
        onValueChange={(next) =>
          onChange(next == null || next === ALL_DEPARTMENT_VALUE ? "" : next)
        }
      >
        <SelectTrigger
          id="department-filter"
          className={cn(
            toolbarStyle
              ? cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-8 w-full justify-between px-2.5",
                )
              : "h-9 w-full px-3 text-sm",
          )}
        >
          <SelectValue placeholder="すべての部署">
            {selectedDepartmentName ? (
              <span className={DEMO_SENSITIVE_BLUR_CLASS}>{selectedDepartmentName}</span>
            ) : (
              ALL_DEPARTMENT_VALUE
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-[11rem]">
          <SelectItem value={ALL_DEPARTMENT_VALUE}>すべての部署</SelectItem>
          {departments.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              <span className={DEMO_SENSITIVE_BLUR_CLASS}>{d.name}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

