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
import { PageStack } from "@/components/page-stack";

export async function generateMetadata(): Promise<Metadata> {
  const name = await getAppDisplayName();
  return {
    title: "管理",
    description: `${name} の管理メニュー`,
  };
}

export default async function AdminHubPage() {
  const displayPrefix = await getAppDisplayNamePrefix();

  return (
    <PageStack>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">管理</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">部署</CardTitle>
            <CardDescription>部署マスターを管理します。</CardDescription>
          </CardHeader>
          <div className="mt-auto flex justify-end px-4">
            <Link
              href="/admin/departments"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "w-36 justify-center text-sm",
              )}
            >
              部署の管理へ
            </Link>
          </div>
        </Card>
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-base">メンバー</CardTitle>
            <CardDescription>メンバーとカレンダーを管理します。</CardDescription>
          </CardHeader>
          <div className="mt-auto flex justify-end px-4">
            <Link
              href="/admin/members"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "w-36 justify-center text-sm",
              )}
            >
              メンバーの管理へ
            </Link>
          </div>
        </Card>
        <Card className="flex flex-col sm:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">外部リンク</CardTitle>
            <CardDescription>
              トップバーに表示する外部サイトへのリンクを設定します（最大 5 件）。
            </CardDescription>
          </CardHeader>
          <div className="mt-auto flex justify-end px-4">
            <Link
              href="/admin/external-links"
              className={cn(
                buttonVariants({ variant: "default", size: "sm" }),
                "w-36 justify-center text-sm",
              )}
            >
              外部リンクの設定へ
            </Link>
          </div>
        </Card>
      </div>

      <DisplayNameForm initialPrefix={displayPrefix} />
      
    </PageStack>
  );
}
