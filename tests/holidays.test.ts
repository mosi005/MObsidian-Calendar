import { describe, expect, it } from "vitest";
import { isHoliday } from "../src/holidays";

const d = (jy: number, jm: number, jd: number) => ({ jy, jm, jd });

describe("isHoliday", () => {
  it("treats Fridays as holidays and normal weekdays as working days", () => {
    expect(isHoliday(d(1405, 7, 17))).toBe(true); // Friday
    expect(isHoliday(d(1405, 7, 15))).toBe(false); // Wednesday
  });

  it("includes fixed holidays in every year", () => {
    expect(isHoliday(d(1405, 1, 1))).toBe(true);
    expect(isHoliday(d(1405, 1, 4))).toBe(true);
    expect(isHoliday(d(1405, 1, 5))).toBe(false);
    expect(isHoliday(d(1407, 3, 14))).toBe(true);
    expect(isHoliday(d(1407, 11, 22))).toBe(true);
  });

  it("includes lunar holidays for years that have data", () => {
    expect(isHoliday(d(1405, 4, 4))).toBe(true); // Tasua
    expect(isHoliday(d(1405, 4, 6))).toBe(false);
    expect(isHoliday(d(1406, 3, 25))).toBe(true); // Ashura
  });

  it("ignores lunar holidays for years without data", () => {
    expect(isHoliday(d(1407, 4, 4))).toBe(false); // Saturday, no data yet
  });
});
