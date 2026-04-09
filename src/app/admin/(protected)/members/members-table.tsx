"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  deleteMember,
  deleteMemberIcs,
  updateMember,
  uploadMemberIcs,
} from "./actions";
import type { DepartmentOption } from "./create-member-form";

function formatJaDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ja-JP", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export type MemberRow = {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  hasIcs: boolean;
  icsFileName: string | null;
  icsRegisteredAt: string | null;
};

export function MembersTable({
  rows,
  departments,
}: {
  rows: MemberRow[];
  departments: DepartmentOption[];
}) {
  const router = useRouter();
  const icsFileRef = useRef<HTMLInputElement>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [icsOpen, setIcsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [active, setActive] = useState<MemberRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editDeptId, setEditDeptId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openEdit(row: MemberRow) {
    setActive(row);
    setEditName(row.name);
    setEditDeptId(row.departmentId);
    setFormError(null);
    setEditOpen(true);
  }

  function openIcs(row: MemberRow) {
    setActive(row);
    setFormError(null);
    if (icsFileRef.current) icsFileRef.current.value = "";
    setIcsOpen(true);
  }

  function openDelete(row: MemberRow) {
    setActive(row);
    setFormError(null);
    setDeleteOpen(true);
  }

  function submitEdit() {
    if (!active) return;
    setFormError(null);
    startTransition(async () => {
      const result = await updateMember(active.id, editName, editDeptId);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setEditOpen(false);
      setActive(null);
      router.refresh();
    });
  }

  function submitIcsUpload() {
    if (!active) return;
    const input = icsFileRef.current;
    const file = input?.files?.[0];
    if (!file) {
      setFormError(".ics ファイルを選択してください。");
      return;
    }
    setFormError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("memberId", active.id);
      fd.set("ics", file);
      const result = await uploadMemberIcs(fd);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setIcsOpen(false);
      setActive(null);
      if (input) input.value = "";
      router.refresh();
    });
  }

  function submitDeleteIcs() {
    if (!active) return;
    setFormError(null);
    startTransition(async () => {
      const result = await deleteMemberIcs(active.id);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setIcsOpen(false);
      setActive(null);
      router.refresh();
    });
  }

  function submitDeleteMember() {
    if (!active) return;
    setFormError(null);
    startTransition(async () => {
      const result = await deleteMember(active.id);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setDeleteOpen(false);
      setActive(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>メンバー名</TableHead>
              <TableHead>部署</TableHead>
              <TableHead>.ics</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  メンバーがまだありません。上のフォームから登録してください。
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.departmentName}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {row.hasIcs ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="text-foreground">
                          {row.icsFileName ?? "登録済み"}
                        </span>
                        {row.icsRegisteredAt ? (
                          <span className="text-xs">
                            登録: {formatJaDateTime(row.icsRegisteredAt)}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      "未登録"
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(row)}
                      >
                        編集
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => openIcs(row)}
                      >
                        カレンダー
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => openDelete(row)}
                      >
                        削除
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>メンバーを編集</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-member-name">メンバー名</Label>
              <Input
                id="edit-member-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={120}
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-member-dept">部署</Label>
              <select
                id="edit-member-dept"
                value={editDeptId}
                onChange={(e) => setEditDeptId(e.target.value)}
                disabled={pending}
                className={cn(
                  "border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm",
                  "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                )}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            {formError && editOpen ? (
              <p className="text-destructive text-sm" role="alert">
                {formError}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={pending}
            >
              キャンセル
            </Button>
            <Button type="button" onClick={submitEdit} disabled={pending}>
              {pending ? "保存中…" : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={icsOpen} onOpenChange={setIcsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>カレンダー（.ics）</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <p className="text-muted-foreground text-sm">
              {active?.hasIcs ? (
                <>
                  現在:{" "}
                  <span className="text-foreground font-medium">
                    {active.icsFileName ?? "登録済み"}
                  </span>
                  {active.icsRegisteredAt ? (
                    <>
                      <br />
                      登録日:{" "}
                      <span className="text-foreground">
                        {formatJaDateTime(active.icsRegisteredAt)}
                      </span>
                    </>
                  ) : null}
                </>
              ) : (
                "まだ .ics が登録されていません（FR-MEM-04）。"
              )}
            </p>
            <div className="grid gap-2">
              <Label htmlFor="ics-file">ファイル</Label>
              <input
                id="ics-file"
                ref={icsFileRef}
                type="file"
                accept=".ics,text/calendar"
                disabled={pending}
                className={cn(
                  "file:text-foreground h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none",
                  "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium",
                  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
                )}
              />
            </div>
            {formError && icsOpen ? (
              <p className="text-destructive text-sm" role="alert">
                {formError}
              </p>
            ) : null}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {active?.hasIcs ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => submitDeleteIcs()}
                >
                  {pending ? "処理中…" : ".ics を削除"}
                </Button>
              ) : null}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIcsOpen(false)}
                disabled={pending}
              >
                閉じる
              </Button>
              <Button
                type="button"
                onClick={() => submitIcsUpload()}
                disabled={pending}
              >
                {pending ? "アップロード中…" : "アップロード"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>メンバーを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {active ? (
                <>
                  「<span className="font-medium">{active.name}</span>
                  」を削除します。登録済みの .ics も失われます（FR-MEM-05）。
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {formError && deleteOpen ? (
            <p className="text-destructive text-sm" role="alert">
              {formError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>キャンセル</AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => submitDeleteMember()}
            >
              {pending ? "削除中…" : "削除する"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
