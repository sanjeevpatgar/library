import React, { useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  Download,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';
import { getTodayIso } from '../data/seedData';
import { Book, Loan, Patron } from '../types/library';
import {
  addDaysIso,
  diffDaysIso,
  downloadCsv,
  getLoanActiveCountForPatron,
} from '../utils/libraryHelpers';
import { StatusBadge } from './StatusBadge';

interface CirculationScreenProps {
  books: Book[];
  patrons: Patron[];
  loans: Loan[];
  activeBranch: string;
  onCheckout: (
    barcode: string,
    patronId: string,
    checkoutDate: string,
    dueDate: string
  ) => void;
  onReturnLoan: (loanId: string) => void;
  onRenewLoan: (loanId: string) => void;
  onDeleteLoan: (loan: Loan) => void;
  onSelectBook: (book: Book) => void;
}

export const CirculationScreen: React.FC<CirculationScreenProps> = ({
  books,
  patrons,
  loans,
  activeBranch,
  onCheckout,
  onReturnLoan,
  onRenewLoan,
  onDeleteLoan,
  onSelectBook,
}) => {
  const today = getTodayIso();
  const [checkoutBarcode, setCheckoutBarcode] = useState('');
  const [checkoutPatronId, setCheckoutPatronId] = useState('');
  const [checkoutDate, setCheckoutDate] = useState(today);
  const [dueDate, setDueDate] = useState(addDaysIso(today, 14));

  const [checkinLoanId, setCheckinLoanId] = useState('');
  const [ledgerFilter, setLedgerFilter] = useState<
    'All' | 'Active' | 'Due Today' | 'Overdue' | 'Returned'
  >('All');
  const [ledgerSearch, setLedgerSearch] = useState('');

  const bookMap = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);
  const patronMap = useMemo(() => new Map(patrons.map((p) => [p.id, p])), [patrons]);

  const availableCopies = useMemo(
    () =>
      books.flatMap((book) =>
        book.copies
          .filter(
            (c) =>
              c.status === 'Available' &&
              (activeBranch === 'All Branches' || c.branch === activeBranch)
          )
          .map((copy) => ({ book, copy }))
      ),
    [books, activeBranch]
  );

  const activeLoansForDesk = useMemo(
    () =>
      loans.filter(
        (l) =>
          l.status !== 'Returned' &&
          (activeBranch === 'All Branches' || l.branch === activeBranch)
      ),
    [loans, activeBranch]
  );

  const selectedCheckoutCopy = useMemo(
    () => availableCopies.find((item) => item.copy.barcode === checkoutBarcode),
    [availableCopies, checkoutBarcode]
  );

  const selectedCheckoutPatron = useMemo(
    () => patrons.find((p) => p.id === checkoutPatronId),
    [patrons, checkoutPatronId]
  );

  const selectedCheckinLoan = useMemo(
    () => activeLoansForDesk.find((l) => l.id === checkinLoanId),
    [activeLoansForDesk, checkinLoanId]
  );

  const filteredLedger = useMemo(() => {
    const q = ledgerSearch.trim().toLowerCase();
    return loans
      .filter((l) => activeBranch === 'All Branches' || l.branch === activeBranch)
      .filter((l) => ledgerFilter === 'All' || l.status === ledgerFilter)
      .filter((l) => {
        if (!q) return true;
        const book = bookMap.get(l.bookId);
        const patron = patronMap.get(l.patronId);
        return (
          l.barcode.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q) ||
          (book?.title.toLowerCase().includes(q) ?? false) ||
          (patron?.name.toLowerCase().includes(q) ?? false) ||
          (patron?.cardNumber.toLowerCase().includes(q) ?? false)
        );
      })
      .sort((a, b) => b.checkoutDate.localeCompare(a.checkoutDate));
  }, [loans, activeBranch, ledgerFilter, ledgerSearch, bookMap, patronMap]);

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutBarcode || !checkoutPatronId) return;
    onCheckout(checkoutBarcode, checkoutPatronId, checkoutDate, dueDate);
    setCheckoutBarcode('');
    setCheckoutPatronId('');
  };

  const handleExportLedger = () => {
    downloadCsv(
      'library-loans.csv',
      ['Loan ID', 'Barcode', 'Title', 'Member', 'Card Number', 'Borrowed Date', 'Due Date', 'Status', 'Branch'],
      filteredLedger.map((l) => [
        l.id,
        l.barcode,
        bookMap.get(l.bookId)?.title ?? '',
        patronMap.get(l.patronId)?.name ?? '',
        patronMap.get(l.patronId)?.cardNumber ?? '',
        l.checkoutDate,
        l.dueDate,
        l.status,
        l.branch,
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#191c1e]">
            Borrow & Return
          </h1>
          <p className="mt-1 text-sm text-[#454652]">
            Lend available copies, process returns, renew due dates, or remove loan records
          </p>
        </div>

        {filteredLedger.length > 0 && (
          <button
            type="button"
            onClick={handleExportLedger}
            className="inline-flex items-center gap-2 rounded border border-[#c5c5d4] bg-white px-3.5 py-2 text-sm font-medium text-[#191c1e] transition-colors hover:bg-[#f2f4f6] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="h-4 w-4 text-[#505f76]" />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      {/* Dual Circulation Forms */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Lend a Book */}
        <section className="rounded-lg border border-[#e0e3e5] bg-white p-5">
          <div className="flex items-center justify-between border-b border-[#eceef0] pb-3.5">
            <div>
              <h2 className="text-base font-semibold text-[#191c1e]">
                Lend a Book
              </h2>
              <p className="text-xs text-[#454652]">
                Select an available copy, member, and custom due date
              </p>
            </div>
            <ArrowLeftRight className="h-4 w-4 text-[#24389c]" aria-hidden="true" />
          </div>

          <form onSubmit={handleCheckoutSubmit} className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="circ-copy-select"
                className="block text-xs font-medium text-[#191c1e]"
              >
                Book Copy
              </label>
              <select
                id="circ-copy-select"
                value={checkoutBarcode}
                onChange={(e) => setCheckoutBarcode(e.target.value)}
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
                    {book.title} — {copy.barcode} ({copy.branch})
                  </option>
                ))}
              </select>
              {selectedCheckoutCopy && (
                <div className="mt-2 rounded border border-[#e0e3e5] bg-[#f7f9fb] px-3 py-2 text-xs text-[#454652]">
                  <span className="font-medium text-[#191c1e]">
                    {selectedCheckoutCopy.book.title}
                  </span>{' '}
                  · {selectedCheckoutCopy.copy.shelfLocation}
                </div>
              )}
            </div>

            <div>
              <label
                htmlFor="circ-patron-select"
                className="block text-xs font-medium text-[#191c1e]"
              >
                Member
              </label>
              <select
                id="circ-patron-select"
                value={checkoutPatronId}
                onChange={(e) => setCheckoutPatronId(e.target.value)}
                className="mt-1.5 w-full rounded border border-[#c5c5d4] bg-white px-3 py-2 text-sm text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
                required
              >
                <option value="">
                  {patrons.length === 0
                    ? 'No members — add a member first'
                    : 'Choose a member...'}
                </option>
                {patrons.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.standing === 'Suspended'}>
                    {p.name} ({p.cardNumber}
                    {p.standing === 'Suspended' ? ' · Suspended' : ''})
                  </option>
                ))}
              </select>
              {selectedCheckoutPatron && (
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded border border-[#e0e3e5] bg-[#f7f9fb] px-3 py-2 text-xs">
                  <span className="text-[#454652]">
                    Active Loans:{' '}
                    <strong className="font-mono text-[#191c1e] tabular-nums">
                      {getLoanActiveCountForPatron(loans, selectedCheckoutPatron.id)} /{' '}
                      {selectedCheckoutPatron.maxLoans}
                    </strong>
                  </span>
                  <StatusBadge status={selectedCheckoutPatron.standing} compact />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="circ-checkout-date"
                  className="block text-xs font-medium text-[#191c1e]"
                >
                  Borrow Date
                </label>
                <input
                  id="circ-checkout-date"
                  type="date"
                  value={checkoutDate}
                  onChange={(e) => setCheckoutDate(e.target.value)}
                  className="mt-1.5 w-full rounded border border-[#c5c5d4] bg-white px-3 py-2 font-mono text-xs text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="circ-due-date"
                  className="block text-xs font-medium text-[#191c1e]"
                >
                  Due Date
                </label>
                <input
                  id="circ-due-date"
                  type="date"
                  value={dueDate}
                  min={checkoutDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="mt-1.5 w-full rounded border border-[#c5c5d4] bg-white px-3 py-2 font-mono text-xs text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
                  required
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                {[7, 14, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDueDate(addDaysIso(checkoutDate, d))}
                    className="rounded border border-[#c5c5d4] bg-[#f7f9fb] px-2 py-1 text-[11px] font-medium text-[#454652] hover:bg-[#eceef0] cursor-pointer"
                  >
                    +{d}d
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={!checkoutBarcode || !checkoutPatronId}
                className="rounded bg-[#24389c] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1c2c7e] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                Lend Book
              </button>
            </div>
          </form>
        </section>

        {/* Return or Renew */}
        <section className="rounded-lg border border-[#e0e3e5] bg-white p-5">
          <div className="flex items-center justify-between border-b border-[#eceef0] pb-3.5">
            <div>
              <h2 className="text-base font-semibold text-[#191c1e]">
                Return or Renew
              </h2>
              <p className="text-xs text-[#454652]">
                Check a borrowed book back in or extend its due date
              </p>
            </div>
            <RefreshCw className="h-4 w-4 text-[#505f76]" aria-hidden="true" />
          </div>

          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="circ-return-select"
                className="block text-xs font-medium text-[#191c1e]"
              >
                Borrowed Book
              </label>
              <select
                id="circ-return-select"
                value={checkinLoanId}
                onChange={(e) => setCheckinLoanId(e.target.value)}
                className="mt-1.5 w-full rounded border border-[#c5c5d4] bg-white px-3 py-2 text-sm text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
              >
                <option value="">
                  {activeLoansForDesk.length === 0
                    ? 'No books currently borrowed'
                    : 'Choose a borrowed book...'}
                </option>
                {activeLoansForDesk.map((loan) => {
                  const book = bookMap.get(loan.bookId);
                  const patron = patronMap.get(loan.patronId);
                  return (
                    <option key={loan.id} value={loan.id}>
                      {book?.title} ({loan.barcode}) — {patron?.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {selectedCheckinLoan ? (
              <div className="rounded border border-[#e0e3e5] bg-[#f7f9fb] p-3.5 text-xs space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#191c1e]">
                    {bookMap.get(selectedCheckinLoan.bookId)?.title}
                  </span>
                  <StatusBadge status={selectedCheckinLoan.status} compact />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[#454652]">
                  <div>
                    Member:{' '}
                    <span className="font-medium text-[#191c1e]">
                      {patronMap.get(selectedCheckinLoan.patronId)?.name}
                    </span>
                  </div>
                  <div className="font-mono tabular-nums">
                    Due: {selectedCheckinLoan.dueDate}
                  </div>
                  <div>
                    Renewals:{' '}
                    <span className="font-mono tabular-nums">
                      {selectedCheckinLoan.renewals}
                    </span>
                  </div>
                  <div>
                    Branch: <span className="text-[#191c1e]">{selectedCheckinLoan.branch}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded border border-dashed border-[#c5c5d4] bg-[#f7f9fb] px-4 py-8 text-center text-xs text-[#505f76]">
                Select an active loan above to return it to the shelf or extend its due date by 14 days.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                disabled={!selectedCheckinLoan}
                onClick={() => {
                  if (!selectedCheckinLoan) return;
                  onRenewLoan(selectedCheckinLoan.id);
                }}
                className="rounded border border-[#c5c5d4] bg-white px-4 py-2 text-sm font-medium text-[#191c1e] transition-colors hover:bg-[#f2f4f6] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                Renew (+14 Days)
              </button>
              <button
                type="button"
                disabled={!selectedCheckinLoan}
                onClick={() => {
                  if (!selectedCheckinLoan) return;
                  onReturnLoan(selectedCheckinLoan.id);
                  setCheckinLoanId('');
                }}
                className="rounded bg-[#24389c] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1c2c7e] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                Return Book
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Loan History Table */}
      <section className="overflow-hidden rounded-lg border border-[#e0e3e5] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e0e3e5] px-5 py-4">
          <div
            role="group"
            aria-label="Filter loans by status"
            className="inline-flex flex-wrap items-center rounded border border-[#e0e3e5] bg-[#f2f4f6] p-0.5"
          >
            {(['All', 'Active', 'Due Today', 'Overdue', 'Returned'] as const).map(
              (tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setLedgerFilter(tab)}
                  className={`rounded-xs px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    ledgerFilter === tab
                      ? 'bg-white text-[#191c1e] shadow-2xs'
                      : 'text-[#454652] hover:text-[#191c1e]'
                  }`}
                >
                  {tab}
                </button>
              )
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#757684]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={ledgerSearch}
              onChange={(e) => setLedgerSearch(e.target.value)}
              placeholder="Search barcode, book, or member..."
              className="w-full rounded border border-[#c5c5d4] bg-[#f7f9fb] py-1.5 pr-3 pl-9 text-sm text-[#191c1e] placeholder:text-[#757684] focus:border-[#24389c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#e0e3e5] bg-[#f7f9fb] text-xs font-medium text-[#454652]">
                <th className="px-4 py-2.5">Barcode & ID</th>
                <th className="px-4 py-2.5">Book Title</th>
                <th className="px-4 py-2.5">Member</th>
                <th className="px-4 py-2.5">Borrowed</th>
                <th className="px-4 py-2.5">Due / Returned</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef0]">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#454652]">
                    No loan records yet. Lend a book above to create your first loan entry.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((loan) => {
                  const book = bookMap.get(loan.bookId);
                  const patron = patronMap.get(loan.patronId);
                  const lateDays =
                    loan.status === 'Overdue' ? diffDaysIso(loan.dueDate, today) : 0;

                  return (
                    <tr
                      key={loan.id}
                      className="transition-colors hover:bg-[#f7f9fb]"
                    >
                      <td className="px-4 py-3 font-mono text-xs tabular-nums">
                        <div className="font-medium text-[#191c1e]">{loan.barcode}</div>
                        <div className="text-[11px] text-[#505f76]">{loan.id}</div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => book && onSelectBook(book)}
                          className="font-medium text-[#191c1e] hover:text-[#24389c] hover:underline text-left cursor-pointer"
                        >
                          {book?.title ?? 'Deleted Book'}
                        </button>
                        <div className="text-xs text-[#505f76]">{loan.branch}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-[#191c1e]">
                          {patron?.name ?? 'Removed Member'}
                        </div>
                        <div className="font-mono text-[11px] text-[#505f76] tabular-nums">
                          {patron?.cardNumber ?? '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs tabular-nums text-[#454652]">
                        {loan.checkoutDate}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs tabular-nums text-[#191c1e]">
                        <div>
                          {loan.status === 'Returned' && loan.returnedDate
                            ? loan.returnedDate
                            : loan.dueDate}
                        </div>
                        {lateDays > 0 && (
                          <div className="text-[11px] text-[#ba1a1a]">
                            {lateDays}d overdue
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={loan.status} compact />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {loan.status !== 'Returned' && (
                            <>
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
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteLoan(loan)}
                            aria-label={`Delete loan ${loan.id}`}
                            title="Delete loan record"
                            className="rounded border border-[#c5c5d4] bg-white p-1.5 text-[#505f76] hover:bg-[#ffdad6]/50 hover:text-[#ba1a1a] cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
