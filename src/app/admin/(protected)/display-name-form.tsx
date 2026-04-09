"use client";

import { useActionState } from "react";
import { APP_DISPLAY_NAME_SUFFIX } from "@/lib/app-display-constants";
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
import {
  updateAppDisplayName,
  type DisplayNameFormState,
} from "./display-name-actions";

const initialState: DisplayNameFormState = { error: null };

export function DisplayNameForm({
  initialPrefix,
}: {
  initialPrefix: string;
}) {
  const [state, formAction, pending] = useActionState(
    updateAppDisplayName,
    initialState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">アプリ表示名</CardTitle>
        <CardDescription>
          ホームやヘッダーのアプリ名を編集できます。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="display-name">接頭辞</Label>
            <div className="grid grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Input
                  id="display-name"
                  key={initialPrefix}
                  name="displayName"
                  defaultValue={initialPrefix}
                  maxLength={48}
                  disabled={pending}
                  autoComplete="off"
                  className="min-w-0 flex-1"
                  placeholder="PonzRyu"
                  aria-describedby="display-name-hint"
                />
                <span
                  className="text-muted-foreground shrink-0 text-sm whitespace-nowrap"
                  aria-hidden
                >
                </span>
              </div>
              <Button
                type="submit"
                disabled={pending}
                className="w-full shrink-0 sm:w-auto"
              >
                {pending ? "保存中…" : "保存"}
              </Button>
            </div>
          </div>
          <p id="display-name-hint" className="text-muted-foreground text-xs">
            「表示名 {APP_DISPLAY_NAME_SUFFIX}」形式で表示されます。
          </p>
          {state.error ? (
            <p className="text-destructive text-sm" role="alert">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="text-muted-foreground text-sm" role="status">
              保存しました。
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
