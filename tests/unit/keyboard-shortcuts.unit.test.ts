/**
 * Keyboard Shortcuts Tests
 * getShortcutAction のキーマップとガード条件、フォーカス対象判定、オーバーレイ判定のテスト
 */

import { describe, it, expect, afterEach, vi, beforeEach } from "vitest";
import {
  getShortcutAction,
  isEditableTarget,
  isAnyOverlayOpen,
  initializeKeyboardShortcuts,
  type ShortcutAction
} from "../../src/features/KeyboardShortcuts";

interface FakeKeyboardEvent {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  isComposing: boolean;
}

const keyEvent = (key: string, mods: Partial<FakeKeyboardEvent> = {}): FakeKeyboardEvent => ({
  key,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  shiftKey: false,
  isComposing: false,
  ...mods
});

const closedContext = { isEditableTarget: false, isOverlayOpen: false };

describe("getShortcutAction", () => {
  describe("キーマップ", () => {
    it("n / N で createTask を返す", () => {
      expect(getShortcutAction(keyEvent("n"), closedContext)).toBe<ShortcutAction>("createTask");
      expect(getShortcutAction(keyEvent("N", { shiftKey: true }), closedContext)).toBe<ShortcutAction>("createTask");
    });

    it("e / E で editTask を返す", () => {
      expect(getShortcutAction(keyEvent("e"), closedContext)).toBe<ShortcutAction>("editTask");
      expect(getShortcutAction(keyEvent("E"), closedContext)).toBe<ShortcutAction>("editTask");
    });

    it("Enter と Space で toggleTask を返す", () => {
      expect(getShortcutAction(keyEvent("Enter"), closedContext)).toBe<ShortcutAction>("toggleTask");
      expect(getShortcutAction(keyEvent(" "), closedContext)).toBe<ShortcutAction>("toggleTask");
    });

    it("d / D で deleteTask を返す", () => {
      expect(getShortcutAction(keyEvent("d"), closedContext)).toBe<ShortcutAction>("deleteTask");
      expect(getShortcutAction(keyEvent("D"), closedContext)).toBe<ShortcutAction>("deleteTask");
    });

    it("← / → で previousWeek / nextWeek を返す", () => {
      expect(getShortcutAction(keyEvent("ArrowLeft"), closedContext)).toBe<ShortcutAction>("previousWeek");
      expect(getShortcutAction(keyEvent("ArrowRight"), closedContext)).toBe<ShortcutAction>("nextWeek");
    });

    it("t / T で goToToday を返す", () => {
      expect(getShortcutAction(keyEvent("t"), closedContext)).toBe<ShortcutAction>("goToToday");
      expect(getShortcutAction(keyEvent("T"), closedContext)).toBe<ShortcutAction>("goToToday");
    });

    it("? で showHelp を返す", () => {
      expect(getShortcutAction(keyEvent("?", { shiftKey: true }), closedContext)).toBe<ShortcutAction>("showHelp");
    });

    it("未割り当てのキーは null を返す", () => {
      expect(getShortcutAction(keyEvent("x"), closedContext)).toBeNull();
      expect(getShortcutAction(keyEvent("a"), closedContext)).toBeNull();
      expect(getShortcutAction(keyEvent("Escape"), closedContext)).toBeNull();
    });
  });

  describe("ガード条件", () => {
    it("Ctrl / Meta / Alt 併用時は null を返す（ブラウザショートカット優先）", () => {
      expect(getShortcutAction(keyEvent("n", { ctrlKey: true }), closedContext)).toBeNull();
      expect(getShortcutAction(keyEvent("n", { metaKey: true }), closedContext)).toBeNull();
      expect(getShortcutAction(keyEvent("d", { altKey: true }), closedContext)).toBeNull();
    });

    it("IME変換中 (isComposing) は null を返す", () => {
      expect(getShortcutAction(keyEvent("n", { isComposing: true }), closedContext)).toBeNull();
    });

    it("編集可能要素に入力中は null を返す", () => {
      expect(getShortcutAction(keyEvent("n"), { isEditableTarget: true, isOverlayOpen: false })).toBeNull();
    });

    it("モーダル等のオーバーレイ表示中は null を返す", () => {
      expect(getShortcutAction(keyEvent("n"), { isEditableTarget: false, isOverlayOpen: true })).toBeNull();
    });
  });
});

