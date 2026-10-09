// Builds the vault path of a calendar note from the settings patterns.
// Pure module: no Obsidian imports (settings types are import-type only).

import { formatPattern } from "./format";
import type { FormatValues } from "./format";
import { weekOf } from "./jalali";
import type { JalaliDate } from "./jalali";
import type { NoteTypeSettings } from "./settings";

/** Which note is meant. For weekly notes, weekYear is the year from weekOf(). */
export type NoteTarget =
  | { kind: "daily"; date: JalaliDate }
  | { kind: "weekly"; weekYear: number; week: number }
  | { kind: "monthly"; jy: number; jm: number }
  | { kind: "yearly"; jy: number };

function valuesOf(target: NoteTarget): FormatValues {
  switch (target.kind) {
    case "daily":
      return { ...target.date, week: weekOf(target.date).week };
    case "weekly":
      return { jy: target.weekYear, week: target.week };
    case "monthly":
      return { jy: target.jy, jm: target.jm };
    case "yearly":
      return { jy: target.jy };
  }
}

/** Vault path such as "600 - Journal/1405/Daily/1405-05-02.md". Throws on a bad pattern. */
export function notePath(
  config: Pick<NoteTypeSettings, "folder" | "name">,
  target: NoteTarget,
): string {
  const values = valuesOf(target);
  const folder = formatPattern(config.folder, values).replace(/^\/+|\/+$/g, "");
  const name = formatPattern(config.name, values);
  return folder ? `${folder}/${name}.md` : `${name}.md`;
}
