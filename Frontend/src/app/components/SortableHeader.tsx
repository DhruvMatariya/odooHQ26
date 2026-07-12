import { ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';

export type SortDir = 'asc' | 'desc' | null;

interface SortableHeaderProps {
  label: string;
  field: string;
  sortField: string;
  sortDir: SortDir;
  onSort: (field: string) => void;
  style?: React.CSSProperties;
}

const TH_BASE: React.CSSProperties = {
  padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600,
  color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap',
  userSelect: 'none',
};

export function SortableHeader({ label, field, sortField, sortDir, onSort, style }: SortableHeaderProps) {
  const active = sortField === field;
  const Icon = active ? (sortDir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
  return (
    <th
      style={{ ...TH_BASE, ...style, cursor: 'pointer' }}
      onClick={() => onSort(field)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        <Icon size={12} color={active ? '#004643' : '#C0C0C0'} />
      </div>
    </th>
  );
}

export function PlainHeader({ label, style }: { label: string; style?: React.CSSProperties }) {
  return <th style={{ ...TH_BASE, ...style }}>{label}</th>;
}

export function useSort<T>(items: T[], defaultField: keyof T) {
  return items; // placeholder — consumers manage state themselves
}