describe("isEditableTarget", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("input / textarea / select を編集対象と判定する", () => {
    for (const tag of ["input", "textarea", "select"]) {
      const el = document.createElement(tag);
      expect(isEditableTarget(el)).toBe(true);
    }
  });

  it("通常の div は編集対象と判定しない", () => {
    expect(isEditableTarget(document.createElement("div"))).toBe(false);
  });

  it("null は編集対象と判定しない", () => {
    expect(isEditableTarget(null)).toBe(false);
  });

  it("contenteditable 要素は編集対象と判定する", () => {
    const el = document.createElement("div");
    // jsdom は isContentEditable を実装しないため属性でシミュレートする
    el.setAttribute("contenteditable", "true");
    expect(isEditableTarget(el)).toBe(true);
  });
});

describe("isAnyOverlayOpen", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("オーバーレイがなければ false", () => {
    expect(isAnyOverlayOpen()).toBe(false);
  });

  it("モーダルが display:block なら true", () => {
    const modal = document.createElement("div");
    modal.id = "task-modal";
    modal.className = "modal";
    modal.style.display = "block";
    document.body.appendChild(modal);
    expect(isAnyOverlayOpen()).toBe(true);
  });

  it("モーダルが display:none なら false", () => {
    const modal = document.createElement("div");
    modal.id = "task-modal";
    modal.className = "modal";
    modal.style.display = "none";
    document.body.appendChild(modal);
    expect(isAnyOverlayOpen()).toBe(false);
  });

  it("コンテキストメニューが開いていれば true", () => {
    const menu = document.createElement("div");
    menu.id = "day-context-menu";
    menu.style.display = "block";
    document.body.appendChild(menu);
    expect(isAnyOverlayOpen()).toBe(true);
  });
});

