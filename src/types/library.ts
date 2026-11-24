export type NavSection =
  | 'overview'
  | 'catalog'
  | 'circulation'
  | 'patrons'
  | 'holds'
  | 'reports';

export type CopyStatus = 'Available' | 'Checked Out' | 'Reserved' | 'Overdue' | 'Processing';

export type CoverMotif = 'geometric' | 'monograph' | 'archival' | 'grid' | 'typographic' | 'botanical';

export const BOOK_CATEGORIES = [
  'Computer Science',
  'Architecture & Design',
  'Economics & Policy',
  'History & Archives',
  'Natural Sciences',
  'Literature',
  'Law & Governance',
  'Arts & Humanities',
  'Reference & General',
] as const;

export type BookCategory = (typeof BOOK_CATEGORIES)[number] | string;

export interface BookCopy {
  barcode: string;
  branch: string;
  shelfLocation: string;
  status: CopyStatus;
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  isbn: string;
  callNumber: string;
  category: BookCategory;
  publisher: string;
  year: number;
  pages: number;
  format: 'Hardcover' | 'Paperback' | 'Reference' | 'Folio' | 'Digital / Media';
  language: string;
  description: string;
  coverTone: 'indigo' | 'slate' | 'burgundy' | 'forest' | 'ochre' | 'obsidian';
  coverMotif: CoverMotif;
  copies: BookCopy[];
  totalCheckouts: number;
}

export type PatronType = 'Student' | 'Graduate' | 'Faculty' | 'Staff' | 'Member';
export type PatronStanding = 'Good Standing' | 'Fines Due' | 'Suspended';

export interface Patron {
  id: string;
  cardNumber: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  type: PatronType;
  standing: PatronStanding;
  finesOwed: number;
  memberSince: string;
  maxLoans: number;
  notes?: string;
}

export type LoanStatus = 'Active' | 'Due Today' | 'Overdue' | 'Returned';

export interface Loan {
  id: string;
  bookId: string;
  barcode: string;
  patronId: string;
  checkoutDate: string;
  dueDate: string;
  returnedDate?: string;
  renewals: number;
  status: LoanStatus;
  branch: string;
}

export type HoldStatus = 'Waiting' | 'Ready for Pickup' | 'In Transit' | 'Fulfilled' | 'Cancelled';

export interface HoldRequest {
  id: string;
  bookId: string;
  patronId: string;
  requestedDate: string;
  pickupBranch: string;
  expiryDate?: string;
  queuePosition: number;
  status: HoldStatus;
  notes?: string;
}

export type AcquisitionStatus = 'Ordered' | 'In Processing' | 'Cataloged';

export interface AcquisitionOrder {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: BookCategory;
  vendor: string;
  unitCost: number;
  quantity: number;
  orderedDate: string;
  expectedDate: string;
  targetBranch: string;
  status: AcquisitionStatus;
}
