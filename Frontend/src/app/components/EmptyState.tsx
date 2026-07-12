import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <tr>
      <td colSpan={99}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: '64px 24px', gap: 12,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '16px',
            background: '#F0EDE5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#004643', marginBottom: 4,
          }}>
            {icon}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>{title}</div>
          <div style={{ fontSize: '13px', color: '#9CA3AF', textAlign: 'center', maxWidth: 320, lineHeight: 1.5 }}>{message}</div>
          {action && <div style={{ marginTop: 8 }}>{action}</div>}
        </div>
      </td>
    </tr>
  );
}
