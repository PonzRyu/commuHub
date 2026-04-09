import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
      <div className="max-w-lg space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          CommuHub（コミュハブ）
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          上部メニューから「部署の管理」へ進み、管理者パスワードでログインして部署を登録できます（FR-SEC-01〜03、NFR-SEC-01）。
        </p>
      </div>
      <Link
        href="/admin/departments"
        className={cn(buttonVariants({ variant: "default" }))}
      >
        部署の管理へ
      </Link>
    </div>
  );
}
