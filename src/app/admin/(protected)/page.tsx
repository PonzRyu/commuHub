import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getAppDisplayName, getAppDisplayNamePrefix } from "@/lib/app-display-name";
import { DisplayNameForm } from "./display-name-form";

export async function generateMetadata(): Promise<Metadata> {
  const name = await getAppDisplayName();
  return {
    title: "管理",
    description: `${name} の管理メニュー`,
  };
}

export default async function AdminHubPage() {
  const appName = await getAppDisplayName();
  const displayPrefix = await getAppDisplayNamePrefix();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">管理</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {appName} — 部署・メンバーの登録と .ics の管理（FR-SEC-* / FR-MEM-*）。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">部署</CardTitle>
            <CardDescription>部署名の一覧・追加・編集・削除</CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <Link
              href="/admin/departments"
              className={cn(buttonVariants({ variant: "default" }), "inline-flex")}
            >
              部署の管理へ
            </Link>
          </div>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">メンバー</CardTitle>
            <CardDescription>
              メンバーとカレンダー（.ics）の登録・更新・削除
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <Link
              href="/admin/members"
              className={cn(buttonVariants({ variant: "default" }), "inline-flex")}
            >
              メンバーの管理へ
            </Link>
          </div>
        </Card>
      </div>

      <DisplayNameForm initialPrefix={displayPrefix} />
      
    </div>
  );
}
