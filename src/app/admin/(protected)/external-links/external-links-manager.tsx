"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ExternalNavLinkPublic } from "@/lib/external-nav-links-shared";
import { MAX_EXTERNAL_LINK_LABEL_LEN, MAX_EXTERNAL_NAV_LINKS } from "@/lib/external-nav-links-shared";
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
  addExternalLink,
  submitDeleteExternalLink,
  updateExternalLink,
  type ExternalLinksFormState,
} from "../external-links-actions";
import { DEMO_SENSITIVE_BLUR_CLASS } from "@/lib/demo-redaction";

const emptyState: ExternalLinksFormState = { error: null };

function ExternalLinkRowFields({ link }: { link: ExternalNavLinkPublic }) {
  const { pending } = useFormStatus();

  return (
    <>
      <input type="hidden" name="id" value={link.id} />
      <div className="grid gap-2">
        <Label htmlFor={`label-${link.id}`}>サイト名</Label>
        <Input
          id={`label-${link.id}`}
          name="label"
          defaultValue={link.label}
          maxLength={MAX_EXTERNAL_LINK_LABEL_LEN}
          disabled={pending}
          autoComplete="off"
          className={DEMO_SENSITIVE_BLUR_CLASS}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`url-${link.id}`}>外部リンク</Label>
        <Input
          id={`url-${link.id}`}
          name="url"
          type="url"
          defaultValue={link.url}
          disabled={pending}
          autoComplete="off"
          placeholder="https://"
          className={DEMO_SENSITIVE_BLUR_CLASS}
        />
      </div>
      <div className="flex w-full flex-row flex-nowrap gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
        <Button
          type="submit"
          disabled={pending}
          size="sm"
          className="min-w-[4.5rem] shrink-0"
        >
          {pending ? "処理中…" : "更新"}
        </Button>
        <Button
          type="submit"
          formAction={submitDeleteExternalLink}
          variant="outline"
          size="sm"
          disabled={pending}
          className="min-w-[4.5rem] shrink-0"
        >
          {pending ? "処理中…" : "削除"}
        </Button>
      </div>
    </>
  );
}

function ExternalLinkRowForm({ link }: { link: ExternalNavLinkPublic }) {
  const [updateState, updateAction] = useActionState(
    updateExternalLink,
    emptyState,
  );

  return (
    <div className="border-muted space-y-3 rounded-lg border p-4">
      <form
        action={updateAction}
        className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end"
      >
        <ExternalLinkRowFields link={link} />
      </form>
      {updateState.error ? (
        <p className="text-destructive text-sm" role="alert">
          {updateState.error}
        </p>
      ) : null}
      {updateState.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          保存しました。
        </p>
      ) : null}
    </div>
  );
}

function AddExternalLinkForm({ canAdd }: { canAdd: boolean }) {
  const [state, formAction, pending] = useActionState(addExternalLink, emptyState);

  if (!canAdd) {
    return (
      <p className="text-muted-foreground text-sm">
        外部リンクは {MAX_EXTERNAL_NAV_LINKS} 件に達しています。追加するには既存の項目を削除してください。
      </p>
    );
  }

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end">
      <div className="grid gap-2">
        <Label htmlFor="new-label">サイト名</Label>
        <Input
          id="new-label"
          name="label"
          maxLength={MAX_EXTERNAL_LINK_LABEL_LEN}
          disabled={pending}
          autoComplete="off"
          placeholder="例: 社内 Wiki"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="new-url">外部リンク</Label>
        <Input
          id="new-url"
          name="url"
          type="url"
          disabled={pending}
          autoComplete="off"
          placeholder="https://"
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "追加中…" : "追加"}
      </Button>
      {state.error ? (
        <p className="text-destructive sm:col-span-3 text-sm" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="text-muted-foreground sm:col-span-3 text-sm" role="status">
          追加しました。
        </p>
      ) : null}
    </form>
  );
}

export function ExternalLinksManager({
  initialLinks,
}: {
  initialLinks: ExternalNavLinkPublic[];
}) {
  const canAdd = initialLinks.length < MAX_EXTERNAL_NAV_LINKS;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">登録済み</CardTitle>
        <CardDescription>
          トップバーに表示する順で並びます（最大 {MAX_EXTERNAL_NAV_LINKS} 件）。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {initialLinks.length === 0 ? (
          <p className="text-muted-foreground text-sm">まだ外部リンクがありません。</p>
        ) : (
          <div className="space-y-4">
            {initialLinks.map((link) => (
              <ExternalLinkRowForm key={link.id} link={link} />
            ))}
          </div>
        )}

        <div className="border-muted space-y-3 border-t pt-4">
          <p className="text-sm font-medium">新規追加</p>
          <AddExternalLinkForm
            key={initialLinks.map((l) => l.id).join("-")}
            canAdd={canAdd}
          />
        </div>
      </CardContent>
    </Card>
  );
}
