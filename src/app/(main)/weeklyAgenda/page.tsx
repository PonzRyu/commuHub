import {
  addCalendarDaysTokyo,
  currentMondayTokyo,
  formatWeekRangeLabel,
  formatYmd,
  parseWeekQuery,
} from "@/lib/ics/tokyo-week";
import { prisma } from "@/lib/prisma";
import { WeeklyNoticeEditor } from "./weekly-notice-editor";
import type { WeeklyAgendaScheduleDataV1 } from "./actions";

export default async function WeeklyAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  const sp = await searchParams;
  const mondayParsed = parseWeekQuery(sp.w);
  const mondayYmd = mondayParsed ?? currentMondayTokyo();
  const mondayParam = formatYmd(mondayYmd);
  const prevMondayParam = formatYmd(addCalendarDaysTokyo(mondayYmd, -7));
  const nextMondayParam = formatYmd(addCalendarDaysTokyo(mondayYmd, 7));

  const row = await prisma.weeklyNotice.findUnique({
    where: { weekMondayYmd: mondayParam },
    select: { content: true },
  });

  const scheduleRow = await prisma.weeklyAgendaSchedule.findUnique({
    where: { weekMondayYmd: mondayParam },
    select: { data: true },
  });

  const initialSchedule: WeeklyAgendaScheduleDataV1 =
    (scheduleRow?.data as WeeklyAgendaScheduleDataV1 | null) ?? {
      v: 1,
      days: Array.from({ length: 7 }, () => []),
    };

  return (
    <WeeklyNoticeEditor
      weekRangeLabel={formatWeekRangeLabel(mondayYmd)}
      mondayParam={mondayParam}
      prevMondayParam={prevMondayParam}
      nextMondayParam={nextMondayParam}
      initialContent={row?.content ?? ""}
      initialSchedule={initialSchedule}
    />
  );
}
