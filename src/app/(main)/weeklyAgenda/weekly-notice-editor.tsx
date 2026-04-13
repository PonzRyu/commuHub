"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { GripVertical, Plus, X } from "lucide-react";

import { WeekNavLinks } from "@/components/week-nav-links";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WEEKLY_AGENDA_PATH } from "@/lib/routes";
import {
  clearWeeklyAgendaSchedule,
  clearWeeklyNotice,
  saveWeeklyAgendaSchedule,
  saveWeeklyNotice,
  type WeeklyAgendaScheduleDataV1,
  type WeeklyAgendaScheduleRow,
} from "./actions";
import { PageContainer } from "@/components/page-container";
import { PageStack } from "@/components/page-stack";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

function scheduleHasAnyCellContent(data: WeeklyAgendaScheduleDataV1): boolean {
  return data.days.some((day) =>
    day.some((r) => r.time.trim().length > 0 || r.text.trim().length > 0),
  );
}

export interface WeeklyNoticeEditorProps {
  weekRangeLabel: string;
  mondayParam: string;
  prevMondayParam: string;
  nextMondayParam: string;
  initialContent: string;
  initialSchedule: WeeklyAgendaScheduleDataV1;
}

export function WeeklyNoticeEditor({
  weekRangeLabel,
  mondayParam,
  prevMondayParam,
  nextMondayParam,
  initialContent,
  initialSchedule,
}: WeeklyNoticeEditorProps) {
  const router = useRouter();
  const [draft, setDraft] = React.useState(initialContent);
  const [unifiedClearOpen, setUnifiedClearOpen] = React.useState(false);
  const [leaveOpen, setLeaveOpen] = React.useState(false);
  const [pendingLeaveHref, setPendingLeaveHref] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [scheduleDraft, setScheduleDraft] = React.useState<WeeklyAgendaScheduleDataV1>(
    initialSchedule,
  );
  const [scheduleBusy, setScheduleBusy] = React.useState(false);
  const [scheduleError, setScheduleError] = React.useState<string | null>(null);

  /** dnd-kit の SSR/CSR 初回差分を避けるためマウント後のみ有効化 */
  const [scheduleDndMounted, setScheduleDndMounted] = React.useState(false);
  React.useEffect(() => {
    setScheduleDndMounted(true);
  }, []);

  React.useEffect(() => {
    setDraft(initialContent);
  }, [initialContent]);

  const isDirty = draft !== initialContent;

  React.useEffect(() => {
    setScheduleDraft(initialSchedule);
  }, [initialSchedule]);

  const isScheduleDirty =
    JSON.stringify(scheduleDraft) !== JSON.stringify(initialSchedule);

  const unifiedBusy = busy || scheduleBusy;
  const canUnifiedClear =
    initialContent.trim().length > 0 ||
    draft.trim().length > 0 ||
    scheduleHasAnyCellContent(initialSchedule) ||
    scheduleHasAnyCellContent(scheduleDraft);

  React.useEffect(() => {
    if (!isDirty && !isScheduleDirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, isScheduleDirty]);

  React.useEffect(() => {
    if (!isDirty && !isScheduleDirty) return;
    function onDocumentClickCapture(e: MouseEvent) {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== 0) return;
      const t = e.target;
      const el =
        t instanceof Element ? t : t instanceof Node ? t.parentElement : null;
      if (!el) return;
      const anchor = el.closest("a");
      if (!anchor || !(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const hrefAttr = anchor.getAttribute("href");
      if (!hrefAttr || hrefAttr.startsWith("#") || hrefAttr.startsWith("javascript:")) return;

      let nextUrl: URL;
      try {
        nextUrl = new URL(hrefAttr, window.location.href);
      } catch {
        return;
      }

      const cur = new URL(window.location.href);
      if (
        nextUrl.pathname === cur.pathname &&
        nextUrl.search === cur.search &&
        nextUrl.hash === cur.hash
      ) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      setUnifiedClearOpen(false);
      setPendingLeaveHref(nextUrl.href);
      setLeaveOpen(true);
    }
    document.addEventListener("click", onDocumentClickCapture, true);
    return () => document.removeEventListener("click", onDocumentClickCapture, true);
  }, [isDirty, isScheduleDirty]);

  async function onUnifiedSave() {
    setError(null);
    setScheduleError(null);
    if (!isDirty && !isScheduleDirty) return;

    setBusy(true);
    setScheduleBusy(true);
    try {
      if (isDirty) {
        const r = await saveWeeklyNotice(mondayParam, draft);
        if (!r.ok) {
          setError(r.error ?? "保存に失敗しました。");
          return;
        }
      }
      if (isScheduleDirty) {
        const r = await saveWeeklyAgendaSchedule(mondayParam, scheduleDraft);
        if (!r.ok) {
          setScheduleError(r.error ?? "保存に失敗しました。");
          return;
        }
      }
      router.refresh();
    } finally {
      setBusy(false);
      setScheduleBusy(false);
    }
  }

  function confirmLeaveNavigation() {
    const href = pendingLeaveHref;
    if (!href) return;
    setLeaveOpen(false);
    setPendingLeaveHref(null);
    const u = new URL(href);
    if (u.origin === window.location.origin) {
      router.push(`${u.pathname}${u.search}${u.hash}`);
    } else {
      window.location.assign(u.href);
    }
  }

  async function onUnifiedClearConfirm() {
    setError(null);
    setScheduleError(null);
    setBusy(true);
    setScheduleBusy(true);
    try {
      const [noticeResult, scheduleResult] = await Promise.all([
        clearWeeklyNotice(mondayParam),
        clearWeeklyAgendaSchedule(mondayParam),
      ]);
      if (!noticeResult.ok) {
        setError(noticeResult.error ?? "共有事項のクリアに失敗しました。");
      }
      if (!scheduleResult.ok) {
        setScheduleError(scheduleResult.error ?? "予定表のクリアに失敗しました。");
      }
      if (!noticeResult.ok || !scheduleResult.ok) return;

      setDraft("");
      setScheduleDraft({ v: 1, days: Array.from({ length: 7 }, () => []) });
      setUnifiedClearOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
      setScheduleBusy(false);
    }
  }

  function createRowId() {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  const scheduleSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  /** `afterRowId` があるときはその行の直下に、ないときはその曜日の末尾に行を追加する */
  function addScheduleRowAfter(dayIndex: number, afterRowId?: string) {
    setScheduleDraft((prev) => {
      const days = prev.days.map((d) => [...d]) as WeeklyAgendaScheduleRow[][];
      const day = [...(days[dayIndex] ?? [])];
      const nextRow: WeeklyAgendaScheduleRow = { id: createRowId(), time: "", text: "" };
      if (afterRowId == null || afterRowId === "") {
        day.push(nextRow);
      } else {
        const idx = day.findIndex((r) => r.id === afterRowId);
        if (idx === -1) day.push(nextRow);
        else day.splice(idx + 1, 0, nextRow);
      }
      days[dayIndex] = day;
      return { ...prev, days };
    });
  }

  function updateScheduleRow(
    dayIndex: number,
    rowId: string,
    patch: Partial<Pick<WeeklyAgendaScheduleRow, "time" | "text">>,
  ) {
    setScheduleDraft((prev) => {
      const days = prev.days.map((d) => [...d]) as WeeklyAgendaScheduleRow[][];
      const day = days[dayIndex] ?? [];
      const idx = day.findIndex((r) => r.id === rowId);
      if (idx === -1) return prev;
      const current = day[idx];
      day[idx] = { ...current, ...patch };
      days[dayIndex] = day;
      return { ...prev, days };
    });
  }

  function removeScheduleRow(dayIndex: number, rowId: string) {
    setScheduleDraft((prev) => {
      const days = prev.days.map((d) => [...d]) as WeeklyAgendaScheduleRow[][];
      days[dayIndex] = (days[dayIndex] ?? []).filter((r) => r.id !== rowId);
      return { ...prev, days };
    });
  }

  /** tbody 内に DndContext を置けない（補助 DOM が入りハイドレーションエラーになる）ため、テーブル全体で 1 つの DndContext にまとめる */
  function onScheduleDragEndGlobal(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    setScheduleDraft((prev) => {
      const activeId = String(active.id);
      let dayIndex = -1;
      for (let i = 0; i < 7; i++) {
        if ((prev.days[i] ?? []).some((r) => r.id === activeId)) {
          dayIndex = i;
          break;
        }
      }
      if (dayIndex === -1) return prev;

      const days = prev.days.map((d) => [...d]) as WeeklyAgendaScheduleRow[][];
      const day = days[dayIndex] ?? [];
      const oldIndex = day.findIndex((r) => r.id === String(active.id));
      const newIndex = day.findIndex((r) => r.id === String(over.id));
      if (oldIndex === -1 || newIndex === -1) return prev;
      days[dayIndex] = arrayMove(day, oldIndex, newIndex);
      return { ...prev, days };
    });
  }

  return (
    <PageContainer>
      <PageStack>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="m-0 flex min-h-7 shrink-0 items-center text-2xl font-semibold leading-none tracking-tight whitespace-nowrap">
                ウィークリーアジェンダ
              </h1>
              <span className="size-7 shrink-0" aria-hidden />
            </div>
            <p className="text-muted-foreground mt-2 text-sm font-medium">
              期間：{weekRangeLabel}
            </p>
          </div>
          <div className="flex w-full flex-col items-stretch gap-2 sm:max-w-none sm:items-end">
            <WeekNavLinks
              currentWeekHref={WEEKLY_AGENDA_PATH}
              prevWeekHref={`${WEEKLY_AGENDA_PATH}?w=${encodeURIComponent(prevMondayParam)}`}
              nextWeekHref={`${WEEKLY_AGENDA_PATH}?w=${encodeURIComponent(nextMondayParam)}`}
              className="w-full justify-end sm:w-[18rem]"
            />
            <div className="flex w-full flex-wrap justify-end gap-2">
              <Button
                type="button"
                size="sm"
                onClick={() => void onUnifiedSave()}
                disabled={unifiedBusy || (!isDirty && !isScheduleDirty)}
              >
                保存
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setDraft(initialContent);
                  setScheduleDraft(initialSchedule);
                }}
                disabled={unifiedBusy || (!isDirty && !isScheduleDirty)}
              >
                編集を取り消す
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => setUnifiedClearOpen(true)}
                disabled={unifiedBusy || !canUnifiedClear}
              >
                クリア
              </Button>
            </div>
            {error ? (
              <p className="text-destructive max-w-md text-right text-sm" role="alert">
                {error}
              </p>
            ) : null}
            {scheduleError ? (
              <p className="text-destructive max-w-md text-right text-sm" role="alert">
                {scheduleError}
              </p>
            ) : null}
          </div>
        </div>

        <section className="rounded-xl border bg-card">
          <div className="border-b px-3 py-2">
            <h2 className="text-lg font-semibold tracking-tight">共有事項</h2>
          </div>

          <div className="px-3 py-3 sm:px-3.5 sm:py-4">
            <label htmlFor="weekly-sharing-body" className="sr-only">
              共有事項
            </label>
            <textarea
              id="weekly-sharing-body"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              disabled={unifiedBusy}
              placeholder="例：定例会の議題、締切、休暇の共有、来客の案内 など"
              className="border-input bg-background w-full min-h-[6rem] resize-y rounded-lg border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
        </section>

        <section className="rounded-xl border bg-card">
          <div className="px-3 py-3 sm:px-3.5 sm:py-4">
            <h2 className="text-lg font-semibold tracking-tight">予定表</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              曜日ごとに行を追加して予定を記入できます（週ごとに保存されます）。
            </p>

            <div className="mt-4 rounded-lg border bg-background/40">
              <DndContext
                sensors={scheduleSensors}
                collisionDetection={closestCenter}
                onDragEnd={onScheduleDragEndGlobal}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[8.5rem]">曜日</TableHead>
                      <TableHead className="w-[10rem]">時間</TableHead>
                      <TableHead>内容</TableHead>
                      <TableHead className="w-[5.5rem] text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { key: "mon", label: "月" },
                      { key: "tue", label: "火" },
                      { key: "wed", label: "水" },
                      { key: "thu", label: "木" },
                      { key: "fri", label: "金" },
                      { key: "sat", label: "土" },
                      { key: "sun", label: "日" },
                    ].map((d, dayIndex) => {
                      const rows = scheduleDraft.days[dayIndex] ?? [];
                      const hasRows = rows.length > 0;
                      return (
                        <SortableContext
                          key={d.key}
                          items={rows.map((r) => r.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {hasRows ? (
                            rows.map((row, rowIndex) => (
                              <ScheduleSortableRow
                                key={row.id}
                                row={row}
                                dayLabel={d.label}
                                dayIndex={dayIndex}
                                isFirstRowOfDay={rowIndex === 0}
                                scheduleBusy={unifiedBusy}
                                scheduleDndMounted={scheduleDndMounted}
                                updateScheduleRow={updateScheduleRow}
                                removeScheduleRow={removeScheduleRow}
                                onAddAfter={() => addScheduleRowAfter(dayIndex, row.id)}
                              />
                            ))
                          ) : (
                            <TableRow>
                              <TableCell className="align-top">
                                <span className="inline-block pt-1 text-sm font-semibold tracking-tight">
                                  {d.label}
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground align-top">—</TableCell>
                              <TableCell className="text-muted-foreground align-top">—</TableCell>
                              <TableCell className="align-top">
                                <div className="flex justify-end gap-0.5">
                                  <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="ghost"
                                    className="bg-transparent text-primary hover:bg-transparent hover:text-primary/90 active:bg-transparent dark:hover:bg-transparent"
                                    onClick={() => addScheduleRowAfter(dayIndex)}
                                    disabled={unifiedBusy}
                                    aria-label={`${d.label}曜日に行を追加`}
                                    title="この曜日に行を追加"
                                  >
                                    <Plus className="size-4" aria-hidden />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </SortableContext>
                      );
                    })}
                  </TableBody>
                </Table>
              </DndContext>
            </div>
          </div>
        </section>

        <AlertDialog open={unifiedClearOpen} onOpenChange={setUnifiedClearOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>共有事項と予定表をクリアしますか？</AlertDialogTitle>
              <AlertDialogDescription>
                この操作は取り消せません。保存済みの共有事項と予定表の両方が削除されます。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={unifiedBusy}>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(e) => {
                  e.preventDefault();
                  void onUnifiedClearConfirm();
                }}
                disabled={unifiedBusy}
              >
                クリアする
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={leaveOpen}
          onOpenChange={(open) => {
            setLeaveOpen(open);
            if (!open) setPendingLeaveHref(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>保存されていない変更があります</AlertDialogTitle>
              <AlertDialogDescription>
                編集中の内容が保存されていません。このページを離れますか？
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>このページに留まる</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  confirmLeaveNavigation();
                }}
              >
                ページを離れる
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageStack>
    </PageContainer>
  );
}

function ScheduleSortableRow({
  row,
  dayLabel,
  dayIndex,
  isFirstRowOfDay,
  scheduleBusy,
  scheduleDndMounted,
  updateScheduleRow,
  removeScheduleRow,
  onAddAfter,
}: {
  row: WeeklyAgendaScheduleRow;
  dayLabel: string;
  dayIndex: number;
  isFirstRowOfDay: boolean;
  scheduleBusy: boolean;
  scheduleDndMounted: boolean;
  updateScheduleRow: (
    dayIndex: number,
    rowId: string,
    patch: Partial<Pick<WeeklyAgendaScheduleRow, "time" | "text">>,
  ) => void;
  removeScheduleRow: (dayIndex: number, rowId: string) => void;
  onAddAfter: () => void;
}) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, isDragging, transform, transition } =
    useSortable({ id: row.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        isDragging ? "bg-muted/30" : null,
      )}
    >
      <TableCell className="align-top">
        {isFirstRowOfDay ? (
          <span className="inline-block pt-1 text-sm font-semibold tracking-tight">{dayLabel}</span>
        ) : (
          <span className="text-muted-foreground select-none" aria-hidden>
            {" "}
          </span>
        )}
      </TableCell>
      <TableCell className="align-top">
        <div className="flex items-start gap-2">
          <button
            type="button"
            ref={setActivatorNodeRef}
            disabled={scheduleBusy || !scheduleDndMounted}
            aria-label={`${dayLabel}曜日の行を移動`}
            className={cn(
              "text-muted-foreground hover:text-foreground inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
              "cursor-grab active:cursor-grabbing",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
          <Input
            value={row.time}
            onChange={(e) => updateScheduleRow(dayIndex, row.id, { time: e.target.value })}
            placeholder="例: 10:00"
            disabled={scheduleBusy}
            aria-label={`${dayLabel}曜日の時間`}
          />
        </div>
      </TableCell>
      <TableCell className="align-top whitespace-normal">
        <Input
          className="min-w-0 w-full"
          value={row.text}
          onChange={(e) => updateScheduleRow(dayIndex, row.id, { text: e.target.value })}
          placeholder="例: 定例MTG / 来客対応"
          disabled={scheduleBusy}
          aria-label={`${dayLabel}曜日の内容`}
        />
      </TableCell>
      <TableCell className="align-top">
        <div className="flex justify-end gap-0.5">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="bg-transparent text-primary hover:bg-transparent hover:text-primary/90 active:bg-transparent dark:hover:bg-transparent"
            onClick={onAddAfter}
            disabled={scheduleBusy}
            aria-label={`${dayLabel}曜日: この行の下に行を追加`}
            title="この行の下に行を追加"
          >
            <Plus className="size-4" aria-hidden />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => removeScheduleRow(dayIndex, row.id)}
            disabled={scheduleBusy}
            aria-label={`${dayLabel}曜日: この行を削除`}
            title="この行を削除"
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      </TableCell>
    </tr>
  );
}
