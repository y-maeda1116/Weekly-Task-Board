import type { Task } from '../types';
import type { TaskPriority, TaskCategory } from '../types/task';
import { formatDate } from '../utils/date';

type ModalMode = 'create' | 'edit';

interface ModalState {
  isOpen: boolean;
  currentTaskId: string | null;
  isEditMode: boolean;
  mode: ModalMode;
}

interface FormDataType {
  name: string;
  estimated_time: number;
  actual_time: number;
  priority: string;
  category: string;
  date: string;
  due_date: string | null;
  due_time_period: string | null;
  due_hour: number | null;
  details: string;
  is_recurring: boolean;
  recurrence_pattern: string | null;
  recurrence_end_date: string | null;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ModalElements {
  modal: HTMLElement | null;
  form: HTMLFormElement | null;
  taskName: HTMLInputElement | null;
  estimatedTime: HTMLInputElement | null;
  actualTime: HTMLInputElement | null;
  priority: HTMLSelectElement | null;
  category: HTMLSelectElement | null;
  date: HTMLInputElement | null;
  dueDate: HTMLInputElement | null;
  dueTimePeriod: HTMLSelectElement | null;
  dueHour: HTMLSelectElement | null;
  details: HTMLTextAreaElement | null;
  isRecurring: HTMLInputElement | null;
  recurrenceOptions: HTMLElement | null;
  recurrencePattern: HTMLSelectElement | null;
  recurrenceEndDate: HTMLInputElement | null;
  duplicateBtn: HTMLElement | null;
  saveAsTemplateBtn: HTMLElement | null;
  closeModalBtns: NodeListOf<HTMLElement> | null;
}

const modalState: ModalState = {
  isOpen: false,
  currentTaskId: null,
  isEditMode: false,
  mode: 'create',
};

const elements: ModalElements = {
  modal: null,
  form: null,
  taskName: null,
  estimatedTime: null,
  actualTime: null,
  priority: null,
  category: null,
  date: null,
  dueDate: null,
  dueTimePeriod: null,
  dueHour: null,
  details: null,
  isRecurring: null,
  recurrenceOptions: null,
  recurrencePattern: null,
  recurrenceEndDate: null,
  duplicateBtn: null,
  saveAsTemplateBtn: null,
  closeModalBtns: null,
};

function logInfo(message: string, ...args: unknown[]): void {
  console.log(`[TaskModal] ${message}`, ...args);
}

function logWarn(message: string, ...args: unknown[]): void {
  console.warn(`[TaskModal] ${message}`, ...args);
}

function initializeElements(): boolean {
  elements.modal = document.getElementById('task-modal');
  elements.form = document.getElementById('task-form') as HTMLFormElement | null;
  elements.taskName = document.getElementById('task-name') as HTMLInputElement | null;
  elements.estimatedTime = document.getElementById('estimated-time') as HTMLInputElement | null;
  elements.actualTime = document.getElementById('actual-time') as HTMLInputElement | null;
  elements.priority = document.getElementById('task-priority') as HTMLSelectElement | null;
  elements.category = document.getElementById('task-category') as HTMLSelectElement | null;
  elements.date = document.getElementById('task-date') as HTMLInputElement | null;
  elements.dueDate = document.getElementById('due-date') as HTMLInputElement | null;
  elements.dueTimePeriod = document.getElementById('due-time-period') as HTMLSelectElement | null;
  elements.dueHour = document.getElementById('due-hour') as HTMLSelectElement | null;
  elements.details = document.getElementById('task-details') as HTMLTextAreaElement | null;
  elements.isRecurring = document.getElementById('is-recurring') as HTMLInputElement | null;
  elements.recurrenceOptions = document.getElementById('recurrence-options');
  elements.recurrencePattern = document.getElementById('recurrence-pattern') as HTMLSelectElement | null;
  elements.recurrenceEndDate = document.getElementById('recurrence-end-date') as HTMLInputElement | null;
  elements.duplicateBtn = document.getElementById('duplicate-task-btn');
  elements.saveAsTemplateBtn = document.getElementById('save-as-template-btn');
  elements.closeModalBtns = document.querySelectorAll<HTMLElement>('.close-btn');

  const critical: (HTMLElement | null)[] = [
    elements.modal, elements.form, elements.taskName,
    elements.estimatedTime, elements.priority, elements.category, elements.date,
  ];
  const missingCount = critical.filter((el) => el === null).length;
  if (missingCount > 0) {
    logWarn(`Missing critical modal elements: ${missingCount}`);
  }
  return missingCount === 0;
}

function showModal(): void {
  if (elements.modal) {
    elements.modal.style.display = 'block';
    elements.modal.classList.add('show');
    modalState.isOpen = true;
  }
}

function hideModal(): void {
  if (elements.modal) {
    elements.modal.classList.remove('show');
    elements.modal.style.display = 'none';
    modalState.isOpen = false;
    modalState.currentTaskId = null;
    modalState.isEditMode = false;
  }
}

function openCreateModal(date?: string): void {
  modalState.mode = 'create';
  modalState.isEditMode = false;
  modalState.currentTaskId = null;
  resetForm();
  if (elements.date) {
    elements.date.value = date || formatDate(new Date());
  }
  if (elements.duplicateBtn) {
    elements.duplicateBtn.style.display = 'none';
  }
  if (elements.saveAsTemplateBtn) {
    elements.saveAsTemplateBtn.style.display = 'none';
  }
  showModal();
  focusFirstInput();
  logInfo('Opened create task modal');
}

function openEditModal(taskId: string): void {
  modalState.mode = 'edit';
  modalState.isEditMode = true;
  modalState.currentTaskId = taskId;
  loadTaskIntoForm(taskId);
  if (elements.duplicateBtn) {
    elements.duplicateBtn.style.display = 'inline-block';
  }
  if (elements.saveAsTemplateBtn) {
    elements.saveAsTemplateBtn.style.display = 'inline-block';
  }
  showModal();
  logInfo(`Opened edit task modal: ${taskId}`);
}

function resetForm(): void {
  if (elements.form) {
    elements.form.reset();
  }
  if (elements.actualTime) {
    elements.actualTime.value = '0';
  }
  if (elements.recurrenceOptions) {
    elements.recurrenceOptions.style.display = 'none';
  }
  if (elements.recurrencePattern) {
    elements.recurrencePattern.value = '';
  }
  if (elements.recurrenceEndDate) {
    elements.recurrenceEndDate.value = '';
  }
  if (elements.dueHour) {
    elements.dueHour.value = '';
  }
}

function loadTaskIntoForm(taskId: string): void {
  const taskData = getTaskDataFromScript(taskId);
  if (!taskData) {
    logWarn(`Task not found: ${taskId}`);
    return;
  }
  if (elements.taskName) elements.taskName.value = taskData.name || '';
  if (elements.estimatedTime) elements.estimatedTime.value = String(taskData.estimated_time || 0);
  if (elements.actualTime) elements.actualTime.value = String(taskData.actual_time || 0);
  if (elements.priority) elements.priority.value = taskData.priority || 'medium';
  if (elements.category) elements.category.value = taskData.category || 'task';
  if (elements.date) elements.date.value = taskData.date || formatDate(new Date());
  if (elements.dueDate) elements.dueDate.value = taskData.due_date || '';
  if (elements.dueTimePeriod) elements.dueTimePeriod.value = taskData.due_time_period || '';
  if (elements.dueHour) elements.dueHour.value = taskData.due_hour ? String(taskData.due_hour) : '';
  if (elements.details) elements.details.value = taskData.details || '';
  loadRecurrenceIntoForm(taskData);
}

function loadRecurrenceIntoForm(taskData: Task): void {
  if (elements.isRecurring) {
    elements.isRecurring.checked = taskData.is_recurring || false;
    if (elements.recurrenceOptions) {
      elements.recurrenceOptions.style.display = taskData.is_recurring ? 'block' : 'none';
    }
  }
  if (elements.recurrencePattern) {
    elements.recurrencePattern.value = taskData.recurrence_pattern || '';
  }
  if (elements.recurrenceEndDate) {
    elements.recurrenceEndDate.value = taskData.recurrence_end_date || '';
  }
}

function getTaskDataFromScript(taskId: string): Task | null {
  const ops = (window as any).HybridTaskOperations;
  if (ops?.findTaskById) {
    return ops.findTaskById(taskId);
  }
  const tasks: Task[] = (window as any).tasks ?? [];
  return tasks.find((t) => t.id === taskId) ?? null;
}

function getFormData(): FormDataType {
  return {
    name: elements.taskName?.value || '',
    estimated_time: parseFloat(elements.estimatedTime?.value || '0'),
    actual_time: parseFloat(elements.actualTime?.value || '0'),
    priority: elements.priority?.value || 'medium',
    category: elements.category?.value || 'task',
    date: elements.date?.value || formatDate(new Date()),
    due_date: elements.dueDate?.value || null,
    due_time_period: elements.dueTimePeriod?.value || null,
    due_hour: elements.dueHour?.value ? parseInt(elements.dueHour.value) : null,
    details: elements.details?.value || '',
    is_recurring: elements.isRecurring?.checked || false,
    recurrence_pattern: elements.recurrencePattern?.value || null,
    recurrence_end_date: elements.recurrenceEndDate?.value || null,
  };
}

function validateFormData(formData: FormDataType): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!formData.name || formData.name.trim().length === 0) {
    errors.push('タスク名を入力してください');
  }
  if (formData.estimated_time <= 0) {
    errors.push('見積もり時間は0より大きい値を入力してください');
  }
  if (formData.actual_time < 0) {
    errors.push('実績時間は0以上の値を入力してください');
  }
  if (formData.estimated_time < formData.actual_time) {
    warnings.push('実績時間が見積もり時間を超えています。よろしいですか？');
  }
  if (formData.is_recurring && !formData.recurrence_pattern) {
    errors.push('繰り返しパターンを選択してください');
  }

  return { isValid: errors.length === 0, errors, warnings };
}

