import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { ReactNode } from 'react';

interface KPICardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'flat';
  trendText?: string;
  accent?: string;
}

export function KPICard({ label, value, icon, trend, trendText, accent = '#004643' }: KPICardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#1E9E5A' : trend === 'down' ? '#B3261E' : '#6B7280';

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '20px 24px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        border: '1px solid rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </span>
        {icon && (
          <div style={{
            width: 36, height: 36, borderRadius: '8px',
            background: accent + '18',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent,
          }}>
            {icon}
          </div>
        )}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color: '#1A1F27', lineHeight: 1.1, fontFamily: 'Poppins, Inter, sans-serif' }}>
        {value}
      </div>
      {trendText && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: trendColor, fontSize: '12px', fontWeight: 500 }}>
          <TrendIcon size={14} />
          <span>{trendText}</span>
        </div>
      )}
    </div>
  );
}
