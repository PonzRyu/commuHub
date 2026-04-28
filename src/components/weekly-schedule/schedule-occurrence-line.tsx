"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DEMO_SENSITIVE_BLUR_CLASS } from "@/lib/demo-redaction";
import { cn } from "@/lib/utils";

const TOKYO = "Asia/Tokyo";

const timeHmShort = new Intl.DateTimeFormat("en-GB", {
  timeZone: TOKYO,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const rangeDetail = new Intl.DateTimeFormat("ja-JP", {
  timeZone: TOKYO,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateOnly = new Intl.DateTimeFormat("ja-JP", {
  timeZone: TOKYO,
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

export interface ScheduleOccurrenceLineProps {
  startIso: string;
  endIso: string;
  spanStartIso: string;
  spanEndIso: string;
  summary: string;
  location: string | null;
  isFullDay: boolean;
  colorIndex: number;
}

const PALETTES = [
  {
    border: "border-l-sky-500",
    bgHover: "hover:bg-sky-500/10",
    badge: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  },
  {
    border: "border-l-emerald-500",
    bgHover: "hover:bg-emerald-500/10",
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  {
    border: "border-l-violet-500",
    bgHover: "hover:bg-violet-500/10",
    badge: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  },
  {
    border: "border-l-amber-500",
    bgHover: "hover:bg-amber-500/10",
    badge: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  },
  {
    border: "border-l-rose-500",
    bgHover: "hover:bg-rose-500/10",
    badge: "bg-rose-500/15 text-rose-800 dark:text-rose-300",
  },
  {
    border: "border-l-cyan-500",
    bgHover: "hover:bg-cyan-500/10",
    badge: "bg-cyan-500/15 text-cyan-800 dark:text-cyan-300",
  },
  {
    border: "border-l-lime-500",
    bgHover: "hover:bg-lime-500/10",
    badge: "bg-lime-500/15 text-lime-800 dark:text-lime-300",
  },
  {
    border: "border-l-fuchsia-500",
    bgHover: "hover:bg-fuchsia-500/10",
    badge: "bg-fuchsia-500/15 text-fuchsia-800 dark:text-fuchsia-300",
  },
  {
    border: "border-l-orange-500",
    bgHover: "hover:bg-orange-500/10",
    badge: "bg-orange-500/15 text-orange-800 dark:text-orange-300",
  },
  {
    border: "border-l-indigo-500",
    bgHover: "hover:bg-indigo-500/10",
    badge: "bg-indigo-500/15 text-indigo-800 dark:text-indigo-300",
  },
] as const;

export function ScheduleOccurrenceLine({
  startIso,
  endIso,
  spanStartIso,
  spanEndIso,
  summary,
  location,
  isFullDay,
  colorIndex,
}: ScheduleOccurrenceLineProps) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const spanStart = new Date(spanStartIso);
  const spanEnd = new Date(spanEndIso);

  const timePrefix = isFullDay ? "終日" : timeHmShort.format(start);

  const startDay = dateOnly.format(spanStart);
  const endDay = dateOnly.format(spanEnd);

  const timeDetail = isFullDay
    ? startDay === endDay
      ? `終日（${startDay}）`
      : `終日（${startDay} 〜 ${endDay}）`
    : `${rangeDetail.format(spanStart)} 〜 ${rangeDetail.format(spanEnd)}`;

  const palette = PALETTES[colorIndex] ?? PALETTES[0];
  const placeText = location?.trim() ? location.trim() : "—";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full min-w-0 max-w-full cursor-default items-baseline gap-2 rounded-sm border border-transparent text-left text-xs leading-snug outline-none",
            "border-l-2 px-2 py-1",
            palette.border,
            palette.bgHover,
            "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
          )}
        >
          <span
            className={cn(
              "shrink-0 rounded px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
              palette.badge,
            )}
          >
            {timePrefix}
          </span>
          <span className={cn("min-w-0 flex-1 truncate", DEMO_SENSITIVE_BLUR_CLASS)}>{summary}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        sideOffset={8}
        className="max-w-sm space-y-2 text-left whitespace-normal"
      >
        <p className={cn("font-semibold", DEMO_SENSITIVE_BLUR_CLASS)}>{summary}</p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {timeDetail}
        </p>
        <p className="text-xs leading-relaxed">
          <span className="text-muted-foreground">場所: </span>
          {placeText}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
