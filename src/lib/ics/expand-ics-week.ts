import { async as icalAsync, expandRecurringEvent } from "node-ical";
import type {
  CalendarResponse,
  EventInstance,
  ParameterValue,
  VEvent,
} from "node-ical";
import {
  mondayWeekdayIndexTokyo,
  addCalendarDaysTokyo,
  instantTokyo00,
  toTokyoYmd,
  type TokyoWeekRange,
} from "@/lib/ics/tokyo-week";

export interface WeekOccurrence {
  /** セル（曜日）に配置するための日付キー（開始側） */
  start: Date;
  /** 単日表示用（終日は start と同日を指す） */
  end: Date;
  /** 実際の期間（ツールチップ表示用） */
  spanStart: Date;
  /** 実際の期間（ツールチップ表示用） */
  spanEnd: Date;
  summary: string;
  /** LOCATION（未設定は null） */
  location: string | null;
  isFullDay: boolean;
}

function parameterToOptionalString(s: ParameterValue | undefined): string | null {
  if (s == null) return null;
  if (typeof s === "string") {
    const t = s.trim();
    return t ? t : null;
  }
  if (typeof s === "object" && s !== null && "val" in s) {
    const v = (s as { val?: unknown }).val;
    if (typeof v === "string") {
      const t = v.trim();
      return t ? t : null;
    }
  }
  const t = String(s).trim();
  return t ? t : null;
}

function summaryToString(s: ParameterValue | undefined): string {
  return parameterToOptionalString(s) ?? "(無題)";
}

function collectInstancesForEvent(
  event: VEvent,
  range: TokyoWeekRange,
): EventInstance[] {
  if (event.status === "CANCELLED") return [];

  const toInstant = new Date(range.toExclusive.getTime() - 1);

  try {
    return expandRecurringEvent(event, {
      from: range.fromInclusive,
      to: toInstant,
      expandOngoing: true,
      excludeExdates: true,
      includeOverrides: true,
    });
  } catch {
    return [];
  }
}

export async function expandIcsToWeekOccurrences(
  icsContent: string,
  range: TokyoWeekRange,
): Promise<WeekOccurrence[]> {
  let data: CalendarResponse;
  try {
    data = await icalAsync.parseICS(icsContent);
  } catch {
    return [];
  }

  const out: WeekOccurrence[] = [];

  for (const comp of Object.values(data)) {
    if (!comp || typeof comp !== "object") continue;
    if ((comp as { type?: string }).type !== "VEVENT") continue;
    const event = comp as VEvent;
    const instances = collectInstancesForEvent(event, range);
    for (const inst of instances) {
      const loc = parameterToOptionalString(inst.event?.location);
      const base = {
        summary: summaryToString(inst.summary),
        location: loc,
        isFullDay: inst.isFullDay,
        spanStart: inst.start,
        spanEnd: inst.end,
      };

      // 終日で複数日にまたがる場合は、期間内の各日ぶんを作って「連続表示」させる
      if (inst.isFullDay) {
        const startYmd = toTokyoYmd(inst.start);
        const endYmd = toTokyoYmd(inst.end);
        const sameDay =
          startYmd.y === endYmd.y && startYmd.m === endYmd.m && startYmd.d === endYmd.d;

        if (!sameDay) {
          // この週レンジに収まる範囲で切って日次展開
          const fromYmd = toTokyoYmd(range.fromInclusive);
          const toYmd = toTokyoYmd(new Date(range.toExclusive.getTime() - 1));

          let cursor = startYmd;
          // end は「終日の終了日」を含めたいので、endYmd まで（最大 8 日程度に収まる想定）
          for (let guard = 0; guard < 32; guard++) {
            const inWeek =
              (cursor.y > fromYmd.y ||
                (cursor.y === fromYmd.y &&
                  (cursor.m > fromYmd.m ||
                    (cursor.m === fromYmd.m && cursor.d >= fromYmd.d)))) &&
              (cursor.y < toYmd.y ||
                (cursor.y === toYmd.y &&
                  (cursor.m < toYmd.m ||
                    (cursor.m === toYmd.m && cursor.d <= toYmd.d))));

            if (inWeek) {
              const dayStart = instantTokyo00(cursor);
              out.push({
                ...base,
                start: dayStart,
                end: dayStart,
              });
            }

            if (
              cursor.y === endYmd.y &&
              cursor.m === endYmd.m &&
              cursor.d === endYmd.d
            )
              break;
            cursor = addCalendarDaysTokyo(cursor, 1);
          }

          continue;
        }
      }

      out.push({
        ...base,
        start: inst.start,
        end: inst.end,
      });
    }
  }

  out.sort((a, b) => a.start.getTime() - b.start.getTime());
  return out;
}

/** 月曜=0 … 日=6 の列へ振り分け（開始日時は東京暦の曜日で決める） */
export function bucketByMondayWeekday(
  occurrences: WeekOccurrence[],
): WeekOccurrence[][] {
  const buckets: WeekOccurrence[][] = Array.from({ length: 7 }, () => []);
  for (const occ of occurrences) {
    const idx = mondayWeekdayIndexTokyo(occ.start);
    if (idx >= 0 && idx <= 6) buckets[idx].push(occ);
  }
  for (const b of buckets) {
    b.sort((a, c) => {
      if (a.isFullDay !== c.isFullDay) return a.isFullDay ? -1 : 1;
      return a.start.getTime() - c.start.getTime();
    });
  }
  return buckets;
}
