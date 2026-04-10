"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { WEEKLY_AGENDA_PATH } from "@/lib/routes";

const MAX_CONTENT_LEN = 32_000;

function normalizeWeekMondayYmd(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

export interface WeeklyNoticeActionResult {
  ok: boolean;
  error: string | null;
}

export async function saveWeeklyNotice(
  weekMondayYmd: string,
  content: string,
): Promise<WeeklyNoticeActionResult> {
  const ymd = normalizeWeekMondayYmd(weekMondayYmd);
  if (!ymd) {
    return { ok: false, error: "週の指定が不正です。" };
  }
  const trimmed = String(content ?? "").trim();
  if (trimmed.length > MAX_CONTENT_LEN) {
    return {
      ok: false,
      error: `共有事項は ${MAX_CONTENT_LEN} 文字以内にしてください。`,
    };
  }

  if (trimmed.length === 0) {
    await prisma.weeklyNotice.deleteMany({ where: { weekMondayYmd: ymd } });
  } else {
    await prisma.weeklyNotice.upsert({
      where: { weekMondayYmd: ymd },
      create: { weekMondayYmd: ymd, content: trimmed },
      update: { content: trimmed },
    });
  }

  revalidatePath(WEEKLY_AGENDA_PATH);
  return { ok: true, error: null };
}

export async function clearWeeklyNotice(
  weekMondayYmd: string,
): Promise<WeeklyNoticeActionResult> {
  const ymd = normalizeWeekMondayYmd(weekMondayYmd);
  if (!ymd) {
    return { ok: false, error: "週の指定が不正です。" };
  }

  await prisma.weeklyNotice.deleteMany({ where: { weekMondayYmd: ymd } });

  revalidatePath(WEEKLY_AGENDA_PATH);
  return { ok: true, error: null };
}
