import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CalendarEvent } from '../../models/calendar-event.model';

@Injectable({
  providedIn: 'root',
})
export class CalendarService {
  private readonly STORAGE_KEY = 'calendar_events';
  private eventsSubject = new BehaviorSubject<CalendarEvent[]>([]);
  public events$: Observable<CalendarEvent[]> = this.eventsSubject.asObservable();

  constructor() {
    this.loadEvents();
  }

  private loadEvents(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const events = JSON.parse(stored);
        this.eventsSubject.next(events);
      }
    } catch (error) {
      console.error('Error loading calendar events:', error);
    }
  }

  private saveEvents(events: CalendarEvent[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(events));
      this.eventsSubject.next(events);
    } catch (error) {
      console.error('Error saving calendar events:', error);
    }
  }

  getEvents(): CalendarEvent[] {
    return this.eventsSubject.value;
  }

  getEventsForDate(date: string): CalendarEvent[] {
    return this.getEvents().filter((event) => event.startDate === date);
  }

  getEventsForDateRange(startDate: string, endDate: string): CalendarEvent[] {
    return this.getEvents().filter((event) => event.startDate >= startDate && event.endDate! <= endDate);
  }

  addEvent(event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): CalendarEvent {
    const now = new Date().toISOString();
    const newEvent: CalendarEvent = {
      ...event,
      id: this.generateId(),
      createdAt: now,
      updatedAt: now,
    };

    const events = [...this.getEvents(), newEvent];
    this.saveEvents(events);
    return newEvent;
  }

  updateEvent(id: string, updates: Partial<CalendarEvent>): boolean {
    const events = this.getEvents();
    const eventIndex = events.findIndex((e) => e.id === id);

    if (eventIndex === -1) {
      return false;
    }

    events[eventIndex] = {
      ...events[eventIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.saveEvents(events);
    return true;
  }

  deleteEvent(id: string): boolean {
    const events = this.getEvents();
    const filteredEvents = events.filter((e) => e.id !== id);

    if (filteredEvents.length === events.length) {
      return false;
    }

    this.saveEvents(filteredEvents);
    return true;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  getEventTypeColor(type: CalendarEvent['type']): string {
    const colors: Record<CalendarEvent['type'], string> = {
      tournament: '#ff6b6b',
      practice: '#4ecdc4',
      league: '#45b7d1',
      other: '#96ceb4',
    };
    return colors[type] || colors.other;
  }
}
