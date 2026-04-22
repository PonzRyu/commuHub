"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createMember, type MemberFormState } from "./actions";

const initialState: MemberFormState = { error: null };
const DEPARTMENT_UNSELECTED_VALUE = "選択してください";
const DISPLAY_ORDER_UNSELECTED_VALUE = "選択してください";

export type DepartmentOption = { id: string; name: string };

export function CreateMemberForm({
  departments,
}: {
  departments: DepartmentOption[];
}) {
  const [state, formAction, pending] = useActionState(
    createMember,
    initialState,
  );
  const [departmentId, setDepartmentId] = useState("");
  const [displayOrder, setDisplayOrder] = useState("");
  const selectedDepartmentName =
    departments.find((department) => department.id === departmentId)?.name ?? "";

  if (departments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">メンバーを追加</CardTitle>
          <CardDescription>
            先に部署を登録してください（FR-MEM-01）。部署の管理画面から追加できます。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/admin/departments"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            部署の管理へ
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">メンバーを追加</CardTitle>
        <CardDescription>
          氏名・所属部署を登録し、ICSリンクを登録します。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="member-name">メンバー名</Label>
            <Input
              id="member-name"
              name="name"
              placeholder="例: 山田 太郎"
              maxLength={120}
              required
              disabled={pending}
              autoComplete="name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="member-dept">部署</Label>
            <input type="hidden" name="departmentId" value={departmentId} />
            <Select
              value={departmentId || DEPARTMENT_UNSELECTED_VALUE}
              onValueChange={(next) =>
                setDepartmentId(
                  next == null || next === DEPARTMENT_UNSELECTED_VALUE ? "" : next,
                )
              }
              disabled={pending}
            >
              <SelectTrigger id="member-dept" className="h-8 w-full px-2.5 text-sm">
                <SelectValue placeholder="選択してください">
                  {selectedDepartmentName || DEPARTMENT_UNSELECTED_VALUE}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="max-h-[11rem]">
                <SelectItem value={DEPARTMENT_UNSELECTED_VALUE}>選択してください</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="member-display-order">表示順（任意）</Label>
            <input type="hidden" name="displayOrder" value={displayOrder} />
            <Select
              value={displayOrder || DISPLAY_ORDER_UNSELECTED_VALUE}
              onValueChange={(next) =>
                setDisplayOrder(
                  next == null || next === DISPLAY_ORDER_UNSELECTED_VALUE ? "" : next,
                )
              }
              disabled={pending}
            >
              <SelectTrigger id="member-display-order" className="h-8 w-full px-2.5 text-sm">
                <SelectValue placeholder="未選択（最後）" />
              </SelectTrigger>
              <SelectContent className="max-h-[11rem]">
                <SelectItem value={DISPLAY_ORDER_UNSELECTED_VALUE}>未選択（最後）</SelectItem>
                <SelectItem value="1">1（最優先）</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="member-ics-url">カレンダー（ICS リンク・任意）</Label>
            <Input
              id="member-ics-url"
              name="icsUrl"
              type="url"
              placeholder="例: https://example.com/calendar.ics"
              disabled={pending}
            />
            <p className="text-muted-foreground text-xs">
              公開されたiCalendar(ICS)へのリンクを入力してください。
            </p>
          </div>
          <Button type="submit" className="w-fit" disabled={pending}>
            {pending ? "登録中…" : "登録"}
          </Button>
          {state.error ? (
            <p className="text-destructive text-sm" role="alert">
              {state.error}
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
