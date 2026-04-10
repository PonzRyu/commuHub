import {
  addCalendarDaysTokyo,
  currentMondayTokyo,
  formatWeekRangeLabel,
  formatYmd,
  parseWeekQuery,
} from "@/lib/ics/tokyo-week";
import { prisma } from "@/lib/prisma";
import { WeeklyNoticeEditor } from "./weekly-notice-editor";

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

  return (
    <WeeklyNoticeEditor
      weekRangeLabel={formatWeekRangeLabel(mondayYmd)}
      mondayParam={mondayParam}
      prevMondayParam={prevMondayParam}
      nextMondayParam={nextMondayParam}
      initialContent={row?.content ?? ""}
    />
  );
}
