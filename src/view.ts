// The calendar panel: header, weekday labels and the month grid.

import { ItemView, debounce, setIcon } from "obsidian";
import type { WorkspaceLeaf } from "obsidian";
import { buildMonthGrid } from "./grid";
import { fromDate } from "./jalali";
import type { NoteService } from "./notes";
import type { NoteTarget } from "./paths";

export const VIEW_TYPE = "mcalendar-view";

const MONTH_NAMES = [
  "Farvardin",
  "Ordibehesht",
  "Khordad",
  "Tir",
  "Mordad",
  "Shahrivar",
  "Mehr",
  "Aban",
  "Azar",
  "Dey",
  "Bahman",
  "Esfand",
];
const WEEKDAY_LABELS = ["S", "S", "M", "T", "W", "T", "F"]; // Saturday first

export class CalendarView extends ItemView {
  private notes: NoteService;
  private jy: number; // month currently shown
  private jm: number;
  private todayKey = "";

  constructor(leaf: WorkspaceLeaf, notes: NoteService) {
    super(leaf);
    this.notes = notes;
    const today = fromDate(new Date());
    this.jy = today.jy;
    this.jm = today.jm;
  }

  getViewType(): string {
    return VIEW_TYPE;
  }

  getDisplayText(): string {
    return "MCalendar";
  }

  getIcon(): string {
    return "calendar";
  }

  async onOpen(): Promise<void> {
    this.contentEl.addClass("mcal");
    this.contentEl.setAttr("dir", "ltr");

    // Redraw when notes appear, disappear or move (brightness shows which exist).
    const refresh = debounce(() => this.render(), 100, true);
    this.registerEvent(this.app.vault.on("create", refresh));
    this.registerEvent(this.app.vault.on("delete", refresh));
    this.registerEvent(this.app.vault.on("rename", refresh));

    // Redraw when the day changes while Obsidian stays open.
    this.registerInterval(
      window.setInterval(() => {
        if (this.todayKey !== this.keyOf(fromDate(new Date()))) this.render();
      }, 60_000),
    );

    this.render();
  }

  /** Draws the whole panel again. Also called by the plugin after a settings change. */
  render(): void {
    const root = this.contentEl;
    root.empty();
    const today = fromDate(new Date());
    this.todayKey = this.keyOf(today);
    this.renderHeader(root);
    this.renderGrid(root, today);
  }

  private keyOf(d: { jy: number; jm: number; jd: number }): string {
    return `${d.jy}-${d.jm}-${d.jd}`;
  }

  private renderHeader(root: HTMLElement): void {
    const header = root.createDiv({ cls: "mcal-header" });

    const nav = header.createDiv({ cls: "mcal-nav" });
    this.addButton(nav, "chevron-left", "Previous month", () =>
      this.shiftMonth(-1),
    );
    this.addButton(nav, "rotate-cw", "Current month", () => this.goToToday());
    this.addButton(nav, "chevron-right", "Next month", () =>
      this.shiftMonth(1),
    );

    const title = header.createDiv({ cls: "mcal-title" });
    const month = title.createSpan({
      cls: "mcal-month",
      text: MONTH_NAMES[this.jm - 1],
    });
    month.addEventListener("click", () => {
      void this.notes.openOrCreate({
        kind: "monthly",
        jy: this.jy,
        jm: this.jm,
      });
    });
    const year = title.createSpan({ cls: "mcal-year", text: String(this.jy) });
    year.addEventListener("click", () => {
      void this.notes.openOrCreate({ kind: "yearly", jy: this.jy });
    });
  }

  private addButton(
    parent: HTMLElement,
    icon: string,
    label: string,
    onClick: () => void,
  ): void {
    const button = parent.createEl("button", {
      cls: "clickable-icon mcal-button",
      attr: { "aria-label": label },
    });
    setIcon(button, icon);
    button.addEventListener("click", onClick);
  }

  private renderGrid(
    root: HTMLElement,
    today: { jy: number; jm: number; jd: number },
  ): void {
    const grid = root.createDiv({ cls: "mcal-grid" });

    grid.createDiv({ cls: "mcal-label mcal-label--week", text: "W" });
    for (const label of WEEKDAY_LABELS)
      grid.createDiv({ cls: "mcal-label", text: label });

    for (const row of buildMonthGrid(this.jy, this.jm, today)) {
      const weekTarget: NoteTarget = {
        kind: "weekly",
        weekYear: row.weekYear,
        week: row.week,
      };
      const week = grid.createDiv({ cls: "mcal-week", text: String(row.week) });
      week.toggleClass("mcal-has-note", this.notes.exists(weekTarget));
      week.addEventListener("click", () => {
        void this.notes.openOrCreate(weekTarget);
      });

      for (const day of row.days) {
        const target: NoteTarget = {
          kind: "daily",
          date: { jy: day.jy, jm: day.jm, jd: day.jd },
        };
        const cell = grid.createDiv({ cls: "mcal-day" });
        cell.createSpan({ cls: "mcal-num", text: String(day.jd) });
        cell.toggleClass("mcal-outside", !day.inMonth);
        cell.toggleClass("mcal-holiday", day.isHoliday);
        cell.toggleClass("mcal-today", day.isToday);
        cell.toggleClass("mcal-has-note", this.notes.exists(target));
        cell.addEventListener("click", () => {
          void this.notes.openOrCreate(target);
          if (!day.inMonth) this.show(day.jy, day.jm); // follow a click on a neighbouring month's day
        });
      }
    }
  }

  private shiftMonth(delta: number): void {
    const index = this.jy * 12 + (this.jm - 1) + delta;
    this.show(Math.floor(index / 12), (index % 12) + 1);
  }

  private goToToday(): void {
    const today = fromDate(new Date());
    this.show(today.jy, today.jm);
  }

  private show(jy: number, jm: number): void {
    this.jy = jy;
    this.jm = jm;
    this.render();
  }
}
