"use client";

import * as React from "react";
import Link from "next/link";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

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
import { formatWeekdayLabels } from "@/lib/ics/tokyo-week";
import { ScheduleOccurrenceLine } from "@/components/weekly-schedule/schedule-occurrence-line";
import { ScheduleTooltipProvider } from "@/components/weekly-schedule/schedule-tooltip-provider";
import { DepartmentFilter } from "@/components/weekly-schedule/department-filter";
import { WeekNavLinks } from "@/components/week-nav-links";
import { PageContainer } from "@/components/page-container";
import { PageStack } from "@/components/page-stack";
import {
  getBaseScheduleColorIndex,
  SCHEDULE_PALETTE_COUNT,
} from "@/lib/ics/schedule-color";

import type {
  DepartmentFilterOption,
  WeeklyMemberRow,
} from "@/components/weekly-schedule/weekly-schedule";

const WEEKDAY_COL_CLASS = "w-[13.2rem] max-w-[13.2rem]";
const WEEKEND_COL_CLASS = "w-[12rem] max-w-[12rem]";
const WEEKEND_CLASS = "bg-muted/30";

type SortMode = "custom" | "department";

function sortByDepartment(rows: WeeklyMemberRow[]): WeeklyMemberRow[] {
  return [...rows].sort((a, b) => {
    const dept = a.departmentName.localeCompare(b.departmentName, "ja");
    if (dept !== 0) return dept;
    const ao = a.displayOrder ?? Number.POSITIVE_INFINITY;
    const bo = b.displayOrder ?? Number.POSITIVE_INFINITY;
    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name, "ja");
  });
}

function useSortableRow(id: string) {
  const sortable = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };
  return { ...sortable, style };
}

