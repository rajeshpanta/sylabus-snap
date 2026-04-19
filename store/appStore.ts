import { create } from 'zustand';
import { differenceInDays } from 'date-fns';
import type { Semester } from '@/types/database';

interface AppState {
  selectedSemesterId: string | null;
  setSelectedSemester: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedSemesterId: null,
  setSelectedSemester: (id) => set({ selectedSemesterId: id }),
}));

const GRADE_CHECK_WINDOW = 60; // days after semester ends where student may still check grades

/**
 * Find the best semester to auto-select based on today's date.
 *
 * Priority:
 * 1. Exact match — today is between start_date and end_date
 * 2. Nearest by date proximity — with preference for recently-ended
 *    semester over distant future semester (grade checking window)
 * 3. Semesters without dates — most recently created (last resort)
 */
export function findCurrentSemester(semesters: Semester[]): string | null {
  if (semesters.length === 0) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Exact match: today is within a semester's date range
  for (const s of semesters) {
    if (s.start_date && s.end_date) {
      const start = new Date(s.start_date + 'T00:00:00');
      const end = new Date(s.end_date + 'T00:00:00');
      if (today >= start && today <= end) return s.id;
    }
    // If only start_date and no end_date, treat as possibly current
    if (s.start_date && !s.end_date) {
      const start = new Date(s.start_date + 'T00:00:00');
      if (today >= start) return s.id;
    }
  }

  // 2. No exact match — find nearest by date proximity
  const withDates = semesters.filter((s) => s.start_date || s.end_date);

  if (withDates.length > 0) {
    // Categorize semesters
    const past: { semester: Semester; daysAgo: number }[] = [];
    const future: { semester: Semester; daysUntil: number }[] = [];

    for (const s of withDates) {
      if (s.end_date) {
        const end = new Date(s.end_date + 'T00:00:00');
        if (end < today) {
          past.push({ semester: s, daysAgo: differenceInDays(today, end) });
        }
      }
      if (s.start_date) {
        const start = new Date(s.start_date + 'T00:00:00');
        if (start > today) {
          future.push({ semester: s, daysUntil: differenceInDays(start, today) });
        }
      }
    }

    // Sort: most recently ended first, soonest starting first
    past.sort((a, b) => a.daysAgo - b.daysAgo);
    future.sort((a, b) => a.daysUntil - b.daysUntil);

    const nearestPast = past[0] || null;
    const nearestFuture = future[0] || null;

    // No future semester → use most recently ended (checking grades)
    if (!nearestFuture && nearestPast) {
      return nearestPast.semester.id;
    }

    // No past semester → use soonest future (prep mode)
    if (!nearestPast && nearestFuture) {
      return nearestFuture.semester.id;
    }

    // Both exist — decide based on grade checking window
    if (nearestPast && nearestFuture) {
      // If past semester ended within 60 days AND it's closer than the future one
      // → student is likely still checking grades
      if (nearestPast.daysAgo <= GRADE_CHECK_WINDOW && nearestPast.daysAgo <= nearestFuture.daysUntil) {
        return nearestPast.semester.id;
      }
      // Otherwise pick the nearest one by raw distance
      if (nearestPast.daysAgo <= nearestFuture.daysUntil) {
        return nearestPast.semester.id;
      }
      return nearestFuture.semester.id;
    }
  }

  // 3. No semesters have dates — fall back to first (most recently created)
  return semesters[0].id;
}
