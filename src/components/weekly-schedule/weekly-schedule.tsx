import type { WeekOccurrence } from "@/lib/ics/expand-ics-week";
import { WeeklyScheduleClient } from "@/components/weekly-schedule/weekly-schedule-client";

export interface WeeklyMemberRow {
  memberId: string;
  name: string;
  departmentName: string;
  displayOrder: number | null;
  hasIcs: boolean;
  /** 月曜=0 … 日=6 */
  buckets: WeekOccurrence[][];
}

export interface DepartmentFilterOption {
  id: string;
  name: string;
}

interface WeeklyScheduleProps {
  weekRangeLabel: string;
  mondayParam: string;
  prevMondayParam: string;
  nextMondayParam: string;
  departments: DepartmentFilterOption[];
  departmentId: string | null;
  rows: WeeklyMemberRow[];
}

export function WeeklySchedule({
  weekRangeLabel,
  mondayParam,
  prevMondayParam,
  nextMondayParam,
  departments,
  departmentId,
  rows,
}: WeeklyScheduleProps) {
  return (
    <WeeklyScheduleClient
      weekRangeLabel={weekRangeLabel}
      mondayParam={mondayParam}
      prevMondayParam={prevMondayParam}
      nextMondayParam={nextMondayParam}
      departments={departments}
      departmentId={departmentId}
      rows={rows}
    />
  );
}
