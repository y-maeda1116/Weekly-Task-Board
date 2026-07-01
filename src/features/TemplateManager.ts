import type { Task } from '../types';
import type { TaskPriority, TaskCategory, RecurrencePattern } from '../types/task';
import { StorageKeys } from '../types/storage';
import { getCategoryInfo, validateCategory } from '../app/taskStorage';
import { showNotification } from '../app/notifications';

interface TemplateBaseTask {
  name: string;
  estimated_time: number;
  priority: TaskPriority;
  category: TaskCategory;
  details: string;
  is_recurring: boolean;
  recurrence_pattern: RecurrencePattern;
  recurrence_end_date: string | null;
}

interface TaskTemplateItem {
  id: string;
  name: string;
  description: string;
  base_task: TemplateBaseTask;
  created_date: string;
  usage_count: number;
}

type SortOption = 'recent' | 'name' | 'usage';

const PRIORITY_LABELS: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

function loadTemplates(): TaskTemplateItem[] {
  const raw = localStorage.getItem(StorageKeys.TEMPLATES);
  if (!raw) return [];
  return JSON.parse(raw) as TaskTemplateItem[];
}

function saveTemplates(templates: TaskTemplateItem[]): void {
  localStorage.setItem(StorageKeys.TEMPLATES, JSON.stringify(templates));
}

function saveTaskAsTemplate(task: Task, templateName: string): TaskTemplateItem {
  const templates = loadTemplates();

  const template: TaskTemplateItem = {
    id: 'template-' + Date.now(),
    name: templateName,
    description: '',
    base_task: {
      name: task.name,
      estimated_time: task.estimated_time,
      priority: task.priority,
      category: task.category,
      details: task.details,
      is_recurring: task.is_recurring,
      recurrence_pattern: task.recurrence_pattern,
      recurrence_end_date: task.recurrence_end_date,
    },
    created_date: new Date().toISOString().slice(0, 10),
    usage_count: 0,
  };

  saveTemplates([...templates, template]);
  return template;
}

function getTemplates(): TaskTemplateItem[] {
  return loadTemplates();
}

function createTaskFromTemplate(
  template: TaskTemplateItem,
  assignedDate: string | null = null,
): Task {
  const newTask: Task = {
    id: 'task-' + Date.now(),
    name: template.base_task.name,
    estimated_time: template.base_task.estimated_time,
    actual_time: 0,
    priority: template.base_task.priority,
    category: validateCategory(template.base_task.category),
    completed: false,
    date: assignedDate ?? '',
    assigned_date: assignedDate,
    due_date: null,
    details: template.base_task.details,
    is_recurring: template.base_task.is_recurring,
    recurrence_pattern: template.base_task.recurrence_pattern,
    recurrence_end_date: template.base_task.recurrence_end_date,
  };

  const templates = loadTemplates();
  const updated = templates.map(t =>
    t.id === template.id ? { ...t, usage_count: t.usage_count + 1 } : t,
  );
  saveTemplates(updated);

  return newTask;
}

function deleteTemplate(templateId: string): void {
  const templates = loadTemplates();
  const filtered = templates.filter(t => t.id !== templateId);
  if (filtered.length < templates.length) {
    saveTemplates(filtered);
  }
}

function duplicateTemplate(
  template: TaskTemplateItem,
  searchTerm: string = '',
  sortBy: SortOption = 'recent',
): void {
  const newName = prompt('新しいテンプレート名を入力してください:', template.name + ' (コピー)');
  if (!newName) return;

  const templates = loadTemplates();

  const newTemplate: TaskTemplateItem = {
    id: 'template-' + Date.now(),
    name: newName,
    description: template.description,
    base_task: { ...template.base_task },
    created_date: new Date().toISOString().slice(0, 10),
    usage_count: 0,
  };

  saveTemplates([...templates, newTemplate]);
  showNotification('テンプレート「' + newName + '」を作成しました', 'success');
  filterAndRenderTemplates(searchTerm, sortBy);
}

function getFilteredTemplates(
  templates: TaskTemplateItem[],
  searchTerm: string,
): TaskTemplateItem[] {
  if (!searchTerm) return templates;
  return templates.filter(t =>
    t.name.toLowerCase().includes(searchTerm) ||
    t.base_task.name.toLowerCase().includes(searchTerm) ||
    t.base_task.details.toLowerCase().includes(searchTerm),
  );
}

