const TOKYO = "Asia/Tokyo";

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export interface TokyoYmd {
  y: number;
  m: number;
  d: number;
}

/** 東京のカレンダー日付（その日の 0:00 を表すインスタント） */
export function instantMonday00Tokyo(ymd: TokyoYmd): Date {
  return new Date(
    `${ymd.y}-${pad2(ymd.m)}-${pad2(ymd.d)}T00:00:00+09:00`,
  );
}

/** 東京のカレンダー日付（その日の 0:00 を表すインスタント） */
export function instantTokyo00(ymd: TokyoYmd): Date {
  return instantMonday00Tokyo(ymd);
}

export function formatYmd(ymd: TokyoYmd): string {
  return `${ymd.y}-${pad2(ymd.m)}-${pad2(ymd.d)}`;
}

/** 任意のインスタントについて、東京の暦日付を返す */
export function toTokyoYmd(date: Date): TokyoYmd {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: TOKYO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const [y, m, d] = s.split("-").map(Number);
  return { y, m, d };
}

/**
 * 東京の「その暦日の正午」用インスタント（曜日計算に利用・日本は DST なし）
 */
function noonTokyo(ymd: TokyoYmd): Date {
  return new Date(
    `${ymd.y}-${pad2(ymd.m)}-${pad2(ymd.d)}T12:00:00+09:00`,
  );
}

const SHORT_WD: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function weekdaySun0Sat6Tokyo(date: Date): number {
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone: TOKYO,
    weekday: "short",
  }).format(date);
  return SHORT_WD[short] ?? 0;
}

/** 月曜始まり 0〜6（月=0 … 日=6） */
export function mondayWeekdayIndexTokyo(date: Date): number {
  const sun0 = weekdaySun0Sat6Tokyo(date);
  return (sun0 + 6) % 7;
}

export function addCalendarDaysTokyo(ymd: TokyoYmd, deltaDays: number): TokyoYmd {
  const t = noonTokyo(ymd).getTime() + deltaDays * 86400000;
  return toTokyoYmd(new Date(t));
}

/** 東京暦で「その日を含む週」の月曜日の日付 */
export function mondayOfWeekContainingTokyo(ymd: TokyoYmd): TokyoYmd {
  const noon = noonTokyo(ymd);
  const fromMon = mondayWeekdayIndexTokyo(noon);
  return addCalendarDaysTokyo(ymd, -fromMon);
}

export function currentMondayTokyo(now = new Date()): TokyoYmd {
  return mondayOfWeekContainingTokyo(toTokyoYmd(now));
}

export interface TokyoWeekRange {
  mondayYmd: TokyoYmd;
  /** 範囲検索用（この週の月曜 0:00 東京、以上） */
  fromInclusive: Date;
  /** 範囲検索用（翌週月曜 0:00 東京、未満） */
  toExclusive: Date;
}

/** 表示対象週。[fromInclusive, toExclusive) でイベントを切る（半開区間） */
export function getTokyoWeekRange(mondayYmd: TokyoYmd): TokyoWeekRange {
  const monday = mondayYmd;
  const nextMonday = addCalendarDaysTokyo(monday, 7);
  return {
    mondayYmd: monday,
    fromInclusive: instantMonday00Tokyo(monday),
    toExclusive: instantMonday00Tokyo(nextMonday),
  };
}

/** URL クエリ `w`（YYYY-MM-DD）— その日を含む週の月曜に正規化。無効時は null */
export function parseWeekQuery(w: string | undefined): TokyoYmd | null {
  if (!w || !/^\d{4}-\d{2}-\d{2}$/.test(w)) return null;
  const [y, m, d] = w.split("-").map(Number);
  if (!y || m < 1 || m > 12 || d < 1 || d > 31) return null;
  const instant = new Date(`${y}-${pad2(m)}-${pad2(d)}T12:00:00+09:00`);
  if (Number.isNaN(instant.getTime())) return null;
  const ymd: TokyoYmd = { y, m, d };
  // 実在しない日は Invalid Date になることが多いが、念のため東京暦に寄せる
  const normalized = toTokyoYmd(instant);
  return mondayOfWeekContainingTokyo(normalized);
}

export function formatWeekdayLabels(): readonly string[] {
  return ["月", "火", "水", "木", "金", "土", "日"] as const;
}

/** 週の表示ラベル（東京暦・月曜始まりの 7 日間） */
export function formatWeekRangeLabel(mondayYmd: TokyoYmd): string {
  const sun = addCalendarDaysTokyo(mondayYmd, 6);
  const f = (ymd: TokyoYmd) => `${ymd.y}年${ymd.m}月${ymd.d}日`;
  return `${f(mondayYmd)}〜${f(sun)}`;
}
