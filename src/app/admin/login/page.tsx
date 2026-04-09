import { redirect } from "next/navigation";
import { isAdminSessionValid } from "@/lib/admin-session";
import { LoginForm } from "./login-form";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  if (await isAdminSessionValid()) {
    redirect("/admin/departments");
  }

  const sp = await searchParams;
  const raw = sp.next;
  const nextPath =
    raw &&
    raw.startsWith("/") &&
    !raw.startsWith("//") &&
    !raw.includes("\n")
      ? raw
      : "/admin/departments";

  return <LoginForm nextPath={nextPath} />;
}