function sortTemplates(
  templates: TaskTemplateItem[],
  sortBy: SortOption,
): TaskTemplateItem[] {
  const sorted = [...templates];
  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    case 'usage':
      return sorted.sort((a, b) => b.usage_count - a.usage_count);
    case 'recent':
    default:
      return sorted.sort(
        (a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime(),
      );
  }
}

function createTemplateHeader(
  template: TaskTemplateItem,
  searchTerm: string,
  sortBy: SortOption,
): HTMLElement {
  const headerDiv = document.createElement('div');
  headerDiv.className = 'template-item-header';

  const titleDiv = document.createElement('div');
  titleDiv.className = 'template-item-title';
  titleDiv.textContent = template.name;

  const actionsDiv = document.createElement('div');
  actionsDiv.className = 'template-item-actions';

  actionsDiv.appendChild(createActionBtn(
    'template-use-btn', template.id,
    'このテンプレートから新規タスクを作成', 'テンプレートを使用', '使用',
    () => handleUseTemplate(template),
  ));
  actionsDiv.appendChild(createActionBtn(
    'template-duplicate-btn', template.id,
    'このテンプレートを複製', 'テンプレートを複製', '複製',
    () => duplicateTemplate(template, searchTerm, sortBy),
  ));
  actionsDiv.appendChild(createActionBtn(
    'template-delete-btn', template.id,
    'このテンプレートを削除', 'テンプレートを削除', '削除',
    () => handleDeleteTemplate(template.id, searchTerm, sortBy),
  ));

  headerDiv.appendChild(titleDiv);
  headerDiv.appendChild(actionsDiv);
  return headerDiv;
}

function createActionBtn(
  className: string,
  templateId: string,
  title: string,
  ariaLabel: string,
  text: string,
  onClick: () => void,
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = className;
  btn.dataset.templateId = templateId;
  btn.title = title;
  btn.setAttribute('aria-label', ariaLabel);
  btn.textContent = text;
  btn.addEventListener('click', onClick);
  return btn;
}

function createTemplateContent(template: TaskTemplateItem): HTMLElement {
  const contentDiv = document.createElement('div');
  contentDiv.className = 'template-item-content';

  const taskNameDiv = document.createElement('div');
  taskNameDiv.className = 'template-item-task-name';
  taskNameDiv.textContent = template.base_task.name;
  contentDiv.appendChild(taskNameDiv);

  contentDiv.appendChild(createTemplateMeta(template));

  if (template.base_task.details) {
    const descDiv = document.createElement('div');
    descDiv.className = 'template-item-description';
    descDiv.textContent = template.base_task.details;
    contentDiv.appendChild(descDiv);
  }

  contentDiv.appendChild(createTemplateFooter(template));
  return contentDiv;
}

function createTemplateMeta(template: TaskTemplateItem): HTMLElement {
  const metaDiv = document.createElement('div');
  metaDiv.className = 'template-item-meta';

  const categoryInfo = getCategoryInfo(template.base_task.category);

  const catSpan = document.createElement('span');
  catSpan.className = 'template-item-category';
  catSpan.style.backgroundColor = categoryInfo.bgColor;
  catSpan.style.color = categoryInfo.color;
  catSpan.textContent = categoryInfo.name;
  metaDiv.appendChild(catSpan);

  const timeSpan = document.createElement('span');
  timeSpan.className = 'template-item-time';
  timeSpan.textContent = '見積: ' + template.base_task.estimated_time + 'h';
  metaDiv.appendChild(timeSpan);

  const prioSpan = document.createElement('span');
  prioSpan.className = 'template-item-priority priority-' + template.base_task.priority;
  prioSpan.textContent = '優先度: ' + (PRIORITY_LABELS[template.base_task.priority] || '中');
  metaDiv.appendChild(prioSpan);

  return metaDiv;
}

function createTemplateFooter(template: TaskTemplateItem): HTMLElement {
  const footerDiv = document.createElement('div');
  footerDiv.className = 'template-item-footer';

  const createdSpan = document.createElement('span');
  createdSpan.className = 'template-item-created';
  createdSpan.textContent = '作成: ' + template.created_date;
  footerDiv.appendChild(createdSpan);

  const usageSpan = document.createElement('span');
  usageSpan.className = 'template-item-usage';
  usageSpan.textContent = '使用回数: ' + template.usage_count;
  footerDiv.appendChild(usageSpan);

  return footerDiv;
}

