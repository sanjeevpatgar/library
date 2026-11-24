import React, { useEffect, useState } from 'react';
import {
  BookmarkPlus,
  Building2,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { getTodayIso } from '../data/seedData';
import {
  BOOK_CATEGORIES,
  Book,
  BookCopy,
  CoverMotif,
  Loan,
  Patron,
  PatronStanding,
  PatronType,
} from '../types/library';
import { addDaysIso } from '../utils/libraryHelpers';
import { BookCoverPlate } from './BookCoverPlate';
import { StatusBadge } from './StatusBadge';

/* -------------------------------------------------------------------------- */
/* Confirm Delete Modal                                                       */
/* -------------------------------------------------------------------------- */
interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Delete',
  onCancel,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1e]/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-md rounded-lg border border-[#c5c5d4] bg-white">
        <div className="flex items-center justify-between border-b border-[#e0e3e5] px-6 py-4">
          <h2 className="text-base font-semibold text-[#191c1e]">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close confirmation"
            className="rounded p-1 text-[#505f76] hover:bg-[#f2f4f6] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm leading-relaxed text-[#454652]">{description}</p>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded border border-[#c5c5d4] bg-white px-4 py-2 text-sm font-medium text-[#191c1e] hover:bg-[#f2f4f6] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded bg-[#ba1a1a] px-4 py-2 text-sm font-medium text-white hover:bg-[#93000a] cursor-pointer"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Book Detail Slide-Over Drawer                                              */
/* -------------------------------------------------------------------------- */
interface BookDetailDrawerProps {
  book: Book | null;
  patrons: Patron[];
  loans: Loan[];
  branches: string[];
  onClose: () => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (book: Book) => void;
  onCheckoutCopy: (
    barcode: string,
    patronId: string,
    checkoutDate: string,
    dueDate: string
  ) => void;
  onPlaceHold: (bookId: string, patronId: string, branch: string) => void;
  onAddCopy: (
    bookId: string,
    branch: string,
    shelfLocation: string,
    customBarcode?: string
  ) => void;
  onUpdateCopy: (
    bookId: string,
    barcode: string,
    updates: Pick<BookCopy, 'branch' | 'shelfLocation'>
  ) => void;
  onDeleteCopy: (bookId: string, barcode: string) => void;
}

export const BookDetailDrawer: React.FC<BookDetailDrawerProps> = ({
  book,
  patrons,
  loans,
  branches,
  onClose,
  onEditBook,
  onDeleteBook,
  onCheckoutCopy,
  onPlaceHold,
  onAddCopy,
  onUpdateCopy,
  onDeleteCopy,
}) => {
  const today = getTodayIso();
  const [selectedBarcode, setSelectedBarcode] = useState<string | null>(null);
  const [patronId, setPatronId] = useState('');
  const [dueDate, setDueDate] = useState(addDaysIso(today, 14));

  const [holdPatronId, setHoldPatronId] = useState('');
  const [holdBranch, setHoldBranch] = useState(branches[0] ?? 'Main Library');

  const [showAddCopy, setShowAddCopy] = useState(false);
  const [newCopyBarcode, setNewCopyBarcode] = useState('');
  const [newCopyBranch, setNewCopyBranch] = useState(branches[0] ?? 'Main Library');
  const [newCopyShelf, setNewCopyShelf] = useState('');

  const [editingCopyBarcode, setEditingCopyBarcode] = useState<string | null>(null);
  const [editCopyBranch, setEditCopyBranch] = useState('');
  const [editCopyShelf, setEditCopyShelf] = useState('');

  useEffect(() => {
    setSelectedBarcode(null);
    setPatronId('');
    setHoldPatronId('');
    setShowAddCopy(false);
    setEditingCopyBarcode(null);
    setNewCopyBarcode('');
    setNewCopyShelf('');
    setHoldBranch(branches[0] ?? 'Main Library');
    setNewCopyBranch(branches[0] ?? 'Main Library');
  }, [book?.id, branches]);

  if (!book) return null;

  const patronMap = new Map(patrons.map((p) => [p.id, p]));

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#191c1e]/35"
      role="dialog"
      aria-modal="true"
      aria-label={`Details for ${book.title}`}
    >
      <div className="flex h-full w-full max-w-xl flex-col border-l border-[#c5c5d4] bg-white">
        <div className="flex items-center justify-between border-b border-[#e0e3e5] px-6 py-4">
          <div>
            <span className="font-mono text-xs text-[#505f76]">
              {book.callNumber || book.isbn || 'Book Details'}
            </span>
            <h2 className="text-lg font-semibold text-[#191c1e]">Book Details</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEditBook(book)}
              className="inline-flex items-center gap-1.5 rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 text-xs font-medium text-[#191c1e] hover:bg-[#f2f4f6] cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => onDeleteBook(book)}
              className="inline-flex items-center gap-1.5 rounded border border-[#f5b7b1] bg-white px-2.5 py-1.5 text-xs font-medium text-[#ba1a1a] hover:bg-[#ffdad6]/50 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close book drawer"
              className="rounded p-1.5 text-[#505f76] hover:bg-[#f2f4f6] hover:text-[#191c1e] cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          {/* Header Block */}
          <div className="flex gap-5">
            <div className="w-32 shrink-0">
              <BookCoverPlate book={book} size="lg" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium text-[#24389c]">{book.category}</div>
              <h3 className="mt-1 text-xl font-semibold leading-snug text-[#191c1e]">
                {book.title}
              </h3>
              {book.subtitle && (
                <p className="mt-1 text-sm text-[#454652]">{book.subtitle}</p>
              )}
              <p className="mt-2 text-sm font-medium text-[#191c1e]">{book.author}</p>
              <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-[#eceef0] pt-3 text-xs text-[#454652]">
                <div>
                  ISBN: <span className="font-mono text-[#191c1e]">{book.isbn || '—'}</span>
                </div>
                <div>
                  Format: <span className="text-[#191c1e]">{book.format}</span>
                </div>
                <div>
                  Publisher: <span className="text-[#191c1e]">{book.publisher || '—'}</span>
                </div>
                <div className="tabular-nums">
                  Year / Pages:{' '}
                  <span className="text-[#191c1e]">
                    {book.year} · {book.pages}p
                  </span>
                </div>
                <div>
                  Language: <span className="text-[#191c1e]">{book.language || 'English'}</span>
                </div>
                <div className="tabular-nums">
                  Total Loans: <span className="font-mono text-[#191c1e]">{book.totalCheckouts}</span>
                </div>
              </div>
            </div>
          </div>

          {book.description && (
            <p className="text-sm leading-relaxed text-[#454652]">{book.description}</p>
          )}

          {/* Physical Copies */}
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[#191c1e]">
                Copies ({book.copies.length})
              </h4>
              <button
                type="button"
                onClick={() => setShowAddCopy((v) => !v)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#24389c] hover:underline cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Copy</span>
              </button>
            </div>

            {showAddCopy && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onAddCopy(
                    book.id,
                    newCopyBranch,
                    newCopyShelf.trim() || 'General Shelf',
                    newCopyBarcode.trim() || undefined
                  );
                  setShowAddCopy(false);
                  setNewCopyBarcode('');
                  setNewCopyShelf('');
                }}
                className="mt-3 grid grid-cols-1 gap-2.5 rounded border border-[#e0e3e5] bg-[#f7f9fb] p-3 sm:grid-cols-12"
              >
                <input
                  type="text"
                  value={newCopyBarcode}
                  onChange={(e) => setNewCopyBarcode(e.target.value)}
                  placeholder="Barcode (auto if blank)"
                  className="rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 font-mono text-xs text-[#191c1e] sm:col-span-4"
                />
                <select
                  value={newCopyBranch}
                  onChange={(e) => setNewCopyBranch(e.target.value)}
                  className="rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 text-xs text-[#191c1e] sm:col-span-3"
                >
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newCopyShelf}
                  onChange={(e) => setNewCopyShelf(e.target.value)}
                  placeholder="Shelf location"
                  className="rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 text-xs text-[#191c1e] sm:col-span-3"
                />
                <button
                  type="submit"
                  className="rounded bg-[#24389c] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1c2c7e] sm:col-span-2 cursor-pointer"
                >
                  Add
                </button>
              </form>
            )}

            {book.copies.length === 0 ? (
              <div className="mt-3 rounded border border-dashed border-[#c5c5d4] bg-[#f7f9fb] p-4 text-center text-xs text-[#505f76]">
                No physical copies added yet. Click &ldquo;Add Copy&rdquo; above to add a copy barcode.
              </div>
            ) : (
              <div className="mt-3 divide-y divide-[#eceef0] rounded-lg border border-[#e0e3e5]">
                {book.copies.map((copy) => {
                  const activeLoan = loans.find(
                    (l) => l.barcode === copy.barcode && l.status !== 'Returned'
                  );
                  const borrower = activeLoan ? patronMap.get(activeLoan.patronId) : null;
                  const isCheckoutOpen = selectedBarcode === copy.barcode;
                  const isEditingCopy = editingCopyBarcode === copy.barcode;

                  return (
                    <div key={copy.barcode} className="p-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-medium text-[#191c1e] tabular-nums">
                              {copy.barcode}
                            </span>
                            <StatusBadge status={copy.status} compact />
                          </div>
                          <div className="mt-1 text-xs text-[#454652]">
                            {copy.branch} · {copy.shelfLocation}
                          </div>
                          {borrower && activeLoan && (
                            <div className="mt-1 text-xs text-[#505f76] tabular-nums">
                              Borrowed by <strong className="text-[#191c1e]">{borrower.name}</strong>{' '}
                              (Due {activeLoan.dueDate})
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          {copy.status === 'Available' && (
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedBarcode(isCheckoutOpen ? null : copy.barcode)
                              }
                              className="rounded bg-[#24389c] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1c2c7e] cursor-pointer"
                            >
                              {isCheckoutOpen ? 'Cancel' : 'Lend'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (isEditingCopy) {
                                setEditingCopyBarcode(null);
                              } else {
                                setEditingCopyBarcode(copy.barcode);
                                setEditCopyBranch(copy.branch);
                                setEditCopyShelf(copy.shelfLocation);
                              }
                            }}
                            aria-label={`Edit copy ${copy.barcode}`}
                            className="rounded border border-[#c5c5d4] bg-white p-1.5 text-[#505f76] hover:bg-[#f2f4f6] cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCopy(book.id, copy.barcode)}
                            aria-label={`Delete copy ${copy.barcode}`}
                            className="rounded border border-[#c5c5d4] bg-white p-1.5 text-[#505f76] hover:bg-[#ffdad6]/50 hover:text-[#ba1a1a] cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {isEditingCopy && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            onUpdateCopy(book.id, copy.barcode, {
                              branch: editCopyBranch,
                              shelfLocation: editCopyShelf.trim() || 'General Shelf',
                            });
                            setEditingCopyBarcode(null);
                          }}
                          className="mt-3 grid grid-cols-1 gap-2 rounded border border-[#c5c5d4] bg-[#f7f9fb] p-3 sm:grid-cols-12"
                        >
                          <select
                            value={editCopyBranch}
                            onChange={(e) => setEditCopyBranch(e.target.value)}
                            className="rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 text-xs text-[#191c1e] sm:col-span-5"
                          >
                            {branches.map((b) => (
                              <option key={b} value={b}>
                                {b}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={editCopyShelf}
                            onChange={(e) => setEditCopyShelf(e.target.value)}
                            placeholder="Shelf location"
                            className="rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 text-xs text-[#191c1e] sm:col-span-5"
                          />
                          <button
                            type="submit"
                            className="rounded bg-[#24389c] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1c2c7e] sm:col-span-2 cursor-pointer"
                          >
                            Save
                          </button>
                        </form>
                      )}

                      {isCheckoutOpen && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (!patronId) return;
                            onCheckoutCopy(copy.barcode, patronId, today, dueDate);
                            setSelectedBarcode(null);
                            setPatronId('');
                          }}
                          className="mt-3 grid grid-cols-1 gap-2 rounded border border-[#c5c5d4] bg-[#f7f9fb] p-3 sm:grid-cols-12"
                        >
                          <select
                            value={patronId}
                            onChange={(e) => setPatronId(e.target.value)}
                            className="rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 text-xs text-[#191c1e] sm:col-span-5"
                            required
                          >
                            <option value="">Choose member...</option>
                            {patrons.map((p) => (
                              <option
                                key={p.id}
                                value={p.id}
                                disabled={p.standing === 'Suspended'}
                              >
                                {p.name} ({p.cardNumber})
                              </option>
                            ))}
                          </select>
                          <input
                            type="date"
                            value={dueDate}
                            min={today}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 font-mono text-xs text-[#191c1e] sm:col-span-4"
                            required
                          />
                          <button
                            type="submit"
                            className="rounded bg-[#24389c] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1c2c7e] sm:col-span-3 cursor-pointer"
                          >
                            Confirm
                          </button>
                        </form>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Place Reservation */}
          {patrons.length > 0 && (
            <div className="rounded-lg border border-[#e0e3e5] bg-[#f7f9fb] p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#191c1e]">
                <BookmarkPlus className="h-4 w-4 text-[#24389c]" aria-hidden="true" />
                <span>Reserve This Book</span>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!holdPatronId) return;
                  onPlaceHold(book.id, holdPatronId, holdBranch);
                  setHoldPatronId('');
                }}
                className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-12"
              >
                <select
                  value={holdPatronId}
                  onChange={(e) => setHoldPatronId(e.target.value)}
                  className="rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 text-xs text-[#191c1e] sm:col-span-5"
                  required
                >
                  <option value="">Choose member...</option>
                  {patrons.map((p) => (
                    <option key={p.id} value={p.id} disabled={p.standing === 'Suspended'}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  value={holdBranch}
                  onChange={(e) => setHoldBranch(e.target.value)}
                  className="rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 text-xs text-[#191c1e] sm:col-span-4"
                >
                  {branches.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded border border-[#24389c] bg-white px-3 py-1.5 text-xs font-medium text-[#24389c] hover:bg-[#dee0ff]/40 sm:col-span-3 cursor-pointer"
                >
                  Reserve
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Patron Detail Slide-Over Drawer                                            */
/* -------------------------------------------------------------------------- */
interface PatronDetailDrawerProps {
  patron: Patron | null;
  books: Book[];
  loans: Loan[];
  onClose: () => void;
  onEditMember: (patron: Patron) => void;
  onDeleteMember: (patron: Patron) => void;
  onSettleFines: (patronId: string) => void;
  onToggleSuspend: (patronId: string) => void;
  onReturnLoan: (loanId: string) => void;
  onRenewLoan: (loanId: string) => void;
}

export const PatronDetailDrawer: React.FC<PatronDetailDrawerProps> = ({
  patron,
  books,
  loans,
  onClose,
  onEditMember,
  onDeleteMember,
  onSettleFines,
  onToggleSuspend,
  onReturnLoan,
  onRenewLoan,
}) => {
  if (!patron) return null;

  const bookMap = new Map(books.map((b) => [b.id, b]));
  const patronLoans = loans
    .filter((l) => l.patronId === patron.id)
    .sort((a, b) => b.checkoutDate.localeCompare(a.checkoutDate));

  const activeLoans = patronLoans.filter((l) => l.status !== 'Returned');

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#191c1e]/35"
      role="dialog"
      aria-modal="true"
      aria-label={`Member profile for ${patron.name}`}
    >
      <div className="flex h-full w-full max-w-lg flex-col border-l border-[#c5c5d4] bg-white">
        <div className="flex items-center justify-between border-b border-[#e0e3e5] px-6 py-4">
          <div>
            <span className="font-mono text-xs text-[#505f76] tabular-nums">
              {patron.cardNumber}
            </span>
            <h2 className="text-lg font-semibold text-[#191c1e]">{patron.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEditMember(patron)}
              className="inline-flex items-center gap-1.5 rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 text-xs font-medium text-[#191c1e] hover:bg-[#f2f4f6] cursor-pointer"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => onDeleteMember(patron)}
              className="inline-flex items-center gap-1.5 rounded border border-[#f5b7b1] bg-white px-2.5 py-1.5 text-xs font-medium text-[#ba1a1a] hover:bg-[#ffdad6]/50 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close member drawer"
              className="rounded p-1.5 text-[#505f76] hover:bg-[#f2f4f6] hover:text-[#191c1e] cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="rounded-lg border border-[#e0e3e5] bg-[#f7f9fb] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#454652]">
                {patron.type} · {patron.department}
              </span>
              <StatusBadge status={patron.standing} compact />
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-[#e0e3e5] pt-3 text-xs">
              <div>
                <div className="text-[#505f76]">Email</div>
                <div className="mt-0.5 font-medium text-[#191c1e]">{patron.email}</div>
              </div>
              <div>
                <div className="text-[#505f76]">Phone</div>
                <div className="mt-0.5 font-mono text-[#191c1e]">{patron.phone || '—'}</div>
              </div>
              <div>
                <div className="text-[#505f76]">Member Since</div>
                <div className="mt-0.5 font-mono text-[#191c1e] tabular-nums">
                  {patron.memberSince}
                </div>
              </div>
              <div>
                <div className="text-[#505f76]">Borrow Limit</div>
                <div className="mt-0.5 font-mono font-medium text-[#191c1e] tabular-nums">
                  {activeLoans.length} / {patron.maxLoans} borrowed
                </div>
              </div>
              <div>
                <div className="text-[#505f76]">Fines Owed</div>
                <div
                  className={`mt-0.5 font-mono font-semibold tabular-nums ${
                    patron.finesOwed > 0 ? 'text-[#ba1a1a]' : 'text-[#14532d]'
                  }`}
                >
                  ${patron.finesOwed.toFixed(2)}
                </div>
              </div>
              {patron.notes && (
                <div className="col-span-2">
                  <div className="text-[#505f76]">Notes</div>
                  <div className="mt-0.5 text-[#191c1e]">{patron.notes}</div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-[#e0e3e5] pt-3">
              {patron.finesOwed > 0 && (
                <button
                  type="button"
                  onClick={() => onSettleFines(patron.id)}
                  className="rounded bg-[#24389c] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1c2c7e] cursor-pointer"
                >
                  Clear ${patron.finesOwed.toFixed(2)} Fine
                </button>
              )}
              <button
                type="button"
                onClick={() => onToggleSuspend(patron.id)}
                className="rounded border border-[#c5c5d4] bg-white px-3 py-1.5 text-xs font-medium text-[#191c1e] hover:bg-[#f2f4f6] cursor-pointer"
              >
                {patron.standing === 'Suspended' ? 'Reactivate Card' : 'Suspend Card'}
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#191c1e]">
              Borrowing History ({patronLoans.length})
            </h3>

            {patronLoans.length === 0 ? (
              <p className="mt-2 text-xs text-[#454652]">
                No loans recorded for this member yet.
              </p>
            ) : (
              <div className="mt-3 divide-y divide-[#eceef0] rounded-lg border border-[#e0e3e5]">
                {patronLoans.map((loan) => {
                  const book = bookMap.get(loan.bookId);
                  return (
                    <div key={loan.id} className="p-3.5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium text-[#191c1e]">
                            {book?.title ?? 'Deleted Book'}
                          </div>
                          <div className="font-mono text-[11px] text-[#505f76] tabular-nums">
                            {loan.barcode} · Due {loan.dueDate}
                          </div>
                        </div>
                        <StatusBadge status={loan.status} compact />
                      </div>
                      {loan.status !== 'Returned' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onRenewLoan(loan.id)}
                            className="rounded border border-[#c5c5d4] bg-white px-2.5 py-1 text-xs font-medium text-[#191c1e] hover:bg-[#f2f4f6] cursor-pointer"
                          >
                            Renew
                          </button>
                          <button
                            type="button"
                            onClick={() => onReturnLoan(loan.id)}
                            className="rounded bg-[#24389c] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#1c2c7e] cursor-pointer"
                          >
                            Return
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Add / Edit Book Modal (Full Details)                                       */
/* -------------------------------------------------------------------------- */
interface BookFormModalProps {
  isOpen: boolean;
  editingBook: Book | null;
  branches: string[];
  onClose: () => void;
  onSaveNewBook: (book: Omit<Book, 'id' | 'totalCheckouts'>) => void;
  onSaveEditedBook: (bookId: string, updates: Omit<Book, 'id' | 'totalCheckouts' | 'copies'>) => void;
}

export const BookFormModal: React.FC<BookFormModalProps> = ({
  isOpen,
  editingBook,
  branches,
  onClose,
  onSaveNewBook,
  onSaveEditedBook,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [callNumber, setCallNumber] = useState('');
  const [category, setCategory] = useState<string>(BOOK_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [publisher, setPublisher] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [pages, setPages] = useState('250');
  const [format, setFormat] = useState<Book['format']>('Hardcover');
  const [language, setLanguage] = useState('English');
  const [description, setDescription] = useState('');
  const [coverTone, setCoverTone] = useState<Book['coverTone']>('indigo');
  const [coverMotif, setCoverMotif] = useState<CoverMotif>('monograph');

  // Initial copy fields when creating a new book
  const [copyCount, setCopyCount] = useState('1');
  const [customBarcode, setCustomBarcode] = useState('');
  const [branch, setBranch] = useState(branches[0] ?? 'Main Library');
  const [shelfLocation, setShelfLocation] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingBook) {
      setTitle(editingBook.title);
      setSubtitle(editingBook.subtitle ?? '');
      setAuthor(editingBook.author);
      setIsbn(editingBook.isbn);
      setCallNumber(editingBook.callNumber);
      const isPreset = (BOOK_CATEGORIES as readonly string[]).includes(editingBook.category);
      if (isPreset) {
        setCategory(editingBook.category);
        setCustomCategory('');
      } else {
        setCategory('__custom__');
        setCustomCategory(editingBook.category);
      }
      setPublisher(editingBook.publisher);
      setYear(String(editingBook.year));
      setPages(String(editingBook.pages));
      setFormat(editingBook.format);
      setLanguage(editingBook.language);
      setDescription(editingBook.description);
      setCoverTone(editingBook.coverTone);
      setCoverMotif(editingBook.coverMotif);
    } else {
      setTitle('');
      setSubtitle('');
      setAuthor('');
      setIsbn('');
      setCallNumber('');
      setCategory(BOOK_CATEGORIES[0]);
      setCustomCategory('');
      setPublisher('');
      setYear(String(new Date().getFullYear()));
      setPages('250');
      setFormat('Hardcover');
      setLanguage('English');
      setDescription('');
      setCoverTone('indigo');
      setCoverMotif('monograph');
      setCopyCount('1');
      setCustomBarcode('');
      setBranch(branches[0] ?? 'Main Library');
      setShelfLocation('');
    }
  }, [isOpen, editingBook, branches]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;

    const finalCategory =
      category === '__custom__'
        ? customCategory.trim() || 'General'
        : category;

    const sharedFields = {
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      author: author.trim(),
      isbn: isbn.trim(),
      callNumber: callNumber.trim(),
      category: finalCategory,
      publisher: publisher.trim() || 'Independent',
      year: Number(year) || new Date().getFullYear(),
      pages: Math.max(1, Number(pages) || 100),
      format,
      language: language.trim() || 'English',
      description: description.trim(),
      coverTone,
      coverMotif,
    };

    if (editingBook) {
      onSaveEditedBook(editingBook.id, sharedFields);
    } else {
      const count = Math.min(20, Math.max(1, Number(copyCount) || 1));
      const baseCode = Math.floor(10000 + Math.random() * 89000);
      const copies: BookCopy[] = Array.from({ length: count }, (_, idx) => ({
        barcode:
          idx === 0 && customBarcode.trim()
            ? customBarcode.trim()
            : `BK-${baseCode}-${String.fromCharCode(65 + idx)}`,
        branch,
        shelfLocation: shelfLocation.trim() || 'General Shelf',
        status: 'Available',
      }));
      onSaveNewBook({ ...sharedFields, copies });
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1e]/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={editingBook ? 'Edit book details' : 'Add new book'}
    >
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg border border-[#c5c5d4] bg-white">
        <div className="flex items-center justify-between border-b border-[#e0e3e5] px-6 py-4">
          <h2 className="text-base font-semibold text-[#191c1e]">
            {editingBook ? 'Edit Book Details' : 'Add New Book'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded p-1 text-[#505f76] hover:bg-[#f2f4f6] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="book-title" className="block text-xs font-medium text-[#191c1e]">
                Book Title *
              </label>
              <input
                id="book-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter full title"
                className="mt-1 w-full rounded border border-[#c5c5d4] px-3 py-2 text-sm text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
                required
              />
            </div>
            <div>
              <label htmlFor="book-subtitle" className="block text-xs font-medium text-[#191c1e]">
                Subtitle
              </label>
              <input
                id="book-subtitle"
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="Optional subtitle"
                className="mt-1 w-full rounded border border-[#c5c5d4] px-3 py-2 text-sm text-[#191c1e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="book-author" className="block text-xs font-medium text-[#191c1e]">
                Author(s) *
              </label>
              <input
                id="book-author"
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name"
                className="mt-1 w-full rounded border border-[#c5c5d4] px-3 py-2 text-sm text-[#191c1e]"
                required
              />
            </div>
            <div>
              <label htmlFor="book-isbn" className="block text-xs font-medium text-[#191c1e]">
                ISBN
              </label>
              <input
                id="book-isbn"
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-..."
                className="mt-1 w-full rounded border border-[#c5c5d4] px-3 py-2 font-mono text-xs text-[#191c1e]"
              />
            </div>
            <div>
              <label htmlFor="book-call" className="block text-xs font-medium text-[#191c1e]">
                Call Number / Code
              </label>
              <input
                id="book-call"
                type="text"
                value={callNumber}
                onChange={(e) => setCallNumber(e.target.value)}
                placeholder="e.g. QA76.6"
                className="mt-1 w-full rounded border border-[#c5c5d4] px-3 py-2 font-mono text-xs text-[#191c1e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="book-cat" className="block text-xs font-medium text-[#191c1e]">
                Category
              </label>
              <select
                id="book-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-2.5 py-2 text-sm text-[#191c1e]"
              >
                {BOOK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="__custom__">Custom Category...</option>
              </select>
              {category === '__custom__' && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category"
                  className="mt-2 w-full rounded border border-[#c5c5d4] px-2.5 py-1.5 text-xs text-[#191c1e]"
                  required
                />
              )}
            </div>

            <div>
              <label htmlFor="book-pub" className="block text-xs font-medium text-[#191c1e]">
                Publisher
              </label>
              <input
                id="book-pub"
                type="text"
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="Publisher name"
                className="mt-1 w-full rounded border border-[#c5c5d4] px-3 py-2 text-sm text-[#191c1e]"
              />
            </div>

            <div>
              <label htmlFor="book-lang" className="block text-xs font-medium text-[#191c1e]">
                Language
              </label>
              <input
                id="book-lang"
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="mt-1 w-full rounded border border-[#c5c5d4] px-3 py-2 text-sm text-[#191c1e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label htmlFor="book-year" className="block text-xs font-medium text-[#191c1e]">
                Year
              </label>
              <input
                id="book-year"
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="mt-1 w-full rounded border border-[#c5c5d4] px-2.5 py-1.5 font-mono text-sm tabular-nums text-[#191c1e]"
              />
            </div>
            <div>
              <label htmlFor="book-pages" className="block text-xs font-medium text-[#191c1e]">
                Pages
              </label>
              <input
                id="book-pages"
                type="number"
                value={pages}
                onChange={(e) => setPages(e.target.value)}
                className="mt-1 w-full rounded border border-[#c5c5d4] px-2.5 py-1.5 font-mono text-sm tabular-nums text-[#191c1e]"
              />
            </div>
            <div>
              <label htmlFor="book-format" className="block text-xs font-medium text-[#191c1e]">
                Format
              </label>
              <select
                id="book-format"
                value={format}
                onChange={(e) => setFormat(e.target.value as Book['format'])}
                className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 text-sm text-[#191c1e]"
              >
                <option value="Hardcover">Hardcover</option>
                <option value="Paperback">Paperback</option>
                <option value="Reference">Reference</option>
                <option value="Folio">Folio</option>
                <option value="Digital / Media">Digital / Media</option>
              </select>
            </div>
            <div>
              <label htmlFor="book-tone" className="block text-xs font-medium text-[#191c1e]">
                Cover Color
              </label>
              <select
                id="book-tone"
                value={coverTone}
                onChange={(e) => setCoverTone(e.target.value as Book['coverTone'])}
                className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 text-sm text-[#191c1e]"
              >
                <option value="indigo">Indigo</option>
                <option value="slate">Slate</option>
                <option value="burgundy">Burgundy</option>
                <option value="forest">Forest</option>
                <option value="ochre">Ochre</option>
                <option value="obsidian">Obsidian</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="book-desc" className="block text-xs font-medium text-[#191c1e]">
              Description / Notes
            </label>
            <textarea
              id="book-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary, edition notes, or subject tags..."
              className="mt-1 w-full rounded border border-[#c5c5d4] px-3 py-2 text-sm text-[#191c1e]"
            />
          </div>

          {/* Initial Copies Section (only on create) */}
          {!editingBook && (
            <div className="rounded-lg border border-[#e0e3e5] bg-[#f7f9fb] p-4 space-y-3">
              <div className="text-xs font-semibold text-[#191c1e]">
                Initial Physical Copy Details
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div>
                  <label htmlFor="book-copies" className="block text-xs font-medium text-[#454652]">
                    Copies
                  </label>
                  <input
                    id="book-copies"
                    type="number"
                    min="1"
                    max="20"
                    value={copyCount}
                    onChange={(e) => setCopyCount(e.target.value)}
                    className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 font-mono text-sm tabular-nums text-[#191c1e]"
                  />
                </div>
                <div>
                  <label htmlFor="book-barcode" className="block text-xs font-medium text-[#454652]">
                    Barcode
                  </label>
                  <input
                    id="book-barcode"
                    type="text"
                    value={customBarcode}
                    onChange={(e) => setCustomBarcode(e.target.value)}
                    placeholder="Auto if blank"
                    className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 font-mono text-xs text-[#191c1e]"
                  />
                </div>
                <div>
                  <label htmlFor="book-branch" className="block text-xs font-medium text-[#454652]">
                    Branch
                  </label>
                  <select
                    id="book-branch"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 text-sm text-[#191c1e]"
                  >
                    {branches.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="book-shelf" className="block text-xs font-medium text-[#454652]">
                    Shelf Location
                  </label>
                  <input
                    id="book-shelf"
                    type="text"
                    value={shelfLocation}
                    onChange={(e) => setShelfLocation(e.target.value)}
                    placeholder="e.g. Aisle 2, Shelf B"
                    className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 text-sm text-[#191c1e]"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-[#e0e3e5] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-[#c5c5d4] bg-white px-4 py-2 text-sm font-medium text-[#191c1e] hover:bg-[#f2f4f6] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-[#24389c] px-4 py-2 text-sm font-medium text-white hover:bg-[#1c2c7e] cursor-pointer"
            >
              {editingBook ? 'Save Changes' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Quick Lend Modal                                                           */
/* -------------------------------------------------------------------------- */
interface QuickCheckoutModalProps {
  isOpen: boolean;
  preselectedBook: Book | null;
  books: Book[];
  patrons: Patron[];
  onClose: () => void;
  onConfirmCheckout: (
    barcode: string,
    patronId: string,
    checkoutDate: string,
    dueDate: string
  ) => void;
}

export const QuickCheckoutModal: React.FC<QuickCheckoutModalProps> = ({
  isOpen,
  preselectedBook,
  books,
  patrons,
  onClose,
  onConfirmCheckout,
}) => {
  const today = getTodayIso();
  const [barcode, setBarcode] = useState('');
  const [patronId, setPatronId] = useState('');
  const [checkoutDate, setCheckoutDate] = useState(today);
  const [dueDate, setDueDate] = useState(addDaysIso(today, 14));

  useEffect(() => {
    if (isOpen && preselectedBook) {
      const avail = preselectedBook.copies.find((c) => c.status === 'Available');
      setBarcode(avail?.barcode ?? '');
    } else if (isOpen) {
      setBarcode('');
    }
    setPatronId('');
    setCheckoutDate(today);
    setDueDate(addDaysIso(today, 14));
  }, [isOpen, preselectedBook, today]);

  if (!isOpen) return null;

  const availableCopies = books.flatMap((b) =>
    b.copies
      .filter((c) => c.status === 'Available')
      .map((c) => ({ book: b, copy: c }))
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1e]/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Lend a Book"
    >
      <div className="w-full max-w-md rounded-lg border border-[#c5c5d4] bg-white">
        <div className="flex items-center justify-between border-b border-[#e0e3e5] px-6 py-4">
          <h2 className="text-base font-semibold text-[#191c1e]">
            Lend a Book
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded p-1 text-[#505f76] hover:bg-[#f2f4f6] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!barcode || !patronId) return;
            onConfirmCheckout(barcode, patronId, checkoutDate, dueDate);
            onClose();
          }}
          className="space-y-4 p-6"
        >
          <div>
            <label htmlFor="modal-copy" className="block text-xs font-medium text-[#191c1e]">
              Book Copy
            </label>
            <select
              id="modal-copy"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="mt-1.5 w-full rounded border border-[#c5c5d4] bg-white px-3 py-2 text-sm text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
              required
            >
              <option value="">
                {availableCopies.length === 0
                  ? 'No available copies — add books first'
                  : 'Choose an available book copy...'}
              </option>
              {availableCopies.map(({ book, copy }) => (
                <option key={copy.barcode} value={copy.barcode}>
                  {book.title} ({copy.barcode} · {copy.branch})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="modal-patron" className="block text-xs font-medium text-[#191c1e]">
              Member
            </label>
            <select
              id="modal-patron"
              value={patronId}
              onChange={(e) => setPatronId(e.target.value)}
              className="mt-1.5 w-full rounded border border-[#c5c5d4] bg-white px-3 py-2 text-sm text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
              required
            >
              <option value="">
                {patrons.length === 0 ? 'No members — add a member first' : 'Choose a member...'}
              </option>
              {patrons.map((p) => (
                <option key={p.id} value={p.id} disabled={p.standing === 'Suspended'}>
                  {p.name} ({p.cardNumber}
                  {p.standing === 'Suspended' ? ' · Suspended' : ''})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="modal-borrow-date" className="block text-xs font-medium text-[#191c1e]">
                Borrow Date
              </label>
              <input
                id="modal-borrow-date"
                type="date"
                value={checkoutDate}
                onChange={(e) => setCheckoutDate(e.target.value)}
                className="mt-1.5 w-full rounded border border-[#c5c5d4] bg-white px-3 py-2 font-mono text-xs text-[#191c1e]"
                required
              />
            </div>
            <div>
              <label htmlFor="modal-due-date" className="block text-xs font-medium text-[#191c1e]">
                Due Date
              </label>
              <input
                id="modal-due-date"
                type="date"
                value={dueDate}
                min={checkoutDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5 w-full rounded border border-[#c5c5d4] bg-white px-3 py-2 font-mono text-xs text-[#191c1e]"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#e0e3e5] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-[#c5c5d4] bg-white px-4 py-2 text-sm font-medium text-[#191c1e] hover:bg-[#f2f4f6] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!barcode || !patronId}
              className="rounded bg-[#24389c] px-4 py-2 text-sm font-medium text-white hover:bg-[#1c2c7e] disabled:opacity-50 cursor-pointer"
            >
              Lend Book
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Add / Edit Member Modal (Full Details)                                     */
/* -------------------------------------------------------------------------- */
interface MemberFormModalProps {
  isOpen: boolean;
  editingMember: Patron | null;
  onClose: () => void;
  onSaveNewMember: (patron: Omit<Patron, 'id'>) => void;
  onSaveEditedMember: (patronId: string, updates: Omit<Patron, 'id'>) => void;
}

export const MemberFormModal: React.FC<MemberFormModalProps> = ({
  isOpen,
  editingMember,
  onClose,
  onSaveNewMember,
  onSaveEditedMember,
}) => {
  const today = getTodayIso();
  const [name, setName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [type, setType] = useState<PatronType>('Member');
  const [maxLoans, setMaxLoans] = useState('5');
  const [finesOwed, setFinesOwed] = useState('0.00');
  const [standing, setStanding] = useState<PatronStanding>('Good Standing');
  const [memberSince, setMemberSince] = useState(today);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (editingMember) {
      setName(editingMember.name);
      setCardNumber(editingMember.cardNumber);
      setEmail(editingMember.email);
      setPhone(editingMember.phone ?? '');
      setDepartment(editingMember.department);
      setType(editingMember.type);
      setMaxLoans(String(editingMember.maxLoans));
      setFinesOwed(editingMember.finesOwed.toFixed(2));
      setStanding(editingMember.standing);
      setMemberSince(editingMember.memberSince);
      setNotes(editingMember.notes ?? '');
    } else {
      setName('');
      setCardNumber('');
      setEmail('');
      setPhone('');
      setDepartment('');
      setType('Member');
      setMaxLoans('5');
      setFinesOwed('0.00');
      setStanding('Good Standing');
      setMemberSince(today);
      setNotes('');
    }
  }, [isOpen, editingMember, today]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    const fineNum = Math.max(0, Number(finesOwed) || 0);
    const computedStanding: PatronStanding =
      standing === 'Suspended'
        ? 'Suspended'
        : fineNum > 0
        ? 'Fines Due'
        : 'Good Standing';

    const payload: Omit<Patron, 'id'> = {
      name: name.trim(),
      cardNumber:
        cardNumber.trim() || `MEM-${Math.floor(10000 + Math.random() * 89999)}`,
      email: email.trim(),
      phone: phone.trim() || undefined,
      department: department.trim() || 'General',
      type,
      maxLoans: Math.max(1, Number(maxLoans) || 5),
      finesOwed: fineNum,
      standing: computedStanding,
      memberSince: memberSince || today,
      notes: notes.trim() || undefined,
    };

    if (editingMember) {
      onSaveEditedMember(editingMember.id, payload);
    } else {
      onSaveNewMember(payload);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1e]/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={editingMember ? 'Edit member' : 'Add library member'}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg border border-[#c5c5d4] bg-white">
        <div className="flex items-center justify-between border-b border-[#e0e3e5] px-6 py-4">
          <h2 className="text-base font-semibold text-[#191c1e]">
            {editingMember ? 'Edit Member Details' : 'Add New Member'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded p-1 text-[#505f76] hover:bg-[#f2f4f6] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="pat-name" className="block text-xs font-medium text-[#191c1e]">
                Full Name *
              </label>
              <input
                id="pat-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Member full name"
                className="mt-1 w-full rounded border border-[#c5c5d4] px-3 py-2 text-sm text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
                required
              />
            </div>
            <div>
              <label htmlFor="pat-card" className="block text-xs font-medium text-[#191c1e]">
                Card Number
              </label>
              <input
                id="pat-card"
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                placeholder="Auto-generated if blank"
                className="mt-1 w-full rounded border border-[#c5c5d4] px-3 py-2 font-mono text-xs text-[#191c1e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="pat-email" className="block text-xs font-medium text-[#191c1e]">
                Email *
              </label>
              <input
                id="pat-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="mt-1 w-full rounded border border-[#c5c5d4] px-3 py-2 text-sm text-[#191c1e]"
                required
              />
            </div>
            <div>
              <label htmlFor="pat-phone" className="block text-xs font-medium text-[#191c1e]">
                Phone Number
              </label>
              <input
                id="pat-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional phone"
                className="mt-1 w-full rounded border border-[#c5c5d4] px-3 py-2 font-mono text-xs text-[#191c1e]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="pat-dept" className="block text-xs font-medium text-[#191c1e]">
                Department / Group
              </label>
              <input
                id="pat-dept"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Science, Grade 10, Public"
                className="mt-1 w-full rounded border border-[#c5c5d4] px-3 py-2 text-sm text-[#191c1e]"
              />
            </div>
            <div>
              <label htmlFor="pat-type" className="block text-xs font-medium text-[#191c1e]">
                Member Role
              </label>
              <select
                id="pat-type"
                value={type}
                onChange={(e) => setType(e.target.value as PatronType)}
                className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-3 py-2 text-sm text-[#191c1e]"
              >
                <option value="Member">Member</option>
                <option value="Student">Student</option>
                <option value="Graduate">Graduate</option>
                <option value="Faculty">Faculty</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="pat-max" className="block text-xs font-medium text-[#191c1e]">
                Max Books
              </label>
              <input
                id="pat-max"
                type="number"
                min="1"
                max="100"
                value={maxLoans}
                onChange={(e) => setMaxLoans(e.target.value)}
                className="mt-1 w-full rounded border border-[#c5c5d4] px-2.5 py-1.5 font-mono text-sm tabular-nums text-[#191c1e]"
              />
            </div>
            <div>
              <label htmlFor="pat-fines" className="block text-xs font-medium text-[#191c1e]">
                Fines ($)
              </label>
              <input
                id="pat-fines"
                type="number"
                step="0.5"
                min="0"
                value={finesOwed}
                onChange={(e) => setFinesOwed(e.target.value)}
                className="mt-1 w-full rounded border border-[#c5c5d4] px-2.5 py-1.5 font-mono text-sm tabular-nums text-[#191c1e]"
              />
            </div>
            <div>
              <label htmlFor="pat-standing" className="block text-xs font-medium text-[#191c1e]">
                Card Status
              </label>
              <select
                id="pat-standing"
                value={standing}
                onChange={(e) => setStanding(e.target.value as PatronStanding)}
                className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 text-sm text-[#191c1e]"
              >
                <option value="Good Standing">Good Standing</option>
                <option value="Fines Due">Fines Due</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="pat-since" className="block text-xs font-medium text-[#191c1e]">
                Member Since
              </label>
              <input
                id="pat-since"
                type="date"
                value={memberSince}
                onChange={(e) => setMemberSince(e.target.value)}
                className="mt-1 w-full rounded border border-[#c5c5d4] px-3 py-1.5 font-mono text-xs text-[#191c1e]"
              />
            </div>
            <div>
              <label htmlFor="pat-notes" className="block text-xs font-medium text-[#191c1e]">
                Notes
              </label>
              <input
                id="pat-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional member notes"
                className="mt-1 w-full rounded border border-[#c5c5d4] px-3 py-1.5 text-sm text-[#191c1e]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-[#e0e3e5] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-[#c5c5d4] bg-white px-4 py-2 text-sm font-medium text-[#191c1e] hover:bg-[#f2f4f6] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-[#24389c] px-4 py-2 text-sm font-medium text-white hover:bg-[#1c2c7e] cursor-pointer"
            >
              {editingMember ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Manage Branches Modal                                                      */
/* -------------------------------------------------------------------------- */
interface ManageBranchesModalProps {
  isOpen: boolean;
  branches: string[];
  onClose: () => void;
  onAddBranch: (name: string) => void;
  onDeleteBranch: (name: string) => void;
}

export const ManageBranchesModal: React.FC<ManageBranchesModalProps> = ({
  isOpen,
  branches,
  onClose,
  onAddBranch,
  onDeleteBranch,
}) => {
  const [newBranch, setNewBranch] = useState('');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#191c1e]/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Manage library branches"
    >
      <div className="w-full max-w-md rounded-lg border border-[#c5c5d4] bg-white">
        <div className="flex items-center justify-between border-b border-[#e0e3e5] px-6 py-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#24389c]" aria-hidden="true" />
            <h2 className="text-base font-semibold text-[#191c1e]">
              Manage Branches
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded p-1 text-[#505f76] hover:bg-[#f2f4f6] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newBranch.trim()) return;
              onAddBranch(newBranch.trim());
              setNewBranch('');
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={newBranch}
              onChange={(e) => setNewBranch(e.target.value)}
              placeholder="New branch or room name..."
              className="flex-1 rounded border border-[#c5c5d4] px-3 py-2 text-sm text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
            />
            <button
              type="submit"
              className="rounded bg-[#24389c] px-4 py-2 text-sm font-medium text-white hover:bg-[#1c2c7e] cursor-pointer"
            >
              Add
            </button>
          </form>

          <div className="divide-y divide-[#eceef0] rounded-lg border border-[#e0e3e5]">
            {branches.map((branch) => (
              <div
                key={branch}
                className="flex items-center justify-between px-3.5 py-2.5 text-sm"
              >
                <span className="font-medium text-[#191c1e]">{branch}</span>
                {branches.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => onDeleteBranch(branch)}
                    aria-label={`Delete branch ${branch}`}
                    className="rounded p-1 text-[#505f76] hover:bg-[#ffdad6]/50 hover:text-[#ba1a1a] cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="text-[11px] text-[#757684]">Primary</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
