import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getAppDisplayName } from "@/lib/app-display-name";
import { cn } from "@/lib/utils";

export default async function Home() {
  const appName = await getAppDisplayName();

  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <div className="max-w-lg space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">{appName}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          上部メニューから「管理」へ進み、管理者パスワードでログインして部署・メンバーを登録できます（FR-SEC-*
          / FR-MEM-*、NFR-SEC-01）。
        </p>
      </div>
      <Link href="/admin" className={cn(buttonVariants({ variant: "default" }))}>
        管理へ
      </Link>
    </div>
  );
}