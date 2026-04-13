import {
  bucketByMondayWeekday,
  expandIcsToWeekOccurrences,
  type WeekOccurrence,
} from "@/lib/ics/expand-ics-week";
import { fetchIcsText } from "@/lib/ics/fetch-ics-text";
import {
  getTokyoWeekRange,
  parseWeekQuery,
  toTokyoYmd,
  type TokyoYmd,
} from "@/lib/ics/tokyo-week";
import { prisma } from "@/lib/prisma";

const TOKYO = "Asia/Tokyo";

const timeHmTokyo = new Intl.DateTimeFormat("en-GB", {
  timeZone: TOKYO,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateOnlyJa = new Intl.DateTimeFormat("ja-JP", {
  timeZone: TOKYO,
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

/** 予定表の「時間」列: 東京暦・同日なら HH:mm ~ HH:mm、日をまたぐ場合は m/d 付き */
function formatOccurrenceTimeRange(occ: WeekOccurrence): string {
  const sy = toTokyoYmd(occ.start);
  const ey = toTokyoYmd(occ.end);
  const startHm = timeHmTokyo.format(occ.start);
  const endHm = timeHmTokyo.format(occ.end);
  const sameYmd = sy.y === ey.y && sy.m === ey.m && sy.d === ey.d;

  if (sameYmd) {
    return startHm === endHm ? startHm : `${startHm} ~ ${endHm}`;
  }

  const md = (y: TokyoYmd) => `${y.m}/${y.d}`;
  return `${md(sy)} ${startHm} ~ ${md(ey)} ${endHm}`;
}

/** 共有事項向け: 「期間 タイトル」（終日・複数日対応） */
export function formatFullDaySharingSegment(occ: WeekOccurrence): string {
  const startDay = dateOnlyJa.format(occ.spanStart);
  const endDay = dateOnlyJa.format(occ.spanEnd);
  const period = startDay === endDay ? startDay : `${startDay} 〜 ${endDay}`;
  return `${period} ${occ.summary}`;
}

export interface TeamScheduleTimedRow {
  /** 月曜=0 … 日=6 */
  weekdayIndex: number;
  time: string;
  text: string;
}

export interface TeamScheduleImportBuilt {
  sharingLines: string[];
  timedRows: TeamScheduleTimedRow[];
}

function normalizeWeekMondayYmd(raw: string): TokyoYmd | null {
  return parseWeekQuery(raw);
}

/**
 * ウィークリースケジュール（全メンバー・部署フィルタなし）と同じソースから
 * 共有事項・予定表への取り込み用データを組み立てる。
 */
export async function buildTeamScheduleImportForWeek(
  weekMondayYmd: string,
  options?: { bypassIcsCache?: boolean },
): Promise<TeamScheduleImportBuilt | { error: string }> {
  const mondayYmd = normalizeWeekMondayYmd(weekMondayYmd);
  if (!mondayYmd) return { error: "週の指定が不正です。" };

  const range = getTokyoWeekRange(mondayYmd);
  const bypassCache = options?.bypassIcsCache === true;

  const members = await prisma.member.findMany({
    orderBy: [
      { department: { name: "asc" } },
      { displayOrder: { sort: "asc", nulls: "last" } },
      { name: "asc" },
    ],
    include: { department: true },
  });

  const fullDayKeySeen = new Set<string>();
  const sharingLines: string[] = [];

  const timedKeySeen = new Set<string>();
  const timedScratch: Array<TeamScheduleTimedRow & { sortKey: number }> = [];

  for (const m of members) {
    const icsUrl = m.icsUrl;
    if (!icsUrl) continue;

    let icsText: string;
    try {
      icsText = await fetchIcsText(icsUrl, { bypassCache });
    } catch {
      continue;
    }

    const occList = await expandIcsToWeekOccurrences(icsText, range);
    const buckets = bucketByMondayWeekday(occList);

    for (let weekdayIndex = 0; weekdayIndex < 7; weekdayIndex++) {
      for (const occ of buckets[weekdayIndex] ?? []) {
        if (occ.isFullDay) {
          const fk = `${occ.spanStart.getTime()}\t${occ.spanEnd.getTime()}\t${occ.summary}`;
          if (fullDayKeySeen.has(fk)) continue;
          fullDayKeySeen.add(fk);
          sharingLines.push(formatFullDaySharingSegment(occ));
          continue;
        }

        const time = formatOccurrenceTimeRange(occ);
        const tk = `${weekdayIndex}\t${time}\t${occ.summary}`;
        if (timedKeySeen.has(tk)) continue;
        timedKeySeen.add(tk);
        timedScratch.push({
          weekdayIndex,
          time,
          text: occ.summary,
          sortKey: occ.start.getTime(),
        });
      }
    }
  }

  timedScratch.sort((a, b) => {
    if (a.weekdayIndex !== b.weekdayIndex) return a.weekdayIndex - b.weekdayIndex;
    if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
    return a.text.localeCompare(b.text, "ja");
  });

  const timedRows: TeamScheduleTimedRow[] = timedScratch.map(
    ({ weekdayIndex, time, text }) => ({ weekdayIndex, time, text }),
  );

  return {
    sharingLines,
    timedRows,
  };
}
