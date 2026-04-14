"use server";

import { revalidatePath } from "next/cache";
import { assertAdminSession } from "@/lib/admin-session";
import {
  MAX_EXTERNAL_LINK_LABEL_LEN,
  MAX_EXTERNAL_NAV_LINKS,
  normalizeExternalLinkLabel,
  validateExternalLinkUrl,
} from "@/lib/external-nav-links-shared";
import { prisma } from "@/lib/prisma";

export type ExternalLinksFormState = {
  error: string | null;
  success?: boolean;
};

function revalidateExternalLinks() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/external-links");
}

export async function addExternalLink(
  _prev: ExternalLinksFormState | null,
  formData: FormData,
): Promise<ExternalLinksFormState> {
  await assertAdminSession();
  const label = normalizeExternalLinkLabel(String(formData.get("label") ?? ""));
  const urlRaw = String(formData.get("url") ?? "");
  const urlResult = validateExternalLinkUrl(urlRaw);

  if (!label) {
    return { error: "サイト名を入力してください。", success: false };
  }
  if (label.length > MAX_EXTERNAL_LINK_LABEL_LEN) {
    return {
      error: `サイト名は ${MAX_EXTERNAL_LINK_LABEL_LEN} 文字以内にしてください。`,
      success: false,
    };
  }
  if (!urlResult.ok) {
    return { error: urlResult.error, success: false };
  }

  const count = await prisma.externalNavLink.count();
  if (count >= MAX_EXTERNAL_NAV_LINKS) {
    return { error: "外部リンクは最大 5 件までです。", success: false };
  }

  const agg = await prisma.externalNavLink.aggregate({ _max: { sortOrder: true } });
  const nextOrder = (agg._max.sortOrder ?? -1) + 1;

  await prisma.externalNavLink.create({
    data: { label, url: urlResult.href, sortOrder: nextOrder },
  });

  revalidateExternalLinks();
  return { error: null, success: true };
}

export async function updateExternalLink(
  _prev: ExternalLinksFormState | null,
  formData: FormData,
): Promise<ExternalLinksFormState> {
  await assertAdminSession();
  const id = String(formData.get("id") ?? "").trim();
  const label = normalizeExternalLinkLabel(String(formData.get("label") ?? ""));
  const urlRaw = String(formData.get("url") ?? "");
  const urlResult = validateExternalLinkUrl(urlRaw);

  if (!id) {
    return { error: "更新対象が不正です。", success: false };
  }
  if (!label) {
    return { error: "サイト名を入力してください。", success: false };
  }
  if (label.length > MAX_EXTERNAL_LINK_LABEL_LEN) {
    return {
      error: `サイト名は ${MAX_EXTERNAL_LINK_LABEL_LEN} 文字以内にしてください。`,
      success: false,
    };
  }
  if (!urlResult.ok) {
    return { error: urlResult.error, success: false };
  }

  const existing = await prisma.externalNavLink.findUnique({ where: { id } });
  if (!existing) {
    return { error: "該当するリンクが見つかりません。", success: false };
  }

  await prisma.externalNavLink.update({
    where: { id },
    data: { label, url: urlResult.href },
  });

  revalidateExternalLinks();
  return { error: null, success: true };
}

export async function deleteExternalLink(
  _prev: ExternalLinksFormState | null,
  formData: FormData,
): Promise<ExternalLinksFormState> {
  await assertAdminSession();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    return { error: "削除対象が不正です。", success: false };
  }

  const found = await prisma.externalNavLink.findUnique({ where: { id } });
  if (!found) {
    return { error: "該当するリンクが見つかりません。", success: false };
  }

  await prisma.$transaction(async (tx) => {
    await tx.externalNavLink.delete({ where: { id } });
    const rest = await tx.externalNavLink.findMany({
      orderBy: { sortOrder: "asc" },
    });
    for (let i = 0; i < rest.length; i++) {
      if (rest[i].sortOrder !== i) {
        await tx.externalNavLink.update({
          where: { id: rest[i].id },
          data: { sortOrder: i },
        });
      }
    }
  });

  revalidateExternalLinks();
  return { error: null, success: true };
}

/**
 * `<button formAction>` 用（1 引数の Server Action）。同一フォーム内の更新ボタンと並べるときに使う。
 */
export async function submitDeleteExternalLink(formData: FormData): Promise<void> {
  await deleteExternalLink(null, formData);
}
