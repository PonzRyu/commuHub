/** クライアントとサーバーで共有（`actions.ts` は `"use server"` のため定数・型はここに置く） */

export const MAX_CONTENT_LEN = 32_000;
export const MAX_SCHEDULE_ROWS_PER_DAY = 40;

export interface WeeklyAgendaScheduleRow {
  id: string;
  time: string;
  text: string;
}

export interface WeeklyAgendaScheduleDataV1 {
  v: 1;
  days: WeeklyAgendaScheduleRow[][];
}
