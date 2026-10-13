import { Injectable, signal } from '@angular/core';

export interface ThemeOption {
  id: string;
  name: string;
  tamilName: string;
  colorHex: string;
  badgeHex: string;
}

export const AVAILABLE_THEMES: ThemeOption[] = [
  {
    id: 'orange',
    name: 'Arivom Saffron / Orange',
    tamilName: 'அறிவோம் ஆரஞ்சு',
    colorHex: '#EA580C',
    badgeHex: '#FF6B00'
  },
  {
    id: 'emerald',
    name: 'Temple Forest Emerald',
    tamilName: 'கோவில் மரகதம்',
    colorHex: '#0B3C2D',
    badgeHex: '#059669'
  },
  {
    id: 'indigo',
    name: 'Royal Heritage Indigo',
    tamilName: 'ராஜ நீலம்',
    colorHex: '#2563EB',
    badgeHex: '#3B82F6'
  },
  {
    id: 'gold',
    name: 'Divine Temple Gold',
    tamilName: 'தெய்வீக தங்கம்',
    colorHex: '#D97706',
    badgeHex: '#F59E0B'
  }
];

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  currentTheme = signal<string>('orange'); // Default: Arivom Tech vibrant saffron/orange
  isCollapsed = signal<boolean>(false);

  constructor() {
    // 1. Initialize Theme from localStorage (default to 'orange')
    const savedTheme = typeof localStorage !== 'undefined' ? localStorage.getItem('oor_theme') : null;
    const initialTheme = savedTheme && AVAILABLE_THEMES.some(t => t.id === savedTheme) ? savedTheme : 'orange';
    this.setTheme(initialTheme);

    // 2. Initialize Sidebar Collapse state from localStorage
    const savedCollapse = typeof localStorage !== 'undefined' ? localStorage.getItem('sidebar_collapsed') === 'true' : false;
    this.isCollapsed.set(savedCollapse);
    this.applyCollapseClass(savedCollapse);
  }

  setTheme(themeId: string) {
    this.currentTheme.set(themeId);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('oor_theme', themeId);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', themeId);
    }
  }

  toggleCollapse() {
    const next = !this.isCollapsed();
    this.isCollapsed.set(next);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sidebar_collapsed', next ? 'true' : 'false');
    }
    this.applyCollapseClass(next);
  }

  private applyCollapseClass(collapsed: boolean) {
    if (typeof document !== 'undefined') {
      if (collapsed) {
        document.body.classList.add('sidebar-collapsed');
      } else {
        document.body.classList.remove('sidebar-collapsed');
      }
    }
  }
}
