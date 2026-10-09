// Builds the rows of one month for the calendar view.
// Pure module: no Obsidian imports, no clock (today is passed in).

import { isHoliday } from "./holidays";
import { addDays, monthLength, weekdayIndex, weekOf } from "./jalali";
import type { JalaliDate } from "./jalali";

/** One cell of the grid. */
export interface GridDay extends JalaliDate {
  inMonth: boolean; // false for the leading/trailing days of neighbouring months
  isHoliday: boolean;
  isToday: boolean;
}

/** One row: a Saturday-to-Friday week with its number. */
export interface GridWeek {
  weekYear: number;
  week: number;
  days: GridDay[]; // always 7 entries
}

/** Returns the rows of month jm of year jy (5 or 6 rows, Saturday first). */
export function buildMonthGrid(
  jy: number,
  jm: number,
  today: JalaliDate,
): GridWeek[] {
  const first: JalaliDate = { jy, jm, jd: 1 };
  const leading = weekdayIndex(first); // days of the previous month shown in row 1
  const rowCount = Math.ceil((leading + monthLength(jy, jm)) / 7);
  const gridStart = addDays(first, -leading);

  const rows: GridWeek[] = [];
  for (let r = 0; r < rowCount; r++) {
    const days: GridDay[] = [];
    for (let c = 0; c < 7; c++) {
      const d = addDays(gridStart, r * 7 + c);
      days.push({
        ...d,
        inMonth: d.jy === jy && d.jm === jm,
        isHoliday: isHoliday(d),
        isToday: d.jy === today.jy && d.jm === today.jm && d.jd === today.jd,
      });
    }
    // Every day of a Saturday-to-Friday row shares the same week.
    const { weekYear, week } = weekOf(days[0]);
    rows.push({ weekYear, week, days });
  }
  return rows;
}
