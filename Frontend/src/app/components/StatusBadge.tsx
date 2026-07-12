interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  // Vehicle
  AVAILABLE:   { label: 'Available',   bg: '#D1F4E4', color: '#1E9E5A' },
  ON_TRIP:     { label: 'On Trip',     bg: '#DBEAFE', color: '#1D6FE0' },
  IN_SHOP:     { label: 'In Shop',     bg: '#FEF3C7', color: '#D98F1F' },
  RETIRED:     { label: 'Retired',     bg: '#FEE2E2', color: '#B3261E' },
  // Driver
  OFF_DUTY:    { label: 'Off Duty',    bg: '#F3F4F6', color: '#6B7280' },
  SUSPENDED:   { label: 'Suspended',   bg: '#FEE2E2', color: '#B3261E' },
  // Trip
  DRAFT:       { label: 'Draft',       bg: '#F3F4F6', color: '#6B7280' },
  DISPATCHED:  { label: 'Dispatched',  bg: '#DBEAFE', color: '#1D6FE0' },
  COMPLETED:   { label: 'Completed',   bg: '#CCEDE9', color: '#004643' },
  CANCELLED:   { label: 'Cancelled',   bg: '#FEE2E2', color: '#B3261E' },
  // Maintenance
  ACTIVE:      { label: 'Active',      bg: '#FEF3C7', color: '#D98F1F' },
  CLOSED:      { label: 'Closed',      bg: '#F3F4F6', color: '#6B7280' },
  // Expenses
  TOLL:        { label: 'Toll',        bg: '#EDE9FE', color: '#7C3AED' },
  OTHER:       { label: 'Other',       bg: '#F3F4F6', color: '#6B7280' },
};

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: '#F3F4F6', color: '#6B7280' };
  const pad = size === 'md' ? '3px 10px' : '2px 8px';
  const fs = size === 'md' ? '12px' : '11px';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: pad,
        borderRadius: '999px',
        background: cfg.bg,
        color: cfg.color,
        fontSize: fs,
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  );
}
