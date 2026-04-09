"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { loginAsAdmin } from "./actions";

const initialState = { error: null as string | null };

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState(
    loginAsAdmin,
    initialState,
  );

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>管理者ログイン</CardTitle>
          <CardDescription>
            部署・メンバー管理のためのパスワードを入力してください（NFR-SEC-01）。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4">
            <input type="hidden" name="next" value={nextPath} />
            <div className="grid gap-2">
              <Label htmlFor="password">パスワード</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={pending}
              />
            </div>
            {state.error ? (
              <p className="text-destructive text-sm" role="alert">
                {state.error}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "確認中…" : "ログイン"}
            </Button>
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "inline-flex w-full justify-center",
              )}
            >
              ホームへ戻る
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