function handleUseTemplate(template: TaskTemplateItem): void {
  const w = window as any;
  const newTask = createTaskFromTemplate(template);
  if (Array.isArray(w.tasks)) {
    w.tasks.push(newTask);
  }
  if (typeof w.saveTasks === 'function') w.saveTasks();
  if (typeof w.renderWeek === 'function') w.renderWeek();
  if (typeof w.updateDashboard === 'function') w.updateDashboard();

  const templatePanel = document.getElementById('template-panel');
  if (templatePanel) {
    templatePanel.style.display = 'none';
  }

  showNotification('テンプレート「' + template.name + '」から新規タスクを作成しました', 'success');
}

function handleDeleteTemplate(
  templateId: string,
  searchTerm: string,
  sortBy: SortOption,
): void {
  if (confirm('このテンプレートを削除してもよろしいですか？')) {
    deleteTemplate(templateId);
    filterAndRenderTemplates(searchTerm, sortBy);
  }
}

function filterAndRenderTemplates(
  searchTerm: string = '',
  sortBy: SortOption = 'recent',
): void {
  const templateList = document.getElementById('template-list');
  const templateEmpty = document.getElementById('template-empty');

  if (!templateList || !templateEmpty) return;

  const templates = sortTemplates(
    getFilteredTemplates(getTemplates(), searchTerm),
    sortBy,
  );

  if (templates.length === 0) {
    templateList.textContent = '';
    templateEmpty.style.display = 'block';
    return;
  }

  templateEmpty.style.display = 'none';
  templateList.textContent = '';

  for (const template of templates) {
    const item = document.createElement('div');
    item.className = 'template-item';
    item.appendChild(createTemplateHeader(template, searchTerm, sortBy));
    item.appendChild(createTemplateContent(template));
    templateList.appendChild(item);
  }
}

function renderTemplateList(): void {
  filterAndRenderTemplates('', 'recent');
}

function handleSaveAsTemplateClick(): void {
  const w = window as any;
  const editingTaskId: string | null = w.editingTaskId ?? null;
  if (!editingTaskId) return;

  const tasks: Task[] = w.tasks ?? [];
  const task = tasks.find(t => t.id === editingTaskId);
  if (!task) return;

  const templateName = prompt('テンプレート名を入力してください:', task.name);
  if (!templateName) return;

  saveTaskAsTemplate(task, templateName);
  showNotification('テンプレート「' + templateName + '」を保存しました', 'success');
  if (typeof w.closeTaskModal === 'function') w.closeTaskModal();
}

function initializeTemplatePanel(): void {
  const templateToggleBtn = document.getElementById('template-toggle');
  const templatePanel = document.getElementById('template-panel');
  const closeTemplatePanelBtn = document.getElementById('close-template-panel');
  const saveAsTemplateBtn = document.getElementById('save-as-template-btn');
  const templateSearchInput = document.getElementById('template-search') as HTMLInputElement | null;
  const templateSortSelect = document.getElementById('template-sort') as HTMLSelectElement | null;

  if (!templateToggleBtn || !templatePanel) return;

  templateToggleBtn.addEventListener('click', () => {
    if (templatePanel.style.display === 'none') {
      templatePanel.style.display = 'block';
      renderTemplateList();
    } else {
      templatePanel.style.display = 'none';
    }
  });

  if (closeTemplatePanelBtn) {
    closeTemplatePanelBtn.addEventListener('click', () => {
      templatePanel.style.display = 'none';
    });
  }

  if (templateSearchInput) {
    templateSearchInput.addEventListener('input', (e: Event) => {
      const term = (e.target as HTMLInputElement).value.toLowerCase();
      const sort = templateSortSelect ? templateSortSelect.value as SortOption : 'recent';
      filterAndRenderTemplates(term, sort);
    });
  }

  if (templateSortSelect) {
    templateSortSelect.addEventListener('change', (e: Event) => {
      const term = templateSearchInput ? templateSearchInput.value.toLowerCase() : '';
      filterAndRenderTemplates(term, (e.target as HTMLSelectElement).value as SortOption);
    });
  }

  if (saveAsTemplateBtn) {
    saveAsTemplateBtn.addEventListener('click', handleSaveAsTemplateClick);
  }
}

export {
  loadTemplates,
  saveTemplates,
  saveTaskAsTemplate,
  getTemplates,
  createTaskFromTemplate,
  deleteTemplate,
  duplicateTemplate,
  initializeTemplatePanel,
  renderTemplateList,
  filterAndRenderTemplates,
  handleUseTemplate as createAndAddTaskFromTemplate,
};
