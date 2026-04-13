"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WEEKLY_AGENDA_PATH } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface SiteHeaderNavLink {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
}

const LINKS: SiteHeaderNavLink[] = [
  {
    href: "/",
    label: "ウィークリースケジュール",
    isActive: (pathname) => pathname === "/",
  },
  {
    href: WEEKLY_AGENDA_PATH,
    label: "ウィークリーアジェンダ",
    isActive: (pathname) => pathname === WEEKLY_AGENDA_PATH,
  },
  {
    href: "/admin",
    label: "管理",
    isActive: (pathname) => pathname === "/admin" || pathname.startsWith("/admin/"),
  },
];

export function SiteHeaderNav() {
  const pathname = usePathname() ?? "/";

  return (
    <nav className="flex max-w-full min-w-0 items-center gap-2 overflow-x-auto text-sm sm:gap-4">
      {LINKS.map((link) => {
        const isActive = link.isActive(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-md px-2 py-1 transition-colors",
              isActive
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

