"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { setAdminSessionCookie } from "@/lib/admin-session";

function hashUtf8(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest();
}

export async function loginAsAdmin(
  _prev: { error: string | null } | null,
  formData: FormData,
): Promise<{ error: string | null }> {
  const password = String(formData.get("password") ?? "");
  const nextPathRaw = String(formData.get("next") ?? "/admin");
  const nextPath =
    nextPathRaw.startsWith("/admin") &&
    !nextPathRaw.startsWith("//") &&
    nextPathRaw !== "/admin/login"
      ? nextPathRaw
      : "/admin";

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return {
      error:
        "ADMIN_PASSWORD が設定されていません。環境変数を確認してください。",
    };
  }

  if (!process.env.ADMIN_SESSION_SECRET) {
    return {
      error:
        "ADMIN_SESSION_SECRET が設定されていません。環境変数を確認してください。",
    };
  }

  const a = hashUtf8(password);
  const b = hashUtf8(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { error: "パスワードが正しくありません。" };
  }

  await setAdminSessionCookie();
  redirect(nextPath);
}
