"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

const MAX_NAME_LEN = 120;
const MAX_ICS_URL_LEN = 2048;

function normalizeName(raw: unknown): string {
  return String(raw ?? "").trim();
}

function parseDisplayOrder(raw: unknown): number | null {
  const v = String(raw ?? "").trim();
  if (!v) return null;
  const n = Number(v);
  if (!Number.isInteger(n)) return null;
  if (n < 1 || n > 5) return null;
  return n;
}

function isRecord(e: unknown): e is Record<string, unknown> {
  return typeof e === "object" && e !== null;
}

function getPrismaErrorCode(e: unknown): string {
  if (!isRecord(e) || typeof e.code !== "string") return "";
  return e.code;
}

function normalizeOptionalIcsUrl(raw: unknown): string | null {
  const t = String(raw ?? "").trim();
  return t ? t : null;
}

function isIpLiteral(hostname: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":");
}

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((p) => Number(p));
  if (parts.length !== 4 || parts.some((n) => !Number.isInteger(n) || n < 0 || n > 255))
    return true;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function validateIcsUrl(urlText: string): { ok: true; url: string } | { ok: false; error: string } {
  if (urlText.length > MAX_ICS_URL_LEN) {
    return { ok: false, error: `ICS リンクは ${MAX_ICS_URL_LEN} 文字以内にしてください。` };
  }
  let u: URL;
  try {
    u = new URL(urlText);
  } catch {
    return { ok: false, error: "ICS リンク（URL）の形式が不正です。" };
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") {
    return { ok: false, error: "ICS リンクは http(s) URL のみ対応しています。" };
  }
  const host = u.hostname.toLowerCase();
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return { ok: false, error: "localhost 宛の ICS リンクは登録できません。" };
  }
  if (isIpLiteral(host) && /^\d{1,3}(\.\d{1,3}){3}$/.test(host) && isPrivateIpv4(host)) {
    return { ok: false, error: "プライベートIP宛の ICS リンクは登録できません。" };
  }
  return { ok: true, url: u.toString() };
}

export type MemberFormState = { error: string | null };

export async function createMember(
  _prev: MemberFormState | null,
  formData: FormData,
): Promise<MemberFormState> {
  await assertAdminSession();
  const name = normalizeName(formData.get("name"));
  const departmentId = String(formData.get("departmentId") ?? "").trim();
  const displayOrder = parseDisplayOrder(formData.get("displayOrder"));

  if (!name) {
    return { error: "メンバー名を入力してください。" };
  }
  if (name.length > MAX_NAME_LEN) {
    return { error: `メンバー名は ${MAX_NAME_LEN} 文字以内にしてください。` };
  }
  if (!departmentId) {
    return { error: "部署を選択してください。" };
  }

  const icsUrlText = normalizeOptionalIcsUrl(formData.get("icsUrl"));
  if (icsUrlText) {
    const validated = validateIcsUrl(icsUrlText);
    if (!validated.ok) return { error: validated.error };
  }

  const now = new Date();
  try {
    await prisma.member.create({
      data: {
        name,
        departmentId,
        displayOrder,
        icsUrl: icsUrlText,
        icsRegisteredAt: icsUrlText ? now : null,
      },
    });
  } catch (e) {
    const code = getPrismaErrorCode(e);
    if (code === "P2003") {
      return { error: "選択した部署が存在しません。" };
    }
    throw e;
  }

  revalidatePath("/admin/members");
  redirect("/admin/members");
}

export async function updateMember(
  id: string,
  name: string,
  departmentId: string,
  displayOrder: number | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAdminSession();
  const trimmedName = name.trim();
  const dept = departmentId.trim();
  if (!trimmedName) {
    return { ok: false, error: "メンバー名を入力してください。" };
  }
  if (trimmedName.length > MAX_NAME_LEN) {
    return {
      ok: false,
      error: `メンバー名は ${MAX_NAME_LEN} 文字以内にしてください。`,
    };
  }
  if (!dept) {
    return { ok: false, error: "部署を選択してください。" };
  }

  try {
    await prisma.member.update({
      where: { id },
      data: { name: trimmedName, departmentId: dept, displayOrder },
    });
  } catch (e) {
    const code = getPrismaErrorCode(e);
    if (code === "P2025") {
      return { ok: false, error: "対象のメンバーが見つかりません。" };
    }
    if (code === "P2003") {
      return { ok: false, error: "選択した部署が存在しません。" };
    }
    throw e;
  }

  revalidatePath("/admin/members");
  return { ok: true };
}

export async function deleteMember(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAdminSession();
  try {
    await prisma.member.delete({ where: { id } });
  } catch (e) {
    const code = getPrismaErrorCode(e);
    if (code === "P2025") {
      return { ok: false, error: "対象のメンバーが見つかりません。" };
    }
    throw e;
  }

  revalidatePath("/admin/members");
  return { ok: true };
}

export async function uploadMemberIcs(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAdminSession();
  const id = String(formData.get("memberId") ?? "").trim();
  if (!id) {
    return { ok: false, error: "メンバーが不正です。" };
  }

  const icsUrlText = normalizeOptionalIcsUrl(formData.get("icsUrl"));
  if (!icsUrlText) {
    return { ok: false, error: "ICS リンク（URL）を入力してください。" };
  }
  const validated = validateIcsUrl(icsUrlText);
  if (!validated.ok) return { ok: false, error: validated.error };

  try {
    await prisma.member.update({
      where: { id },
      data: {
        icsUrl: validated.url,
        icsRegisteredAt: new Date(),
      },
    });
  } catch (e) {
    const code = getPrismaErrorCode(e);
    if (code === "P2025") {
      return { ok: false, error: "対象のメンバーが見つかりません。" };
    }
    throw e;
  }

  revalidatePath("/admin/members");
  return { ok: true };
}

export async function deleteMemberIcs(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAdminSession();
  try {
    await prisma.member.update({
      where: { id },
      data: {
        icsUrl: null,
        icsRegisteredAt: null,
      },
    });
  } catch (e) {
    const code = getPrismaErrorCode(e);
    if (code === "P2025") {
      return { ok: false, error: "対象のメンバーが見つかりません。" };
    }
    throw e;
  }

  revalidatePath("/admin/members");
  return { ok: true };
}
