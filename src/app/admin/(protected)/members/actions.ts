"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

const MAX_NAME_LEN = 120;
const MAX_ICS_BYTES = 2 * 1024 * 1024;

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

function isValidIcsText(text: string): boolean {
  return text.toUpperCase().includes("BEGIN:VCALENDAR");
}

async function readOptionalIcsFromForm(
  formData: FormData,
  fieldName: string,
): Promise<{ ok: true; content: string | null; fileName: string | null } | { ok: false; error: string }> {
  const entry = formData.get(fieldName);
  if (entry === null || entry === undefined) {
    return { ok: true, content: null, fileName: null };
  }
  if (typeof entry === "string") {
    return { ok: true, content: null, fileName: null };
  }
  const file = entry as File;
  if (!file || file.size === 0) {
    return { ok: true, content: null, fileName: null };
  }
  if (file.size > MAX_ICS_BYTES) {
    return {
      ok: false,
      error: `.ics ファイルは ${MAX_ICS_BYTES / (1024 * 1024)}MB 以下にしてください。`,
    };
  }
  const text = await file.text();
  if (!isValidIcsText(text)) {
    return {
      ok: false,
      error: "iCalendar（.ics）形式ではないようです。BEGIN:VCALENDAR を含むファイルを選んでください。",
    };
  }
  return {
    ok: true,
    content: text,
    fileName: file.name || "calendar.ics",
  };
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

  const ics = await readOptionalIcsFromForm(formData, "ics");
  if (!ics.ok) {
    return { error: ics.error };
  }

  const now = new Date();
  try {
    await prisma.member.create({
      data: {
        name,
        departmentId,
        displayOrder,
        icsContent: ics.content,
        icsFileName: ics.fileName,
        icsRegisteredAt: ics.content ? now : null,
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

  const ics = await readOptionalIcsFromForm(formData, "ics");
  if (!ics.ok) {
    return { ok: false, error: ics.error };
  }
  if (!ics.content) {
    return { ok: false, error: ".ics ファイルを選択してください。" };
  }

  try {
    await prisma.member.update({
      where: { id },
      data: {
        icsContent: ics.content,
        icsFileName: ics.fileName,
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
        icsContent: null,
        icsFileName: null,
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