function handleFormSubmit(event: Event): void {
  event.preventDefault();
  const formData = getFormData();
  const validation = validateFormData(formData);

  if (!validation.isValid) {
    logWarn('Form validation failed:', validation.errors);
    alert(validation.errors.join('\n'));
    return;
  }
  if (validation.warnings.length > 0) {
    if (!confirm(validation.warnings.join('\n'))) return;
  }

  if (modalState.mode === 'create') {
    createNewTask(formData);
  } else {
    updateExistingTask(modalState.currentTaskId!, formData);
  }
}

function createNewTask(formData: FormDataType): void {
  const ops = (window as any).HybridTaskOperations;
  if (ops?.createTask && ops.addTask) {
    const newTask = ops.createTask(formData);
    ops.addTask(newTask);
    hideModal();
    logInfo('Task created successfully');
    const w = window as any;
    if (w.loadTasks) { w.tasks = w.loadTasks(); }
    if (w.renderWeek) w.renderWeek();
  } else {
    logInfo('Delegating task creation to existing script.js');
    hideModal();
  }
}

function updateExistingTask(taskId: string, formData: FormDataType): void {
  const ops = (window as any).HybridTaskOperations;
  if (ops?.updateTask) {
    ops.updateTask(taskId, formData);
    hideModal();
    logInfo(`Task updated successfully: ${taskId}`);
    const w = window as any;
    if (w.loadTasks) { w.tasks = w.loadTasks(); }
    if (w.renderWeek) w.renderWeek();
  } else {
    logInfo('Delegating task update to existing script.js');
    hideModal();
  }
}

