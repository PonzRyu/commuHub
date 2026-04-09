import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WeekOccurrence } from "@/lib/ics/expand-ics-week";
import { formatWeekdayLabels } from "@/lib/ics/tokyo-week";
import { ScheduleOccurrenceLine } from "@/components/weekly-schedule/schedule-occurrence-line";
import { ScheduleTooltipProvider } from "@/components/weekly-schedule/schedule-tooltip-provider";
import { DepartmentFilter } from "@/components/weekly-schedule/department-filter";
import {
  getBaseScheduleColorIndex,
  SCHEDULE_PALETTE_COUNT,
} from "@/lib/ics/schedule-color";

const WEEKDAY_COL_CLASS = "w-[13.2rem] max-w-[13.2rem]";
const WEEKEND_COL_CLASS = "w-[12rem] max-w-[12rem]";
const WEEKEND_CLASS = "bg-muted/30";

export interface WeeklyMemberRow {
  memberId: string;
  name: string;
  departmentName: string;
  hasIcs: boolean;
  /** 月曜=0 … 日=6 */
  buckets: WeekOccurrence[][];
}

export interface DepartmentFilterOption {
  id: string;
  name: string;
}

interface WeeklyScheduleProps {
  weekRangeLabel: string;
  mondayParam: string;
  prevMondayParam: string;
  nextMondayParam: string;
  departments: DepartmentFilterOption[];
  departmentId: string | null;
  rows: WeeklyMemberRow[];
}

function buildQuery(
  monday: string,
  departmentId: string | null,
): Record<string, string> {
  const q: Record<string, string> = { w: monday };
  if (departmentId) q.departmentId = departmentId;
  return q;
}

function toHref(query: Record<string, string>): string {
  const sp = new URLSearchParams(query);
  const s = sp.toString();
  return s ? `/?${s}` : "/";
}

export function WeeklySchedule({
  weekRangeLabel,
  mondayParam,
  prevMondayParam,
  nextMondayParam,
  departments,
  departmentId,
  rows,
}: WeeklyScheduleProps) {
  const weekdays = formatWeekdayLabels();

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">週間日程</h1>
          <p className="mt-2 text-sm font-medium">期間：{weekRangeLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={toHref(buildQuery(prevMondayParam, departmentId))}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            ← 前の週
          </Link>
          <Link
            href={toHref(buildQuery(nextMondayParam, departmentId))}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            次の週 →
          </Link>
        </div>
      </div>

      <DepartmentFilter
        mondayParam={mondayParam}
        departmentId={departmentId}
        departments={departments}
      />

      <ScheduleTooltipProvider>
      <div className="rounded-xl border bg-card">
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 z-10 w-[7rem] max-w-[7rem] bg-card pl-3">
                名前
              </TableHead>
              {weekdays.map((w, idx) => (
                <TableHead
                  key={w}
                  className={cn(
                    idx >= 5 ? WEEKEND_COL_CLASS : WEEKDAY_COL_CLASS,
                    "text-center",
                    idx >= 5 ? WEEKEND_CLASS : null,
                  )}
                >
                  {w}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-muted-foreground py-10 text-center"
                >
                  表示するメンバーがいません。管理画面でメンバーを登録してください。
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.memberId}>
                  <TableCell className="bg-card sticky left-0 z-10 align-top font-medium whitespace-normal pl-3">
                    <div className="flex flex-col gap-0.5">
                      <span>{row.name}</span>
                      <span className="text-muted-foreground text-xs font-normal">
                        {row.departmentName}
                      </span>
                    </div>
                  </TableCell>
                  {row.buckets.map((day, i) => (
                    <TableCell
                      key={`${row.memberId}-${i}`}
                      className={cn(
                        i >= 5 ? WEEKEND_COL_CLASS : WEEKDAY_COL_CLASS,
                        "align-top overflow-hidden",
                        i >= 5 ? WEEKEND_CLASS : null,
                      )}
                    >
                      {!row.hasIcs ? (
                        <span className="text-muted-foreground text-xs">
                          .ics 未登録
                        </span>
                      ) : day.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <ul className="flex flex-col gap-1 text-left">
                          {(() => {
                            let prevColor = -1;
                            return day.map((occ, idx) => {
                              const seed = `${occ.summary}@@${occ.location ?? "—"}`;
                              const base = getBaseScheduleColorIndex(seed);
                              const colorIndex =
                                base === prevColor
                                  ? (base + 1) % SCHEDULE_PALETTE_COUNT
                                  : base;
                              prevColor = colorIndex;

                              return (
                                <li
                                  key={`${occ.start.getTime()}-${idx}-${occ.summary.slice(0, 24)}`}
                                  className="min-w-0"
                                >
                                  <ScheduleOccurrenceLine
                                    startIso={occ.start.toISOString()}
                                    endIso={occ.end.toISOString()}
                                    spanStartIso={occ.spanStart.toISOString()}
                                    spanEndIso={occ.spanEnd.toISOString()}
                                    summary={occ.summary}
                                    location={occ.location}
                                    isFullDay={occ.isFullDay}
                                    colorIndex={colorIndex}
                                  />
                                </li>
                              );
                            });
                          })()}
                        </ul>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      </ScheduleTooltipProvider>
    </div>
  );
}
