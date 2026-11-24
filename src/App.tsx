import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BarChart3,
  BookMarked,
  BookOpen,
  Building2,
  CheckCircle2,
  Landmark,
  LayoutDashboard,
  Menu,
  Repeat,
  Search,
  Settings2,
  Users,
  X,
} from 'lucide-react';
import { CatalogScreen } from './components/CatalogScreen';
import { CirculationScreen } from './components/CirculationScreen';
import { HoldsScreen } from './components/HoldsScreen';
import {
  BookDetailDrawer,
  BookFormModal,
  ConfirmDeleteModal,
  ManageBranchesModal,
  MemberFormModal,
  PatronDetailDrawer,
  QuickCheckoutModal,
} from './components/ModalsAndDrawers';
import { OverviewScreen } from './components/OverviewScreen';
import { PatronsScreen } from './components/PatronsScreen';
import { ReportsScreen } from './components/ReportsScreen';
import {
  DEFAULT_BRANCHES,
  INITIAL_ACQUISITIONS,
  INITIAL_BOOKS,
  INITIAL_HOLDS,
  INITIAL_LOANS,
  INITIAL_PATRONS,
  getTodayIso,
} from './data/seedData';
import {
  AcquisitionOrder,
  Book,
  BookCopy,
  HoldRequest,
  Loan,
  NavSection,
  Patron,
} from './types/library';
import {
  addDaysIso,
  computeLoanStatus,
  getLoanActiveCountForPatron,
} from './utils/libraryHelpers';

const STORAGE_KEY = 'athenaeum_lms_data_v2';

interface PersistedState {
  books: Book[];
  patrons: Patron[];
  loans: Loan[];
  holds: HoldRequest[];
  acquisitions: AcquisitionOrder[];
  branches: string[];
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (
        Array.isArray(parsed.books) &&
        Array.isArray(parsed.patrons) &&
        Array.isArray(parsed.loans) &&
        Array.isArray(parsed.holds) &&
        Array.isArray(parsed.acquisitions)
      ) {
        const refreshedLoans = parsed.loans.map((l) => ({
          ...l,
          status: computeLoanStatus(l.dueDate, l.returnedDate),
        }));
        return {
          books: parsed.books,
          patrons: parsed.patrons,
          loans: refreshedLoans,
          holds: parsed.holds,
          acquisitions: parsed.acquisitions,
          branches:
            Array.isArray(parsed.branches) && parsed.branches.length > 0
              ? parsed.branches
              : DEFAULT_BRANCHES,
        };
      }
    }
  } catch {
    // Fallback to clean empty state
  }
  return {
    books: INITIAL_BOOKS,
    patrons: INITIAL_PATRONS,
    loans: INITIAL_LOANS,
    holds: INITIAL_HOLDS,
    acquisitions: INITIAL_ACQUISITIONS,
    branches: DEFAULT_BRANCHES,
  };
}

const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  Icon: React.FC<{ className?: string }>;
}> = [
  { id: 'overview', label: 'Dashboard', Icon: LayoutDashboard },
  { id: 'catalog', label: 'Books', Icon: BookOpen },
  { id: 'circulation', label: 'Borrow & Return', Icon: Repeat },
  { id: 'patrons', label: 'Members', Icon: Users },
  { id: 'holds', label: 'Reservations', Icon: BookMarked },
  { id: 'reports', label: 'Orders & Reports', Icon: BarChart3 },
];

const SECTION_TITLES: Record<NavSection, string> = {
  overview: 'Dashboard',
  catalog: 'Books',
  circulation: 'Borrow & Return',
  patrons: 'Members',
  holds: 'Reservations',
  reports: 'Orders & Reports',
};

type PendingDelete =
  | { type: 'book'; book: Book }
  | { type: 'copy'; bookId: string; barcode: string }
  | { type: 'member'; patron: Patron }
  | { type: 'loan'; loan: Loan }
  | { type: 'hold'; hold: HoldRequest }
  | { type: 'order'; order: AcquisitionOrder }
  | { type: 'clear-all' };