function handleDuplicateTask(): void {
  if (!modalState.currentTaskId) return;
  const ops = (window as any).HybridTaskOperations;
  if (ops?.duplicateTask) {
    const newTask = ops.duplicateTask(modalState.currentTaskId);
    if (newTask) {
      hideModal();
      logInfo('Task duplicated successfully');
      if ((window as any).renderWeek) (window as any).renderWeek();
    }
  } else {
    logInfo('Delegating task duplication to existing script.js');
  }
}

function handleSaveAsTemplate(): void {
  if (!modalState.currentTaskId) return;
  const ops = (window as any).HybridTaskOperations;
  if (ops?.findTaskById && ops.saveAsTemplate) {
    const task = ops.findTaskById(modalState.currentTaskId);
    if (task) {
      ops.saveAsTemplate(task);
      logInfo('Template saved successfully');
      if ((window as any).toggleTemplatePanel) (window as any).toggleTemplatePanel();
    }
  } else {
    logInfo('Delegating template save to existing script.js');
  }
}

function handleRecurrenceChange(event: Event): void {
  const isChecked = (event.target as HTMLInputElement).checked;
  if (elements.recurrenceOptions) {
    elements.recurrenceOptions.style.display = isChecked ? 'block' : 'none';
  }
}

function handleDueTimePeriodChange(event: Event): void {
  const value = (event.target as HTMLSelectElement).value;
  if (elements.dueHour) {
    elements.dueHour.style.display = value ? 'inline-block' : 'none';
  }
}

function focusFirstInput(): void {
  if (elements.taskName) {
    elements.taskName.focus();
  }
}

function initializeModal(): boolean {
  const success = initializeElements();
  if (!success || !elements.form) return success;

  elements.form.addEventListener('submit', handleFormSubmit);

  if (elements.isRecurring) {
    elements.isRecurring.addEventListener('change', handleRecurrenceChange);
  }
  if (elements.dueTimePeriod) {
    elements.dueTimePeriod.addEventListener('change', handleDueTimePeriodChange);
  }
  if (elements.duplicateBtn) {
    elements.duplicateBtn.addEventListener('click', handleDuplicateTask);
  }
  if (elements.saveAsTemplateBtn) {
    elements.saveAsTemplateBtn.addEventListener('click', handleSaveAsTemplate);
  }
  if (elements.closeModalBtns) {
    elements.closeModalBtns.forEach((btn) => btn.addEventListener('click', hideModal));
  }
  if (elements.modal) {
    elements.modal.addEventListener('click', (event: MouseEvent) => {
      if (event.target === elements.modal) hideModal();
    });
  }
  document.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && modalState.isOpen) hideModal();
  });

  return success;
}

export function getState(): ModalState {
  return { ...modalState };
}

export function isModalOpen(): boolean {
  return modalState.isOpen;
}

export function getMode(): ModalMode {
  return modalState.mode;
}

export {
  openCreateModal,
  openEditModal,
  hideModal as closeModal,
  getFormData,
  validateFormData,
  resetForm,
  initializeModal,
};
