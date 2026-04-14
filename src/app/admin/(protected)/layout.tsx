import Link from "next/link";
import { assertAdminSession } from "@/lib/admin-session";
import { Button } from "@/components/ui/button";
import { logoutAdmin } from "./actions";
import { AdminNav } from "./admin-nav";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await assertAdminSession();

  return (
    <div className="bg-background flex min-h-full flex-1 flex-col">
      <header className="bg-background border-b">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-3">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href="/"
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              ウィークリースケジュール
            </Link>
            <AdminNav />
          </div>
          <form action={logoutAdmin}>
            <Button type="submit" variant="outline" size="sm">
              ログアウト
            </Button>
          </form>
        </div>
      </header>
      <div className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8">{children}</div>
    </div>
  );
}
