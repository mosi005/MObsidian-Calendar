// A small yes/no dialog used before a new calendar note is created.

import { Modal } from "obsidian";
import type { App } from "obsidian";

class ConfirmModal extends Modal {
  private message: string;
  private done: (answer: boolean) => void;
  private answered = false;

  constructor(app: App, message: string, done: (answer: boolean) => void) {
    super(app);
    this.message = message;
    this.done = done;
  }

  onOpen(): void {
    const { contentEl } = this;
    this.titleEl.setText("Create new note");
    contentEl.createEl("p", { text: this.message });

    const buttons = contentEl.createDiv({ cls: "modal-button-container" });
    buttons
      .createEl("button", { text: "Cancel" })
      .addEventListener("click", () => this.finish(false));
    buttons
      .createEl("button", { text: "Create", cls: "mod-cta" })
      .addEventListener("click", () => this.finish(true));

    // Enter confirms, Esc cancels (Esc is handled by Obsidian and ends in onClose).
    this.scope.register([], "Enter", () => {
      this.finish(true);
      return false;
    });
  }

  onClose(): void {
    this.contentEl.empty();
    if (!this.answered) this.done(false); // closed with Esc or by clicking outside
  }

  private finish(answer: boolean): void {
    this.answered = true;
    this.done(answer);
    this.close();
  }
}

/** Resolves true if the user confirms, false if they cancel or close the dialog. */
export function askToCreate(app: App, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    new ConfirmModal(app, message, resolve).open();
  });
}
