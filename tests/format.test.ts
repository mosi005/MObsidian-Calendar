import { describe, expect, it } from "vitest";
import { formatPattern, toVaultPath } from "../src/format";

describe("formatPattern", () => {
  it("builds the current folder layout", () => {
    const v = { jy: 1405, jm: 5, jd: 2 };
    expect(formatPattern("600 - Journal/jYYYY/[Daily]", v)).toBe(
      "600 - Journal/1405/Daily",
    );
    expect(formatPattern("600 - Journal/jYYYY", v)).toBe("600 - Journal/1405");
  });

  it("builds the current note names", () => {
    expect(formatPattern("jYYYY-jMM-jDD", { jy: 1405, jm: 5, jd: 2 })).toBe(
      "1405-05-02",
    );
    expect(formatPattern("jYYYY-jMM", { jy: 1405, jm: 5 })).toBe("1405-05");
    expect(formatPattern("jYYYY", { jy: 1405 })).toBe("1405");
    expect(formatPattern("jYYYY-[W]WW", { jy: 1405, week: 18 })).toBe(
      "1405-W18",
    );
  });

  it("zero-pads the week number", () => {
    expect(formatPattern("jYYYY-[W]WW", { jy: 1402, week: 5 })).toBe(
      "1402-W05",
    );
  });

  it("copies bracketed text literally, even if it looks like a token", () => {
    expect(formatPattern("[jYYYY]", { jy: 1405 })).toBe("jYYYY");
    expect(formatPattern("[فصل]-jYYYY", { jy: 1405 })).toBe("فصل-1405");
    expect(formatPattern("a[]b", { jy: 1405 })).toBe("ab");
  });

  it("leaves plain text and unclosed brackets alone", () => {
    expect(formatPattern("600 - Journal", { jy: 1405 })).toBe("600 - Journal");
    expect(formatPattern("a[b", { jy: 1405 })).toBe("a[b");
  });

  it("throws when a token has no value for this note type", () => {
    expect(() => formatPattern("jDD", { jy: 1405 })).toThrow('Token "jDD"');
    expect(() => formatPattern("WW", { jy: 1405, jm: 5 })).toThrow(
      'Token "WW"',
    );
  });
});

describe("toVaultPath", () => {
  const base = "/Users/mostafa/Documents/Mosii";

  it("strips the vault location from an absolute path", () => {
    const abs = `${base}/800 - Materials/810 - Templates/Weekly Template.md`;
    expect(toVaultPath(abs, base)).toBe(
      "800 - Materials/810 - Templates/Weekly Template.md",
    );
  });

  it("adds .md and removes leading slashes", () => {
    expect(toVaultPath("/Templates/Weekly Template", base)).toBe(
      "Templates/Weekly Template.md",
    );
    expect(toVaultPath("Templates/Daily.md", base)).toBe("Templates/Daily.md");
  });

  it("returns an empty string for an empty field", () => {
    expect(toVaultPath("   ", base)).toBe("");
  });
});
