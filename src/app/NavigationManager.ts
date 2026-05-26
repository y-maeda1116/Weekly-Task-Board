import type { Settings } from '../types/storage';
import { getMonday } from '../utils/date';

interface NavDeps {
  getCurrentDate: () => Date;
  setCurrentDate: (d: Date) => void;
  getCategoryFilter: () => string;
  setCategoryFilter: (f: string) => void;
  getSettings: () => Settings;
  saveSettings: () => void;
  renderWeek: () => void;
}

export function createNavigationManager(deps: NavDeps): void {
  const prevWeekBtn = document.getElementById('prev-week');
  const nextWeekBtn = document.getElementById('next-week');
  const todayBtn = document.getElementById('today-btn');
  const datePicker = document.getElementById('date-picker') as HTMLInputElement | null;
  const idealDailyMinutesInput = document.getElementById('ideal-daily-minutes') as HTMLInputElement | null;
  const categoryFilterSelect = document.getElementById('category-filter') as HTMLSelectElement | null;

  prevWeekBtn?.addEventListener('click', () => {
    const newMonday = getMonday(deps.getCurrentDate());
    newMonday.setDate(newMonday.getDate() - 7);
    deps.setCurrentDate(newMonday);
    deps.renderWeek();
  });

  nextWeekBtn?.addEventListener('click', () => {
    const newMonday = getMonday(deps.getCurrentDate());
    newMonday.setDate(newMonday.getDate() + 7);
    deps.setCurrentDate(newMonday);
    deps.renderWeek();
  });

  todayBtn?.addEventListener('click', () => {
    deps.setCurrentDate(new Date());
    deps.renderWeek();
  });

  if (datePicker) {
    datePicker.addEventListener('click', () => {
      datePicker.removeAttribute('readonly');
      if (typeof datePicker.showPicker === 'function') {
        try { datePicker.showPicker(); } catch { datePicker.focus(); }
      } else {
        datePicker.focus();
      }
    });

    datePicker.addEventListener('change', (e) => {
      const value = (e.target as HTMLInputElement).value;
      if (value) {
        deps.setCurrentDate(new Date(value));
        deps.renderWeek();
      }
      setTimeout(() => datePicker.setAttribute('readonly', 'readonly'), 100);
    });

    datePicker.addEventListener('blur', () => {
      setTimeout(() => datePicker.setAttribute('readonly', 'readonly'), 100);
    });
  }

  idealDailyMinutesInput?.addEventListener('change', (e) => {
    deps.getSettings().ideal_daily_minutes = parseInt((e.target as HTMLInputElement).value, 10) || 480;
    deps.saveSettings();
    deps.renderWeek();
  });

  categoryFilterSelect?.addEventListener('change', (e) => {
    deps.setCategoryFilter((e.target as HTMLSelectElement).value);
    updateFilterIndicator(deps.getCategoryFilter());
    deps.renderWeek();
  });
}

function updateFilterIndicator(filter: string): void {
  const filterContainer = document.getElementById('category-filter');
  if (!filterContainer) return;
  if (filter) {
    filterContainer.classList.add('filter-active');
  } else {
    filterContainer.classList.remove('filter-active');
  }
}
