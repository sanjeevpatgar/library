import {
  AcquisitionOrder,
  Book,
  HoldRequest,
  Loan,
  Patron,
} from '../types/library';

export function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const TODAY_ISO = getTodayIso();

export const DEFAULT_BRANCHES: string[] = ['Main Library'];

export const INITIAL_BOOKS: Book[] = [];
export const INITIAL_PATRONS: Patron[] = [];
export const INITIAL_LOANS: Loan[] = [];
export const INITIAL_HOLDS: HoldRequest[] = [];
export const INITIAL_ACQUISITIONS: AcquisitionOrder[] = [];
