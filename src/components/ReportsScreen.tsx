import React, { useEffect, useMemo, useState } from 'react';
import { Download, PackagePlus, Trash2 } from 'lucide-react';
import { getTodayIso } from '../data/seedData';
import { AcquisitionOrder, BOOK_CATEGORIES, Book, Loan } from '../types/library';
import { addDaysIso, downloadCsv } from '../utils/libraryHelpers';
import { StatusBadge } from './StatusBadge';

interface ReportsScreenProps {
  books: Book[];
  loans: Loan[];
  acquisitions: AcquisitionOrder[];
  branches: string[];
  onAddAcquisition: (
    order: Omit<AcquisitionOrder, 'id' | 'status'>
  ) => void;
  onAdvanceAcquisition: (orderId: string) => void;
  onDeleteAcquisition: (order: AcquisitionOrder) => void;
  onRequestClearAllData: () => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  books,
  loans,
  acquisitions,
  branches,
  onAddAcquisition,
  onAdvanceAcquisition,
  onDeleteAcquisition,
  onRequestClearAllData,
}) => {
  const today = getTodayIso();
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [category, setCategory] = useState<string>(BOOK_CATEGORIES[0]);
  const [vendor, setVendor] = useState('');
  const [unitCost, setUnitCost] = useState('25.00');
  const [quantity, setQuantity] = useState('1');
  const [orderedDate, setOrderedDate] = useState(today);
  const [expectedDate, setExpectedDate] = useState(addDaysIso(today, 10));
  const [targetBranch, setTargetBranch] = useState<string>(branches[0] ?? 'Main Library');

  useEffect(() => {
    if (!branches.includes(targetBranch)) {
      setTargetBranch(branches[0] ?? 'Main Library');
    }
  }, [branches, targetBranch]);

  const categoryBreakdown = useMemo(() => {
    const counts = new Map<
      string,
      { titles: number; copies: number; checkouts: number }
    >();
    books.forEach((b) => {
      const existing = counts.get(b.category) ?? { titles: 0, copies: 0, checkouts: 0 };
      counts.set(b.category, {
        titles: existing.titles + 1,
        copies: existing.copies + b.copies.length,
        checkouts: existing.checkouts + b.totalCheckouts,
      });
    });
    return Array.from(counts.entries()).sort((a, b) => b[1].copies - a[1].copies);
  }, [books]);

  const maxCopies = useMemo(
    () => Math.max(1, ...categoryBreakdown.map(([, v]) => v.copies)),
    [categoryBreakdown]
  );

  const totalBudgetCommitted = useMemo(
    () => acquisitions.reduce((sum, a) => sum + a.unitCost * a.quantity, 0),
    [acquisitions]
  );

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) return;
    onAddAcquisition({
      title: title.trim(),
      author: author.trim(),
      isbn: isbn.trim() || 'N/A',
      category,
      vendor: vendor.trim() || 'Direct Vendor',
      unitCost: Math.max(0, Number(unitCost) || 0),
      quantity: Math.max(1, Number(quantity) || 1),
      orderedDate,
      expectedDate,
      targetBranch,
    });
    setTitle('');
    setAuthor('');
    setIsbn('');
    setVendor('');
  };

  const handleExportReport = () => {
    downloadCsv(
      `library-report-${today}.csv`,
      ['Category', 'Titles', 'Copies', 'Total Checkouts'],
      categoryBreakdown.map(([cat, stats]) => [
        cat,
        stats.titles,
        stats.copies,
        stats.checkouts,
      ])
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#191c1e]">
            Orders & Reports
          </h1>
          <p className="mt-1 text-sm text-[#454652]">
            Track book purchase orders, inspect real collection metrics, and export CSV reports
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRequestClearAllData}
            className="inline-flex items-center gap-2 rounded border border-[#f5b7b1] bg-white px-3.5 py-2 text-sm font-medium text-[#ba1a1a] transition-colors hover:bg-[#ffdad6]/50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear All Data</span>
          </button>
          {categoryBreakdown.length > 0 && (
            <button
              type="button"
              onClick={handleExportReport}
              className="inline-flex items-center gap-2 rounded bg-[#24389c] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1c2c7e] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Export Report CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Collection Composition + Purchase Order Form */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="rounded-lg border border-[#e0e3e5] bg-white p-5 lg:col-span-7">
          <h2 className="text-base font-semibold text-[#191c1e]">
            Collection Breakdown
          </h2>
          <p className="mt-0.5 text-xs text-[#454652] tabular-nums">
            Computed from your {books.length} books and {loans.length} recorded loans
          </p>

          {categoryBreakdown.length === 0 ? (
            <div className="mt-5 rounded border border-dashed border-[#c5c5d4] bg-[#f7f9fb] px-4 py-12 text-center text-sm text-[#454652]">
              Add books to your catalog to view real category counts and borrowing totals.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {categoryBreakdown.map(([cat, stats]) => {
                const pct = Math.round((stats.copies / maxCopies) * 100);
                return (
                  <div key={cat}>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-medium text-[#191c1e]">{cat}</span>
                      <span className="font-mono text-[#505f76] tabular-nums">
                        {stats.titles} {stats.titles === 1 ? 'title' : 'titles'} ·{' '}
                        {stats.copies} {stats.copies === 1 ? 'copy' : 'copies'} ·{' '}
                        <strong className="text-[#191c1e]">{stats.checkouts} loans</strong>
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-xs bg-[#eceef0]">
                      <div
                        className="h-full rounded-xs bg-[#24389c]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* New Purchase Order Card */}
        <section className="rounded-lg border border-[#e0e3e5] bg-white p-5 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-[#eceef0] pb-3.5">
            <div>
              <h2 className="text-base font-semibold text-[#191c1e]">
                Add Purchase Order
              </h2>
              <p className="text-xs text-[#454652] tabular-nums">
                Total Order Spend: ${totalBudgetCommitted.toFixed(2)}
              </p>
            </div>
            <PackagePlus className="h-4 w-4 text-[#24389c]" aria-hidden="true" />
          </div>

          <form onSubmit={handleOrderSubmit} className="mt-4 space-y-3">
            <div>
              <label htmlFor="acq-title" className="block text-xs font-medium text-[#191c1e]">
                Book Title
              </label>
              <input
                id="acq-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter book title"
                className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-3 py-1.5 text-sm text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="acq-author" className="block text-xs font-medium text-[#191c1e]">
                  Author
                </label>
                <input
                  id="acq-author"
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Author name"
                  className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-3 py-1.5 text-sm text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
                  required
                />
              </div>
              <div>
                <label htmlFor="acq-isbn" className="block text-xs font-medium text-[#191c1e]">
                  ISBN
                </label>
                <input
                  id="acq-isbn"
                  type="text"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="Optional ISBN"
                  className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-3 py-1.5 font-mono text-xs text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="acq-cat" className="block text-xs font-medium text-[#191c1e]">
                  Category
                </label>
                <select
                  id="acq-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 text-sm text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
                >
                  {BOOK_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="acq-branch" className="block text-xs font-medium text-[#191c1e]">
                  Target Branch
                </label>
                <select
                  id="acq-branch"
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 text-sm text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
                >
                  {branches.map((branch) => (
                    <option key={branch} value={branch}>
                      {branch}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="acq-vendor" className="block text-xs font-medium text-[#191c1e]">
                  Supplier
                </label>
                <input
                  id="acq-vendor"
                  type="text"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  placeholder="Bookstore / Press"
                  className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 text-sm text-[#191c1e]"
                />
              </div>
              <div>
                <label htmlFor="acq-cost" className="block text-xs font-medium text-[#191c1e]">
                  Price ($)
                </label>
                <input
                  id="acq-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 font-mono text-sm tabular-nums text-[#191c1e]"
                />
              </div>
              <div>
                <label htmlFor="acq-qty" className="block text-xs font-medium text-[#191c1e]">
                  Qty
                </label>
                <input
                  id="acq-qty"
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 font-mono text-sm tabular-nums text-[#191c1e]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="acq-ordered" className="block text-xs font-medium text-[#191c1e]">
                  Order Date
                </label>
                <input
                  id="acq-ordered"
                  type="date"
                  value={orderedDate}
                  onChange={(e) => setOrderedDate(e.target.value)}
                  className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 font-mono text-xs text-[#191c1e]"
                />
              </div>
              <div>
                <label htmlFor="acq-expected" className="block text-xs font-medium text-[#191c1e]">
                  Expected Date
                </label>
                <input
                  id="acq-expected"
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="mt-1 w-full rounded border border-[#c5c5d4] bg-white px-2.5 py-1.5 font-mono text-xs text-[#191c1e]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded bg-[#24389c] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1c2c7e] cursor-pointer"
            >
              Add Purchase Order
            </button>
          </form>
        </section>
      </div>

      {/* Acquisitions Table */}
      <section className="overflow-hidden rounded-lg border border-[#e0e3e5] bg-white">
        <div className="border-b border-[#e0e3e5] px-5 py-4">
          <h2 className="text-base font-semibold text-[#191c1e]">
            Purchase Orders
          </h2>
          <p className="text-xs text-[#454652]">
            Receive arriving orders and add them directly into your book catalog
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#e0e3e5] bg-[#f7f9fb] text-xs font-medium text-[#454652]">
                <th className="px-4 py-2.5">Order ID</th>
                <th className="px-4 py-2.5">Book & Author</th>
                <th className="px-4 py-2.5">Supplier & Branch</th>
                <th className="px-4 py-2.5 text-right">Qty & Cost</th>
                <th className="px-4 py-2.5">Expected</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eceef0]">
              {acquisitions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#454652]">
                    No purchase orders yet. Use the form above to add a new order.
                  </td>
                </tr>
              ) : (
                acquisitions.map((order) => (
                  <tr
                    key={order.id}
                    className="transition-colors hover:bg-[#f7f9fb]"
                  >
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-[#505f76]">
                      {order.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#191c1e]">{order.title}</div>
                      <div className="text-xs text-[#454652]">
                        {order.author} · <span className="font-mono">{order.isbn}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#454652]">
                      <div className="text-[#191c1e]">{order.vendor}</div>
                      <div>{order.targetBranch}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-[#191c1e]">
                      {order.quantity} × ${order.unitCost.toFixed(2)} ={' '}
                      <strong>${(order.quantity * order.unitCost).toFixed(2)}</strong>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs tabular-nums text-[#454652]">
                      {order.expectedDate}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} compact />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {order.status === 'Ordered' && (
                          <button
                            type="button"
                            onClick={() => onAdvanceAcquisition(order.id)}
                            className="rounded border border-[#c5c5d4] bg-white px-2.5 py-1 text-xs font-medium text-[#191c1e] hover:bg-[#f2f4f6] whitespace-nowrap cursor-pointer"
                          >
                            Mark Received
                          </button>
                        )}
                        {order.status === 'In Processing' && (
                          <button
                            type="button"
                            onClick={() => onAdvanceAcquisition(order.id)}
                            className="rounded bg-[#24389c] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#1c2c7e] whitespace-nowrap cursor-pointer"
                          >
                            Add to Books
                          </button>
                        )}
                        {order.status === 'Cataloged' && (
                          <span className="px-2 text-xs font-medium text-[#14532d]">
                            In Catalog
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteAcquisition(order)}
                          aria-label={`Delete order ${order.id}`}
                          title="Delete purchase order"
                          className="rounded border border-[#c5c5d4] bg-white p-1.5 text-[#505f76] hover:bg-[#ffdad6]/50 hover:text-[#ba1a1a] cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
