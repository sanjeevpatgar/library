import React, { useMemo, useState } from 'react';
import { Pencil, Search, Trash2, UserPlus } from 'lucide-react';
import { Loan, Patron, PatronStanding } from '../types/library';
import { getLoanActiveCountForPatron } from '../utils/libraryHelpers';
import { StatusBadge } from './StatusBadge';

interface PatronsScreenProps {
  patrons: Patron[];
  loans: Loan[];
  onSelectPatron: (patron: Patron) => void;
  onOpenAddMember: () => void;
  onEditMember: (patron: Patron) => void;
  onDeleteMember: (patron: Patron) => void;
  onSettleFines: (patronId: string) => void;
}

export const PatronsScreen: React.FC<PatronsScreenProps> = ({
  patrons,
  loans,
  onSelectPatron,
  onOpenAddMember,
  onEditMember,
  onDeleteMember,
  onSettleFines,
}) => {
  const [query, setQuery] = useState('');
  const [standingFilter, setStandingFilter] = useState<'All' | PatronStanding>('All');

  const filteredPatrons = useMemo(() => {
    const q = query.trim().toLowerCase();
    return patrons.filter((p) => {
      if (standingFilter !== 'All' && p.standing !== standingFilter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.cardNumber.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.phone?.toLowerCase().includes(q) ?? false) ||
        p.department.toLowerCase().includes(q)
      );
    });
  }, [patrons, query, standingFilter]);

  const totalOutstandingFines = useMemo(
    () => patrons.reduce((sum, p) => sum + p.finesOwed, 0),
    [patrons]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#191c1e]">
            Members
          </h1>
          <p className="mt-1 text-sm text-[#454652] tabular-nums">
            {patrons.length} registered {patrons.length === 1 ? 'member' : 'members'} ·{' '}
            <span className="font-medium text-[#191c1e]">
              ${totalOutstandingFines.toFixed(2)}
            </span>{' '}
            total fines owed
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddMember}
          className="inline-flex items-center gap-2 rounded bg-[#24389c] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1c2c7e] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Member</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#e0e3e5] bg-white p-3.5">
        <div className="relative min-w-[240px] flex-1 max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#757684]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, card number, email, phone, or group..."
            className="w-full rounded border border-[#c5c5d4] bg-[#f7f9fb] py-2 pr-3 pl-9 text-sm text-[#191c1e] placeholder:text-[#757684] focus:border-[#24389c] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#24389c]/20"
          />
        </div>

        <div
          role="group"
          aria-label="Filter by member standing"
          className="inline-flex flex-wrap items-center rounded border border-[#e0e3e5] bg-[#f2f4f6] p-0.5"
        >
          {(['All', 'Good Standing', 'Fines Due', 'Suspended'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStandingFilter(st)}
              className={`rounded-xs px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                standingFilter === st
                  ? 'bg-white text-[#191c1e] shadow-2xs'
                  : 'text-[#454652] hover:text-[#191c1e]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State or Table */}
      {patrons.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-[#e0e3e5] bg-white px-6 py-16 text-center">
          <p className="text-base font-semibold text-[#191c1e]">
            No library members yet
          </p>
          <p className="mt-1 max-w-md text-sm text-[#454652]">
            Add members with their card number, email, phone, and borrowing limit. You can edit or delete member records anytime.
          </p>
          <button
            type="button"
            onClick={onOpenAddMember}
            className="mt-4 inline-flex items-center gap-2 rounded bg-[#24389c] px-4 py-2 text-sm font-medium text-white hover:bg-[#1c2c7e] cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add First Member</span>
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-[#e0e3e5] bg-white">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#e0e3e5] bg-[#f7f9fb] text-xs font-medium text-[#454652]">
                  <th className="px-4 py-3">Card ID</th>
                  <th className="px-4 py-3">Member & Contact</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Borrowed</th>
                  <th className="px-4 py-3 text-right">Fines</th>
                  <th className="px-4 py-3">Standing</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceef0]">
                {filteredPatrons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-sm text-[#454652]">
                      No members match your search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPatrons.map((patron) => {
                    const activeCount = getLoanActiveCountForPatron(loans, patron.id);
                    return (
                      <tr
                        key={patron.id}
                        className="transition-colors hover:bg-[#f7f9fb]"
                      >
                        <td className="px-4 py-3 font-mono text-xs font-medium tabular-nums text-[#191c1e]">
                          {patron.cardNumber}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => onSelectPatron(patron)}
                            className="font-medium text-[#191c1e] hover:text-[#24389c] hover:underline text-left cursor-pointer"
                          >
                            {patron.name}
                          </button>
                          <div className="text-xs text-[#454652]">
                            {patron.department} · {patron.email}
                            {patron.phone ? ` · ${patron.phone}` : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-[#454652]">{patron.type}</td>
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums text-[#191c1e]">
                          {activeCount} / {patron.maxLoans}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-xs tabular-nums">
                          <span
                            className={
                              patron.finesOwed > 0
                                ? 'font-semibold text-[#ba1a1a]'
                                : 'text-[#454652]'
                            }
                          >
                            ${patron.finesOwed.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={patron.standing} compact />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            {patron.finesOwed > 0 && (
                              <button
                                type="button"
                                onClick={() => onSettleFines(patron.id)}
                                className="rounded border border-[#c5c5d4] bg-white px-2.5 py-1 text-xs font-medium text-[#191c1e] hover:bg-[#f2f4f6] whitespace-nowrap cursor-pointer"
                              >
                                Clear Fine
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onEditMember(patron)}
                              aria-label={`Edit ${patron.name}`}
                              title="Edit member details"
                              className="rounded border border-[#c5c5d4] bg-white p-1.5 text-[#505f76] hover:bg-[#f2f4f6] hover:text-[#191c1e] cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteMember(patron)}
                              aria-label={`Delete ${patron.name}`}
                              title="Delete member"
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
        </div>
      )}
    </div>
  );
};
