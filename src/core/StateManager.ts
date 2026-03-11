/**
 * StateManager - Type-safe class for application state management
 * Manages application state with change listeners and notifications
 */

import type { AppState, Task, TaskCategory, Theme } from '../types';
import { TaskStorage, SettingsStorage } from '../utils/storage';
import type { Settings } from '../types';
import { loadTasksWithMigrations } from '../utils/migration';
import { logger } from '../utils/logger';

/**
 * State change listener type
 */
export type StateChangeListener<T = AppState> = (
  newState: T,
  oldState: T
) => void;

/**
 * Specific state listener types
 */
export type TasksChangeListener = (tasks: Task[], oldTasks: Task[]) => void;
export type SettingsChangeListener = (
  settings: Settings,
  oldSettings: Settings
) => void;
export type CurrentDateChangeListener = (
  currentDate: Date,
  oldDate: Date
) => void;
export type CategoryFilterChangeListener = (
  filter: TaskCategory | '',
  oldFilter: TaskCategory | ''
) => void;
export type ThemeChangeListener = (theme: Theme, oldTheme: Theme) => void;
export type SelectedTaskChangeListener = (
  taskId: string | null,
  oldTaskId: string | null
) => void;

/**
 * StateManager class
 * Centralized state management with change notifications
 */
export class StateManager {
  private state: AppState;
  private listeners: Map<string, Set<StateChangeListener>> = new Map();
  private currentTheme: Theme = 'light';

  constructor(initialState?: Partial<AppState>) {
    // Load initial data from storage
    const tasks = loadTasksWithMigrations();
    const settings = SettingsStorage.loadSettings();

    this.state = {
      tasks,
      settings,
      currentDate: new Date(),
      categoryFilter: '',
      selectedTaskId: null,
      isEditMode: false,
      isDarkTheme: false,
      dashboardVisible: false,
      templatePanelVisible: false,
      archiveVisible: false,
      ...initialState
    };

    // Load theme from localStorage
    this.loadTheme();

    logger.info('StateManager initialized with', {
      tasksCount: this.state.tasks.length,
      theme: this.currentTheme
    });
  }

  /**
   * Get current state (readonly)
   * @returns Current application state
   */
  getState(): Readonly<AppState> {
    return { ...this.state };
  }

  /**
   * Get a specific state property
   * @param key - The state property key
   * @returns The property value
   */
  get<K extends keyof AppState>(key: K): AppState[K] {
    return this.state[key];
  }

  /**
   * Set a specific state property
   * @param key - The state property key
   * @param value - The new value
   * @returns Success of update
   */
  set<K extends keyof AppState>(key: K, value: AppState[K]): boolean {
    const oldValue = this.state[key];
    if (oldValue === value) {
      return false;
    }

    this.state[key] = value;
    this.notifyListeners();

    return true;
  }

  /**
   * Update multiple state properties at once
   * @param updates - Partial state object with updates
   * @returns Success of update
   */
  update(updates: Partial<AppState>): boolean {
    let changed = false;

    Object.keys(updates).forEach(key => {
      const k = key as keyof AppState;
      if (this.state[k] !== updates[k]) {
        this.state[k] = updates[k]!;
        changed = true;
      }
    });

    if (changed) {
      this.notifyListeners();
    }

    return changed;
  }

  /**
   * Set tasks
   * @param tasks - New tasks array
   * @param saveToStorage - Whether to save to localStorage (default: true)
   */
  setTasks(tasks: Task[], saveToStorage: boolean = true): void {
    const oldTasks = this.state.tasks;
    this.state.tasks = tasks;

    if (saveToStorage) {
      TaskStorage.saveTasks(tasks);
    }

    this.notifyListeners();
    this.notifySpecificListeners('tasks', tasks, oldTasks);
  }

  /**
   * Get all tasks
   * @returns Current tasks array
   */
  getTasks(): ReadonlyArray<Task> {
    return [...this.state.tasks];
  }

  /**
   * Get a task by ID
   * @param taskId - The task ID
   * @returns The task or undefined
   */
  getTaskById(taskId: string): Task | undefined {
    return this.state.tasks.find(task => task.id === taskId);
  }

  /**
   * Add a task
   * @param task - The task to add
   * @param saveToStorage - Whether to save to localStorage (default: true)
   */
  addTask(task: Task, saveToStorage: boolean = true): void {
    const oldTasks = [...this.state.tasks];
    this.state.tasks.push(task);

    if (saveToStorage) {
      TaskStorage.saveTasks(this.state.tasks);
    }

    this.notifyListeners();
    this.notifySpecificListeners('tasks', this.state.tasks, oldTasks);
  }

