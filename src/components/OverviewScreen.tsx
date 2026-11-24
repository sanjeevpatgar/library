import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Plus,
  RotateCcw,
  UserPlus,
  Users,
} from 'lucide-react';
import { getTodayIso } from '../data/seedData';
import {
  Book,
  HoldRequest,
  Loan,
  NavSection,
  Patron,
} from '../types/library';
import { addDaysIso, diffDaysIso, formatShortDate } from '../utils/libraryHelpers';
import { BookCoverPlate } from './BookCoverPlate';
import { StatusBadge } from './StatusBadge';

interface OverviewScreenProps {
  books: Book[];
  patrons: Patron[];
  loans: Loan[];
  holds: HoldRequest[];
  activeBranch: string;
  onNavigate: (section: NavSection) => void;
  onSelectBook: (book: Book) => void;
  onOpenAddBook: () => void;
  onOpenAddMember: () => void;
  onQuickCheckout: (barcode: string, patronId: string, checkoutDate: string, dueDate: string) => void;
  onReturnLoan: (loanId: string) => void;
  onRenewLoan: (loanId: string) => void;
  onFulfillHold: (holdId: string) => void;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  books,
  patrons,
  loans,
  holds,
  activeBranch,
  onNavigate,
  onSelectBook,
  onOpenAddBook,
  onOpenAddMember,
  onQuickCheckout,
  onReturnLoan,
  onRenewLoan,
  onFulfillHold,
}) => {
  const today = getTodayIso();
  const [selectedBarcode, setSelectedBarcode] = useState<string>('');
  const [selectedPatronId, setSelectedPatronId] = useState<string>('');
  const [loanDays, setLoanDays] = useState<number>(14);

  const branchCopies = useMemo(() => {
    return books.flatMap((book) =>
      book.copies
        .filter((c) => activeBranch === 'All Branches' || c.branch === activeBranch)
        .map((copy) => ({ book, copy }))
    );
  }, [books, activeBranch]);

  const availableCopies = useMemo(
    () => branchCopies.filter((item) => item.copy.status === 'Available'),
    [branchCopies]
  );

  const branchLoans = useMemo(
    () =>
      loans.filter(
        (l) => activeBranch === 'All Branches' || l.branch === activeBranch
      ),
    [loans, activeBranch]
  );

  const activeLoans = useMemo(
    () => branchLoans.filter((l) => l.status !== 'Returned'),
    [branchLoans]
  );

  const attentionLoans = useMemo(
    () =>
      activeLoans
        .filter((l) => l.status === 'Overdue' || l.status === 'Due Today')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [activeLoans]
  );

  const branchHolds = useMemo(
    () =>
      holds.filter(
        (h) =>
          (activeBranch === 'All Branches' || h.pickupBranch === activeBranch) &&
          h.status !== 'Fulfilled' &&
          h.status !== 'Cancelled'
      ),
    [holds, activeBranch]
  );

  const readyHolds = useMemo(
    () => branchHolds.filter((h) => h.status === 'Ready for Pickup'),
    [branchHolds]
  );

  const utilizationPct =
    branchCopies.length > 0
      ? Math.round((activeLoans.length / branchCopies.length) * 100)
      : 0;

  const subjectBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; available: number; borrowed: number }>();
    branchCopies.forEach(({ book, copy }) => {
      const curr = map.get(book.category) ?? { total: 0, available: 0, borrowed: 0 };
      curr.total += 1;
      if (copy.status === 'Available') curr.available += 1;
      if (copy.status === 'Checked Out' || copy.status === 'Overdue') curr.borrowed += 1;
      map.set(book.category, curr);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].total - a[1].total);
  }, [branchCopies]);

  const bookMap = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);
  const patronMap = useMemo(() => new Map(patrons.map((p) => [p.id, p])), [patrons]);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarcode || !selectedPatronId) return;
    onQuickCheckout(selectedBarcode, selectedPatronId, today, addDaysIso(today, loanDays));
    setSelectedBarcode('');
    setSelectedPatronId('');
  };

  const isEmptyLibrary = books.length === 0 && patrons.length === 0;

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#191c1e]">
            Library Dashboard
          </h1>
          <p className="mt-1 text-sm text-[#454652]">
            {activeBranch === 'All Branches'
              ? 'Overview of your books, members, loans, and reservations'
              : `Viewing ${activeBranch}`}
            <span className="mx-2 text-[#c5c5d4]" aria-hidden="true">·</span>
            <span className="font-mono text-xs tabular-nums text-[#505f76]">
              {formatShortDate(today)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenAddBook}
            className="inline-flex items-center gap-2 rounded border border-[#c5c5d4] bg-white px-3.5 py-2 text-sm font-medium text-[#191c1e] transition-colors hover:bg-[#f2f4f6] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4 text-[#24389c]" />
            <span>Add Book</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('circulation')}
            className="inline-flex items-center gap-2 rounded bg-[#24389c] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1c2c7e] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Borrow & Return</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Clean Quick-Start Banner when Library has no records yet */}
      {isEmptyLibrary && (
        <section className="rounded-lg border border-[#c5c5d4] bg-white p-6">
          <h2 className="text-lg font-semibold text-[#191c1e]">
            Welcome to your Library Workspace
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-[#454652]">
            Your workspace starts completely clean with no sample records. Follow these three quick steps to set up your collection and start lending books.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="flex flex-col justify-between rounded-lg border border-[#e0e3e5] bg-[#f7f9fb] p-4">
              <div>
                <div className="text-xs font-semibold text-[#24389c]">Step 1</div>
                <h3 className="mt-1 text-sm font-semibold text-[#191c1e]">
                  Add Books to Your Catalog
                </h3>
                <p className="mt-1 text-xs text-[#454652]">
                  Enter title, author, ISBN, shelf location, and copy barcodes. You can edit or delete any book anytime.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAddBook}
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded bg-[#24389c] px-3 py-2 text-xs font-medium text-white hover:bg-[#1c2c7e] cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add First Book</span>
              </button>
            </div>

            <div className="flex flex-col justify-between rounded-lg border border-[#e0e3e5] bg-[#f7f9fb] p-4">
              <div>
                <div className="text-xs font-semibold text-[#24389c]">Step 2</div>
                <h3 className="mt-1 text-sm font-semibold text-[#191c1e]">
                  Register Library Members
                </h3>
                <p className="mt-1 text-xs text-[#454652]">
                  Add borrowers with contact info, card numbers, and borrow limits.
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenAddMember}
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded border border-[#c5c5d4] bg-white px-3 py-2 text-xs font-medium text-[#191c1e] hover:bg-[#f2f4f6] cursor-pointer"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Add First Member</span>
              </button>
            </div>

            <div className="flex flex-col justify-between rounded-lg border border-[#e0e3e5] bg-[#f7f9fb] p-4">
              <div>
                <div className="text-xs font-semibold text-[#24389c]">Step 3</div>
                <h3 className="mt-1 text-sm font-semibold text-[#191c1e]">
                  Lend, Return & Reserve
                </h3>
                <p className="mt-1 text-xs text-[#454652]">
                  Issue loans with custom due dates, track overdue books, and manage reservations.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('circulation')}
                className="mt-4 inline-flex items-center justify-center gap-1.5 rounded border border-[#c5c5d4] bg-white px-3 py-2 text-xs font-medium text-[#191c1e] hover:bg-[#f2f4f6] cursor-pointer"
              >
                <span>Open Borrow & Return</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 4-Column KPI Summary Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-[#e0e3e5] bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#505f76]">Total Books</span>
            <BookOpen className="h-4 w-4 text-[#505f76]" aria-hidden="true" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2.5">
            <span className="text-3xl font-bold tracking-tight text-[#191c1e] tabular-nums">
              {branchCopies.length}
            </span>
            <span className="text-xs text-[#454652] tabular-nums">
              copies ({books.length} titles)
            </span>
          </div>
          <div className="mt-3 border-t border-[#eceef0] pt-2.5 text-xs text-[#454652] tabular-nums">
            <span className="font-medium text-[#14532d]">{availableCopies.length} available</span>{' '}
            on shelf
          </div>
        </div>

        <div className="rounded-lg border border-[#e0e3e5] bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#505f76]">Currently Borrowed</span>
            <CalendarClock className="h-4 w-4 text-[#24389c]" aria-hidden="true" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2.5">
            <span className="text-3xl font-bold tracking-tight text-[#191c1e] tabular-nums">
              {activeLoans.length}
            </span>
            <span className="text-xs text-[#454652] tabular-nums">
              {utilizationPct}% of copies out
            </span>
          </div>
          <div className="mt-3 border-t border-[#eceef0] pt-2.5 text-xs text-[#454652] tabular-nums">
            <span className="font-medium text-[#24389c]">
              {branchLoans.filter((l) => l.status === 'Returned').length} returned
            </span>{' '}
            all time
          </div>
        </div>

        <div className="rounded-lg border border-[#e0e3e5] bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#505f76]">Overdue & Due Today</span>
            <RotateCcw className="h-4 w-4 text-[#ba1a1a]" aria-hidden="true" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2.5">
            <span
              className={`text-3xl font-bold tracking-tight tabular-nums ${
                attentionLoans.length > 0 ? 'text-[#ba1a1a]' : 'text-[#191c1e]'
              }`}
            >
              {attentionLoans.length}
            </span>
            <span className="text-xs text-[#454652] tabular-nums">
              {activeLoans.filter((l) => l.status === 'Overdue').length} overdue ·{' '}
              {activeLoans.filter((l) => l.status === 'Due Today').length} due today
            </span>
          </div>
          <div className="mt-3 border-t border-[#eceef0] pt-2.5 text-xs">
            <button
              type="button"
              onClick={() => onNavigate('circulation')}
              className="font-medium text-[#24389c] hover:underline cursor-pointer"
            >
              View all loans
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-[#e0e3e5] bg-white p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#505f76]">Members & Reservations</span>
            <Users className="h-4 w-4 text-[#505f76]" aria-hidden="true" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2.5">
            <span className="text-3xl font-bold tracking-tight text-[#191c1e] tabular-nums">
              {patrons.length}
            </span>
            <span className="text-xs text-[#454652] tabular-nums">
              members · {branchHolds.length} reservations
            </span>
          </div>
          <div className="mt-3 border-t border-[#eceef0] pt-2.5 text-xs">
            <button
              type="button"
              onClick={() => onNavigate('patrons')}
              className="font-medium text-[#24389c] hover:underline cursor-pointer"
            >
              Manage members
            </button>
          </div>
        </div>
      </div>

      {/* Main 12-Column Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 7 Columns: Real Collection Breakdown + Due/Overdue Queue */}
        <div className="space-y-6 lg:col-span-7">
          {/* Live Shelf Availability by Category */}
          <section className="rounded-lg border border-[#e0e3e5] bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#191c1e]">
                  Collection Status by Category
                </h2>
                <p className="text-xs text-[#454652]">
                  Live copy availability across your catalog categories
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('catalog')}
                className="text-xs font-medium text-[#24389c] hover:underline cursor-pointer"
              >
                View Books
              </button>
            </div>

            {subjectBreakdown.length === 0 ? (
              <div className="mt-4 rounded border border-dashed border-[#c5c5d4] bg-[#f7f9fb] px-4 py-8 text-center">
                <p className="text-sm font-medium text-[#191c1e]">No books added yet</p>
                <p className="mt-1 text-xs text-[#454652]">
                  Add books to see real-time category and shelf counts here.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3.5">
                {subjectBreakdown.map(([cat, stats]) => {
                  const availPct = Math.round((stats.available / stats.total) * 100);
                  return (
                    <div key={cat}>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="font-medium text-[#191c1e]">{cat}</span>
                        <span className="font-mono text-[#505f76] tabular-nums">
                          {stats.available} available · {stats.borrowed} borrowed · {stats.total}{' '}
                          total
                        </span>
                      </div>
                      <div className="mt-1.5 flex h-2 w-full overflow-hidden rounded-xs bg-[#eceef0]">
                        <div
                          className="h-full bg-[#24389c]"
                          style={{ width: `${availPct}%` }}
                          title={`${stats.available} available`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Priority Returns & Overdue */}
          <section className="overflow-hidden rounded-lg border border-[#e0e3e5] bg-white">
            <div className="flex items-center justify-between border-b border-[#e0e3e5] px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-[#191c1e]">
                  Due Today & Overdue Books
                </h2>
                <p className="text-xs text-[#454652]">
                  Books requiring return or renewal attention
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('circulation')}
                className="text-xs font-medium text-[#24389c] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                All Loans
              </button>
            </div>

            {attentionLoans.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
                <CheckCircle2 className="h-7 w-7 text-[#14532d]" />
                <p className="mt-2 text-sm font-medium text-[#191c1e]">
                  No overdue or due-today books
                </p>
                <p className="mt-1 text-xs text-[#454652]">
                  Any borrowed books reaching their due date will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#e0e3e5] bg-[#f7f9fb] text-xs font-medium text-[#454652]">
                      <th className="px-4 py-2.5">Book & Barcode</th>
                      <th className="px-4 py-2.5">Member</th>
                      <th className="px-4 py-2.5">Due Date</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eceef0]">
                    {attentionLoans.map((loan) => {
                      const book = bookMap.get(loan.bookId);
                      const patron = patronMap.get(loan.patronId);
                      const daysDelta = diffDaysIso(loan.dueDate, today);
                      return (
                        <tr
                          key={loan.id}
                          className="transition-colors hover:bg-[#f7f9fb]"
                        >
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => book && onSelectBook(book)}
                              className="text-left font-medium text-[#191c1e] hover:text-[#24389c] hover:underline cursor-pointer"
                            >
                              {book?.title ?? 'Unknown Book'}
                            </button>
                            <div className="mt-0.5 font-mono text-[11px] text-[#505f76] tabular-nums">
                              {loan.barcode} · {loan.branch}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-[#191c1e]">
                              {patron?.name ?? 'Unknown Member'}
                            </div>
                            <div className="font-mono text-[11px] text-[#505f76] tabular-nums">
                              {patron?.cardNumber}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs tabular-nums text-[#191c1e]">
                            <div>{loan.dueDate}</div>
                            {daysDelta > 0 && (
                              <div className="text-[11px] text-[#ba1a1a]">
                                {daysDelta}d late
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={loan.status} compact />
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onRenewLoan(loan.id)}
                                className="rounded border border-[#c5c5d4] bg-white px-2.5 py-1 text-xs font-medium text-[#191c1e] hover:bg-[#f2f4f6] whitespace-nowrap cursor-pointer"
                              >
                                Renew
                              </button>
                              <button
                                type="button"
                                onClick={() => onReturnLoan(loan.id)}
                                className="rounded bg-[#24389c] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#1c2c7e] whitespace-nowrap cursor-pointer"
                              >
                                Return
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        {/* Right 5 Columns: Quick Lend + Ready Reservations */}
        <div className="space-y-6 lg:col-span-5">
          {/* Quick Lend Card */}
          <section className="rounded-lg border border-[#e0e3e5] bg-white p-5">
            <h2 className="text-base font-semibold text-[#191c1e]">
              Quick Lend a Book
            </h2>
            <p className="mt-0.5 text-xs text-[#454652]">
              Pick an available book copy and a library member
            </p>

            {availableCopies.length === 0 || patrons.length === 0 ? (
              <div className="mt-4 rounded border border-dashed border-[#c5c5d4] bg-[#f7f9fb] p-4 text-xs text-[#454652]">
                {availableCopies.length === 0
                  ? 'Add at least one available book copy before lending.'
                  : 'Add at least one member before lending a book.'}
                <div className="mt-3 flex flex-wrap gap-2">
                  {availableCopies.length === 0 && (
                    <button
                      type="button"
                      onClick={onOpenAddBook}
                      className="rounded bg-[#24389c] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1c2c7e] cursor-pointer"
                    >
                      Add Book
                    </button>
                  )}
                  {patrons.length === 0 && (
                    <button
                      type="button"
                      onClick={onOpenAddMember}
                      className="rounded border border-[#c5c5d4] bg-white px-3 py-1.5 text-xs font-medium text-[#191c1e] hover:bg-[#f2f4f6] cursor-pointer"
                    >
                      Add Member
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleQuickSubmit} className="mt-4 space-y-3.5">
                <div>
                  <label
                    htmlFor="overview-copy-select"
                    className="block text-xs font-medium text-[#191c1e]"
                  >
                    Available Book Copy
                  </label>
                  <select
                    id="overview-copy-select"
                    value={selectedBarcode}
                    onChange={(e) => setSelectedBarcode(e.target.value)}
                    className="mt-1.5 w-full rounded border border-[#c5c5d4] bg-white px-3 py-2 text-sm text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
                    required
                  >
                    <option value="">Choose a book copy...</option>
                    {availableCopies.map(({ book, copy }) => (
                      <option key={copy.barcode} value={copy.barcode}>
                        {book.title} ({copy.barcode} · {copy.branch})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="overview-patron-select"
                    className="block text-xs font-medium text-[#191c1e]"
                  >
                    Member
                  </label>
                  <select
                    id="overview-patron-select"
                    value={selectedPatronId}
                    onChange={(e) => setSelectedPatronId(e.target.value)}
                    className="mt-1.5 w-full rounded border border-[#c5c5d4] bg-white px-3 py-2 text-sm text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
                    required
                  >
                    <option value="">Choose a member...</option>
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
                    <label
                      htmlFor="overview-loan-term"
                      className="block text-xs font-medium text-[#191c1e]"
                    >
                      Loan Duration
                    </label>
                    <select
                      id="overview-loan-term"
                      value={loanDays}
                      onChange={(e) => setLoanDays(Number(e.target.value))}
                      className="mt-1.5 w-full rounded border border-[#c5c5d4] bg-white px-3 py-2 text-sm text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
                    >
                      <option value={7}>7 Days</option>
                      <option value={14}>14 Days</option>
                      <option value={21}>21 Days</option>
                      <option value={30}>30 Days</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={!selectedBarcode || !selectedPatronId}
                      className="w-full rounded bg-[#24389c] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1c2c7e] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                    >
                      Lend Book
                    </button>
                  </div>
                </div>
              </form>
            )}
          </section>

          {/* Ready for Pickup Reservations */}
          <section className="overflow-hidden rounded-lg border border-[#e0e3e5] bg-white">
            <div className="flex items-center justify-between border-b border-[#e0e3e5] px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-[#191c1e]">
                  Ready for Pickup
                </h2>
                <p className="text-xs text-[#454652]">
                  Reserved books waiting for members
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('holds')}
                className="text-xs font-medium text-[#24389c] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
              >
                All Reservations
              </button>
            </div>

            {readyHolds.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-[#454652]">
                No reserved books waiting for pickup.
              </div>
            ) : (
              <div className="divide-y divide-[#eceef0]">
                {readyHolds.map((hold) => {
                  const book = bookMap.get(hold.bookId);
                  const patron = patronMap.get(hold.patronId);
                  return (
                    <div
                      key={hold.id}
                      className="flex items-center justify-between gap-3 px-5 py-3.5"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {book && <BookCoverPlate book={book} size="sm" />}
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => book && onSelectBook(book)}
                            className="block truncate text-left text-sm font-medium text-[#191c1e] hover:text-[#24389c] hover:underline cursor-pointer"
                          >
                            {book?.title}
                          </button>
                          <div className="mt-0.5 truncate text-xs text-[#454652]">
                            {patron?.name} · Hold until{' '}
                            <span className="font-mono tabular-nums">
                              {hold.expiryDate}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onFulfillHold(hold.id)}
                        className="rounded border border-[#24389c] bg-white px-2.5 py-1 text-xs font-medium text-[#24389c] hover:bg-[#dee0ff]/40 whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        Lend Now
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
