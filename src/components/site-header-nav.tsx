"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SiteHeaderNavLink {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
}

const LINKS: SiteHeaderNavLink[] = [
  {
    href: "/",
    label: "ホーム",
    isActive: (pathname) => pathname === "/",
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
    <nav className="flex items-center gap-4 text-sm">
      {LINKS.map((link) => {
        const isActive = link.isActive(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "rounded-md px-2 py-1 transition-colors",
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

