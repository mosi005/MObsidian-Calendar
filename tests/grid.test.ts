import { describe, expect, it } from "vitest";
import { buildMonthGrid } from "../src/grid";
import { addDays, monthLength, weekdayIndex } from "../src/jalali";

const d = (jy: number, jm: number, jd: number) => ({ jy, jm, jd });
const today = d(1405, 7, 15);

describe("buildMonthGrid", () => {
  it("lays out Mehr 1405 (starts on a Wednesday, 30 days)", () => {
    const rows = buildMonthGrid(1405, 7, today);
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.week)).toEqual([27, 28, 29, 30, 31]);
    expect(rows.every((r) => r.weekYear === 1405)).toBe(true);

    const firstRow = rows[0].days;
    expect(firstRow[0]).toMatchObject({
      jy: 1405,
      jm: 6,
      jd: 28,
      inMonth: false,
    });
    expect(firstRow[4]).toMatchObject({
      jy: 1405,
      jm: 7,
      jd: 1,
      inMonth: true,
    });
    expect(firstRow[6]).toMatchObject({ jm: 7, jd: 3, isHoliday: true }); // Friday

    const lastDay = rows[4].days[6];
    expect(lastDay).toMatchObject({ jy: 1405, jm: 8, jd: 1, inMonth: false });
  });

  it("marks today only once, on the right cell", () => {
    const flagged = buildMonthGrid(1405, 7, today)
      .flatMap((r) => r.days)
      .filter((x) => x.isToday);
    expect(flagged).toHaveLength(1);
    expect(flagged[0]).toMatchObject({ jm: 7, jd: 15 });
  });

  it("puts a leading week of the previous year under that year's number", () => {
    const rows = buildMonthGrid(1403, 1, today);
    expect(rows[0].days[0]).toMatchObject({ jy: 1402, jm: 12, jd: 26 });
    expect(rows[0]).toMatchObject({ weekYear: 1402, week: 52 });
    expect(rows[1]).toMatchObject({ weekYear: 1403, week: 1 });
  });

  it("keeps every month well-formed for ten years", () => {
    let sixRowMonths = 0;
    for (let jy = 1400; jy <= 1410; jy++) {
      for (let jm = 1; jm <= 12; jm++) {
        const rows = buildMonthGrid(jy, jm, today);
        const days = rows.flatMap((r) => r.days);
        expect(rows.length === 5 || rows.length === 6).toBe(true);
        if (rows.length === 6) sixRowMonths++;
        expect(days).toHaveLength(rows.length * 7);
        expect(weekdayIndex(days[0])).toBe(0); // starts on Saturday
        expect(days.filter((x) => x.inMonth)).toHaveLength(monthLength(jy, jm));
        days.forEach((x, i) => {
          if (i > 0) expect(x).toMatchObject(addDays(days[i - 1], 1));
        });
        // A row always ends on Friday, and Fridays are always holidays.
        rows.forEach((r) => expect(r.days[6].isHoliday).toBe(true));
      }
    }
    expect(sixRowMonths).toBeGreaterThan(0);
  });
});
