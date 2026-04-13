"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { WEEKLY_AGENDA_PATH } from "@/lib/routes";

const MAX_CONTENT_LEN = 32_000;
const MAX_SCHEDULE_CELL_LEN = 200;
const MAX_SCHEDULE_ROWS_PER_DAY = 40;

function normalizeWeekMondayYmd(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  return s;
}

export interface WeeklyNoticeActionResult {
  ok: boolean;
  error: string | null;
}

export interface WeeklyAgendaScheduleRow {
  id: string;
  time: string;
  text: string;
}

export interface WeeklyAgendaScheduleDataV1 {
  v: 1;
  days: WeeklyAgendaScheduleRow[][];
}

function normalizeScheduleData(raw: unknown): WeeklyAgendaScheduleDataV1 {
  const empty: WeeklyAgendaScheduleDataV1 = { v: 1, days: Array.from({ length: 7 }, () => []) };
  if (!raw || typeof raw !== "object") return empty;

  const anyRaw = raw as { v?: unknown; days?: unknown };
  if (anyRaw.v !== 1) return empty;
  if (!Array.isArray(anyRaw.days)) return empty;

  const days: WeeklyAgendaScheduleRow[][] = Array.from({ length: 7 }, () => []);
  for (let i = 0; i < 7; i++) {
    const day = anyRaw.days[i];
    if (!Array.isArray(day)) continue;
    const rows: WeeklyAgendaScheduleRow[] = [];
    for (const r of day) {
      if (!r || typeof r !== "object") continue;
      const rr = r as { id?: unknown; time?: unknown; text?: unknown };
      const id = String(rr.id ?? "").trim();
      if (!id) continue;
      const time = String(rr.time ?? "").trim();
      const text = String(rr.text ?? "").trim();
      rows.push({ id, time, text });
      if (rows.length >= MAX_SCHEDULE_ROWS_PER_DAY) break;
    }
    days[i] = rows;
  }

  return { v: 1, days };
}

function validateScheduleData(schedule: WeeklyAgendaScheduleDataV1): string | null {
  if (schedule.v !== 1) return "予定表データの形式が不正です。";
  if (!Array.isArray(schedule.days) || schedule.days.length !== 7) {
    return "予定表データの形式が不正です。";
  }

  for (let i = 0; i < 7; i++) {
    const day = schedule.days[i];
    if (!Array.isArray(day)) return "予定表データの形式が不正です。";
    if (day.length > MAX_SCHEDULE_ROWS_PER_DAY) {
      return `1日の行数は最大 ${MAX_SCHEDULE_ROWS_PER_DAY} 行までです。`;
    }
    for (const row of day) {
      const id = String(row.id ?? "").trim();
      if (!id) return "予定表の行 ID が不正です。";
      const time = String(row.time ?? "").trim();
      const text = String(row.text ?? "").trim();
      if (time.length > MAX_SCHEDULE_CELL_LEN || text.length > MAX_SCHEDULE_CELL_LEN) {
        return `予定表の各セルは ${MAX_SCHEDULE_CELL_LEN} 文字以内にしてください。`;
      }
    }
  }
  return null;
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

export async function saveWeeklyAgendaSchedule(
  weekMondayYmd: string,
  schedule: WeeklyAgendaScheduleDataV1,
): Promise<WeeklyNoticeActionResult> {
  const ymd = normalizeWeekMondayYmd(weekMondayYmd);
  if (!ymd) return { ok: false, error: "週の指定が不正です。" };

  const normalized = normalizeScheduleData(schedule);
  const validationError = validateScheduleData(normalized);
  if (validationError) return { ok: false, error: validationError };

  const hasAny =
    normalized.days.some((d) => d.some((r) => r.time.trim().length > 0 || r.text.trim().length > 0));

  if (!hasAny) {
    await prisma.weeklyAgendaSchedule.deleteMany({ where: { weekMondayYmd: ymd } });
  } else {
    const dataJson = normalized as unknown as Prisma.InputJsonValue;
    await prisma.weeklyAgendaSchedule.upsert({
      where: { weekMondayYmd: ymd },
      create: { weekMondayYmd: ymd, data: dataJson },
      update: { data: dataJson },
    });
  }

  revalidatePath(WEEKLY_AGENDA_PATH);
  return { ok: true, error: null };
}

export async function clearWeeklyAgendaSchedule(
  weekMondayYmd: string,
): Promise<WeeklyNoticeActionResult> {
  const ymd = normalizeWeekMondayYmd(weekMondayYmd);
  if (!ymd) return { ok: false, error: "週の指定が不正です。" };

  await prisma.weeklyAgendaSchedule.deleteMany({ where: { weekMondayYmd: ymd } });

  revalidatePath(WEEKLY_AGENDA_PATH);
  return { ok: true, error: null };
}
