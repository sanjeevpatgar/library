import React from 'react';
import {
  AlertTriangle,
  Bookmark,
  CheckCircle2,
  Clock,
  RefreshCw,
  Truck,
  XCircle,
} from 'lucide-react';

type BadgeVariant =
  | 'Available'
  | 'Checked Out'
  | 'Active'
  | 'Due Today'
  | 'Overdue'
  | 'Reserved'
  | 'Returned'
  | 'Processing'
  | 'Waiting'
  | 'Ready for Pickup'
  | 'In Transit'
  | 'Fulfilled'
  | 'Cancelled'
  | 'Good Standing'
  | 'Fines Due'
  | 'Suspended'
  | 'Ordered'
  | 'In Processing'
  | 'Cataloged';

interface StatusBadgeProps {
  status: BadgeVariant;
  compact?: boolean;
}

const STYLE_MAP: Record<
  BadgeVariant,
  { bg: string; text: string; border: string; Icon: React.FC<{ className?: string }> }
> = {
  Available: {
    bg: 'bg-[#eef7f1]',
    text: 'text-[#14532d]',
    border: 'border-[#bbf7d0]',
    Icon: CheckCircle2,
  },
  Cataloged: {
    bg: 'bg-[#eef7f1]',
    text: 'text-[#14532d]',
    border: 'border-[#bbf7d0]',
    Icon: CheckCircle2,
  },
  'Good Standing': {
    bg: 'bg-[#eef7f1]',
    text: 'text-[#14532d]',
    border: 'border-[#bbf7d0]',
    Icon: CheckCircle2,
  },
  Fulfilled: {
    bg: 'bg-[#eef7f1]',
    text: 'text-[#14532d]',
    border: 'border-[#bbf7d0]',
    Icon: CheckCircle2,
  },
  'Checked Out': {
    bg: 'bg-[#dee0ff]',
    text: 'text-[#00105c]',
    border: 'border-[#bac3ff]',
    Icon: Clock,
  },
  Active: {
    bg: 'bg-[#dee0ff]',
    text: 'text-[#00105c]',
    border: 'border-[#bac3ff]',
    Icon: Clock,
  },
  'Ready for Pickup': {
    bg: 'bg-[#dee0ff]',
    text: 'text-[#24389c]',
    border: 'border-[#bac3ff]',
    Icon: Bookmark,
  },
  Reserved: {
    bg: 'bg-[#d0e1fb]',
    text: 'text-[#0b1c30]',
    border: 'border-[#b7c8e1]',
    Icon: Bookmark,
  },
  'Due Today': {
    bg: 'bg-[#fef3c7]',
    text: 'text-[#92400e]',
    border: 'border-[#fde68a]',
    Icon: AlertTriangle,
  },
  'Fines Due': {
    bg: 'bg-[#fef3c7]',
    text: 'text-[#92400e]',
    border: 'border-[#fde68a]',
    Icon: AlertTriangle,
  },
  'In Transit': {
    bg: 'bg-[#d0e1fb]',
    text: 'text-[#38485d]',
    border: 'border-[#b7c8e1]',
    Icon: Truck,
  },
  'In Processing': {
    bg: 'bg-[#eceef0]',
    text: 'text-[#3b4358]',
    border: 'border-[#c5c5d4]',
    Icon: RefreshCw,
  },
  Processing: {
    bg: 'bg-[#eceef0]',
    text: 'text-[#3b4358]',
    border: 'border-[#c5c5d4]',
    Icon: RefreshCw,
  },
  Ordered: {
    bg: 'bg-[#eceef0]',
    text: 'text-[#454652]',
    border: 'border-[#c5c5d4]',
    Icon: Clock,
  },
  Waiting: {
    bg: 'bg-[#f2f4f6]',
    text: 'text-[#454652]',
    border: 'border-[#c5c5d4]',
    Icon: Clock,
  },
  Returned: {
    bg: 'bg-[#f2f4f6]',
    text: 'text-[#454652]',
    border: 'border-[#d8dadc]',
    Icon: CheckCircle2,
  },
  Overdue: {
    bg: 'bg-[#ffdad6]',
    text: 'text-[#93000a]',
    border: 'border-[#f5b7b1]',
    Icon: AlertTriangle,
  },
  Suspended: {
    bg: 'bg-[#ffdad6]',
    text: 'text-[#93000a]',
    border: 'border-[#f5b7b1]',
    Icon: XCircle,
  },
  Cancelled: {
    bg: 'bg-[#f2f4f6]',
    text: 'text-[#505f76]',
    border: 'border-[#d8dadc]',
    Icon: XCircle,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, compact = false }) => {
  const config = STYLE_MAP[status] ?? STYLE_MAP.Waiting;
  const { Icon } = config;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border font-medium whitespace-nowrap shrink-0 ${
        compact ? 'px-2 py-0.5 text-[11px] leading-4' : 'px-2.5 py-0.5 text-xs leading-4'
      } ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
};
