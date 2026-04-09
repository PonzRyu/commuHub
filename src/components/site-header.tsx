import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="bg-background border-b">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          CommuHub
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/"
            className="text-muted-foreground hover:text-foreground"
          >
            ホーム
          </Link>
          <Link
            href="/admin/departments"
            className="text-muted-foreground hover:text-foreground"
          >
            部署の管理
          </Link>
        </nav>
      </div>
    </header>
  );
}
