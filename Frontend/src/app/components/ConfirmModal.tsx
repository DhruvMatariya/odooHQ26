interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  confirmDanger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: '#fff', borderRadius: '12px', padding: '28px 32px',
          width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 600, color: '#1A1F27' }}>{title}</h3>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6B7280', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.12)',
              background: '#fff', color: '#1A1F27', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none',
              background: confirmDanger ? '#B3261E' : '#004643',
              color: '#fff', fontSize: '14px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
