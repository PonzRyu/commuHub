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
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              ホーム
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link
                href="/admin"
                className="text-muted-foreground hover:text-foreground"
              >
                管理トップ
              </Link>
              <Link
                href="/admin/departments"
                className="text-muted-foreground hover:text-foreground"
              >
                部署
              </Link>
              <Link
                href="/admin/members"
                className="text-muted-foreground hover:text-foreground"
              >
                メンバー
              </Link>
            </nav>          </div>
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
