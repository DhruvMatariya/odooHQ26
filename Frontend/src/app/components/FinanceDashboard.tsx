import React from 'react';
import { KPICard } from './KPICard';
import { Gauge, Fuel, Wrench, TrendingDown, TrendingUp, IndianRupee, BarChart3 } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  LineChart, Line, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import type { Role } from './Layout';

interface FinanceDashboardProps {
  userRole: Role;
  onNavigate: (page: string) => void;
}

/* ── Mock data ── */
const MONTHLY_COSTS = [
  { month: 'Feb', fuel: 182000, maintenance: 95000, other: 28000 },
  { month: 'Mar', fuel: 201000, maintenance: 48000, other: 31000 },
  { month: 'Apr', fuel: 175000, maintenance: 122000, other: 25000 },
  { month: 'May', fuel: 218000, maintenance: 65000, other: 34000 },
  { month: 'Jun', fuel: 234000, maintenance: 87000, other: 29000 },
  { month: 'Jul', fuel: 98000,  maintenance: 42000, other: 14000 },
];

const FUEL_EFFICIENCY = [
  { month: 'Feb', kmPerL: 7.2 },
  { month: 'Mar', kmPerL: 7.8 },
  { month: 'Apr', kmPerL: 6.9 },
  { month: 'May', kmPerL: 8.1 },
  { month: 'Jun', kmPerL: 8.4 },
  { month: 'Jul', kmPerL: 7.6 },
];

const COST_BREAKDOWN = [
  { name: 'Fuel',        value: 1108000, color: '#1D6FE0' },
  { name: 'Maintenance', value: 459000,  color: '#D98F1F' },
  { name: 'Other',       value: 161000,  color: '#7C3AED' },
];

const VEHICLE_ROI = [
  { reg: 'KBZ 456B', model: 'Mercedes Sprinter', acqCost: 4200000, maintenance: 85000,  fuel: 210000, roi: 12.4 },
  { reg: 'KCB 123A', model: 'Toyota Hino 300',   acqCost: 3800000, maintenance: 43000,  fuel: 187000, roi: 8.9  },
  { reg: 'KDB 321D', model: 'MAN TGX 26.440',    acqCost: 9500000, maintenance: 185000, fuel: 342000, roi: 5.2  },
  { reg: 'KDH 910F', model: 'Mitsubishi Fuso',   acqCost: 5100000, maintenance: 62000,  fuel: 214000, roi: 9.8  },
  { reg: 'KDA 789C', model: 'Isuzu FRR 90L',     acqCost: 4700000, maintenance: 84000,  fuel: 155000, roi: 11.1 },
];

const totalFuel    = MONTHLY_COSTS.reduce((s, m) => s + m.fuel, 0);
const totalMaint   = MONTHLY_COSTS.reduce((s, m) => s + m.maintenance, 0);
const totalOther   = MONTHLY_COSTS.reduce((s, m) => s + m.other, 0);
const totalOpex    = totalFuel + totalMaint + totalOther;
const avgEfficiency = (FUEL_EFFICIENCY.reduce((s, m) => s + m.kmPerL, 0) / FUEL_EFFICIENCY.length).toFixed(1);

/** Format number as ₹ Indian Rupees */
function fmt(n: number) {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)} L`;
  if (n >= 1_000)      return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n}`;
}

