import React, { useEffect, useMemo, useState } from 'react';
import { BookmarkPlus, Trash2 } from 'lucide-react';
import { Book, HoldRequest, Patron } from '../types/library';
import { BookCoverPlate } from './BookCoverPlate';
import { StatusBadge } from './StatusBadge';

interface HoldsScreenProps {
  holds: HoldRequest[];
  books: Book[];
  patrons: Patron[];
  branches: string[];
  activeBranch: string;
  onMarkReady: (holdId: string) => void;
  onFulfillHold: (holdId: string) => void;
  onCancelHold: (holdId: string) => void;
  onDeleteHold: (hold: HoldRequest) => void;
  onPlaceHold: (bookId: string, patronId: string, branch: string, notes?: string) => void;
  onSelectBook: (book: Book) => void;
}

export const HoldsScreen: React.FC<HoldsScreenProps> = ({
  holds,
  books,
  patrons,
  branches,
  activeBranch,
  onMarkReady,
  onFulfillHold,
  onCancelHold,
  onDeleteHold,
  onPlaceHold,
  onSelectBook,
}) => {
  const [statusTab, setStatusTab] = useState<
    'All Active' | 'Ready for Pickup' | 'Waiting' | 'In Transit' | 'History'
  >('All Active');
  const [newBookId, setNewBookId] = useState('');
  const [newPatronId, setNewPatronId] = useState('');
  const [pickupBranch, setPickupBranch] = useState<string>(
    activeBranch === 'All Branches' ? branches[0] ?? 'Main Library' : activeBranch
  );
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (activeBranch !== 'All Branches') {
      setPickupBranch(activeBranch);
    } else if (!branches.includes(pickupBranch)) {
      setPickupBranch(branches[0] ?? 'Main Library');
    }
  }, [activeBranch, branches, pickupBranch]);

  const bookMap = useMemo(() => new Map(books.map((b) => [b.id, b])), [books]);
  const patronMap = useMemo(() => new Map(patrons.map((p) => [p.id, p])), [patrons]);

  const filteredHolds = useMemo(() => {
    return holds
      .filter((h) => activeBranch === 'All Branches' || h.pickupBranch === activeBranch)
      .filter((h) => {
        if (statusTab === 'All Active') {
          return h.status !== 'Fulfilled' && h.status !== 'Cancelled';
        }
        if (statusTab === 'History') {
          return h.status === 'Fulfilled' || h.status === 'Cancelled';
        }
        return h.status === statusTab;
      });
  }, [holds, activeBranch, statusTab]);

  const handlePlaceHold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookId || !newPatronId) return;
    onPlaceHold(newBookId, newPatronId, pickupBranch, notes.trim() || undefined);
    setNewBookId('');
    setNewPatronId('');
    setNotes('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#191c1e]">
          Reservations
        </h1>
        <p className="mt-1 text-sm text-[#454652]">
          Reserve books for members, mark copies ready for pickup, or remove old requests
        </p>
      </div>

      {/* Place New Reservation */}
      <section className="rounded-lg border border-[#e0e3e5] bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#191c1e]">
          <BookmarkPlus className="h-4 w-4 text-[#24389c]" aria-hidden="true" />
          <span>Reserve a Book</span>
        </div>

        <form onSubmit={handlePlaceHold} className="mt-3.5 grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <label htmlFor="hold-book-select" className="block text-xs font-medium text-[#454652]">
              Book
            </label>
            <select
              id="hold-book-select"
              value={newBookId}
              onChange={(e) => setNewBookId(e.target.value)}
              className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-3 py-2 text-sm text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
              required
            >
              <option value="">
                {books.length === 0 ? 'Add books first...' : 'Choose a book...'}
              </option>
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} — {b.author}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <label htmlFor="hold-patron-select" className="block text-xs font-medium text-[#454652]">
              Member
            </label>
            <select
              id="hold-patron-select"
              value={newPatronId}
              onChange={(e) => setNewPatronId(e.target.value)}
              className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-3 py-2 text-sm text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
              required
            >
              <option value="">
                {patrons.length === 0 ? 'Add members first...' : 'Choose a member...'}
              </option>
              {patrons.map((p) => (
                <option key={p.id} value={p.id} disabled={p.standing === 'Suspended'}>
                  {p.name} ({p.cardNumber})
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="hold-branch-select" className="block text-xs font-medium text-[#454652]">
              Pickup Branch
            </label>
            <select
              id="hold-branch-select"
              value={pickupBranch}
              onChange={(e) => setPickupBranch(e.target.value)}
              className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-3 py-2 text-sm text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
            >
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="hold-notes" className="block text-xs font-medium text-[#454652]">
              Note (Optional)
            </label>
            <input
              id="hold-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Pickup note..."
              className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-3 py-2 text-sm text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
            />
          </div>

          <div className="flex items-end md:col-span-1">
            <button
              type="submit"
              disabled={!newBookId || !newPatronId}
              className="w-full rounded bg-[#24389c] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1c2c7e] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              Reserve
            </button>
          </div>
        </form>
      </section>

      {/* Queue Table */}
      <section className="overflow-hidden rounded-lg border border-[#e0e3e5] bg-white">
        <div className="border-b border-[#e0e3e5] px-5 py-3.5">
          <div
            role="group"
            aria-label="Reservation status filter"
            className="inline-flex flex-wrap items-center rounded border border-[#e0e3e5] bg-[#f2f4f6] p-0.5"
          >
            {(
              ['All Active', 'Ready for Pickup', 'Waiting', 'In Transit', 'History'] as const
            ).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusTab(tab)}
                className={`rounded-xs px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  statusTab === tab
                    ? 'bg-white text-[#191c1e] shadow-2xs'
                    : 'text-[#454652] hover:text-[#191c1e]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#e0e3e5] bg-[#f7f9fb] text-xs font-medium text-[#454652]">
                <th className="px-4 py-2.5">ID & Queue</th>
                <th className="px-4 py-2.5">Book</th>
                <th className="px-4 py-2.5">Member</th>
                <th className="px-4 py-2.5">Pickup Branch</th>
                <th className="px-4 py-2.5">Requested / Expiry</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef0]">
              {filteredHolds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#454652]">
                    No reservations in this view.
                  </td>
                </tr>
              ) : (
                filteredHolds.map((hold) => {
                  const book = bookMap.get(hold.bookId);
                  const patron = patronMap.get(hold.patronId);
                  return (
                    <tr
                      key={hold.id}
                      className="transition-colors hover:bg-[#f7f9fb]"
                    >
                      <td className="px-4 py-3 font-mono text-xs tabular-nums text-[#505f76]">
                        <div>{hold.id}</div>
                        <div className="text-[11px]">Pos #{hold.queuePosition}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {book && <BookCoverPlate book={book} size="sm" />}
                          <div>
                            <button
                              type="button"
                              onClick={() => book && onSelectBook(book)}
                              className="font-medium text-[#191c1e] hover:text-[#24389c] hover:underline text-left cursor-pointer"
                            >
                              {book?.title ?? 'Deleted Book'}
                            </button>
                            <div className="text-[11px] text-[#505f76]">
                              {hold.notes || book?.callNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-[#191c1e]">
                          {patron?.name ?? 'Removed Member'}
                        </div>
                        <div className="font-mono text-[11px] text-[#505f76] tabular-nums">
                          {patron?.cardNumber ?? '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#454652]">{hold.pickupBranch}</td>
                      <td className="px-4 py-3 font-mono text-xs tabular-nums text-[#454652]">
                        <div>Req: {hold.requestedDate}</div>
                        {hold.expiryDate && (
                          <div className="text-[11px] text-[#191c1e]">
                            Exp: {hold.expiryDate}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={hold.status} compact />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {(hold.status === 'Waiting' || hold.status === 'In Transit') && (
                            <button
                              type="button"
                              onClick={() => onMarkReady(hold.id)}
                              className="rounded border border-[#24389c] bg-white px-2.5 py-1 text-xs font-medium text-[#24389c] hover:bg-[#dee0ff]/40 whitespace-nowrap cursor-pointer"
                            >
                              Mark Ready
                            </button>
                          )}
                          {hold.status === 'Ready for Pickup' && (
                            <button
                              type="button"
                              onClick={() => onFulfillHold(hold.id)}
                              className="rounded bg-[#24389c] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#1c2c7e] whitespace-nowrap cursor-pointer"
                            >
                              Lend Now
                            </button>
                          )}
                          {hold.status !== 'Fulfilled' && hold.status !== 'Cancelled' && (
                            <button
                              type="button"
                              onClick={() => onCancelHold(hold.id)}
                              className="rounded border border-[#c5c5d4] bg-white px-2.5 py-1 text-xs font-medium text-[#454652] hover:bg-[#f2f4f6] whitespace-nowrap cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onDeleteHold(hold)}
                            aria-label={`Delete reservation ${hold.id}`}
                            title="Delete reservation"
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
