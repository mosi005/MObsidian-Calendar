// Token formatter for folder and file name patterns, e.g.
//   "600 - Journal/jYYYY/[Daily]"  ->  "600 - Journal/1405/Daily"
// Pure module: no Obsidian imports.
//
// Tokens:  jYYYY (year, 4 digits)   jMM (month, 2 digits)
//          jDD   (day, 2 digits)    WW   (week number, 2 digits)
// Text inside [brackets] is copied as-is, so "[W]" prints a literal W.

/** Values a pattern can use. Optional ones depend on the note type. */
export interface FormatValues {
  jy: number;
  jm?: number;
  jd?: number;
  week?: number;
}

const TOKEN_RE = /\[([^\]]*)\]|jYYYY|jMM|jDD|WW/g;

function pad(n: number, width: number): string {
  return String(n).padStart(width, "0");
}

/** Returns value, or throws if the pattern used a token this note type lacks. */
function need(value: number | undefined, token: string): number {
  if (value === undefined) {
    throw new Error(`Token "${token}" is not available for this note type`);
  }
  return value;
}

/** Replaces tokens in pattern with the matching values. */
export function formatPattern(pattern: string, v: FormatValues): string {
  return pattern.replace(TOKEN_RE, (match: string, literal?: string) => {
    if (literal !== undefined) return literal;
    switch (match) {
      case "jYYYY":
        return pad(v.jy, 4);
      case "jMM":
        return pad(need(v.jm, match), 2);
      case "jDD":
        return pad(need(v.jd, match), 2);
      default: // "WW"
        return pad(need(v.week, match), 2);
    }
  });
}

/** Turns a user-typed template path into a vault-relative path ending in .md. */
export function toVaultPath(input: string, vaultBase: string): string {
  let path = input.trim();
  if (!path) return "";
  const base = vaultBase.replace(/\/+$/, "");
  if (base && path.startsWith(base + "/")) path = path.slice(base.length + 1);
  path = path.replace(/^\/+/, "");
  return path.endsWith(".md") ? path : `${path}.md`;
}
