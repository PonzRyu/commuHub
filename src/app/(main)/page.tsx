import {
  WeeklySchedule,
  type WeeklyMemberRow,
} from "@/components/weekly-schedule/weekly-schedule";
import {
  addCalendarDaysTokyo,
  currentMondayTokyo,
  formatWeekRangeLabel,
  formatYmd,
  getTokyoWeekRange,
  parseWeekQuery,
} from "@/lib/ics/tokyo-week";
import {
  bucketByMondayWeekday,
  expandIcsToWeekOccurrences,
} from "@/lib/ics/expand-ics-week";
import { prisma } from "@/lib/prisma";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ w?: string; departmentId?: string }>;
}) {
  const sp = await searchParams;
  const mondayParsed = parseWeekQuery(sp.w);
  const mondayYmd = mondayParsed ?? currentMondayTokyo();
  const range = getTokyoWeekRange(mondayYmd);
  const mondayParam = formatYmd(mondayYmd);
  const prevMondayParam = formatYmd(addCalendarDaysTokyo(mondayYmd, -7));
  const nextMondayParam = formatYmd(addCalendarDaysTokyo(mondayYmd, 7));

  const departmentId =
    sp.departmentId && sp.departmentId.length > 0 ? sp.departmentId : null;

  const [departments, members] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: "asc" } }),
    prisma.member.findMany({
      where: departmentId ? { departmentId } : {},
      orderBy: [
        { department: { name: "asc" } },
        { displayOrder: { sort: "asc", nulls: "last" } },
        { name: "asc" },
      ],
      include: { department: true },
    }),
  ]);

  const deptOptions = departments.map((d) => ({ id: d.id, name: d.name }));

  const rows: WeeklyMemberRow[] = await Promise.all(
    members.map(async (m) => {
      const ics = m.icsContent;
      if (!ics) {
        return {
          memberId: m.id,
          name: m.name,
          departmentName: m.department.name,
          displayOrder: m.displayOrder ?? null,
          hasIcs: false,
          buckets: Array.from({ length: 7 }, () => []),
        };
      }
      const occ = await expandIcsToWeekOccurrences(ics, range);
      return {
        memberId: m.id,
        name: m.name,
        departmentName: m.department.name,
        displayOrder: m.displayOrder ?? null,
        hasIcs: true,
        buckets: bucketByMondayWeekday(occ),
      };
    }),
  );

  return (
    <WeeklySchedule
      weekRangeLabel={formatWeekRangeLabel(mondayYmd)}
      mondayParam={mondayParam}
      prevMondayParam={prevMondayParam}
      nextMondayParam={nextMondayParam}
      departments={deptOptions}
      departmentId={departmentId}
      rows={rows}
    />
  );
}
