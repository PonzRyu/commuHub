"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteMember,
  deleteMemberIcs,
  updateMember,
  uploadMemberIcs,
} from "./actions";
import type { DepartmentOption } from "./create-member-form";

const ICS_URL_DISPLAY_MAX = 20;
const DISPLAY_ORDER_NONE_VALUE = "選択してください";

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

function truncateIcsUrlForDisplay(url: string): string {
  if (url.length <= ICS_URL_DISPLAY_MAX) return url;
  return `${url.slice(0, ICS_URL_DISPLAY_MAX)}...`;
}

export type MemberRow = {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  displayOrder: number | null;
  hasIcs: boolean;
  icsUrl: string | null;
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
  const [editOpen, setEditOpen] = useState(false);
  const [icsOpen, setIcsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [active, setActive] = useState<MemberRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editDeptId, setEditDeptId] = useState("");
  const [editDisplayOrder, setEditDisplayOrder] = useState<string>("");
  const [icsUrlInput, setIcsUrlInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const selectedEditDepartmentName =
    departments.find((department) => department.id === editDeptId)?.name ?? "";

  function openEdit(row: MemberRow) {
    setActive(row);
    setEditName(row.name);
    setEditDeptId(row.departmentId);
    setEditDisplayOrder(row.displayOrder ? String(row.displayOrder) : "");
    setFormError(null);
    setEditOpen(true);
  }

  function openIcs(row: MemberRow) {
    setActive(row);
    setFormError(null);
    setIcsUrlInput(row.icsUrl ?? "");
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
      const trimmed = editDisplayOrder.trim();
      const parsed = trimmed.length === 0 ? null : Number(trimmed);
      const normalizedOrder =
        typeof parsed === "number" &&
        Number.isInteger(parsed) &&
        parsed >= 1 &&
        parsed <= 5
          ? parsed
          : null;
      const result = await updateMember(
        active.id,
        editName,
        editDeptId,
        normalizedOrder,
      );
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
    const urlText = icsUrlInput.trim();
    if (!urlText) {
      setFormError("ICS リンク（URL）を入力してください。");
      return;
    }
    setFormError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("memberId", active.id);
      fd.set("icsUrl", urlText);
      const result = await uploadMemberIcs(fd);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setIcsOpen(false);
      setActive(null);
      setIcsUrlInput("");
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
              <TableHead>表示順</TableHead>
              <TableHead>ICS</TableHead>
              <TableHead className="w-[1%] text-left whitespace-nowrap">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  メンバーがまだありません。上のフォームから登録してください。
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.departmentName}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.displayOrder ?? "未選択"}
                  </TableCell>
                  <TableCell className="max-w-[min(100%,12rem)] min-w-0 text-muted-foreground text-sm">
                    {row.hasIcs ? (
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <span
                          className="text-foreground"
                          title={row.icsUrl ?? undefined}
                        >
                          {row.icsUrl
                            ? truncateIcsUrlForDisplay(row.icsUrl)
                            : "登録済み"}
                        </span>
                        {row.icsRegisteredAt ? (
                          <span className="text-xs">
                            登録日: {formatJaDateTime(row.icsRegisteredAt)}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      "未登録"
                    )}
                  </TableCell>
                  <TableCell className="w-[1%] text-right align-middle whitespace-nowrap">
                    <div className="flex flex-nowrap justify-end gap-2">
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
              <Select
                value={editDeptId}
                onValueChange={(next) => setEditDeptId(next ?? "")}
                disabled={pending}
              >
                <SelectTrigger id="edit-member-dept" className="h-8 w-full px-2.5 text-sm">
                  <SelectValue placeholder="部署を選択">
                    {selectedEditDepartmentName}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="max-h-[11rem]">
                {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                    {d.name}
                    </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-member-display-order">表示順（任意）</Label>
              <Select
                value={editDisplayOrder || DISPLAY_ORDER_NONE_VALUE}
                onValueChange={(next) =>
                  setEditDisplayOrder(
                    next == null || next === DISPLAY_ORDER_NONE_VALUE ? "" : next,
                  )
                }
                disabled={pending}
              >
                <SelectTrigger id="edit-member-display-order" className="h-8 w-full px-2.5 text-sm">
                  <SelectValue placeholder="未選択（最後）" />
                </SelectTrigger>
                <SelectContent className="max-h-[11rem]">
                  <SelectItem value={DISPLAY_ORDER_NONE_VALUE}>未選択（最後）</SelectItem>
                  <SelectItem value="1">1（最優先）</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                  <SelectItem value="5">5</SelectItem>
                </SelectContent>
              </Select>
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
            <DialogTitle>カレンダー（ICS リンク）</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <p className="text-muted-foreground text-sm">
              {active?.hasIcs ? (
                <>
                  現在:{" "}
                  <span
                    className="text-foreground font-medium"
                    title={active.icsUrl ?? undefined}
                  >
                    {active.icsUrl
                      ? truncateIcsUrlForDisplay(active.icsUrl)
                      : "登録済み"}
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
                "まだICSリンクが登録されていません。"
              )}
            </p>
            <div className="grid gap-2">
              <Label htmlFor="ics-url">ICS リンク</Label>
              <Input
                id="ics-url"
                type="url"
                value={icsUrlInput}
                onChange={(e) => setIcsUrlInput(e.target.value)}
                placeholder="例: https://example.com/calendar.ics"
                disabled={pending}
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
                  {pending ? "処理中…" : "ICSリンクを削除"}
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
                {pending ? "保存中…" : "保存"}
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
                  」を削除します。登録済みの ICS リンクも失われます。
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
