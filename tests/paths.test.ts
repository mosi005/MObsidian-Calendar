import { describe, expect, it } from "vitest";
import { notePath } from "../src/paths";

// Same values as the default settings.
const daily = { folder: "600 - Journal/jYYYY/[Daily]", name: "jYYYY-jMM-jDD" };
const weekly = { folder: "600 - Journal/jYYYY/[Weekly]", name: "jYYYY-[W]WW" };
const monthly = { folder: "600 - Journal/jYYYY/[Monthly]", name: "jYYYY-jMM" };
const yearly = { folder: "600 - Journal/jYYYY", name: "jYYYY" };

describe("notePath", () => {
  it("reproduces the paths of the existing notes", () => {
    expect(
      notePath(daily, { kind: "daily", date: { jy: 1405, jm: 5, jd: 2 } }),
    ).toBe("600 - Journal/1405/Daily/1405-05-02.md");
    expect(notePath(weekly, { kind: "weekly", weekYear: 1405, week: 18 })).toBe(
      "600 - Journal/1405/Weekly/1405-W18.md",
    );
    expect(notePath(monthly, { kind: "monthly", jy: 1405, jm: 5 })).toBe(
      "600 - Journal/1405/Monthly/1405-05.md",
    );
    expect(notePath(yearly, { kind: "yearly", jy: 1405 })).toBe(
      "600 - Journal/1405/1405.md",
    );
  });

  it("files a boundary week under the year of its week number", () => {
    expect(notePath(weekly, { kind: "weekly", weekYear: 1402, week: 52 })).toBe(
      "600 - Journal/1402/Weekly/1402-W52.md",
    );
    expect(notePath(weekly, { kind: "weekly", weekYear: 1406, week: 5 })).toBe(
      "600 - Journal/1406/Weekly/1406-W05.md",
    );
  });

  it("lets a daily pattern use the week number", () => {
    const byWeek = { folder: "J/jYYYY/[W]WW", name: "jYYYY-jMM-jDD" };
    expect(
      notePath(byWeek, { kind: "daily", date: { jy: 1405, jm: 7, jd: 15 } }),
    ).toBe("J/1405/W29/1405-07-15.md");
  });

  it("trims stray slashes and handles an empty folder", () => {
    expect(
      notePath(
        { folder: "/Notes/", name: "jYYYY" },
        { kind: "yearly", jy: 1405 },
      ),
    ).toBe("Notes/1405.md");
    expect(
      notePath({ folder: "", name: "jYYYY" }, { kind: "yearly", jy: 1405 }),
    ).toBe("1405.md");
  });

  it("throws when a pattern needs a value the note type lacks", () => {
    expect(() =>
      notePath({ folder: "jYYYY", name: "jDD" }, { kind: "yearly", jy: 1405 }),
    ).toThrow('Token "jDD"');
  });
});
