"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createDepartment, type DepartmentFormState } from "./actions";

const initialState: DepartmentFormState = { error: null };

export function CreateDepartmentForm() {
  const [state, formAction, pending] = useActionState(
    createDepartment,
    initialState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">部署を追加</CardTitle>
        <CardDescription>新しい部署名を登録します（FR-SEC-03）。</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="dept-name">部署名</Label>
            <Input
              id="dept-name"
              name="name"
              placeholder="例: 開発部"
              maxLength={120}
              required
              disabled={pending}
              autoComplete="organization"
            />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "登録中…" : "登録"}
          </Button>
        </form>
        {state.error ? (
          <p className="text-destructive mt-3 text-sm" role="alert">
            {state.error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
