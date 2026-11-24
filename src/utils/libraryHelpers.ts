import { getTodayIso } from '../data/seedData';
import { Book, BookCopy, Loan, LoanStatus } from '../types/library';

export function addDaysIso(baseIso: string, days: number): string {
  const [y, m, d] = baseIso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

export function diffDaysIso(fromIso: string, toIso: string): number {
  const [y1, m1, d1] = fromIso.split('-').map(Number);
  const [y2, m2, d2] = toIso.split('-').map(Number);
  const t1 = Date.UTC(y1, m1 - 1, d1);
  const t2 = Date.UTC(y2, m2 - 1, d2);
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

export function formatShortDate(iso: string): string {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function computeLoanStatus(dueDate: string, returnedDate?: string): LoanStatus {
  if (returnedDate) return 'Returned';
  const today = getTodayIso();
  if (dueDate < today) return 'Overdue';
  if (dueDate === today) return 'Due Today';
  return 'Active';
}

export function getBookCopiesForBranch(book: Book, branch: string): BookCopy[] {
  if (branch === 'All Branches') return book.copies;
  return book.copies.filter((c) => c.branch === branch);
}

export function getBookAvailabilitySummary(
  book: Book,
  branch: string
): {
  available: number;
  total: number;
  primaryStatus: 'Available' | 'Checked Out' | 'Reserved' | 'Overdue';
} {
  const copies = getBookCopiesForBranch(book, branch);
  const total = copies.length;
  const available = copies.filter((c) => c.status === 'Available').length;
  if (available > 0) {
    return { available, total, primaryStatus: 'Available' };
  }
  if (copies.some((c) => c.status === 'Overdue')) {
    return { available, total, primaryStatus: 'Overdue' };
  }
  if (copies.some((c) => c.status === 'Reserved')) {
    return { available, total, primaryStatus: 'Reserved' };
  }
  return { available, total, primaryStatus: 'Checked Out' };
}

export function getLoanActiveCountForPatron(loans: Loan[], patronId: string): number {
  return loans.filter((l) => l.patronId === patronId && l.status !== 'Returned').length;
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escapeCell = (val: string | number) => {
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((r) => r.map(escapeCell).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