  /**
   * Update a task
   * @param taskId - The task ID
   * @param updates - Partial task updates
   * @param saveToStorage - Whether to save to localStorage (default: true)
   * @returns Success of update
   */
  updateTask(taskId: string, updates: Partial<Task>, saveToStorage: boolean = true): boolean {
    const oldTasks = [...this.state.tasks];
    const taskIndex = this.state.tasks.findIndex(task => task.id === taskId);

    if (taskIndex === -1) {
      logger.warn(`Task not found: ${taskId}`);
      return false;
    }

    this.state.tasks[taskIndex] = {
      ...this.state.tasks[taskIndex],
      ...updates
    };

    if (saveToStorage) {
      TaskStorage.saveTasks(this.state.tasks);
    }

    this.notifyListeners();
    this.notifySpecificListeners('tasks', this.state.tasks, oldTasks);
    return true;
  }

  /**
   * Delete a task
   * @param taskId - The task ID
   * @param saveToStorage - Whether to save to localStorage (default: true)
   * @returns Success of deletion
   */
  deleteTask(taskId: string, saveToStorage: boolean = true): boolean {
    const oldTasks = [...this.state.tasks];
    const taskIndex = this.state.tasks.findIndex(task => task.id === taskId);

    if (taskIndex === -1) {
      logger.warn(`Task not found: ${taskId}`);
      return false;
    }

    this.state.tasks.splice(taskIndex, 1);

    if (saveToStorage) {
      TaskStorage.saveTasks(this.state.tasks);
    }

    this.notifyListeners();
    this.notifySpecificListeners('tasks', this.state.tasks, oldTasks);
    return true;
  }

  /**
   * Set settings
   * @param settings - New settings object
   */
  setSettings(settings: Settings): void {
    const oldSettings = this.state.settings;
    this.state.settings = settings;

    SettingsStorage.saveSettings(settings);

    this.notifyListeners();
    this.notifySpecificListeners('settings', settings, oldSettings);
  }

  /**
   * Get settings
   * @returns Current settings
   */
  getSettings(): Settings {
    return { ...this.state.settings };
  }

  /**
   * Set current date
   * @param date - New current date
   */
  setCurrentDate(date: Date): void {
    const oldDate = this.state.currentDate;
    this.state.currentDate = date;

    this.notifyListeners();
    this.notifySpecificListeners('currentDate', date, oldDate);
  }

  /**
   * Get current date
   * @returns Current date
   */
  getCurrentDate(): Date {
    return new Date(this.state.currentDate);
  }

  /**
   * Set category filter
   * @param filter - New category filter
   */
  setCategoryFilter(filter: TaskCategory | ''): void {
    const oldFilter = this.state.categoryFilter;
    this.state.categoryFilter = filter;

    this.notifyListeners();
    this.notifySpecificListeners('categoryFilter', filter, oldFilter);
  }

  /**
   * Get category filter
   * @returns Current category filter
   */
  getCategoryFilter(): TaskCategory | '' {
    return this.state.categoryFilter;
  }

  /**
   * Set selected task ID
   * @param taskId - The task ID to select
   */
  setSelectedTaskId(taskId: string | null): void {
    const oldTaskId = this.state.selectedTaskId;
    this.state.selectedTaskId = taskId;

    this.notifyListeners();
    this.notifySpecificListeners('selectedTaskId', taskId, oldTaskId);
  }

  /**
   * Get selected task ID
   * @returns Selected task ID or null
   */
  getSelectedTaskId(): string | null {
    return this.state.selectedTaskId;
  }

  /**
   * Get selected task
   * @returns Selected task or null
   */
  getSelectedTask(): Task | null {
    if (!this.state.selectedTaskId) {
      return null;
    }
    return this.getTaskById(this.state.selectedTaskId) || null;
  }

  /**
   * Set edit mode
   * @param isEditMode - Whether in edit mode
   */
  setEditMode(isEditMode: boolean): void {
    this.state.isEditMode = isEditMode;
    this.notifyListeners();
  }

  /**
   * Get edit mode
   * @returns Whether in edit mode
   */
  isEditMode(): boolean {
    return this.state.isEditMode;
  }

  /**
   * Set dashboard visibility
   * @param visible - Whether dashboard is visible
   */
  setDashboardVisible(visible: boolean): void {
    this.state.dashboardVisible = visible;
    this.notifyListeners();
  }

  /**
   * Get dashboard visibility
   * @returns Whether dashboard is visible
   */
  isDashboardVisible(): boolean {
    return this.state.dashboardVisible;
  }

  /**
   * Set template panel visibility
   * @param visible - Whether template panel is visible
   */
  setTemplatePanelVisible(visible: boolean): void {
    this.state.templatePanelVisible = visible;
    this.notifyListeners();
  }

  /**
   * Get template panel visibility
   * @returns Whether template panel is visible
   */
  isTemplatePanelVisible(): boolean {
    return this.state.templatePanelVisible;
  }

  /**
   * Set archive visibility
   * @param visible - Whether archive is visible
   */
  setArchiveVisible(visible: boolean): void {
    this.state.archiveVisible = visible;
    this.notifyListeners();
  }

