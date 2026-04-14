import Link from "next/link";
import { getAppDisplayName } from "@/lib/app-display-name";
import { listExternalNavLinksPublic } from "@/lib/external-nav-links";
import { SiteHeaderNav } from "@/components/site-header-nav";

export async function SiteHeader() {
  const appName = await getAppDisplayName();
  const externalLinks = await listExternalNavLinksPublic();

  return (
    <header className="bg-background border-b">
      <div className="mx-auto flex min-w-0 max-w-[1200px] items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="text-primary text-base font-extrabold tracking-tight sm:text-lg"
        >
          {appName}
        </Link>
        <SiteHeaderNav externalLinks={externalLinks} />
      </div>
    </header>
  );
}