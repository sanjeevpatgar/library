import React, { useMemo, useState } from 'react';
import {
  Download,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { BOOK_CATEGORIES, Book } from '../types/library';
import {
  downloadCsv,
  getBookAvailabilitySummary,
  getBookCopiesForBranch,
} from '../utils/libraryHelpers';
import { BookCoverPlate } from './BookCoverPlate';
import { StatusBadge } from './StatusBadge';

interface CatalogScreenProps {
  books: Book[];
  activeBranch: string;
  onSelectBook: (book: Book) => void;
  onOpenAddBook: () => void;
  onEditBook: (book: Book) => void;
  onDeleteBook: (book: Book) => void;
  onQuickCheckoutBook: (book: Book) => void;
}

export const CatalogScreen: React.FC<CatalogScreenProps> = ({
  books,
  activeBranch,
  onSelectBook,
  onOpenAddBook,
  onEditBook,
  onDeleteBook,
  onQuickCheckoutBook,
}) => {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories');
  const [availabilityFilter, setAvailabilityFilter] = useState<
    'All' | 'Available' | 'Checked Out' | 'Overdue'
  >('All');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const availableCategories = useMemo(() => {
    const set = new Set<string>(BOOK_CATEGORIES);
    books.forEach((b) => set.add(b.category));
    return ['All Categories', ...Array.from(set)];
  }, [books]);

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return books.filter((book) => {
      const copies = getBookCopiesForBranch(book, activeBranch);
      if (activeBranch !== 'All Branches' && copies.length === 0) return false;

      if (categoryFilter !== 'All Categories' && book.category !== categoryFilter) {
        return false;
      }

      const summary = getBookAvailabilitySummary(book, activeBranch);
      if (availabilityFilter === 'Available' && summary.available === 0) return false;
      if (
        availabilityFilter === 'Checked Out' &&
        !copies.some((c) => c.status === 'Checked Out')
      ) {
        return false;
      }
      if (availabilityFilter === 'Overdue' && !copies.some((c) => c.status === 'Overdue')) {
        return false;
      }

      if (!q) return true;
      return (
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q) ||
        book.isbn.toLowerCase().includes(q) ||
        book.callNumber.toLowerCase().includes(q) ||
        copies.some((c) => c.barcode.toLowerCase().includes(q))
      );
    });
  }, [books, activeBranch, query, categoryFilter, availabilityFilter]);

  const handleExportCsv = () => {
    downloadCsv(
      `library-books-${activeBranch.toLowerCase().replace(/\s+/g, '-')}.csv`,
      [
        'ID',
        'Title',
        'Author',
        'ISBN',
        'Call Number',
        'Category',
        'Publisher',
        'Year',
        'Available Copies',
        'Total Copies',
      ],
      filteredBooks.map((b) => {
        const summary = getBookAvailabilitySummary(b, activeBranch);
        return [
          b.id,
          b.title,
          b.author,
          b.isbn,
          b.callNumber,
          b.category,
          b.publisher,
          b.year,
          summary.available,
          summary.total,
        ];
      })
    );
  };

  const resetFilters = () => {
    setQuery('');
    setCategoryFilter('All Categories');
    setAvailabilityFilter('All');
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#191c1e]">
            Books
          </h1>
          <p className="mt-1 text-sm text-[#454652] tabular-nums">
            {filteredBooks.length} {filteredBooks.length === 1 ? 'book' : 'books'}
            <span className="mx-2 text-[#c5c5d4]" aria-hidden="true">·</span>
            <span>{activeBranch}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {filteredBooks.length > 0 && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 rounded border border-[#c5c5d4] bg-white px-3.5 py-2 text-sm font-medium text-[#191c1e] transition-colors hover:bg-[#f2f4f6] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="h-4 w-4 text-[#505f76]" />
              <span>Export CSV</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenAddBook}
            className="inline-flex items-center gap-2 rounded bg-[#24389c] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1c2c7e] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add Book</span>
          </button>
        </div>
      </div>

      {/* Filter & View Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e0e3e5] bg-white p-3.5">
        <div className="flex min-w-[260px] flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#757684]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title, author, ISBN, call number, or barcode..."
              className="w-full rounded border border-[#c5c5d4] bg-[#f7f9fb] py-2 pr-3 pl-9 text-sm text-[#191c1e] placeholder:text-[#757684] focus:border-[#24389c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[#505f76]" aria-hidden="true" />
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded border border-[#c5c5d4] bg-white px-3 py-2 text-sm text-[#191c1e] focus:border-[#24389c] focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
            >
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            role="group"
            aria-label="Filter by availability"
            className="inline-flex items-center rounded border border-[#e0e3e5] bg-[#f2f4f6] p-0.5"
          >
            {(['All', 'Available', 'Checked Out', 'Overdue'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setAvailabilityFilter(status)}
                className={`rounded-xs px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  availabilityFilter === status
                    ? 'bg-white text-[#191c1e] shadow-2xs'
                    : 'text-[#454652] hover:text-[#191c1e]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div
            role="group"
            aria-label="Catalog layout mode"
            className="inline-flex items-center rounded border border-[#e0e3e5] bg-[#f2f4f6] p-0.5"
          >
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              aria-label="Grid view"
              className={`inline-flex items-center gap-1.5 rounded-xs px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-white text-[#191c1e] shadow-2xs'
                  : 'text-[#454652] hover:text-[#191c1e]'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              aria-label="Table view"
              className={`inline-flex items-center gap-1.5 rounded-xs px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#191c1e] shadow-2xs'
                  : 'text-[#454652] hover:text-[#191c1e]'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Empty States */}
      {books.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-[#e0e3e5] bg-white px-6 py-16 text-center">
          <p className="text-base font-semibold text-[#191c1e]">
            Your book catalog is empty
          </p>
          <p className="mt-1 max-w-md text-sm text-[#454652]">
            Add your first book with title, author, ISBN, shelf location, and copies. You can edit or delete any detail at any time.
          </p>
          <button
            type="button"
            onClick={onOpenAddBook}
            className="mt-4 inline-flex items-center gap-2 rounded bg-[#24389c] px-4 py-2 text-sm font-medium text-white hover:bg-[#1c2c7e] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add First Book</span>
          </button>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-[#e0e3e5] bg-white px-6 py-16 text-center">
          <p className="text-base font-semibold text-[#191c1e]">
            No books match your filters
          </p>
          <p className="mt-1 max-w-md text-sm text-[#454652]">
            Try clearing your search, switching branches, or resetting the category filter.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 rounded border border-[#c5c5d4] bg-white px-4 py-2 text-sm font-medium text-[#191c1e] hover:bg-[#f2f4f6] cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredBooks.map((book) => {
            const summary = getBookAvailabilitySummary(book, activeBranch);
            return (
              <article
                key={book.id}
                className="flex flex-col justify-between rounded-lg border border-[#e0e3e5] bg-white p-4 transition-colors hover:border-[#c5c5d4]"
              >
                <div>
                  <div className="flex gap-3.5">
                    <button
                      type="button"
                      onClick={() => onSelectBook(book)}
                      className="w-24 shrink-0 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#24389c] cursor-pointer"
                    >
                      <BookCoverPlate book={book} size="md" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-1">
                        <span className="truncate text-[11px] font-medium text-[#505f76]">
                          {book.category}
                        </span>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onEditBook(book)}
                            aria-label={`Edit ${book.title}`}
                            title="Edit book details"
                            className="rounded p-1 text-[#505f76] hover:bg-[#f2f4f6] hover:text-[#191c1e] cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteBook(book)}
                            aria-label={`Delete ${book.title}`}
                            title="Delete book"
                            className="rounded p-1 text-[#505f76] hover:bg-[#ffdad6]/60 hover:text-[#ba1a1a] cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                      <h3 className="mt-1 text-sm font-semibold leading-snug text-[#191c1e] line-clamp-2">
                        <button
                          type="button"
                          onClick={() => onSelectBook(book)}
                          className="text-left hover:text-[#24389c] hover:underline cursor-pointer"
                        >
                          {book.title}
                        </button>
                      </h3>
                      <p className="mt-1 text-xs text-[#454652] truncate">{book.author}</p>
                      <div className="mt-2 font-mono text-[11px] text-[#505f76] tabular-nums truncate">
                        {book.callNumber || book.isbn}
                      </div>
                      <div className="mt-1 text-[11px] text-[#757684] tabular-nums">
                        {book.year} · {book.format} · {book.pages}p
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[#eceef0] pt-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <StatusBadge status={summary.primaryStatus} compact />
                    <span className="font-mono text-[11px] text-[#505f76] tabular-nums whitespace-nowrap">
                      {summary.available}/{summary.total}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectBook(book)}
                      className="rounded border border-[#c5c5d4] bg-white px-2.5 py-1 text-xs font-medium text-[#191c1e] hover:bg-[#f2f4f6] cursor-pointer"
                    >
                      Details
                    </button>
                    {summary.available > 0 && (
                      <button
                        type="button"
                        onClick={() => onQuickCheckoutBook(book)}
                        className="rounded bg-[#24389c] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#1c2c7e] cursor-pointer"
                      >
                        Lend
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#e0e3e5] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#e0e3e5] bg-[#f7f9fb] text-xs font-medium text-[#454652]">
                  <th className="px-4 py-3">Book & Author</th>
                  <th className="px-4 py-3">Call No. & ISBN</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Copies</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceef0]">
                {filteredBooks.map((book) => {
                  const summary = getBookAvailabilitySummary(book, activeBranch);
                  return (
                    <tr
                      key={book.id}
                      className="transition-colors hover:bg-[#f7f9fb]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <BookCoverPlate book={book} size="sm" />
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => onSelectBook(book)}
                              className="font-medium text-[#191c1e] hover:text-[#24389c] hover:underline text-left cursor-pointer"
                            >
                              {book.title}
                            </button>
                            <div className="text-xs text-[#454652]">
                              {book.author} · {book.publisher} ({book.year})
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs tabular-nums text-[#191c1e]">
                        <div>{book.callNumber || '—'}</div>
                        <div className="text-[11px] text-[#505f76]">{book.isbn}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#454652]">
                        <div>{book.category}</div>
                        <div className="text-[11px] text-[#757684]">{book.format}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-[#191c1e]">
                        {summary.available} / {summary.total}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={summary.primaryStatus} compact />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {summary.available > 0 && (
                            <button
                              type="button"
                              onClick={() => onQuickCheckoutBook(book)}
                              className="rounded bg-[#24389c] px-2.5 py-1 text-xs font-medium text-white hover:bg-[#1c2c7e] cursor-pointer"
                            >
                              Lend
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onEditBook(book)}
                            aria-label={`Edit ${book.title}`}
                            className="rounded border border-[#c5c5d4] bg-white px-2.5 py-1 text-xs font-medium text-[#191c1e] hover:bg-[#f2f4f6] cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteBook(book)}
                            aria-label={`Delete ${book.title}`}
                            className="rounded border border-[#c5c5d4] bg-white px-2.5 py-1 text-xs font-medium text-[#ba1a1a] hover:bg-[#ffdad6]/50 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
