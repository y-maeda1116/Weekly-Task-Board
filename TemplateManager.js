(function() {
    'use strict';

    const TEMPLATES_STORAGE_KEY = 'weekly-task-board.templates';

    /**
     * Load templates from localStorage
     * @returns {object[]}
     */
    function loadTemplates() {
        const templatesJson = localStorage.getItem(TEMPLATES_STORAGE_KEY);
        if (!templatesJson) {
            return [];
        }

        return JSON.parse(templatesJson);
    }

    /**
     * Save templates to localStorage
     * @param {object[]} templates
     */
    function saveTemplates(templates) {
        localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    }

    /**
     * Save current task as a template (10.1)
     * @param {object} task - Task to save as template
     * @param {string} templateName - Name for the template
     * @returns {object} Created template
     */
    function saveTaskAsTemplate(task, templateName) {
        const templates = loadTemplates();

        const template = {
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
                recurrence_end_date: task.recurrence_end_date
            },
            created_date: new Date().toISOString().split('T')[0],
            usage_count: 0
        };

        templates.push(template);
        saveTemplates(templates);

        return template;
    }

    /**
     * Get all templates (10.2)
     * @returns {object[]}
     */
    function getTemplates() {
        return loadTemplates();
    }

    /**
     * Create new task from template (10.3)
     * @param {object} template - Template to use
     * @param {string|null} assignedDate - Optional date to assign
     * @returns {object} New task
     */
    function createTaskFromTemplate(template, assignedDate = null) {
        const newTask = {
            id: 'task-' + Date.now(),
            name: template.base_task.name,
            estimated_time: template.base_task.estimated_time,
            priority: template.base_task.priority,
            category: template.base_task.category,
            completed: false,
            details: template.base_task.details,
            assigned_date: assignedDate,
            is_recurring: template.base_task.is_recurring,
            recurrence_pattern: template.base_task.recurrence_pattern,
            recurrence_end_date: template.base_task.recurrence_end_date
        };

        // Update template usage count
        const templates = loadTemplates();
        const templateIndex = templates.findIndex(t => t.id === template.id);
        if (templateIndex > -1) {
            templates[templateIndex].usage_count++;
            saveTemplates(templates);
        }

        return newTask;
    }

    /**
     * Delete template (10.4)
     * @param {string} templateId - Template ID to delete
     */
    function deleteTemplate(templateId) {
        const templates = loadTemplates();
        const filteredTemplates = templates.filter(t => t.id !== templateId);

        if (filteredTemplates.length < templates.length) {
            saveTemplates(filteredTemplates);
        }
    }

    /**
     * Duplicate a template with a new name
     * @param {object} template - Template to duplicate
     * @param {string} searchTerm - Current search term for re-rendering
     * @param {string} sortBy - Current sort order for re-rendering
     */
    function duplicateTemplate(template, searchTerm = '', sortBy = 'recent') {
        const newTemplateName = prompt('\u65b0\u3057\u3044\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u540d\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044:', template.name + ' (\u30b3\u30d4\u30fc)');

        if (!newTemplateName) return;

        const templates = loadTemplates();

        const newTemplate = {
            id: 'template-' + Date.now(),
            name: newTemplateName,
            description: template.description,
            base_task: { ...template.base_task },
            created_date: new Date().toISOString().split('T')[0],
            usage_count: 0
        };

        templates.push(newTemplate);
        saveTemplates(templates);

        showNotification('\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u300c' + newTemplateName + '\u300d\u3092\u4f5c\u6210\u3057\u307e\u3057\u305f', 'success');
        filterAndRenderTemplates(searchTerm, sortBy);
    }

    /**
     * Initialize template panel event listeners.
     */
    function initializeTemplatePanel() {
        const templateToggleBtn = document.getElementById('template-toggle');
        const templatePanel = document.getElementById('template-panel');
        const closeTemplatePanelBtn = document.getElementById('close-template-panel');
        const saveAsTemplateBtn = document.getElementById('save-as-template-btn');
        const templateSearchInput = document.getElementById('template-search');
        const templateSortSelect = document.getElementById('template-sort');

        if (!templateToggleBtn || !templatePanel) return;

        // Template panel toggle
        templateToggleBtn.addEventListener('click', () => {
            if (templatePanel.style.display === 'none') {
                templatePanel.style.display = 'block';
                renderTemplateList();
            } else {
                templatePanel.style.display = 'none';
            }
        });

        // Close template panel
        if (closeTemplatePanelBtn) {
            closeTemplatePanelBtn.addEventListener('click', () => {
                templatePanel.style.display = 'none';
            });
        }

        // Template search
        if (templateSearchInput) {
            templateSearchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                filterAndRenderTemplates(searchTerm, templateSortSelect ? templateSortSelect.value : 'recent');
            });
        }

        // Template sort
        if (templateSortSelect) {
            templateSortSelect.addEventListener('change', (e) => {
                const searchTerm = templateSearchInput ? templateSearchInput.value.toLowerCase() : '';
                filterAndRenderTemplates(searchTerm, e.target.value);
            });
        }

        // Save as template button
        if (saveAsTemplateBtn) {
            saveAsTemplateBtn.addEventListener('click', () => {
                if (editingTaskId) {
                    const task = tasks.find(t => t.id === editingTaskId);
                    if (task) {
                        const templateName = prompt('\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u540d\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044:', task.name);
                        if (templateName) {
                            saveTaskAsTemplate(task, templateName);
                            showNotification('\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u300c' + templateName + '\u300d\u3092\u4fdd\u5b58\u3057\u307e\u3057\u305f', 'success');
                            closeTaskModal();
                        }
                    }
                }
            });
        }
    }

    /**
     * Render template list in template panel
     */
    function renderTemplateList() {
        filterAndRenderTemplates('', 'recent');
    }

    /**
     * Filter and render templates based on search term and sort order
     * @param {string} searchTerm - Search term to filter templates
     * @param {string} sortBy - Sort order: 'recent', 'name', or 'usage'
     */
    function filterAndRenderTemplates(searchTerm, sortBy) {
        if (searchTerm === undefined) searchTerm = '';
        if (sortBy === undefined) sortBy = 'recent';

        var templateList = document.getElementById('template-list');
        var templateEmpty = document.getElementById('template-empty');

        if (!templateList || !templateEmpty) return;

        var templates = getTemplates();

        // Filter by search term
        if (searchTerm) {
            templates = templates.filter(function(template) {
                return template.name.toLowerCase().includes(searchTerm) ||
                    template.base_task.name.toLowerCase().includes(searchTerm) ||
                    template.base_task.details.toLowerCase().includes(searchTerm);
            });
        }

        // Sort templates
        switch (sortBy) {
            case 'name':
                templates.sort(function(a, b) { return a.name.localeCompare(b.name, 'ja'); });
                break;
            case 'usage':
                templates.sort(function(a, b) { return b.usage_count - a.usage_count; });
                break;
            case 'recent':
            default:
                templates.sort(function(a, b) { return new Date(b.created_date) - new Date(a.created_date); });
                break;
        }

        if (templates.length === 0) {
            templateList.textContent = '';
            templateEmpty.style.display = 'block';
            return;
        }

        templateEmpty.style.display = 'none';
        templateList.textContent = '';

        templates.forEach(function(template) {
            var templateItem = document.createElement('div');
            templateItem.className = 'template-item';

            var categoryInfo = getCategoryInfo(template.base_task.category);

            var priorityLabels = { 'high': '\u9ad8', 'medium': '\u4e2d', 'low': '\u4f4e' };
            var priorityLabel = priorityLabels[template.base_task.priority] || '\u4e2d';

            // Header
            var headerDiv = document.createElement('div');
            headerDiv.className = 'template-item-header';

            var titleDiv = document.createElement('div');
            titleDiv.className = 'template-item-title';
            titleDiv.textContent = template.name;

            var actionsDiv = document.createElement('div');
            actionsDiv.className = 'template-item-actions';

            var useBtn = document.createElement('button');
            useBtn.className = 'template-use-btn';
            useBtn.dataset.templateId = template.id;
            useBtn.title = '\u3053\u306e\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u304b\u3089\u65b0\u898f\u30bf\u30b9\u30af\u3092\u4f5c\u6210';
            useBtn.setAttribute('aria-label', '\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u3092\u4f7f\u7528');
            useBtn.textContent = '\u4f7f\u7528';

            var dupBtn = document.createElement('button');
            dupBtn.className = 'template-duplicate-btn';
            dupBtn.dataset.templateId = template.id;
            dupBtn.title = '\u3053\u306e\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u3092\u8907\u88fd';
            dupBtn.setAttribute('aria-label', '\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u3092\u8907\u88fd');
            dupBtn.textContent = '\u8907\u88fd';

            var delBtn = document.createElement('button');
            delBtn.className = 'template-delete-btn';
            delBtn.dataset.templateId = template.id;
            delBtn.title = '\u3053\u306e\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u3092\u524a\u9664';
            delBtn.setAttribute('aria-label', '\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u3092\u524a\u9664');
            delBtn.textContent = '\u524a\u9664';

            actionsDiv.appendChild(useBtn);
            actionsDiv.appendChild(dupBtn);
            actionsDiv.appendChild(delBtn);

            headerDiv.appendChild(titleDiv);
            headerDiv.appendChild(actionsDiv);

            // Content
            var contentDiv = document.createElement('div');
            contentDiv.className = 'template-item-content';

            var taskNameDiv = document.createElement('div');
            taskNameDiv.className = 'template-item-task-name';
            taskNameDiv.textContent = template.base_task.name;
            contentDiv.appendChild(taskNameDiv);

            // Meta
            var metaDiv = document.createElement('div');
            metaDiv.className = 'template-item-meta';

            var catSpan = document.createElement('span');
            catSpan.className = 'template-item-category';
            catSpan.style.backgroundColor = categoryInfo.bgColor;
            catSpan.style.color = categoryInfo.color;
            catSpan.textContent = categoryInfo.name;
            metaDiv.appendChild(catSpan);

            var timeSpan = document.createElement('span');
            timeSpan.className = 'template-item-time';
            timeSpan.textContent = '\u898b\u7a4d: ' + template.base_task.estimated_time + 'h';
            metaDiv.appendChild(timeSpan);

            var prioSpan = document.createElement('span');
            prioSpan.className = 'template-item-priority priority-' + template.base_task.priority;
            prioSpan.textContent = '\u512a\u5148\u5ea6: ' + priorityLabel;
            metaDiv.appendChild(prioSpan);

            contentDiv.appendChild(metaDiv);

            if (template.base_task.details) {
                var descDiv = document.createElement('div');
                descDiv.className = 'template-item-description';
                descDiv.textContent = template.base_task.details;
                contentDiv.appendChild(descDiv);
            }

            // Footer
            var footerDiv = document.createElement('div');
            footerDiv.className = 'template-item-footer';

            var createdSpan = document.createElement('span');
            createdSpan.className = 'template-item-created';
            createdSpan.textContent = '\u4f5c\u6210: ' + template.created_date;
            footerDiv.appendChild(createdSpan);

            var usageSpan = document.createElement('span');
            usageSpan.className = 'template-item-usage';
            usageSpan.textContent = '\u4f7f\u7528\u56de\u6570: ' + template.usage_count;
            footerDiv.appendChild(usageSpan);

            contentDiv.appendChild(footerDiv);

            templateItem.appendChild(headerDiv);
            templateItem.appendChild(contentDiv);
            templateList.appendChild(templateItem);

            // Add event listeners for template actions
            useBtn.addEventListener('click', function(e) {
                var tid = e.target.dataset.templateId;
                var tmpl = templates.find(function(t) { return t.id === tid; });
                if (tmpl) {
                    createAndAddTaskFromTemplate(tmpl);
                }
            });

            dupBtn.addEventListener('click', function(e) {
                var tid = e.target.dataset.templateId;
                var tmpl = templates.find(function(t) { return t.id === tid; });
                if (tmpl) {
                    duplicateTemplate(tmpl, searchTerm, sortBy);
                }
            });

            delBtn.addEventListener('click', function(e) {
                var tid = e.target.dataset.templateId;
                if (confirm('\u3053\u306e\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u3092\u524a\u9664\u3057\u3066\u3082\u3088\u308d\u3057\u3044\u3067\u3059\u304b\uff1f')) {
                    deleteTemplate(tid);
                    filterAndRenderTemplates(searchTerm, sortBy);
                }
            });
        });
    }

    /**
     * Create and add task from template
     * @param {object} template
     */
    function createAndAddTaskFromTemplate(template) {
        var newTask = createTaskFromTemplate(template);
        tasks.push(newTask);
        saveTasks();
        renderWeek();
        updateDashboard();

        // Close template panel
        var templatePanel = document.getElementById('template-panel');
        if (templatePanel) {
            templatePanel.style.display = 'none';
        }

        // Show notification
        showNotification('\u30c6\u30f3\u30d7\u30ec\u30fc\u30c8\u300c' + template.name + '\u300d\u304b\u3089\u65b0\u898f\u30bf\u30b9\u30af\u3092\u4f5c\u6210\u3057\u307e\u3057\u305f', 'success');
    }

    // Export via window
    window.TemplateManager = {
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
        createAndAddTaskFromTemplate
    };

})();
