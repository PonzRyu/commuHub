"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface AdminNavLink {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
}

const LINKS: AdminNavLink[] = [
  {
    href: "/admin",
    label: "管理トップ",
    isActive: (pathname) => pathname === "/admin",
  },
  {
    href: "/admin/departments",
    label: "部署",
    isActive: (pathname) => pathname === "/admin/departments",
  },
  {
    href: "/admin/members",
    label: "メンバー",
    isActive: (pathname) => pathname === "/admin/members",
  },
];

export function AdminNav() {
  const pathname = usePathname() ?? "/admin";

  return (
    <nav className="flex items-center gap-3 text-sm">
      {LINKS.map((link) => {
        const isActive = link.isActive(pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              isActive
                ? "text-primary font-semibold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

