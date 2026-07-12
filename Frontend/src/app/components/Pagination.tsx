import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ total, page, pageSize, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  const btnBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, borderRadius: '6px', border: '1px solid rgba(0,0,0,0.10)',
    cursor: 'pointer', fontSize: '13px', background: '#fff', color: '#374151',
    transition: 'all 0.15s',
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 20px', borderTop: '1px solid rgba(0,0,0,0.06)',
      background: '#FAFAFA',
    }}>
      <span style={{ fontSize: '13px', color: '#6B7280' }}>
        Showing <strong style={{ color: '#1A1F27' }}>{start}–{end}</strong> of <strong style={{ color: '#1A1F27' }}>{total}</strong>
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          style={{ ...btnBase, opacity: page === 1 ? 0.4 : 1, cursor: page === 1 ? 'not-allowed' : 'pointer' }}
        >
          <ChevronLeft size={14} />
        </button>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} style={{ width: 32, textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              style={{
                ...btnBase,
                background: p === page ? '#004643' : '#fff',
                color: p === page ? '#fff' : '#374151',
                border: p === page ? '1px solid #004643' : '1px solid rgba(0,0,0,0.10)',
                fontWeight: p === page ? 600 : 400,
              }}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          style={{ ...btnBase, opacity: page === totalPages ? 0.4 : 1, cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export function usePagination<T>(items: T[], pageSize = 10) {
  return { pageSize };
}
