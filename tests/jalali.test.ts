import { describe, expect, it } from "vitest";
import {
  addDays,
  fromDate,
  monthLength,
  weekdayIndex,
  weekOf,
} from "../src/jalali";

const d = (jy: number, jm: number, jd: number) => ({ jy, jm, jd });

describe("fromDate", () => {
  it("converts Gregorian dates to Jalali", () => {
    expect(fromDate(new Date(2026, 2, 21))).toEqual(d(1405, 1, 1));
    expect(fromDate(new Date(2026, 9, 7))).toEqual(d(1405, 7, 15));
  });
});

describe("monthLength", () => {
  it("handles month lengths and leap years", () => {
    expect(monthLength(1405, 1)).toBe(31);
    expect(monthLength(1405, 7)).toBe(30);
    expect(monthLength(1403, 12)).toBe(30); // leap year
    expect(monthLength(1404, 12)).toBe(29);
  });
});

describe("weekdayIndex", () => {
  it("uses Saturday = 0 and Friday = 6", () => {
    expect(weekdayIndex(d(1405, 1, 1))).toBe(0); // Saturday
    expect(weekdayIndex(d(1405, 7, 15))).toBe(4); // Wednesday
    expect(weekdayIndex(d(1404, 1, 1))).toBe(6); // Friday
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries in both directions", () => {
    expect(addDays(d(1403, 12, 30), 1)).toEqual(d(1404, 1, 1));
    expect(addDays(d(1405, 1, 1), -1)).toEqual(d(1404, 12, 29));
    expect(addDays(d(1405, 6, 31), 1)).toEqual(d(1405, 7, 1));
  });
});

describe("weekOf", () => {
  it("starts week 1 on 1 Farvardin when it is a Saturday", () => {
    expect(weekOf(d(1405, 1, 1))).toEqual({ weekYear: 1405, week: 1 });
    expect(weekOf(d(1405, 1, 7))).toEqual({ weekYear: 1405, week: 1 });
    expect(weekOf(d(1405, 1, 8))).toEqual({ weekYear: 1405, week: 2 });
  });

  it("matches the existing weekly notes (today is in W29)", () => {
    expect(weekOf(d(1405, 7, 15))).toEqual({ weekYear: 1405, week: 29 });
  });

  it("puts early Farvardin days in the previous year's last week", () => {
    expect(weekOf(d(1403, 1, 1))).toEqual({ weekYear: 1402, week: 52 });
    expect(weekOf(d(1404, 1, 1))).toEqual({ weekYear: 1403, week: 52 }); // Friday
    expect(weekOf(d(1404, 1, 2))).toEqual({ weekYear: 1404, week: 1 });
  });

  it("gives 1405 a week 53 that runs into 1406", () => {
    expect(weekOf(d(1405, 12, 29))).toEqual({ weekYear: 1405, week: 53 });
    expect(weekOf(d(1406, 1, 1))).toEqual({ weekYear: 1405, week: 53 });
    expect(weekOf(d(1406, 1, 7))).toEqual({ weekYear: 1406, week: 1 });
  });

  it("only changes week on Saturdays, for many years in a row", () => {
    let day = d(1400, 1, 1);
    let prev = weekOf(day);
    for (let i = 0; i < 365 * 12; i++) {
      day = addDays(day, 1);
      const cur = weekOf(day);
      if (weekdayIndex(day) === 0) {
        const nextWeek =
          cur.weekYear === prev.weekYear
            ? cur.week === prev.week + 1
            : cur.weekYear === prev.weekYear + 1 && cur.week === 1;
        expect(nextWeek).toBe(true);
      } else {
        expect(cur).toEqual(prev);
      }
      prev = cur;
    }
  });
});