/* ── Custom Tooltips ── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', padding: '10px 14px', fontSize: 13, minWidth: 160 }}>
      <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#1A1F27' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ margin: '2px 0', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: p.color ?? p.stroke }}>{p.name}</span>
          <span style={{ fontWeight: 600, color: '#1A1F27' }}>{typeof p.value === 'number' && p.value > 1000 ? fmt(p.value) : p.value}</span>
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', padding: '8px 14px', fontSize: 13 }}>
      <span style={{ color: d.payload.color, fontWeight: 700 }}>● </span>
      <span style={{ color: '#1A1F27', fontWeight: 600 }}>{d.name}:</span>{' '}
      <span style={{ color: '#374151' }}>{fmt(d.value)}</span>
    </div>
  );
}

function RoiBadge({ roi }: { roi: number }) {
  const color = roi >= 10 ? '#1E9E5A' : roi >= 7 ? '#D98F1F' : '#B3261E';
  const bg    = roi >= 10 ? '#D1F4E4' : roi >= 7 ? '#FEF3C7' : '#FEE2E2';
  const Icon  = roi >= 10 ? TrendingUp : TrendingDown;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: '999px', background: bg, color, fontSize: '12px', fontWeight: 700 }}>
      <Icon size={12} />{roi}%
    </span>
  );
}

const CARD_STYLE: React.CSSProperties = {
  background: '#fff', borderRadius: '12px', padding: '20px 24px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)',
};

const PAGE_TITLE: React.CSSProperties = {
  fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '24px', color: '#1A1F27', margin: '0 0 4px',
};

const TH: React.CSSProperties = {
  padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600,
  color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em',
};

const TD: React.CSSProperties = { padding: '12px 16px', fontSize: '13px', color: '#374151' };

export function FinanceDashboard({ onNavigate }: FinanceDashboardProps) {
  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', animation: 'fadeUp 0.45s ease both' }}>
        <div>
          <h1 style={PAGE_TITLE}>Financial Analyst Dashboard</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
            Operational cost & profitability overview —{' '}
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => onNavigate('reports')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#004643', color: '#fff', border: 'none',
            borderRadius: '8px', padding: '9px 16px', fontSize: '13px',
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          <BarChart3 size={15} /> View Reports
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          <KPICard key="total"  label="Total OpEx (YTD)"    value={fmt(totalOpex)}  icon={<IndianRupee size={18} />}  accent="#004643" trend="up"   trendText="+8% vs last year" />,
          <KPICard key="fuel"   label="Fuel Cost (YTD)"     value={fmt(totalFuel)}  icon={<Fuel size={18} />}        accent="#1D6FE0" trend="up"   trendText="+12% vs last year" />,
          <KPICard key="maint"  label="Maintenance (YTD)"   value={fmt(totalMaint)} icon={<Wrench size={18} />}      accent="#D98F1F" trend="down" trendText="−5% vs last year" />,
          <KPICard key="eff"    label="Avg Fuel Efficiency"  value={`${avgEfficiency} km/L`} icon={<Gauge size={18} />} accent="#1E9E5A" trend="up" trendText="+0.4 vs last month" />,
        ].map((card, i) => (
          <div key={i} style={{ animation: `fadeUp 0.45s ease ${0.05 * i + 0.1}s both` }}>{card}</div>
        ))}
      </div>

      {/* Charts row — Area charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 24 }}>
        {/* Monthly operational cost area chart */}
        <div style={{ ...CARD_STYLE, animation: 'scaleIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.3s both' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>Monthly Cost Trends</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={MONTHLY_COSTS} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradFuel"  x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1D6FE0" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#1D6FE0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradMaint" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#D98F1F" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#D98F1F" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradOther" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#7C3AED" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={v => `${(v/1000).toFixed(0)}K`} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="fuel"        name="Fuel"        stroke="#1D6FE0" strokeWidth={2} fill="url(#gradFuel)"  dot={false} activeDot={{ r: 5 }}
                isAnimationActive animationBegin={300} animationDuration={1000} />
              <Area type="monotone" dataKey="maintenance" name="Maintenance" stroke="#D98F1F" strokeWidth={2} fill="url(#gradMaint)" dot={false} activeDot={{ r: 5 }}
                isAnimationActive animationBegin={400} animationDuration={1000} />
              <Area type="monotone" dataKey="other"       name="Other"       stroke="#7C3AED" strokeWidth={2} fill="url(#gradOther)" dot={false} activeDot={{ r: 5 }}
                isAnimationActive animationBegin={500} animationDuration={1000} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Cost distribution donut */}
        <div style={{ ...CARD_STYLE, animation: 'scaleIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.4s both' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>Cost Distribution</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={COST_BREAKDOWN} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                dataKey="value" paddingAngle={3}
                isAnimationActive animationBegin={200} animationDuration={900}>
                {COST_BREAKDOWN.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {COST_BREAKDOWN.map(d => {
              const pct = ((d.value / totalOpex) * 100).toFixed(1);
              return (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px' }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: '#374151' }}>{d.name}</span>
                  <span style={{ color: '#6B7280' }}>{pct}%</span>
                  <span style={{ fontWeight: 600, color: '#1A1F27' }}>{fmt(d.value)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fuel efficiency area chart + Vehicle ROI */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, animation: 'fadeUp 0.5s ease 0.5s both' }}>
        {/* Fuel efficiency area chart */}
        <div style={{ ...CARD_STYLE }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>Fleet Fuel Efficiency (km/L)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={FUEL_EFFICIENCY} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradEff" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1E9E5A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1E9E5A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis domain={[6, 9]} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="kmPerL" name="km/L" stroke="#1E9E5A" strokeWidth={2.5}
                fill="url(#gradEff)" dot={{ fill: '#1E9E5A', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }}
                isAnimationActive animationBegin={200} animationDuration={1000} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Vehicle ROI table */}
        <div style={{ ...CARD_STYLE, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>Vehicle ROI</h3>
            <button onClick={() => onNavigate('reports')} style={{ background: 'none', border: 'none', color: '#004643', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>Full report →</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['Vehicle', 'Acq. Cost', 'OpEx', 'ROI'].map(h => <th key={h} style={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[...VEHICLE_ROI].sort((a, b) => b.roi - a.roi).map((v, i) => (
                <tr key={v.reg} style={{ borderTop: '1px solid rgba(0,0,0,0.05)', background: i % 2 === 0 ? '#fff' : '#FEFEFE' }}>
                  <td style={TD}>
                    <div style={{ fontWeight: 600, color: '#004643', fontSize: '13px' }}>{v.reg}</div>
                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{v.model}</div>
                  </td>
                  <td style={{ ...TD, fontFamily: 'monospace', fontSize: '12px' }}>{fmt(v.acqCost)}</td>
                  <td style={{ ...TD, fontFamily: 'monospace', fontSize: '12px' }}>{fmt(v.maintenance + v.fuel)}</td>
                  <td style={TD}><RoiBadge roi={v.roi} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
