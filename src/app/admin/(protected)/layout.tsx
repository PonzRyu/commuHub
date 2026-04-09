import Link from "next/link";
import { assertAdminSession } from "@/lib/admin-session";
import { Button } from "@/components/ui/button";
import { logoutAdmin } from "./actions";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await assertAdminSession();

  return (
    <div className="bg-muted/30 flex min-h-full flex-1 flex-col">
      <header className="bg-background border-b">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              ホーム
            </Link>
            <span className="text-sm font-medium">管理（部署）</span>
          </div>
          <form action={logoutAdmin}>
            <Button type="submit" variant="outline" size="sm">
              ログアウト
            </Button>
          </form>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</div>
    </div>
  );
}
