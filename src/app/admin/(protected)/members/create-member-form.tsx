"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
          氏名・所属部署を登録し、任意で .ics を添付できます（FR-MEM-03 / FR-MEM-04）。
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
            <select
              id="member-dept"
              name="departmentId"
              required
              disabled={pending}
              className={cn(
                "border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm",
                "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <option value="">選択してください</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="member-display-order">表示順（任意）</Label>
            <select
              id="member-display-order"
              name="displayOrder"
              disabled={pending}
              defaultValue=""
              className={cn(
                "border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm",
                "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <option value="">未選択（最後）</option>
              <option value="1">1（最優先）</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="member-ics">カレンダー（.ics・任意）</Label>
            <Input
              id="member-ics"
              name="ics"
              type="file"
              accept=".ics,text/calendar"
              disabled={pending}
            />
            <p className="text-muted-foreground text-xs">
              最大 2MB。UTF-8 の iCalendar ファイルを想定しています。
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
