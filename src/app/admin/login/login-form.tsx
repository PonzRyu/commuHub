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

function LoginFormContents({
  nextPath,
  pending,
  error,
}: {
  nextPath: string;
  pending: boolean;
  error: string | null;
}) {
  return (
    <div className="grid gap-4">
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
      {error ? (
        <p className="text-destructive text-sm" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "確認中…" : "ログイン"}
      </Button>
    </div>
  );
}

export function LoginForm({
  nextPath,
  appDisplayName,
}: {
  nextPath: string;
  appDisplayName: string;
}) {
  const [state, formAction, pending] = useActionState(
    loginAsAdmin,
    initialState,
  );

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>管理者ログイン</CardTitle>
          <CardDescription>
            管理者用パスワードを入力してください。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4">
            <LoginFormContents
              nextPath={nextPath}
              pending={pending}
              error={state.error}
            />
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "inline-flex w-full justify-center",
              )}
            >
              ウィークリースケジュールへ戻る
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export function LoginFormInModal({
  nextPath,
}: {
  nextPath: string;
}) {
  const [state, formAction, pending] = useActionState(
    loginAsAdmin,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-4">
      <LoginFormContents
        nextPath={nextPath}
        pending={pending}
        error={state.error}
      />
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "inline-flex w-full justify-center",
        )}
      >
        ウィークリースケジュールへ戻る
      </Link>
    </form>
  );
}
