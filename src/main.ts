// MCalendar: entry point. Wires settings, the note service and the calendar view together.

import { Plugin } from "obsidian";
import { NoteService } from "./notes";
import { MCalendarSettingTab, mergeSettings } from "./settings";
import type { MCalendarSettings } from "./settings";
import { CalendarView, VIEW_TYPE } from "./view";

export default class MCalendarPlugin extends Plugin {
  settings: MCalendarSettings = mergeSettings(null);
  private notes!: NoteService;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.notes = new NoteService(this.app, () => this.settings);

    this.registerView(VIEW_TYPE, (leaf) => new CalendarView(leaf, this.notes));
    this.addRibbonIcon("calendar", "Open MCalendar", () => {
      void this.activateView();
    });
    this.addCommand({
      id: "open-calendar",
      name: "Open MCalendar",
      callback: () => {
        void this.activateView();
      },
    });
    this.addSettingTab(new MCalendarSettingTab(this.app, this));

    // Make sure the calendar is in the right sidebar after startup.
    this.app.workspace.onLayoutReady(() => {
      if (this.app.workspace.getLeavesOfType(VIEW_TYPE).length === 0)
        void this.activateView();
    });
  }

  /** Shows the calendar, opening it in the right sidebar if it is not open yet. */
  async activateView(): Promise<void> {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_TYPE)[0];
    if (!leaf) {
      const right = workspace.getRightLeaf(false);
      if (!right) return;
      await right.setViewState({ type: VIEW_TYPE, active: true });
      leaf = right;
    }
    await workspace.revealLeaf(leaf);
  }

  async loadSettings(): Promise<void> {
    this.settings = mergeSettings(
      (await this.loadData()) as Partial<MCalendarSettings> | null,
    );
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  /** Redraws every open calendar (after a settings change). */
  refreshViews(): void {
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE)) {
      if (leaf.view instanceof CalendarView) leaf.view.render();
    }
  }
}
