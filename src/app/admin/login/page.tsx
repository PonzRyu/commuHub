import { redirect } from "next/navigation";
import { isAdminSessionValid } from "@/lib/admin-session";
import { getAppDisplayName } from "@/lib/app-display-name";
import { LoginForm } from "./login-form";

function safeNextPath(raw: string | undefined): string {
  if (!raw || raw.startsWith("//") || raw.includes("\n")) return "/admin";
  if (!raw.startsWith("/admin") || raw === "/admin/login") return "/admin";
  return raw;
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await isAdminSessionValid()) {
    redirect("/admin");
  }

  const sp = await searchParams;
  const nextPath = safeNextPath(sp.next);

  const appDisplayName = await getAppDisplayName();

  return <LoginForm nextPath={nextPath} appDisplayName={appDisplayName} />;
}
