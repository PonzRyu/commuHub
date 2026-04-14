"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ExternalNavLinkPublic } from "@/lib/external-nav-links-shared";
import { WEEKLY_AGENDA_PATH } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface SiteHeaderNavLink {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
}

const INTERNAL_LINKS: SiteHeaderNavLink[] = [
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
];

const ADMIN_LINK: SiteHeaderNavLink = {
  href: "/admin",
  label: "管理",
  isActive: (pathname) => pathname === "/admin" || pathname.startsWith("/admin/"),
};

const navItemClass = (isActive: boolean) =>
  cn(
    "whitespace-nowrap rounded-md px-2 py-1 transition-colors",
    isActive
      ? "text-primary font-semibold"
      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
  );

export function SiteHeaderNav({
  externalLinks,
}: {
  externalLinks: ExternalNavLinkPublic[];
}) {
  const pathname = usePathname() ?? "/";

  return (
    <nav className="flex max-w-full min-w-0 items-center gap-2 overflow-x-auto text-sm sm:gap-4">
      {INTERNAL_LINKS.map((link) => {
        const isActive = link.isActive(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={navItemClass(isActive)}
          >
            {link.label}
          </Link>
        );
      })}
      {externalLinks.map((item) => (
        <a
          key={item.id}
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={navItemClass(false)}
        >
          {item.label}
        </a>
      ))}
      <Link
        href={ADMIN_LINK.href}
        aria-current={ADMIN_LINK.isActive(pathname) ? "page" : undefined}
        className={navItemClass(ADMIN_LINK.isActive(pathname))}
      >
        {ADMIN_LINK.label}
      </Link>
    </nav>
  );
}

