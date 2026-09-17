/**
 * Keyboard Shortcuts
 * キーボードショートカットのキーマップ判定と初期化
 */

export type ShortcutAction =
  | "createTask"
  | "editTask"
  | "toggleTask"
  | "deleteTask"
  | "previousWeek"
  | "nextWeek"
  | "goToToday"
  | "showHelp";

export interface ShortcutContext {
  readonly isEditableTarget: boolean;
  readonly isOverlayOpen: boolean;
}

const KEY_ACTION_MAP: Readonly<Record<string, ShortcutAction>> = {
  n: "createTask",
  N: "createTask",
  e: "editTask",
  E: "editTask",
  Enter: "toggleTask",
  " ": "toggleTask",
  d: "deleteTask",
  D: "deleteTask",
  ArrowLeft: "previousWeek",
  ArrowRight: "nextWeek",
  t: "goToToday",
  T: "goToToday",
  "?": "showHelp"
};

export function getShortcutAction(
  event: Pick<KeyboardEvent, "key" | "ctrlKey" | "metaKey" | "altKey" | "shiftKey" | "isComposing">,
  context: ShortcutContext
): ShortcutAction | null {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (event.isComposing) return null;
  if (context.isEditableTarget || context.isOverlayOpen) return null;
  return KEY_ACTION_MAP[event.key] ?? null;
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  // jsdom 環境では isContentEditable が未実装のため属性でも判定する
  const editableAttr = target.getAttribute("contenteditable");
  if (editableAttr === "true" || editableAttr === "") return true;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

const OVERLAY_SELECTOR = ".modal, #day-context-menu";

export function isAnyOverlayOpen(): boolean {
  return Array.from(document.querySelectorAll<HTMLElement>(OVERLAY_SELECTOR)).some(
    (el) => el.style.display !== "" && el.style.display !== "none"
  );
}

function getFocusedTaskId(): string | null {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return null;
  const taskElement = active.closest<HTMLElement>("[data-task-id]");
  return taskElement?.dataset.taskId ?? null;
}

export interface KeyboardShortcutDeps {
  readonly openCreateModal: () => void;
  readonly openEditModal: (taskId: string) => void;
  readonly toggleTaskCompletion: (taskId: string) => void;
  readonly deleteTask: (taskId: string) => void;
  readonly navigateWeek: (direction: -1 | 1) => void;
  readonly goToToday: () => void;
  readonly openPalette: () => void;
}

const HELP_MODAL_ID = "keyboard-shortcuts-help";

export function initializeKeyboardShortcuts(deps: KeyboardShortcutDeps): () => void {
  const handler = (event: KeyboardEvent): void => {
    if ((event.ctrlKey || event.metaKey) && (event.key === "k" || event.key === "K")) {
      if (isAnyOverlayOpen()) return;
      event.preventDefault();
      deps.openPalette();
      return;
    }

    if (event.key === "Escape") {
      const help = document.getElementById(HELP_MODAL_ID);
      if (help && help.style.display === "block") {
        help.classList.remove("show");
        help.style.display = "none";
      }
      return;
    }

    const action = getShortcutAction(event, {
      isEditableTarget: isEditableTarget(event.target),
      isOverlayOpen: isAnyOverlayOpen()
    });
    if (action === null) return;

    let handled = false;
    switch (action) {
      case "createTask":
        deps.openCreateModal();
        handled = true;
        break;
      case "editTask": {
        const taskId = getFocusedTaskId();
        if (taskId !== null) {
          deps.openEditModal(taskId);
          handled = true;
        }
        break;
      }
      case "toggleTask": {
        const taskId = getFocusedTaskId();
        if (taskId !== null) {
          deps.toggleTaskCompletion(taskId);
          handled = true;
        }
        break;
      }
      case "deleteTask": {
        const taskId = getFocusedTaskId();
        if (taskId !== null && window.confirm("このタスクを削除しますか？")) {
          deps.deleteTask(taskId);
          handled = true;
        }
        break;
      }
      case "previousWeek":
        deps.navigateWeek(-1);
        handled = true;
        break;
      case "nextWeek":
        deps.navigateWeek(1);
        handled = true;
        break;
      case "goToToday":
        deps.goToToday();
        handled = true;
        break;
      case "showHelp": {
        const help = document.getElementById(HELP_MODAL_ID);
        if (help) {
          help.classList.add("show");
          help.style.display = "block";
          handled = true;
        }
        break;
      }
    }
    if (handled) event.preventDefault();
  };

  const closeHelp = (): void => {
    const help = document.getElementById(HELP_MODAL_ID);
    if (help) {
      help.classList.remove("show");
      help.style.display = "none";
    }
  };

  const closeButton = document.getElementById("close-keyboard-shortcuts-help");
  closeButton?.addEventListener("click", closeHelp);
  document.addEventListener("keydown", handler);
  return () => {
    document.removeEventListener("keydown", handler);
    closeButton?.removeEventListener("click", closeHelp);
  };
}