function MemberRowDayCells({
  row,
  weekdayCount,
}: {
  row: WeeklyMemberRow;
  weekdayCount: number;
}) {
  return (
    <>
      {row.buckets.slice(0, weekdayCount).map((day, i) => (
        <TableCell
          key={`${row.memberId}-${i}`}
          className={cn(
            i >= 5 ? WEEKEND_COL_CLASS : WEEKDAY_COL_CLASS,
            "align-top overflow-hidden",
            "border-b border-border",
            i >= 5 ? WEEKEND_CLASS : null,
          )}
        >
          {!row.hasIcs ? (
            <span className="text-muted-foreground">ー</span>
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
                    base === prevColor ? (base + 1) % SCHEDULE_PALETTE_COUNT : base;
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
    </>
  );
}

function StaticMemberRow({
  row,
  weekdayCount,
}: {
  row: WeeklyMemberRow;
  weekdayCount: number;
}) {
  return (
    <TableRow>
      <TableCell
        className={cn(
          "bg-card sticky left-0 z-10 align-top font-medium whitespace-normal pl-3",
          "border-b border-border",
        )}
      >
        <div className="flex flex-col gap-0.5">
          <span>{row.name}</span>
          <span className="text-muted-foreground text-xs font-normal">
            {row.departmentName}
          </span>
        </div>
      </TableCell>
      <MemberRowDayCells row={row} weekdayCount={weekdayCount} />
    </TableRow>
  );
}

function SortableMemberRow({
  row,
  weekdayCount,
  dragLabel,
}: {
  row: WeeklyMemberRow;
  weekdayCount: number;
  dragLabel: string;
}) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, isDragging, style } =
    useSortableRow(row.memberId);

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(isDragging ? "bg-muted/30" : null)}
    >
      <TableCell
        ref={setActivatorNodeRef}
        className={cn(
          "bg-card sticky left-0 z-10 align-top font-medium whitespace-normal pl-3",
          "cursor-grab active:cursor-grabbing select-none",
          "border-b border-border",
        )}
        aria-label={dragLabel}
        {...attributes}
        {...listeners}
      >
        <div className="flex flex-col gap-0.5">
          <span>{row.name}</span>
          <span className="text-muted-foreground text-xs font-normal">
            {row.departmentName}
          </span>
        </div>
      </TableCell>
      <MemberRowDayCells row={row} weekdayCount={weekdayCount} />
    </TableRow>
  );
}

export function WeeklyScheduleClient({
  weekRangeLabel,
  mondayParam,
  prevMondayParam,
  nextMondayParam,
  departments,
  departmentId,
  rows,
}: {
  weekRangeLabel: string;
  mondayParam: string;
  prevMondayParam: string;
  nextMondayParam: string;
  departments: DepartmentFilterOption[];
  departmentId: string | null;
  rows: WeeklyMemberRow[];
}) {
  const weekdays = formatWeekdayLabels();

  const [sortMode, setSortMode] = React.useState<SortMode>("department");
  const [hideNoSchedule, setHideNoSchedule] = React.useState(false);
  const [customOrder, setCustomOrder] = React.useState<string[]>(
    rows.map((r) => r.memberId),
  );

  const lastCustomOrderRef = React.useRef<string[]>(rows.map((r) => r.memberId));

  React.useEffect(() => {
    const next = rows.map((r) => r.memberId);
    setCustomOrder(next);
    lastCustomOrderRef.current = next;
    setSortMode("department");
  }, [rows]);

  const rowsById = React.useMemo(() => {
    const m = new Map<string, WeeklyMemberRow>();
    for (const r of rows) m.set(r.memberId, r);
    return m;
  }, [rows]);

  const orderedRows = React.useMemo(() => {
    if (sortMode === "department") return sortByDepartment(rows);

    const order = customOrder;
    const existing = order
      .map((id) => rowsById.get(id))
      .filter(Boolean) as WeeklyMemberRow[];
    const rest = rows.filter((r) => !order.includes(r.memberId));
    return [...existing, ...rest];
  }, [rows, rowsById, customOrder, sortMode]);

  const visibleRows = React.useMemo(() => {
    if (!hideNoSchedule) return orderedRows;
    return orderedRows.filter((r) => {
      if (!r.hasIcs) return false;
      return r.buckets.some((b) => b.length > 0);
    });
  }, [orderedRows, hideNoSchedule]);

  /** dnd-kit の SSR 時とクライアント初回で aria-describedby 等の ID がずれハイドレーション不一致になるため、マウント後のみ DnD を有効化する */
  const [dndMounted, setDndMounted] = React.useState(false);
  React.useEffect(() => {
    setDndMounted(true);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const ids = sortMode === "custom" ? customOrder : orderedRows.map((r) => r.memberId);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const next = arrayMove(ids, oldIndex, newIndex);
    lastCustomOrderRef.current = next;
    setCustomOrder(next);
    setSortMode("custom");
  }

  function onClickDepartmentSort() {
    if (sortMode === "department") {
      setSortMode("custom");
      setCustomOrder(lastCustomOrderRef.current);
      return;
    }
    lastCustomOrderRef.current =
      sortMode === "custom" ? customOrder : lastCustomOrderRef.current;
    setSortMode("department");
  }

  const sortButtonLabel = sortMode === "department" ? "カスタム順に戻す" : "部署でソート";
  const hideNoScheduleLabel = hideNoSchedule
    ? "予定がない人も表示する"
    : "予定がない人を非表示にする";

  const router = useRouter();
  const [refreshBusy, setRefreshBusy] = React.useState(false);

  React.useEffect(() => {
    setRefreshBusy(false);
  }, [rows, weekRangeLabel]);

  function onRefreshSchedule() {
    setRefreshBusy(true);
    const sp = new URLSearchParams();
    sp.set("w", mondayParam);
    if (departmentId) sp.set("departmentId", departmentId);
    sp.set("_r", String(Date.now()));
    router.replace(`/?${sp.toString()}`);
  }

  return (
    <PageContainer>
      <PageStack>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="m-0 flex min-h-7 items-center text-2xl font-semibold leading-none tracking-tight">
                ウィークリースケジュール
              </h1>
              <button
                type="button"
                onClick={onRefreshSchedule}
                disabled={refreshBusy}
                aria-label="日程を最新の状態に更新"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon-sm" }),
                  "shrink-0 text-primary hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/15",
                )}
              >
                <RefreshCw
                  className={cn("size-4", refreshBusy && "animate-spin")}
                  aria-hidden
                />
              </button>
            </div>
            <p className="text-muted-foreground mt-2 text-sm font-medium">
              期間：{weekRangeLabel}
            </p>
          </div>
          <WeekNavLinks
            currentWeekHref={departmentId ? `/?departmentId=${encodeURIComponent(departmentId)}` : "/"}
            prevWeekHref={(() => {
              const sp = new URLSearchParams({ w: prevMondayParam });
              if (departmentId) sp.set("departmentId", departmentId);
              const qs = sp.toString();
              return qs ? `/?${qs}` : "/";
            })()}
            nextWeekHref={(() => {
              const sp = new URLSearchParams({ w: nextMondayParam });
              if (departmentId) sp.set("departmentId", departmentId);
              const qs = sp.toString();
              return qs ? `/?${qs}` : "/";
            })()}
            className="w-full justify-end sm:w-[18rem]"
          />
        </div>

      <ScheduleTooltipProvider>
        <div className="rounded-xl border bg-card">
          <div className="flex flex-wrap items-center justify-end gap-2 border-b px-3 py-2">
            <div className="mr-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onClickDepartmentSort}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                {sortButtonLabel}
              </button>
              <button
                type="button"
                onClick={() => setHideNoSchedule((v) => !v)}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                {hideNoScheduleLabel}
              </button>
            </div>
            <DepartmentFilter
              mondayParam={mondayParam}
              departmentId={departmentId}
              departments={departments}
              showLabel={false}
              toolbarStyle
              className="w-full sm:w-[18rem]"
            />
          </div>

          {dndMounted ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={onDragEnd}
            >
              <SortableContext
                items={visibleRows.map((r) => r.memberId)}
                strategy={verticalListSortingStrategy}
              >
                <Table className="table-fixed w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 z-10 w-[7rem] max-w-[7rem] bg-card/90 pl-3">
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
                        <TableCell colSpan={8} className="py-10 text-center">
                          <div className="mx-auto flex max-w-md flex-col items-center gap-2">
                            <p className="text-muted-foreground text-sm">
                              表示するメンバーがいません。管理画面でメンバーを登録してください。
                            </p>
                            <Link
                              href="/admin/members"
                              className={buttonVariants({ variant: "outline", size: "sm" })}
                            >
                              メンバーを追加
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      visibleRows.map((row) => (
                        <SortableMemberRow
                          key={row.memberId}
                          row={row}
                          weekdayCount={weekdays.length}
                          dragLabel={`${row.name}の表示順を変更`}
                        />
                      ))
                    )}
                  </TableBody>
                </Table>
              </SortableContext>
            </DndContext>
          ) : (
            <Table className="table-fixed w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 w-[7rem] max-w-[7rem] bg-card/90 pl-3">
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
                    <TableCell colSpan={8} className="py-10 text-center">
                      <div className="mx-auto flex max-w-md flex-col items-center gap-2">
                        <p className="text-muted-foreground text-sm">
                          表示するメンバーがいません。管理画面でメンバーを登録してください。
                        </p>
                        <Link
                          href="/admin/members"
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          メンバーを追加
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleRows.map((row) => (
                    <StaticMemberRow
                      key={row.memberId}
                      row={row}
                      weekdayCount={weekdays.length}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </ScheduleTooltipProvider>
      </PageStack>
    </PageContainer>
  );
}