export default function App() {
  const [initial] = useState<PersistedState>(() => loadInitialState());
  const [books, setBooks] = useState<Book[]>(initial.books);
  const [patrons, setPatrons] = useState<Patron[]>(initial.patrons);
  const [loans, setLoans] = useState<Loan[]>(initial.loans);
  const [holds, setHolds] = useState<HoldRequest[]>(initial.holds);
  const [acquisitions, setAcquisitions] = useState<AcquisitionOrder[]>(initial.acquisitions);
  const [branches, setBranches] = useState<string[]>(initial.branches);

  const [activeNav, setActiveNav] = useState<NavSection>('overview');
  const [activeBranch, setActiveBranch] = useState<string>('All Branches');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [globalSearch, setGlobalSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedPatronId, setSelectedPatronId] = useState<string | null>(null);

  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);

  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Patron | null>(null);

  const [quickCheckoutOpen, setQuickCheckoutOpen] = useState(false);
  const [quickCheckoutBook, setQuickCheckoutBook] = useState<Book | null>(null);

  const [branchesModalOpen, setBranchesModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const [toast, setToast] = useState<{ message: string; tone: 'info' | 'error' } | null>(null);

  // Persist to localStorage
  useEffect(() => {
    try {
      const payload: PersistedState = {
        books,
        patrons,
        loans,
        holds,
        acquisitions,
        branches,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [books, patrons, loans, holds, acquisitions, branches]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Close search dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Close overlays on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setSelectedBookId(null);
        setSelectedPatronId(null);
        setBookModalOpen(false);
        setMemberModalOpen(false);
        setQuickCheckoutOpen(false);
        setBranchesModalOpen(false);
        setPendingDelete(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const notify = (message: string, tone: 'info' | 'error' = 'info') => {
    setToast({ message, tone });
  };

  const selectedBook = useMemo(
    () => books.find((b) => b.id === selectedBookId) ?? null,
    [books, selectedBookId]
  );
  const selectedPatron = useMemo(
    () => patrons.find((p) => p.id === selectedPatronId) ?? null,
    [patrons, selectedPatronId]
  );

  // Global search results
  const searchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return { books: [], patrons: [] };
    return {
      books: books
        .filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            b.isbn.toLowerCase().includes(q) ||
            b.callNumber.toLowerCase().includes(q) ||
            b.copies.some((c) => c.barcode.toLowerCase().includes(q))
        )
        .slice(0, 5),
      patrons: patrons
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.cardNumber.toLowerCase().includes(q) ||
            p.email.toLowerCase().includes(q)
        )
        .slice(0, 4),
    };
  }, [globalSearch, books, patrons]);

  const overdueCount = useMemo(
    () => loans.filter((l) => l.status === 'Overdue' || l.status === 'Due Today').length,
    [loans]
  );
  const readyHoldsCount = useMemo(
    () => holds.filter((h) => h.status === 'Ready for Pickup').length,
    [holds]
  );

  /* ------------------------------------------------------------------------ */
  /* Book CRUD                                                                */
  /* ------------------------------------------------------------------------ */
  const handleAddBook = (newBookData: Omit<Book, 'id' | 'totalCheckouts'>) => {
    const created: Book = {
      ...newBookData,
      id: `bk-${Date.now().toString().slice(-6)}`,
      totalCheckouts: 0,
    };
    setBooks((prev) => [created, ...prev]);
    notify(`Added "${created.title}" to your book catalog.`);
  };

  const handleEditBook = (
    bookId: string,
    updates: Omit<Book, 'id' | 'totalCheckouts' | 'copies'>
  ) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, ...updates } : b))
    );
    notify(`Updated details for "${updates.title}".`);
  };

  const handleAddCopyToBook = (
    bookId: string,
    branch: string,
    shelfLocation: string,
    customBarcode?: string
  ) => {
    const barcode =
      customBarcode || `BK-${Math.floor(10000 + Math.random() * 89000)}-C`;
    if (books.some((b) => b.copies.some((c) => c.barcode === barcode))) {
      notify(`Barcode ${barcode} already exists. Please use a unique barcode.`, 'error');
      return;
    }
    setBooks((prev) =>
      prev.map((b) =>
        b.id !== bookId
          ? b
          : {
              ...b,
              copies: [
                ...b.copies,
                { barcode, branch, shelfLocation, status: 'Available' },
              ],
            }
      )
    );
    notify(`Added copy ${barcode} (${branch}).`);
  };

  const handleUpdateCopy = (
    bookId: string,
    barcode: string,
    updates: Pick<BookCopy, 'branch' | 'shelfLocation'>
  ) => {
    setBooks((prev) =>
      prev.map((b) =>
        b.id !== bookId
          ? b
          : {
              ...b,
              copies: b.copies.map((c) =>
                c.barcode === barcode ? { ...c, ...updates } : c
              ),
            }
      )
    );
    notify(`Updated location for copy ${barcode}.`);
  };

  /* ------------------------------------------------------------------------ */
  /* Member CRUD                                                              */
  /* ------------------------------------------------------------------------ */
  const handleAddMember = (data: Omit<Patron, 'id'>) => {
    const created: Patron = {
      ...data,
      id: `mem-${Date.now().toString().slice(-6)}`,
    };
    setPatrons((prev) => [created, ...prev]);
    notify(`Added member ${created.name} (${created.cardNumber}).`);
  };

  const handleEditMember = (patronId: string, updates: Omit<Patron, 'id'>) => {
    setPatrons((prev) =>
      prev.map((p) => (p.id === patronId ? { ...p, ...updates } : p))
    );
    notify(`Updated member profile for ${updates.name}.`);
  };

  const handleSettleFines = (patronId: string) => {
    const patron = patrons.find((p) => p.id === patronId);
    if (!patron) return;
    setPatrons((prev) =>
      prev.map((p) =>
        p.id === patronId
          ? {
              ...p,
              finesOwed: 0,
              standing: p.standing === 'Fines Due' ? 'Good Standing' : p.standing,
            }
          : p
      )
    );
    notify(`Cleared $${patron.finesOwed.toFixed(2)} fine for ${patron.name}.`);
  };

  const handleToggleSuspend = (patronId: string) => {
    const patron = patrons.find((p) => p.id === patronId);
    if (!patron) return;
    const nextStanding =
      patron.standing === 'Suspended'
        ? patron.finesOwed > 0
          ? 'Fines Due'
          : 'Good Standing'
        : 'Suspended';
    setPatrons((prev) =>
      prev.map((p) => (p.id === patronId ? { ...p, standing: nextStanding } : p))
    );
    notify(`${patron.name}'s card is now ${nextStanding}.`);
  };

  /* ------------------------------------------------------------------------ */
  /* Circulation & Reservations                                               */
  /* ------------------------------------------------------------------------ */
  const handleCheckout = (
    barcode: string,
    patronId: string,
    checkoutDate: string,
    dueDate: string
  ) => {
    const patron = patrons.find((p) => p.id === patronId);
    if (!patron) return;

    if (patron.standing === 'Suspended') {
      notify(`${patron.name}'s card is suspended and cannot borrow books.`, 'error');
      return;
    }

    const activeCount = getLoanActiveCountForPatron(loans, patron.id);
    if (activeCount >= patron.maxLoans) {
      notify(
        `${patron.name} has reached their borrow limit of ${patron.maxLoans} books.`,
        'error'
      );
      return;
    }

    let targetBook: Book | undefined;
    let targetBranch = branches[0] ?? 'Main Library';

    for (const b of books) {
      const copy = b.copies.find((c) => c.barcode === barcode);
      if (copy) {
        if (copy.status !== 'Available' && copy.status !== 'Reserved') {
          notify(`Copy ${barcode} is currently not available.`, 'error');
          return;
        }
        targetBook = b;
        targetBranch = copy.branch;
        break;
      }
    }

    if (!targetBook) {
      notify(`Copy barcode ${barcode} not found.`, 'error');
      return;
    }

    const status = computeLoanStatus(dueDate);
    const newLoan: Loan = {
      id: `LN-${Math.floor(1000 + Math.random() * 8999)}`,
      bookId: targetBook.id,
      barcode,
      patronId: patron.id,
      checkoutDate,
      dueDate,
      renewals: 0,
      status,
      branch: targetBranch,
    };

    setBooks((prev) =>
      prev.map((b) =>
        b.id !== targetBook!.id
          ? b
          : {
              ...b,
              totalCheckouts: b.totalCheckouts + 1,
              copies: b.copies.map((c) =>
                c.barcode === barcode
                  ? { ...c, status: status === 'Overdue' ? 'Overdue' : 'Checked Out' }
                  : c
              ),
            }
      )
    );
    setLoans((prev) => [newLoan, ...prev]);
    setHolds((prev) =>
      prev.map((h) =>
        h.bookId === targetBook!.id &&
        h.patronId === patron.id &&
        h.status === 'Ready for Pickup'
          ? { ...h, status: 'Fulfilled' }
          : h
      )
    );

    notify(`Lent "${targetBook.title}" to ${patron.name} · Due ${dueDate}.`);
  };

  const handleReturnLoan = (loanId: string) => {
    const today = getTodayIso();
    const loan = loans.find((l) => l.id === loanId);
    if (!loan || loan.status === 'Returned') return;

    const book = books.find((b) => b.id === loan.bookId);
    const waitingHold = holds.find(
      (h) => h.bookId === loan.bookId && h.status === 'Waiting'
    );

    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId ? { ...l, status: 'Returned', returnedDate: today } : l
      )
    );

    setBooks((prev) =>
      prev.map((b) =>
        b.id !== loan.bookId
          ? b
          : {
              ...b,
              copies: b.copies.map((c) =>
                c.barcode === loan.barcode
                  ? { ...c, status: waitingHold ? 'Reserved' : 'Available' }
                  : c
              ),
            }
      )
    );

    if (waitingHold) {
      setHolds((prev) =>
        prev.map((h) =>
          h.id === waitingHold.id
            ? {
                ...h,
                status: 'Ready for Pickup',
                expiryDate: addDaysIso(today, 5),
              }
            : h
        )
      );
      notify(
        `Returned "${book?.title ?? loan.barcode}" and assigned it to the next reservation.`
      );
    } else {
      notify(`Returned "${book?.title ?? loan.barcode}" to shelf.`);
    }
  };

  const handleRenewLoan = (loanId: string) => {
    const today = getTodayIso();
    const loan = loans.find((l) => l.id === loanId);
    if (!loan || loan.status === 'Returned') return;

    const baseDate = loan.dueDate > today ? loan.dueDate : today;
    const newDueDate = addDaysIso(baseDate, 14);

    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? { ...l, dueDate: newDueDate, renewals: l.renewals + 1, status: 'Active' }
          : l
      )
    );
    setBooks((prev) =>
      prev.map((b) =>
        b.id !== loan.bookId
          ? b
          : {
              ...b,
              copies: b.copies.map((c) =>
                c.barcode === loan.barcode ? { ...c, status: 'Checked Out' } : c
              ),
            }
      )
    );
    notify(`Extended due date for ${loan.barcode} to ${newDueDate}.`);
  };

  const handlePlaceHold = (
    bookId: string,
    patronId: string,
    branch: string,
    notes?: string
  ) => {
    const today = getTodayIso();
    const book = books.find((b) => b.id === bookId);
    const patron = patrons.find((p) => p.id === patronId);
    if (!book || !patron) return;

    const existingActive = holds.filter(
      (h) => h.bookId === bookId && h.status !== 'Fulfilled' && h.status !== 'Cancelled'
    );
    const availCopy = book.copies.find(
      (c) => c.status === 'Available' && c.branch === branch
    );

    const newHold: HoldRequest = {
      id: `RES-${Math.floor(100 + Math.random() * 899)}`,
      bookId,
      patronId,
      requestedDate: today,
      pickupBranch: branch,
      expiryDate: availCopy ? addDaysIso(today, 5) : undefined,
      queuePosition: existingActive.length + 1,
      status: availCopy ? 'Ready for Pickup' : 'Waiting',
      notes,
    };

    if (availCopy) {
      setBooks((prev) =>
        prev.map((b) =>
          b.id !== bookId
            ? b
            : {
                ...b,
                copies: b.copies.map((c) =>
                  c.barcode === availCopy.barcode ? { ...c, status: 'Reserved' } : c
                ),
              }
        )
      );
    }

    setHolds((prev) => [newHold, ...prev]);
    notify(`Reserved "${book.title}" for ${patron.name}.`);
  };

  const handleMarkHoldReady = (holdId: string) => {
    const today = getTodayIso();
    setHolds((prev) =>
      prev.map((h) =>
        h.id === holdId
          ? {
              ...h,
              status: 'Ready for Pickup',
              expiryDate: addDaysIso(today, 5),
            }
          : h
      )
    );
    notify(`Reservation ${holdId} marked ready for pickup.`);
  };

  const handleFulfillHold = (holdId: string) => {
    const today = getTodayIso();
    const hold = holds.find((h) => h.id === holdId);
    if (!hold) return;
    const book = books.find((b) => b.id === hold.bookId);
    if (!book) return;

    const candidateCopy =
      book.copies.find((c) => c.status === 'Reserved') ??
      book.copies.find((c) => c.status === 'Available');

    if (!candidateCopy) {
      notify(
        `No available or reserved copy found for "${book.title}". Return a copy first.`,
        'error'
      );
      return;
    }

    handleCheckout(candidateCopy.barcode, hold.patronId, today, addDaysIso(today, 14));
    setHolds((prev) =>
      prev.map((h) => (h.id === holdId ? { ...h, status: 'Fulfilled' } : h))
    );
  };

  const handleCancelHold = (holdId: string) => {
    const hold = holds.find((h) => h.id === holdId);
    setHolds((prev) =>
      prev.map((h) => (h.id === holdId ? { ...h, status: 'Cancelled' } : h))
    );
    if (hold && hold.status === 'Ready for Pickup') {
      setBooks((prev) =>
        prev.map((b) => {
          if (b.id !== hold.bookId) return b;
          const reservedIdx = b.copies.findIndex((c) => c.status === 'Reserved');
          if (reservedIdx === -1) return b;
          return {
            ...b,
            copies: b.copies.map((c, i) =>
              i === reservedIdx ? { ...c, status: 'Available' } : c
            ),
          };
        })
      );
    }
    notify(`Cancelled reservation ${holdId}.`);
  };

  /* ------------------------------------------------------------------------ */
  /* Acquisitions & Branches                                                  */
  /* ------------------------------------------------------------------------ */
  const handleAddAcquisition = (orderData: Omit<AcquisitionOrder, 'id' | 'status'>) => {
    const order: AcquisitionOrder = {
      ...orderData,
      id: `PO-${Math.floor(100 + Math.random() * 899)}`,
      status: 'Ordered',
    };
    setAcquisitions((prev) => [order, ...prev]);
    notify(`Added purchase order ${order.id} for "${order.title}".`);
  };

  const handleAdvanceAcquisition = (orderId: string) => {
    const order = acquisitions.find((o) => o.id === orderId);
    if (!order) return;

    if (order.status === 'Ordered') {
      setAcquisitions((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'In Processing' } : o))
      );
      notify(`Order ${order.id} marked as received.`);
    } else if (order.status === 'In Processing') {
      setAcquisitions((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'Cataloged' } : o))
      );
      const baseCode = Math.floor(10000 + Math.random() * 89000);
      const copies = Array.from({ length: order.quantity }, (_, idx) => ({
        barcode: `BK-${baseCode}-${String.fromCharCode(65 + idx)}`,
        branch: order.targetBranch,
        shelfLocation: 'New Arrivals',
        status: 'Available' as const,
      }));
      const newBook: Book = {
        id: `bk-${Date.now().toString().slice(-6)}`,
        title: order.title,
        author: order.author,
        isbn: order.isbn,
        callNumber: '',
        category: order.category,
        publisher: order.vendor,
        year: new Date().getFullYear(),
        pages: 250,
        format: 'Hardcover',
        language: 'English',
        description: `Added from purchase order ${order.id} (${order.vendor}).`,
        coverTone: 'indigo',
        coverMotif: 'monograph',
        copies,
        totalCheckouts: 0,
      };
      setBooks((prev) => [newBook, ...prev]);
      notify(`Added ${order.quantity} copy(ies) of "${order.title}" to Books.`);
    }
  };

  const handleAddBranch = (name: string) => {
    if (branches.some((b) => b.toLowerCase() === name.toLowerCase())) {
      notify(`Branch "${name}" already exists.`, 'error');
      return;
    }
    setBranches((prev) => [...prev, name]);
    notify(`Added branch "${name}".`);
  };

  const handleDeleteBranch = (name: string) => {
    if (branches.length <= 1) return;
    setBranches((prev) => prev.filter((b) => b !== name));
    if (activeBranch === name) {
      setActiveBranch('All Branches');
    }
    notify(`Removed branch "${name}".`);
  };

  /* ------------------------------------------------------------------------ */
  /* Delete Confirmation Execution                                            */
  /* ------------------------------------------------------------------------ */
  const executePendingDelete = () => {
    if (!pendingDelete) return;

    if (pendingDelete.type === 'book') {
      const targetId = pendingDelete.book.id;
      setBooks((prev) => prev.filter((b) => b.id !== targetId));
      setLoans((prev) => prev.filter((l) => l.bookId !== targetId));
      setHolds((prev) => prev.filter((h) => h.bookId !== targetId));
      if (selectedBookId === targetId) setSelectedBookId(null);
      notify(`Deleted book "${pendingDelete.book.title}".`);
    } else if (pendingDelete.type === 'copy') {
      const { bookId, barcode } = pendingDelete;
      setBooks((prev) =>
        prev.map((b) =>
          b.id !== bookId
            ? b
            : { ...b, copies: b.copies.filter((c) => c.barcode !== barcode) }
        )
      );
      setLoans((prev) => prev.filter((l) => l.barcode !== barcode));
      notify(`Deleted copy ${barcode}.`);
    } else if (pendingDelete.type === 'member') {
      const patronId = pendingDelete.patron.id;
      const activeBarcodes = new Set(
        loans
          .filter((l) => l.patronId === patronId && l.status !== 'Returned')
          .map((l) => l.barcode)
      );
      if (activeBarcodes.size > 0) {
        setBooks((prev) =>
          prev.map((b) => ({
            ...b,
            copies: b.copies.map((c) =>
              activeBarcodes.has(c.barcode) ? { ...c, status: 'Available' } : c
            ),
          }))
        );
      }
      setPatrons((prev) => prev.filter((p) => p.id !== patronId));
      setLoans((prev) => prev.filter((l) => l.patronId !== patronId));
      setHolds((prev) => prev.filter((h) => h.patronId !== patronId));
      if (selectedPatronId === patronId) setSelectedPatronId(null);
      notify(`Deleted member "${pendingDelete.patron.name}".`);
    } else if (pendingDelete.type === 'loan') {
      const loan = pendingDelete.loan;
      if (loan.status !== 'Returned') {
        setBooks((prev) =>
          prev.map((b) =>
            b.id !== loan.bookId
              ? b
              : {
                  ...b,
                  copies: b.copies.map((c) =>
                    c.barcode === loan.barcode ? { ...c, status: 'Available' } : c
                  ),
                }
          )
        );
      }
      setLoans((prev) => prev.filter((l) => l.id !== loan.id));
      notify(`Deleted loan record ${loan.id}.`);
    } else if (pendingDelete.type === 'hold') {
      const hold = pendingDelete.hold;
      if (hold.status === 'Ready for Pickup') {
        setBooks((prev) =>
          prev.map((b) => {
            if (b.id !== hold.bookId) return b;
            const idx = b.copies.findIndex((c) => c.status === 'Reserved');
            if (idx === -1) return b;
            return {
              ...b,
              copies: b.copies.map((c, i) =>
                i === idx ? { ...c, status: 'Available' } : c
              ),
            };
          })
        );
      }
      setHolds((prev) => prev.filter((h) => h.id !== hold.id));
      notify(`Deleted reservation ${hold.id}.`);
    } else if (pendingDelete.type === 'order') {
      setAcquisitions((prev) => prev.filter((o) => o.id !== pendingDelete.order.id));
      notify(`Deleted purchase order ${pendingDelete.order.id}.`);
    } else if (pendingDelete.type === 'clear-all') {
      localStorage.removeItem(STORAGE_KEY);
      setBooks([]);
      setPatrons([]);
      setLoans([]);
      setHolds([]);
      setAcquisitions([]);
      setBranches(DEFAULT_BRANCHES);
      setActiveBranch('All Branches');
      setSelectedBookId(null);
      setSelectedPatronId(null);
      notify('Cleared all library records.');
    }

    setPendingDelete(null);
  };

  const confirmDialogText = useMemo(() => {
    if (!pendingDelete) return { title: '', description: '', label: 'Delete' };
    switch (pendingDelete.type) {
      case 'book':
        return {
          title: 'Delete Book',
          description: `Delete "${pendingDelete.book.title}" and all its copies, loan history, and reservations? This action cannot be undone.`,
          label: 'Delete Book',
        };
      case 'copy':
        return {
          title: 'Delete Copy',
          description: `Remove physical copy ${pendingDelete.barcode} from this book? Any open loan for this barcode will also be removed.`,
          label: 'Delete Copy',
        };
      case 'member':
        return {
          title: 'Delete Member',
          description: `Delete member "${pendingDelete.patron.name}" (${pendingDelete.patron.cardNumber})? Any currently borrowed books will be marked available on shelf.`,
          label: 'Delete Member',
        };
      case 'loan':
        return {
          title: 'Delete Loan Record',
          description: `Delete loan record ${pendingDelete.loan.id} (${pendingDelete.loan.barcode})? If the book was still out, it will be marked available.`,
          label: 'Delete Loan',
        };
      case 'hold':
        return {
          title: 'Delete Reservation',
          description: `Permanently delete reservation ${pendingDelete.hold.id}?`,
          label: 'Delete Reservation',
        };
      case 'order':
        return {
          title: 'Delete Purchase Order',
          description: `Delete purchase order ${pendingDelete.order.id} for "${pendingDelete.order.title}"?`,
          label: 'Delete Order',
        };
      case 'clear-all':
        return {
          title: 'Clear All Library Data',
          description:
            'This will permanently delete all books, members, loans, reservations, and purchase orders in your workspace.',
          label: 'Clear Everything',
        };
    }
  }, [pendingDelete]);

  return (
    <div className="flex min-h-screen bg-[#f7f9fb] text-[#191c1e]">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#191c1e]/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Left Sidebar (248px) */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] shrink-0 flex-col border-r border-[#e0e3e5] bg-white transition-transform duration-150 lg:static lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-[#e0e3e5] px-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#24389c] text-white">
              <Landmark className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="text-base font-bold tracking-tight text-[#191c1e] whitespace-nowrap">
              Athenaeum
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
            className="rounded p-1 text-[#505f76] hover:bg-[#f2f4f6] lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Branch Scope & Manage */}
        <div className="border-b border-[#eceef0] px-4 py-3.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="branch-scope"
              className="flex items-center gap-1.5 text-[11px] font-medium text-[#505f76]"
            >
              <Building2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Library Branch</span>
            </label>
            <button
              type="button"
              onClick={() => setBranchesModalOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#24389c] hover:underline cursor-pointer"
            >
              <Settings2 className="h-3 w-3" />
              <span>Manage</span>
            </button>
          </div>
          <select
            id="branch-scope"
            value={activeBranch}
            onChange={(e) => setActiveBranch(e.target.value)}
            className="mt-1.5 w-full rounded border border-[#c5c5d4] bg-[#f7f9fb] px-2.5 py-1.5 text-xs font-medium text-[#191c1e] focus:border-[#24389c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
          >
            <option value="All Branches">All Branches</option>
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </div>

        {/* Primary Navigation */}
        <nav aria-label="Primary navigation" className="flex-1 space-y-1 px-3 py-4">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = activeNav === id;
            const countBadge =
              id === 'circulation' && overdueCount > 0
                ? overdueCount
                : id === 'holds' && readyHoldsCount > 0
                ? readyHoldsCount
                : null;

            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setActiveNav(id);
                  setMobileMenuOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#dee0ff] text-[#24389c]'
                    : 'text-[#454652] hover:bg-[#f2f4f6] hover:text-[#191c1e]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      active ? 'text-[#24389c]' : 'text-[#505f76]'
                    }`}
                    aria-hidden="true"
                  />
                  <span>{label}</span>
                </span>
                {countBadge !== null && (
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${
                      id === 'circulation'
                        ? 'bg-[#ffdad6] text-[#93000a]'
                        : 'bg-[#d0e1fb] text-[#0b1c30]'
                    }`}
                  >
                    {countBadge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Clean Workspace Footer */}
        <div className="border-t border-[#e0e3e5] px-4 py-3.5 text-xs text-[#505f76] tabular-nums">
          <div className="font-medium text-[#191c1e]">
            {books.length} {books.length === 1 ? 'Book' : 'Books'} · {patrons.length}{' '}
            {patrons.length === 1 ? 'Member' : 'Members'}
          </div>
          <div className="mt-0.5 text-[11px]">Saved automatically in browser</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar (64px) */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#e0e3e5] bg-white px-4 sm:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="rounded border border-[#c5c5d4] p-1.5 text-[#191c1e] hover:bg-[#f2f4f6] lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 text-sm truncate">
              <span className="font-medium text-[#505f76]">Athenaeum</span>
              <span className="text-[#c5c5d4]" aria-hidden="true">/</span>
              <span className="font-semibold text-[#191c1e] truncate">
                {SECTION_TITLES[activeNav]}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div ref={searchContainerRef} className="relative hidden sm:block w-64 md:w-80">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#757684]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={globalSearch}
                onFocus={() => setSearchOpen(true)}
                onChange={(e) => {
                  setGlobalSearch(e.target.value);
                  setSearchOpen(true);
                }}
                placeholder="Search books, ISBN, or members..."
                className="w-full rounded border border-[#c5c5d4] bg-[#f7f9fb] py-1.5 pr-3 pl-9 text-sm text-[#191c1e] placeholder:text-[#757684] focus:border-[#24389c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
              />

              {searchOpen && globalSearch.trim().length > 0 && (
                <div className="absolute right-0 left-0 top-full z-40 mt-1.5 overflow-hidden rounded-lg border border-[#c5c5d4] bg-white shadow-lg">
                  {searchResults.books.length === 0 && searchResults.patrons.length === 0 ? (
                    <div className="px-4 py-3 text-xs text-[#454652]">
                      No matching books or members found.
                    </div>
                  ) : (
                    <div className="divide-y divide-[#eceef0]">
                      {searchResults.books.length > 0 && (
                        <div className="p-2">
                          <div className="px-2 py-1 text-[11px] font-semibold text-[#505f76]">
                            Books
                          </div>
                          {searchResults.books.map((book) => (
                            <button
                              key={book.id}
                              type="button"
                              onClick={() => {
                                setSelectedBookId(book.id);
                                setSearchOpen(false);
                                setGlobalSearch('');
                              }}
                              className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-[#f2f4f6] cursor-pointer"
                            >
                              <span className="truncate font-medium text-[#191c1e]">
                                {book.title}
                              </span>
                              <span className="shrink-0 font-mono text-[11px] text-[#505f76]">
                                {book.callNumber || book.isbn}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.patrons.length > 0 && (
                        <div className="p-2">
                          <div className="px-2 py-1 text-[11px] font-semibold text-[#505f76]">
                            Members
                          </div>
                          {searchResults.patrons.map((patron) => (
                            <button
                              key={patron.id}
                              type="button"
                              onClick={() => {
                                setSelectedPatronId(patron.id);
                                setSearchOpen(false);
                                setGlobalSearch('');
                              }}
                              className="flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-[#f2f4f6] cursor-pointer"
                            >
                              <span className="truncate font-medium text-[#191c1e]">
                                {patron.name}
                              </span>
                              <span className="shrink-0 font-mono text-[11px] text-[#505f76]">
                                {patron.cardNumber}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setQuickCheckoutBook(null);
                setQuickCheckoutOpen(true);
              }}
              className="rounded bg-[#24389c] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1c2c7e] whitespace-nowrap shrink-0 cursor-pointer"
            >
              Lend a Book
            </button>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="mx-auto w-full max-w-[1360px] flex-1 px-4 py-6 sm:px-8 sm:py-8">
          {activeNav === 'overview' && (
            <OverviewScreen
              books={books}
              patrons={patrons}
              loans={loans}
              holds={holds}
              activeBranch={activeBranch}
              onNavigate={setActiveNav}
              onSelectBook={(b) => setSelectedBookId(b.id)}
              onOpenAddBook={() => {
                setEditingBook(null);
                setBookModalOpen(true);
              }}
              onOpenAddMember={() => {
                setEditingMember(null);
                setMemberModalOpen(true);
              }}
              onQuickCheckout={handleCheckout}
              onReturnLoan={handleReturnLoan}
              onRenewLoan={handleRenewLoan}
              onFulfillHold={handleFulfillHold}
            />
          )}

          {activeNav === 'catalog' && (
            <CatalogScreen
              books={books}
              activeBranch={activeBranch}
              onSelectBook={(b) => setSelectedBookId(b.id)}
              onOpenAddBook={() => {
                setEditingBook(null);
                setBookModalOpen(true);
              }}
              onEditBook={(b) => {
                setEditingBook(b);
                setBookModalOpen(true);
              }}
              onDeleteBook={(b) => setPendingDelete({ type: 'book', book: b })}
              onQuickCheckoutBook={(b) => {
                setQuickCheckoutBook(b);
                setQuickCheckoutOpen(true);
              }}
            />
          )}

          {activeNav === 'circulation' && (
            <CirculationScreen
              books={books}
              patrons={patrons}
              loans={loans}
              activeBranch={activeBranch}
              onCheckout={handleCheckout}
              onReturnLoan={handleReturnLoan}
              onRenewLoan={handleRenewLoan}
              onDeleteLoan={(loan) => setPendingDelete({ type: 'loan', loan })}
              onSelectBook={(b) => setSelectedBookId(b.id)}
            />
          )}

          {activeNav === 'patrons' && (
            <PatronsScreen
              patrons={patrons}
              loans={loans}
              onSelectPatron={(p) => setSelectedPatronId(p.id)}
              onOpenAddMember={() => {
                setEditingMember(null);
                setMemberModalOpen(true);
              }}
              onEditMember={(p) => {
                setEditingMember(p);
                setMemberModalOpen(true);
              }}
              onDeleteMember={(p) => setPendingDelete({ type: 'member', patron: p })}
              onSettleFines={handleSettleFines}
            />
          )}

          {activeNav === 'holds' && (
            <HoldsScreen
              holds={holds}
              books={books}
              patrons={patrons}
              branches={branches}
              activeBranch={activeBranch}
              onMarkReady={handleMarkHoldReady}
              onFulfillHold={handleFulfillHold}
              onCancelHold={handleCancelHold}
              onDeleteHold={(hold) => setPendingDelete({ type: 'hold', hold })}
              onPlaceHold={handlePlaceHold}
              onSelectBook={(b) => setSelectedBookId(b.id)}
            />
          )}

          {activeNav === 'reports' && (
            <ReportsScreen
              books={books}
              loans={loans}
              acquisitions={acquisitions}
              branches={branches}
              onAddAcquisition={handleAddAcquisition}
              onAdvanceAcquisition={handleAdvanceAcquisition}
              onDeleteAcquisition={(order) => setPendingDelete({ type: 'order', order })}
              onRequestClearAllData={() => setPendingDelete({ type: 'clear-all' })}
            />
          )}
        </main>
      </div>

      {/* Drawers & Modals */}
      <BookDetailDrawer
        book={selectedBook}
        patrons={patrons}
        loans={loans}
        branches={branches}
        onClose={() => setSelectedBookId(null)}
        onEditBook={(b) => {
          setEditingBook(b);
          setBookModalOpen(true);
        }}
        onDeleteBook={(b) => setPendingDelete({ type: 'book', book: b })}
        onCheckoutCopy={handleCheckout}
        onPlaceHold={handlePlaceHold}
        onAddCopy={handleAddCopyToBook}
        onUpdateCopy={handleUpdateCopy}
        onDeleteCopy={(bookId, barcode) =>
          setPendingDelete({ type: 'copy', bookId, barcode })
        }
      />

      <PatronDetailDrawer
        patron={selectedPatron}
        books={books}
        loans={loans}
        onClose={() => setSelectedPatronId(null)}
        onEditMember={(p) => {
          setEditingMember(p);
          setMemberModalOpen(true);
        }}
        onDeleteMember={(p) => setPendingDelete({ type: 'member', patron: p })}
        onSettleFines={handleSettleFines}
        onToggleSuspend={handleToggleSuspend}
        onReturnLoan={handleReturnLoan}
        onRenewLoan={handleRenewLoan}
      />

      <BookFormModal
        isOpen={bookModalOpen}
        editingBook={editingBook}
        branches={branches}
        onClose={() => {
          setBookModalOpen(false);
          setEditingBook(null);
        }}
        onSaveNewBook={handleAddBook}
        onSaveEditedBook={handleEditBook}
      />

      <MemberFormModal
        isOpen={memberModalOpen}
        editingMember={editingMember}
        onClose={() => {
          setMemberModalOpen(false);
          setEditingMember(null);
        }}
        onSaveNewMember={handleAddMember}
        onSaveEditedMember={handleEditMember}
      />

      <QuickCheckoutModal
        isOpen={quickCheckoutOpen}
        preselectedBook={quickCheckoutBook}
        books={books}
        patrons={patrons}
        onClose={() => {
          setQuickCheckoutOpen(false);
          setQuickCheckoutBook(null);
        }}
        onConfirmCheckout={handleCheckout}
      />

      <ManageBranchesModal
        isOpen={branchesModalOpen}
        branches={branches}
        onClose={() => setBranchesModalOpen(false)}
        onAddBranch={handleAddBranch}
        onDeleteBranch={handleDeleteBranch}
      />

      <ConfirmDeleteModal
        isOpen={pendingDelete !== null}
        title={confirmDialogText.title}
        description={confirmDialogText.description}
        confirmLabel={confirmDialogText.label}
        onCancel={() => setPendingDelete(null)}
        onConfirm={executePendingDelete}
      />

      {/* Toast Confirmation */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed right-5 bottom-5 z-50 flex max-w-md items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-md ${
            toast.tone === 'error'
              ? 'border-[#f5b7b1] bg-[#ffdad6] text-[#93000a]'
              : 'border-[#c5c5d4] bg-[#191c1e] text-white'
          }`}
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="flex-1 text-xs leading-snug font-medium">{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss notification"
            className="rounded p-0.5 opacity-80 hover:opacity-100 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
