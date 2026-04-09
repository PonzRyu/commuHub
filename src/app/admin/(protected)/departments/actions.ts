"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

const MAX_NAME_LEN = 120;

function normalizeName(raw: unknown): string {
  return String(raw ?? "").trim();
}

function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "P2002"
  );
}

export type DepartmentFormState = { error: string | null };

export async function createDepartment(
  _prev: DepartmentFormState | null,
  formData: FormData,
): Promise<DepartmentFormState> {
  await assertAdminSession();
  const name = normalizeName(formData.get("name"));
  if (!name) {
    return { error: "部署名を入力してください。" };
  }
  if (name.length > MAX_NAME_LEN) {
    return { error: `部署名は ${MAX_NAME_LEN} 文字以内にしてください。` };
  }

  try {
    await prisma.department.create({ data: { name } });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { error: "同じ名前の部署が既に登録されています。" };
    }
    throw e;
  }

  revalidatePath("/admin/departments");
  redirect("/admin/departments");
}

export async function updateDepartment(
  id: string,
  name: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAdminSession();
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, error: "部署名を入力してください。" };
  }
  if (trimmed.length > MAX_NAME_LEN) {
    return {
      ok: false,
      error: `部署名は ${MAX_NAME_LEN} 文字以内にしてください。`,
    };
  }

  try {
    await prisma.department.update({
      where: { id },
      data: { name: trimmed },
    });
  } catch (e) {
    if (isUniqueViolation(e)) {
      return { ok: false, error: "同じ名前の部署が既に登録されています。" };
    }
    throw e;
  }

  revalidatePath("/admin/departments");
  return { ok: true };
}

export async function deleteDepartment(
  id: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  await assertAdminSession();
  try {
    await prisma.department.delete({ where: { id } });
  } catch (e) {
    const code =
      typeof e === "object" && e !== null && "code" in e
        ? String((e as { code: unknown }).code)
        : "";
    if (code === "P2025") {
      return { ok: false, error: "対象の部署が見つかりません。" };
    }
    throw e;
  }

  revalidatePath("/admin/departments");
  return { ok: true };
}
