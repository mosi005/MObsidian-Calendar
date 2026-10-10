// Settings model and the settings tab (English UI).

import { PluginSettingTab, Setting, setIcon } from "obsidian";
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

export type Direction = "rtl" | "ltr";

export interface MCalendarSettings {
  direction: Direction; // rtl: week numbers on the right, Saturday first from the right
  confirmCreate: boolean; // ask before a new note is created
  notes: Record<NoteKind, NoteTypeSettings>;
}

export const DEFAULT_SETTINGS: MCalendarSettings = {
  direction: "rtl",
  confirmCreate: true,
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
  const direction =
    saved?.direction === "ltr" || saved?.direction === "rtl"
      ? saved.direction
      : DEFAULT_SETTINGS.direction;
  const confirmCreate =
    typeof saved?.confirmCreate === "boolean"
      ? saved.confirmCreate
      : DEFAULT_SETTINGS.confirmCreate;
  return { direction, confirmCreate, notes };
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

const TOKEN_HINT =
  "Tokens: jYYYY (year), jMM (month), jDD (day), WW (week). Text in [brackets] is copied as-is.";

export class MCalendarSettingTab extends PluginSettingTab {
  private host: MCalendarHost;
  private openGroups = new Set<string>(); // groups left expanded while this session lasts

  constructor(app: App, host: MCalendarHost) {
    super(app, host);
    this.host = host;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl).setName("General").setHeading();
    new Setting(containerEl)
      .setName("Grid direction")
      .setDesc(
        "Right to left puts the week numbers on the right and runs the days from right to left.",
      )
      .addDropdown((dropdown) => {
        dropdown
          .addOption("rtl", "Right to left")
          .addOption("ltr", "Left to right")
          .setValue(this.host.settings.direction)
          .onChange(async (value) => {
            this.host.settings.direction = value === "ltr" ? "ltr" : "rtl";
            await this.save();
          });
      });

    new Setting(containerEl)
      .setName("Confirm before creating notes")
      .setDesc(
        "Ask for confirmation before a new note is created from the calendar.",
      )
      .addToggle((toggle) => {
        toggle
          .setValue(this.host.settings.confirmCreate)
          .onChange(async (value) => {
            this.host.settings.confirmCreate = value;
            await this.save();
          });
      });

    this.addGroup(
      "Paths",
      "Folder where each kind of note is created",
      (body) => {
        body.createEl("p", {
          cls: "setting-item-description",
          text: TOKEN_HINT,
        });
        for (const kind of NOTE_KINDS) {
          this.addPatternField(
            body,
            kind,
            "folder",
            `${LABELS[kind]} Notes Folder`,
            `${LABELS[kind]} notes will be created in this folder.`,
          );
        }
      },
    );

    this.addGroup("Format", "File name of each kind of note", (body) => {
      body.createEl("p", { cls: "setting-item-description", text: TOKEN_HINT });
      for (const kind of NOTE_KINDS) {
        this.addPatternField(
          body,
          kind,
          "name",
          `${LABELS[kind]} note naming format`,
          `File name of ${LABELS[kind].toLowerCase()} notes, without .md.`,
        );
      }
    });

    this.addGroup(
      "Templates",
      "Optional template file for each kind of note",
      (body) => {
        for (const kind of NOTE_KINDS) this.addTemplateField(body, kind);
      },
    );
  }

  /** A collapsible section: click the header to show or hide its settings. */
  private addGroup(
    title: string,
    desc: string,
    fill: (body: HTMLElement) => void,
  ): void {
    const details = this.containerEl.createEl("details", { cls: "mcal-group" });
    details.open = this.openGroups.has(title);
    details.addEventListener("toggle", () => {
      if (details.open) this.openGroups.add(title);
      else this.openGroups.delete(title);
    });

    const summary = details.createEl("summary", { cls: "mcal-group-summary" });
    const text = summary.createDiv();
    text.createDiv({ cls: "mcal-group-title", text: title });
    text.createDiv({ cls: "mcal-group-desc", text: desc });
    setIcon(summary.createSpan({ cls: "mcal-chevron" }), "chevron-down");

    fill(details.createDiv({ cls: "mcal-group-body" }));
  }

  private addPatternField(
    parent: HTMLElement,
    kind: NoteKind,
    field: "folder" | "name",
    name: string,
    desc: string,
  ): void {
    new Setting(parent)
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

  private addTemplateField(parent: HTMLElement, kind: NoteKind): void {
    new Setting(parent)
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
