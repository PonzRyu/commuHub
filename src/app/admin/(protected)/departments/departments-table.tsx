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
import { deleteDepartment, updateDepartment } from "./actions";

export type DepartmentRow = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export function DepartmentsTable({ rows }: { rows: DepartmentRow[] }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [active, setActive] = useState<DepartmentRow | null>(null);
  const [editName, setEditName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openEdit(row: DepartmentRow) {
    setActive(row);
    setEditName(row.name);
    setFormError(null);
    setEditOpen(true);
  }

  function openDelete(row: DepartmentRow) {
    setActive(row);
    setFormError(null);
    setDeleteOpen(true);
  }

  function submitEdit() {
    if (!active) return;
    setFormError(null);
    startTransition(async () => {
      const result = await updateDepartment(active.id, editName);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      setEditOpen(false);
      setActive(null);
      router.refresh();
    });
  }

  function submitDelete() {
    if (!active) return;
    setFormError(null);
    startTransition(async () => {
      const result = await deleteDepartment(active.id);
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
              <TableHead>部署名</TableHead>
              <TableHead className="w-[1%] text-left whitespace-nowrap">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-muted-foreground">
                  部署がまだありません。上のフォームから登録してください。
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
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
            <DialogTitle>部署名を編集</DialogTitle>
          </DialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="edit-dept-name">部署名</Label>
            <Input
              id="edit-dept-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={120}
              disabled={pending}
            />
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

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>部署を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {active ? (
                <>
                  「<span className="font-medium">{active.name}</span>
                  」を削除します。この操作は取り消せません。
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
              onClick={() => submitDelete()}
            >
              {pending ? "削除中…" : "削除する"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
