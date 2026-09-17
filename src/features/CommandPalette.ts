/**
 * Command Palette
 * Ctrl/Cmd+K で開く検索パレットのDOM層（開閉・描画・キーボードナビ・選択実行）
 */
import type { Task } from "../types";
import { showNotification } from "../app/notifications";
import { searchTasks, filterCommands, combineResults, type PaletteItem } from "./paletteSearch";
import { PALETTE_COMMANDS, executeCommand } from "./paletteCommands";

export interface CommandPaletteDeps {
  readonly getTasks: () => readonly Task[];
  readonly goToWeek: (date: Date) => void;
}

export interface CommandPaletteHandle {
  readonly open: () => void;
  readonly dispose: () => void;
}

const PALETTE_ID = "command-palette";
const INPUT_ID = "command-palette-input";
const RESULTS_ID = "command-palette-results";
const HIGHLIGHT_CLASS = "palette-highlight";
const SELECTED_CLASS = "palette-item-selected";
const NO_RESULT_CLASS = "palette-no-result";
const HIGHLIGHT_MS = 3000;
const DEBOUNCE_MS = 150;

export function initializeCommandPalette(deps: CommandPaletteDeps): CommandPaletteHandle {
  const palette = document.getElementById(PALETTE_ID);
  const input = document.getElementById(INPUT_ID) as HTMLInputElement | null;
  const resultsEl = document.getElementById(RESULTS_ID);
  if (palette === null || input === null || resultsEl === null) {
    console.error("CommandPalette: required DOM elements are missing");
    return { open: () => undefined, dispose: () => undefined };
  }

  let items: readonly PaletteItem[] = [];
  let selectedIndex = 0;
  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let highlightTimer: ReturnType<typeof setTimeout> | undefined;

  const clearHighlightTimer = (): void => {
    if (highlightTimer !== undefined) {
      clearTimeout(highlightTimer);
      highlightTimer = undefined;
    }
  };

  const highlightTask = (taskId: string): void => {
    const taskEl = document.querySelector<HTMLElement>(`[data-task-id="${taskId}"]`);
    if (taskEl === null) {
      showNotification("タスクを表示できません（カテゴリフィルタで非表示の可能性があります）", "info");
      return;
    }
    clearHighlightTimer();
    taskEl.classList.add(HIGHLIGHT_CLASS);
    // jsdom 等では scrollIntoView が未実装のため存在確認して呼ぶ（実ブラウザでは常に存在）
    if (typeof taskEl.scrollIntoView === "function") {
      taskEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    highlightTimer = setTimeout(() => {
      taskEl.classList.remove(HIGHLIGHT_CLASS);
      highlightTimer = undefined;
    }, HIGHLIGHT_MS);
  };

  const renderResults = (): void => {
    resultsEl.innerHTML = "";
    if (items.length === 0) {
      const empty = document.createElement("li");
      empty.className = NO_RESULT_CLASS;
      empty.textContent = "一致する結果はありません";
      resultsEl.appendChild(empty);
      return;
    }
    items.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = index === selectedIndex ? `palette-item ${SELECTED_CLASS}` : "palette-item";
      li.setAttribute("role", "option");
      if (item.kind === "command") {
        li.textContent = `▸ ${item.command.title}`;
      } else {
        const dateLabel = item.task.assigned_date ?? "未割り当て";
        li.textContent = `${item.task.name}（${dateLabel}）`;
      }
      li.addEventListener("click", () => selectItem(item));
      li.addEventListener("mouseenter", () => {
        selectedIndex = index;
        renderResults();
      });
      resultsEl.appendChild(li);
    });
  };

  const refresh = (query: string): void => {
    let taskItems: readonly PaletteItem[] = [];
    try {
      taskItems = searchTasks(query, deps.getTasks());
    } catch (error) {
      console.error("CommandPalette: task search failed:", error);
      showNotification("タスクの検索に失敗しました", "error");
    }
    const commandItems = filterCommands(query, PALETTE_COMMANDS);
    items = combineResults(commandItems, taskItems);
    selectedIndex = 0;
    renderResults();
  };

  const close = (): void => {
    palette.style.display = "none";
  };

  const selectItem = (item: PaletteItem): void => {
    close();
    if (item.kind === "command") {
      executeCommand(item.command);
      return;
    }
    if (item.task.assigned_date !== null) {
      // "YYYY-MM-DD" + T00:00:00 でローカル0時解釈（UTC解釈の週ずれ防止）
      deps.goToWeek(new Date(`${item.task.assigned_date}T00:00:00`));
    }
    highlightTask(item.task.id);
  };

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.isComposing) return;
    if (event.key === "Escape") {
      close();
      event.preventDefault();
      return;
    }
    if (items.length === 0) return;
    if (event.key === "ArrowDown") {
      selectedIndex = (selectedIndex + 1) % items.length;
      renderResults();
      event.preventDefault();
    } else if (event.key === "ArrowUp") {
      selectedIndex = (selectedIndex - 1 + items.length) % items.length;
      renderResults();
      event.preventDefault();
    } else if (event.key === "Enter") {
      const selected = items[selectedIndex];
      if (selected !== undefined) selectItem(selected);
      event.preventDefault();
    }
  };

  const handleInput = (): void => {
    if (debounceTimer !== undefined) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      refresh(input.value);
    }, DEBOUNCE_MS);
  };

  const handleBackdropClick = (event: MouseEvent): void => {
    if (event.target === palette) close();
  };

  const open = (): void => {
    palette.style.display = "block";
    input.value = "";
    refresh("");
    input.focus();
  };

  input.addEventListener("keydown", handleKeydown);
  input.addEventListener("input", handleInput);
  palette.addEventListener("click", handleBackdropClick);

  return {
    open,
    dispose: () => {
      input.removeEventListener("keydown", handleKeydown);
      input.removeEventListener("input", handleInput);
      palette.removeEventListener("click", handleBackdropClick);
      if (debounceTimer !== undefined) clearTimeout(debounceTimer);
      clearHighlightTimer();
    },
  };
}
