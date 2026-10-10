// Finds, creates and opens calendar notes inside the vault.

import {
  FileSystemAdapter,
  MarkdownView,
  Notice,
  TFile,
  TFolder,
} from "obsidian";
import type { App } from "obsidian";
import { askToCreate } from "./confirm";
import { toVaultPath } from "./format";
import { notePath } from "./paths";
import type { NoteTarget } from "./paths";
import type { MCalendarSettings } from "./settings";

export class NoteService {
  private app: App;
  private getSettings: () => MCalendarSettings;

  constructor(app: App, getSettings: () => MCalendarSettings) {
    this.app = app;
    this.getSettings = getSettings;
  }

  /** Vault path of the note (throws if a pattern in the settings is invalid). */
  pathOf(target: NoteTarget): string {
    return notePath(this.getSettings().notes[target.kind], target);
  }

  /** True if the note file already exists. */
  exists(target: NoteTarget): boolean {
    try {
      return (
        this.app.vault.getAbstractFileByPath(this.pathOf(target)) instanceof
        TFile
      );
    } catch {
      return false;
    }
  }

  /** Opens the note, creating it (and its folders) first if needed. */
  async openOrCreate(target: NoteTarget): Promise<void> {
    try {
      const path = this.pathOf(target);
      const existing = this.app.vault.getAbstractFileByPath(path);
      if (existing instanceof TFolder)
        throw new Error(`A folder already exists at "${path}"`);
      if (!(existing instanceof TFile) && this.getSettings().confirmCreate) {
        if (
          !(await askToCreate(
            this.app,
            `Create ${target.kind} note "${path}"?`,
          ))
        )
          return;
      }
      const file =
        existing instanceof TFile ? existing : await this.create(path, target);
      await this.open(file);
    } catch (error) {
      new Notice(
        `MCalendar: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async create(path: string, target: NoteTarget): Promise<TFile> {
    await this.ensureFolder(path);
    const content = await this.templateContent(target);
    return this.app.vault.create(path, content);
  }

  /** Creates every missing folder on the way to filePath. */
  private async ensureFolder(filePath: string): Promise<void> {
    let current = "";
    for (const part of filePath.split("/").slice(0, -1)) {
      current = current ? `${current}/${part}` : part;
      const found = this.app.vault.getAbstractFileByPath(current);
      if (found instanceof TFile)
        throw new Error(
          `Cannot create folder "${current}": a file has that name`,
        );
      if (!found) await this.app.vault.createFolder(current);
    }
  }

  /** Raw text of the configured template, or "" for a blank note. */
  private async templateContent(target: NoteTarget): Promise<string> {
    const configured = this.getSettings().notes[target.kind].template;
    if (!configured.trim()) return "";
    const adapter = this.app.vault.adapter;
    const base =
      adapter instanceof FileSystemAdapter ? adapter.getBasePath() : "";
    const templatePath = toVaultPath(configured, base);
    const file = this.app.vault.getAbstractFileByPath(templatePath);
    if (!(file instanceof TFile)) {
      new Notice(`MCalendar: template not found: ${templatePath}`);
      return "";
    }
    return this.app.vault.read(file);
  }

  /** Focuses the tab that already shows the file, or opens it in the main area. */
  private async open(file: TFile): Promise<void> {
    const shown = this.app.workspace
      .getLeavesOfType("markdown")
      .find(
        (leaf) => leaf.view instanceof MarkdownView && leaf.view.file === file,
      );
    if (shown) {
      this.app.workspace.setActiveLeaf(shown, { focus: true });
      return;
    }
    await this.app.workspace.getLeaf(false).openFile(file);
  }
}
