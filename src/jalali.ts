// Pure Jalali date logic for MCalendar.
// No Obsidian imports here, so everything can be unit-tested in plain Node.

import { d2j, j2d, jalaaliMonthLength, toJalaali } from "jalaali-js";
import type { JalaaliDate } from "jalaali-js";

/** A Jalali date: jy = year, jm = month (1-12), jd = day (1-31). */
export type JalaliDate = JalaaliDate;

/** The week a day belongs to. weekYear can differ from the day's own year. */
export interface WeekInfo {
  weekYear: number;
  week: number;
}

/** Converts a JS Date (local time) to a Jalali date. */
export function fromDate(date: Date): JalaliDate {
  return toJalaali(date);
}

/** Number of days in a Jalali month (leap years handled by the library). */
export function monthLength(jy: number, jm: number): number {
  return jalaaliMonthLength(jy, jm);
}

/** Day of week with Saturday = 0, Sunday = 1, ... Friday = 6. */
export function weekdayIndex(d: JalaliDate): number {
  // JDN % 7 gives Monday = 0, so +2 shifts it to Saturday = 0.
  return (j2d(d.jy, d.jm, d.jd) + 2) % 7;
}

/** Returns the date n days after d (n may be negative). */
export function addDays(d: JalaliDate, n: number): JalaliDate {
  return d2j(j2d(d.jy, d.jm, d.jd) + n);
}

/**
 * Julian day number of the first Saturday on or after 1 Farvardin of jy.
 * This is the first day of week 1 ("first full week" rule).
 */
function firstWeekStart(jy: number): number {
  const farvardin1 = j2d(jy, 1, 1);
  const daysUntilSaturday = (7 - weekdayIndex(d2j(farvardin1))) % 7;
  return farvardin1 + daysUntilSaturday;
}

/**
 * Week number of a day. Weeks run Saturday to Friday. Week 1 starts on the
 * first Saturday on or after 1 Farvardin; earlier days belong to the last
 * week of the previous year.
 */
export function weekOf(d: JalaliDate): WeekInfo {
  const jdn = j2d(d.jy, d.jm, d.jd);
  let weekYear = d.jy;
  let start = firstWeekStart(weekYear);
  if (jdn < start) {
    weekYear -= 1;
    start = firstWeekStart(weekYear);
  }
  return { weekYear, week: Math.floor((jdn - start) / 7) + 1 };
}