describe("initializeKeyboardShortcuts", () => {
  interface ShortcutDeps {
    openCreateModal: ReturnType<typeof vi.fn>;
    openEditModal: ReturnType<typeof vi.fn>;
    toggleTaskCompletion: ReturnType<typeof vi.fn>;
    deleteTask: ReturnType<typeof vi.fn>;
    navigateWeek: ReturnType<typeof vi.fn>;
    goToToday: ReturnType<typeof vi.fn>;
    openPalette: ReturnType<typeof vi.fn>;
  }

  let deps: ShortcutDeps;
  let dispose: (() => void) | undefined;
  let helpModal: HTMLElement;

  const dispatchKey = (key: string, mods: KeyboardEventInit = {}): boolean =>
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...mods })
    );

  const addFocusedTask = (taskId: string): HTMLElement => {
    const task = document.createElement("div");
    task.className = "task";
    task.tabIndex = 0;
    task.dataset.taskId = taskId;
    document.body.appendChild(task);
    task.focus();
    return task;
  };

  beforeEach(() => {
    deps = {
      openCreateModal: vi.fn(),
      openEditModal: vi.fn(),
      toggleTaskCompletion: vi.fn(),
      deleteTask: vi.fn(),
      navigateWeek: vi.fn(),
      goToToday: vi.fn(),
      openPalette: vi.fn()
    };
    helpModal = document.createElement("div");
    helpModal.id = "keyboard-shortcuts-help";
    helpModal.className = "modal";
    const closeBtn = document.createElement("span");
    closeBtn.id = "close-keyboard-shortcuts-help";
    helpModal.appendChild(closeBtn);
    document.body.appendChild(helpModal);
    dispose = initializeKeyboardShortcuts(deps);
  });

  afterEach(() => {
    dispose?.();
    dispose = undefined;
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  });

  it("N キーで新規作成モーダルを開く", () => {
    dispatchKey("n");
    expect(deps.openCreateModal).toHaveBeenCalledTimes(1);
  });

  it("E キーでフォーカス中のタスクを編集する", () => {
    addFocusedTask("task-1");
    dispatchKey("e");
    expect(deps.openEditModal).toHaveBeenCalledWith("task-1");
  });

  it("フォーカス中のタスクがなければ E キーは何もしない", () => {
    dispatchKey("e");
    expect(deps.openEditModal).not.toHaveBeenCalled();
  });

  it("Enter キーでフォーカス中のタスクの完了をトグルする（デフォルト動作も抑止）", () => {
    addFocusedTask("task-2");
    const notCanceled = dispatchKey("Enter");
    expect(deps.toggleTaskCompletion).toHaveBeenCalledWith("task-2");
    expect(notCanceled).toBe(false);
  });

  it("フォーカス中のタスクがなければ Enter はデフォルト動作を抑止しない", () => {
    const notCanceled = dispatchKey("Enter");
    expect(notCanceled).toBe(true);
    expect(deps.toggleTaskCompletion).not.toHaveBeenCalled();
  });

  it("フォーカス中のタスクがなければ Space はデフォルト動作を抑止しない", () => {
    const notCanceled = dispatchKey(" ");
    expect(notCanceled).toBe(true);
    expect(deps.toggleTaskCompletion).not.toHaveBeenCalled();
  });

  it("ボタンにフォーカスがあるときの Enter はデフォルト動作を抑止しない", () => {
    const button = document.createElement("button");
    document.body.appendChild(button);
    button.focus();
    const notCanceled = button.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })
    );
    expect(notCanceled).toBe(true);
  });

  it("D キーは確認ダイアログで OK の場合のみ削除する", () => {
    addFocusedTask("task-3");
    vi.stubGlobal("confirm", () => true);
    dispatchKey("d");
    expect(deps.deleteTask).toHaveBeenCalledWith("task-3");
  });

  it("D キーは確認ダイアログでキャンセルなら削除しない", () => {
    addFocusedTask("task-4");
    vi.stubGlobal("confirm", () => false);
    dispatchKey("d");
    expect(deps.deleteTask).not.toHaveBeenCalled();
  });

  it("← / → で週を移動する", () => {
    dispatchKey("ArrowLeft");
    dispatchKey("ArrowRight");
    expect(deps.navigateWeek).toHaveBeenNthCalledWith(1, -1);
    expect(deps.navigateWeek).toHaveBeenNthCalledWith(2, 1);
  });

  it("T キーで今日の週へ移動する", () => {
    dispatchKey("t");
    expect(deps.goToToday).toHaveBeenCalledTimes(1);
  });

  it("? キーでヘルプを表示し、Escape で閉じる", () => {
    dispatchKey("?", { shiftKey: true });
    expect(helpModal.style.display).toBe("block");
    dispatchKey("Escape");
    expect(helpModal.style.display).toBe("none");
  });

  it("? キーでヘルプを表示し、閉じボタンで閉じる", () => {
    dispatchKey("?", { shiftKey: true });
    expect(helpModal.style.display).toBe("block");
    document.getElementById("close-keyboard-shortcuts-help")?.dispatchEvent(
      new MouseEvent("click", { bubbles: true })
    );
    expect(helpModal.style.display).toBe("none");
  });

  it("入力欄へのキー入力はショートカットとして扱わない", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "n", bubbles: true }));
    expect(deps.openCreateModal).not.toHaveBeenCalled();
  });

  it("モーダル表示中はショートカットを無効化する", () => {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.display = "block";
    document.body.appendChild(modal);
    dispatchKey("n");
    expect(deps.openCreateModal).not.toHaveBeenCalled();
  });

  it("dispose 後はキー入力に反応しない", () => {
    dispose?.();
    dispatchKey("n");
    expect(deps.openCreateModal).not.toHaveBeenCalled();
  });

  it("Ctrl+K / Cmd+K でコマンドパレットを開く", () => {
    dispatchKey("k", { ctrlKey: true });
    dispatchKey("k", { metaKey: true });
    expect(deps.openPalette).toHaveBeenCalledTimes(2);
  });

  it("オーバーレイ表示中は Ctrl+K も無視する", () => {
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.display = "block";
    document.body.appendChild(modal);
    dispatchKey("k", { ctrlKey: true });
    expect(deps.openPalette).not.toHaveBeenCalled();
  });
});
