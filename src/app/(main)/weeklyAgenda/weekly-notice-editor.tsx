"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

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
import { clearWeeklyNotice, saveWeeklyNotice } from "./actions";
import { PageContainer } from "@/components/page-container";
import { PageStack } from "@/components/page-stack";

export interface WeeklyNoticeEditorProps {
  weekRangeLabel: string;
  mondayParam: string;
  prevMondayParam: string;
  nextMondayParam: string;
  initialContent: string;
}

export function WeeklyNoticeEditor({
  weekRangeLabel,
  mondayParam,
  prevMondayParam,
  nextMondayParam,
  initialContent,
}: WeeklyNoticeEditorProps) {
  const router = useRouter();
  const [draft, setDraft] = React.useState(initialContent);
  const [clearOpen, setClearOpen] = React.useState(false);
  const [leaveOpen, setLeaveOpen] = React.useState(false);
  const [pendingLeaveHref, setPendingLeaveHref] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setDraft(initialContent);
  }, [initialContent]);

  const isDirty = draft !== initialContent;

  React.useEffect(() => {
    if (!isDirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  React.useEffect(() => {
    if (!isDirty) return;
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
      setClearOpen(false);
      setPendingLeaveHref(nextUrl.href);
      setLeaveOpen(true);
    }
    document.addEventListener("click", onDocumentClickCapture, true);
    return () => document.removeEventListener("click", onDocumentClickCapture, true);
  }, [isDirty]);

  async function onSave() {
    setError(null);
    setBusy(true);
    try {
      const r = await saveWeeklyNotice(mondayParam, draft);
      if (!r.ok) {
        setError(r.error ?? "保存に失敗しました。");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
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

  async function onClearConfirm() {
    setError(null);
    setBusy(true);
    try {
      const r = await clearWeeklyNotice(mondayParam);
      if (!r.ok) {
        setError(r.error ?? "クリアに失敗しました。");
        return;
      }
      setDraft("");
      setClearOpen(false);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <PageContainer>
      <PageStack>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="m-0 flex min-h-7 items-center text-2xl font-semibold leading-none tracking-tight">
                ウィークリーアジェンダ
              </h1>
              <span className="size-7 shrink-0" aria-hidden />
            </div>
            <p className="text-muted-foreground mt-2 text-sm font-medium">
              期間：{weekRangeLabel}
            </p>
          </div>
          <WeekNavLinks
            currentWeekHref={WEEKLY_AGENDA_PATH}
            prevWeekHref={`${WEEKLY_AGENDA_PATH}?w=${encodeURIComponent(prevMondayParam)}`}
            nextWeekHref={`${WEEKLY_AGENDA_PATH}?w=${encodeURIComponent(nextMondayParam)}`}
            className="w-full justify-end sm:w-[18rem]"
          />
        </div>

        <section className="rounded-xl border bg-card">
          <div className="border-b px-3 py-2">
            <h2 className="text-lg font-semibold tracking-tight">今週の共有事項</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              チームリーダーや会議の主催者が、その週に共有したい内容を記載します。
            </p>
          </div>

          <div className="px-3 py-3 sm:px-3.5 sm:py-4">
            <label htmlFor="weekly-sharing-body" className="sr-only">
              今週の共有事項
            </label>
            <textarea
              id="weekly-sharing-body"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={6}
              disabled={busy}
              placeholder="例：定例会の議題、締切、休暇の共有、来客の案内 など"
              className="border-input bg-background w-full min-h-[6rem] resize-y rounded-lg border px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" onClick={onSave} disabled={busy || !isDirty}>
                保存
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setDraft(initialContent)}
                disabled={busy || !isDirty}
              >
                編集を取り消す
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                onClick={() => setClearOpen(true)}
                disabled={busy || (!initialContent && draft === "")}
              >
                クリア
              </Button>
            </div>

            {error ? (
              <p className="text-destructive mt-3 text-sm" role="alert">
                {error}
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-xl border bg-card">
          <div className="px-3 py-3 sm:px-3.5 sm:py-4">
            <h2 className="text-lg font-semibold tracking-tight">今週の予定</h2>
            <p className="text-muted-foreground mt-2 text-sm">
              全員の予定を表でまとめる機能は、別途仕様を定義してから追加します。
            </p>
          </div>
        </section>

        <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>今週の共有事項をクリアしますか？</AlertDialogTitle>
              <AlertDialogDescription>
                この操作は取り消せません。保存済みの共有内容が削除されます。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>キャンセル</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={(e) => {
                  e.preventDefault();
                  void onClearConfirm();
                }}
                disabled={busy}
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
