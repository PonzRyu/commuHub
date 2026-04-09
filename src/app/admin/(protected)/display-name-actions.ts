"use server";

import { revalidatePath } from "next/cache";
import { assertAdminSession } from "@/lib/admin-session";
import {
  normalizeDisplayNamePrefix,
} from "@/lib/app-display-name";
import { prisma } from "@/lib/prisma";

const MAX_PREFIX_LEN = 48;
const SITE_CONFIG_ID = 1;

export type DisplayNameFormState = {
  error: string | null;
  success?: boolean;
};

export async function updateAppDisplayName(
  _prev: DisplayNameFormState | null,
  formData: FormData,
): Promise<DisplayNameFormState> {
  await assertAdminSession();
  const raw = String(formData.get("displayName") ?? "");
  const prefix = normalizeDisplayNamePrefix(raw);

  if (prefix.length > MAX_PREFIX_LEN) {
    return {
      error: `表示名は ${MAX_PREFIX_LEN} 文字以内にしてください。`,
      success: false,
    };
  }

  await prisma.siteConfig.upsert({
    where: { id: SITE_CONFIG_ID },
    create: { id: SITE_CONFIG_ID, displayName: prefix },
    update: { displayName: prefix },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  return { error: null, success: true };
}
