export interface CalendarEvent {
  id: string;
  name: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate?: string; // ISO date string (YYYY-MM-DD)
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  location?: string;
  description?: string;
  type: 'tournament' | 'practice' | 'league' | 'other';
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
}

export interface CalendarWeek {
  days: CalendarDay[];
}

export type CalendarViewMode = 'month' | 'week' | 'day';
