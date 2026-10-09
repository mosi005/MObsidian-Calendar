// Official Iranian holidays. Pure module: no Obsidian imports.
// Fridays are always holidays; the rest comes from the two tables below.
//
// Dates are written as [month, day] in the Jalali calendar.
// To extend: add the next year to LUNAR_HOLIDAYS once its official calendar
// is out. Until then, that year shows only Fridays and the fixed holidays.

import { weekdayIndex } from "./jalali";
import type { JalaliDate } from "./jalali";

type MonthDay = readonly [month: number, day: number];

/** Holidays on the same Jalali date every year. */
const FIXED_HOLIDAYS: readonly MonthDay[] = [
  [1, 1],
  [1, 2],
  [1, 3],
  [1, 4], // Nowruz
  [1, 12], // Islamic Republic Day
  [1, 13], // Nature Day (Sizdah Bedar)
  [3, 14], // Death of Khomeini
  [3, 15], // 15 Khordad uprising
  [11, 22], // Revolution victory
  [12, 29], // Oil nationalization
];

/** Holidays tied to the lunar calendar. They move every year, so list them per year. */
const LUNAR_HOLIDAYS: Readonly<Record<number, readonly MonthDay[]>> = {
  1405: [
    [1, 25], // Imam Sadiq martyrdom (25 Shawwal)
    [3, 6], // Eid al-Adha
    [4, 3],
    [4, 4], // Tasua, Ashura
    [5, 13], // Arbaeen
    [5, 21], // Prophet's demise, Imam Hasan martyrdom
    [5, 22], // Imam Reza martyrdom
    [5, 30], // Imam Hasan Askari martyrdom
    [6, 8], // Prophet's birth, Imam Sadiq birth
    [8, 22], // Fatima martyrdom
    [10, 2], // Imam Ali birth
    [10, 16], // Mab'ath
    [11, 4], // 15 Sha'ban
    [12, 9], // Imam Ali martyrdom
    [12, 19],
    [12, 20], // Eid al-Fitr
  ],
  1406: [
    [1, 14], // Imam Sadiq martyrdom (25 Shawwal)
    [2, 27], // Eid al-Adha
    [3, 4], // Eid al-Ghadir
    [3, 24],
    [3, 25], // Tasua, Ashura
    [5, 3], // Arbaeen
    [5, 11], // Prophet's demise, Imam Hasan martyrdom
    [5, 12], // Imam Reza martyrdom
    [5, 20], // Imam Hasan Askari martyrdom
    [5, 29], // Prophet's birth, Imam Sadiq birth
    [8, 12], // Fatima martyrdom
    [9, 21], // Imam Ali birth
    [10, 5], // Mab'ath
    [10, 23], // 15 Sha'ban
    [11, 28], // Imam Ali martyrdom
    [12, 8],
    [12, 9], // Eid al-Fitr
  ],
};

function includesDay(list: readonly MonthDay[], d: JalaliDate): boolean {
  return list.some(([month, day]) => month === d.jm && day === d.jd);
}

/** True for Fridays and official holidays. */
export function isHoliday(d: JalaliDate): boolean {
  if (weekdayIndex(d) === 6) return true; // Friday
  if (includesDay(FIXED_HOLIDAYS, d)) return true;
  return includesDay(LUNAR_HOLIDAYS[d.jy] ?? [], d);
}
