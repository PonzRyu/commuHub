import type { WeekOccurrence } from "@/lib/ics/expand-ics-week";

const TOKYO = "Asia/Tokyo";

const timeHm = new Intl.DateTimeFormat("en-GB", {
  timeZone: TOKYO,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function formatOccurrenceLine(occ: WeekOccurrence): string {
  if (occ.isFullDay) return `終日 ${occ.summary}`;
  return `${timeHm.format(occ.start)} ${occ.summary}`;
}
