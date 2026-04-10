import Link from "next/link";
import { Settings2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface WeekNavLinksProps {
  currentWeekHref: string;
  prevWeekHref: string;
  nextWeekHref: string;
  className?: string;
}

/**
 * トップ（ウィークリースケジュール `/`）と同様の「今週 / 前の週 / 次の週」ナビ。
 * 各 href は呼び出し側でクエリ（例: ?w=）を組み立てる。
 */
export function WeekNavLinks({
  currentWeekHref,
  prevWeekHref,
  nextWeekHref,
  className,
}: WeekNavLinksProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-end gap-2", className)}>
      <Link
        href={currentWeekHref}
        className={cn(buttonVariants({ variant: "default", size: "sm" }))}
      >
        <Settings2 className="mr-1 size-4" aria-hidden="true" />
        今週
      </Link>
      <Link
        href={prevWeekHref}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "border-primary text-primary hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/15",
        )}
      >
        ← 前の週
      </Link>
      <Link
        href={nextWeekHref}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "border-primary text-primary hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/15",
        )}
      >
        次の週 →
      </Link>
    </div>
  );
}
