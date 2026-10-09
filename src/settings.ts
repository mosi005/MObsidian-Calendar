// Settings model and the settings tab (English UI).

import { PluginSettingTab, Setting } from "obsidian";
import type { App, Plugin, TextComponent } from "obsidian";
import { formatPattern } from "./format";
import type { FormatValues } from "./format";

export type NoteKind = "daily" | "weekly" | "monthly" | "yearly";
export const NOTE_KINDS: readonly NoteKind[] = [
  "daily",
  "weekly",
  "monthly",
  "yearly",
];

/** Where one kind of note lives. All three fields are token patterns (see format.ts). */
export interface NoteTypeSettings {
  folder: string; // e.g. "600 - Journal/jYYYY/[Daily]"
  name: string; // file name without .md, e.g. "jYYYY-jMM-jDD"
  template: string; // vault path of a template file; empty = blank note
}

export interface MCalendarSettings {
  notes: Record<NoteKind, NoteTypeSettings>;
}

export const DEFAULT_SETTINGS: MCalendarSettings = {
  notes: {
    daily: {
      folder: "600 - Journal/jYYYY/[Daily]",
      name: "jYYYY-jMM-jDD",
      template: "",
    },
    weekly: {
      folder: "600 - Journal/jYYYY/[Weekly]",
      name: "jYYYY-[W]WW",
      template: "",
    },
    monthly: {
      folder: "600 - Journal/jYYYY/[Monthly]",
      name: "jYYYY-jMM",
      template: "",
    },
    yearly: { folder: "600 - Journal/jYYYY", name: "jYYYY", template: "" },
  },
};

/** Merges saved data over the defaults, one note type at a time. */
export function mergeSettings(
  saved: Partial<MCalendarSettings> | null,
): MCalendarSettings {
  const notes = {} as Record<NoteKind, NoteTypeSettings>;
  for (const kind of NOTE_KINDS) {
    notes[kind] = { ...DEFAULT_SETTINGS.notes[kind], ...saved?.notes?.[kind] };
  }
  return { notes };
}

/** What the settings tab needs from the plugin (avoids importing main.ts). */
export interface MCalendarHost extends Plugin {
  settings: MCalendarSettings;
  saveSettings(): Promise<void>;
  refreshViews(): void;
}

const LABELS: Record<NoteKind, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

// Values each note type can use in its patterns; used to catch typos while typing.
const SAMPLE_VALUES: Record<NoteKind, FormatValues> = {
  daily: { jy: 1405, jm: 1, jd: 1, week: 1 },
  weekly: { jy: 1405, week: 1 },
  monthly: { jy: 1405, jm: 1 },
  yearly: { jy: 1405 },
};

export class MCalendarSettingTab extends PluginSettingTab {
  private host: MCalendarHost;

  constructor(app: App, host: MCalendarHost) {
    super(app, host);
    this.host = host;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    this.addHeading("Calendar Note Paths");
    containerEl.createEl("p", {
      cls: "setting-item-description",
      text: "Tokens: jYYYY (year), jMM (month), jDD (day), WW (week). Text in [brackets] is copied as-is.",
    });
    for (const kind of NOTE_KINDS) {
      this.addPatternField(
        kind,
        "folder",
        `${LABELS[kind]} Notes Folder`,
        `${LABELS[kind]} notes will be created in this folder.`,
      );
    }

    this.addHeading("Calendar Note Names");
    for (const kind of NOTE_KINDS) {
      this.addPatternField(
        kind,
        "name",
        `${LABELS[kind]} note naming format`,
        `File name of ${LABELS[kind].toLowerCase()} notes, without .md.`,
      );
    }

    this.addHeading("Calendar Note Templates");
    for (const kind of NOTE_KINDS) {
      this.addTemplateField(kind);
    }
  }

  private addHeading(text: string): void {
    new Setting(this.containerEl).setName(text).setHeading();
  }

  private addPatternField(
    kind: NoteKind,
    field: "folder" | "name",
    name: string,
    desc: string,
  ): void {
    new Setting(this.containerEl)
      .setName(name)
      .setDesc(desc)
      .addText((text) => {
        text
          .setValue(this.host.settings.notes[kind][field])
          .onChange(async (value) => {
            if (!this.isValidPattern(kind, field, value, text)) return;
            this.host.settings.notes[kind][field] = value;
            await this.save();
          });
      });
  }

  private addTemplateField(kind: NoteKind): void {
    new Setting(this.containerEl)
      .setName(`${LABELS[kind]} Note Template`)
      .setDesc(
        "Optional. Path of a template file in the vault. Leave empty for a blank note.",
      )
      .addText((text) => {
        text
          .setPlaceholder("Templates/Template.md")
          .setValue(this.host.settings.notes[kind].template)
          .onChange(async (value) => {
            this.host.settings.notes[kind].template = value;
            await this.save();
          });
      });
  }

  /** Rejects empty names and patterns that use a token the note type does not have. */
  private isValidPattern(
    kind: NoteKind,
    field: "folder" | "name",
    value: string,
    text: TextComponent,
  ): boolean {
    let valid = field === "folder" || value.trim() !== "";
    if (valid) {
      try {
        formatPattern(value, SAMPLE_VALUES[kind]);
      } catch {
        valid = false;
      }
    }
    text.inputEl.toggleClass("mcal-invalid", !valid);
    return valid;
  }

  private async save(): Promise<void> {
    await this.host.saveSettings();
    this.host.refreshViews();
  }
}