  /**
   * Get archive visibility
   * @returns Whether archive is visible
   */
  isArchiveVisible(): boolean {
    return this.state.archiveVisible;
  }

  /**
   * Toggle theme
   */
  toggleTheme(): void {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Set theme
   * @param theme - The theme to set
   */
  setTheme(theme: Theme): void {
    const oldTheme = this.currentTheme;
    this.currentTheme = theme;
    this.state.isDarkTheme = theme === 'dark';

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('weekly-task-board.theme', theme);

    this.notifyListeners();
    this.notifySpecificListeners('theme', theme, oldTheme);
  }

  /**
   * Get current theme
   * @returns Current theme
   */
  getTheme(): Theme {
    return this.currentTheme;
  }

  /**
   * Load theme from localStorage
   */
  private loadTheme(): void {
    const savedTheme = localStorage.getItem('weekly-task-board.theme') as Theme | null;
    this.currentTheme = savedTheme || 'light';
    this.state.isDarkTheme = this.currentTheme === 'dark';

    // Apply theme to document
    document.documentElement.setAttribute('data-theme', this.currentTheme);
  }

  /**
   * Register a state change listener
   * @param key - The state property key (or '*' for all changes)
   * @param listener - The listener function
   * @returns Unsubscribe function
   */
  on(key: string, listener: StateChangeListener): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key)!.add(listener);

    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * Register a tasks change listener
   * @param listener - The listener function
   * @returns Unsubscribe function
   */
  onTasksChange(listener: TasksChangeListener): () => void {
    return this.on('tasks', listener);
  }

  /**
   * Register a settings change listener
   * @param listener - The listener function
   * @returns Unsubscribe function
   */
  onSettingsChange(listener: SettingsChangeListener): () => void {
    return this.on('settings', listener);
  }

  /**
   * Register a current date change listener
   * @param listener - The listener function
   * @returns Unsubscribe function
   */
  onCurrentDateChange(listener: CurrentDateChangeListener): () => void {
    return this.on('currentDate', listener);
  }

  /**
   * Register a category filter change listener
   * @param listener - The listener function
   * @returns Unsubscribe function
   */
  onCategoryFilterChange(listener: CategoryFilterChangeListener): () => void {
    return this.on('categoryFilter', listener);
  }

  /**
   * Register a theme change listener
   * @param listener - The listener function
   * @returns Unsubscribe function
   */
  onThemeChange(listener: ThemeChangeListener): () => void {
    return this.on('theme', listener);
  }

  /**
   * Register a selected task change listener
   * @param listener - The listener function
   * @returns Unsubscribe function
   */
  onSelectedTaskChange(listener: SelectedTaskChangeListener): () => void {
    return this.on('selectedTaskId', listener);
  }

  /**
   * Notify all state listeners
   */
  private notifyListeners(): void {
    const allListeners = this.listeners.get('*');
    if (allListeners) {
      allListeners.forEach(listener => {
        try {
          listener(this.state, this.state);
        } catch (error) {
          logger.error('State listener error:', error);
        }
      });
    }
  }

  /**
   * Notify specific state listeners
   * @param key - The state property key
   * @param newValue - New value
   * @param oldValue - Old value
   */
  private notifySpecificListeners(
    key: string,
    newValue: unknown,
    oldValue: unknown
  ): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(listener => {
        try {
          listener(newValue, oldValue);
        } catch (error) {
          logger.error('State listener error:', error);
        }
      });
    }
  }

  /**
   * Reset state to initial values
   */
  reset(): void {
    const oldState = { ...this.state };

    // Reload from storage
    this.state.tasks = loadTasksWithMigrations();
    this.state.settings = SettingsStorage.loadSettings();
    this.state.currentDate = new Date();
    this.state.categoryFilter = '';
    this.state.selectedTaskId = null;
    this.state.isEditMode = false;
    this.state.dashboardVisible = false;
    this.state.templatePanelVisible = false;
    this.state.archiveVisible = false;

    this.notifyListeners();
  }

  /**
   * Get state as JSON string (for debugging/serialization)
   * @returns JSON string representation of state
   */
  toJSON(): string {
    return JSON.stringify({
      tasks: this.state.tasks,
      settings: this.state.settings,
      currentDate: this.state.currentDate,
      categoryFilter: this.state.categoryFilter,
      selectedTaskId: this.state.selectedTaskId,
      isEditMode: this.state.isEditMode,
      isDarkTheme: this.state.isDarkTheme,
      dashboardVisible: this.state.dashboardVisible,
      templatePanelVisible: this.state.templatePanelVisible,
      archiveVisible: this.state.archiveVisible
    });
  }
}

/**
 * Create a StateManager instance
 * @param initialState - Optional initial state
 * @returns New StateManager instance
 */
export function createStateManager(initialState?: Partial<AppState>): StateManager {
  return new StateManager(initialState);
}

/**
 * Global state manager instance
 */
export const stateManager = createStateManager();
