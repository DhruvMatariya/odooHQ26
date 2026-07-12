import React from 'react';
import { KPICard } from './KPICard';
import { StatusBadge } from './StatusBadge';
import {
  Users, ShieldAlert, Clock, CheckCircle2, AlertTriangle, XCircle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';
import type { Role } from './Layout';

interface SafetyDashboardProps {
  userRole: Role;
  onNavigate: (page: string) => void;
}

/* ── Mock data ── */
const DRIVER_STATUS_DIST = [
  { name: 'Available', value: 6, color: '#1E9E5A' },
  { name: 'On Trip',   value: 4, color: '#1D6FE0' },
  { name: 'Off Duty',  value: 3, color: '#6B7280' },
  { name: 'Suspended', value: 1, color: '#B3261E' },
];

const SAFETY_SCORES = [
  { month: 'Feb', avgScore: 82 },
  { month: 'Mar', avgScore: 85 },
  { month: 'Apr', avgScore: 79 },
  { month: 'May', avgScore: 88 },
  { month: 'Jun', avgScore: 91 },
  { month: 'Jul', avgScore: 87 },
];

const EXPIRING_LICENSES = [
  { id: 'd1', name: 'Mary Wanjiru',   license: 'DL-20943', category: 'CE', expiry: '2026-08-01', daysLeft: 20,  status: 'AVAILABLE' },
  { id: 'd2', name: 'Peter Odhiambo', license: 'DL-19823', category: 'C',  expiry: '2026-07-25', daysLeft: 13,  status: 'ON_TRIP'   },
  { id: 'd3', name: 'Grace Njeri',    license: 'DL-20110', category: 'BE', expiry: '2026-07-19', daysLeft: 7,   status: 'AVAILABLE' },
  { id: 'd4', name: 'James Otieno',   license: 'DL-18002', category: 'C',  expiry: '2026-07-15', daysLeft: 3,   status: 'AVAILABLE' },
];

const DRIVER_COMPLIANCE = [
  { id: 'd5', name: 'John Kamau',     score: 95, status: 'AVAILABLE', licenseOk: true },
  { id: 'd6', name: 'Alice Muriithi', score: 88, status: 'ON_TRIP',   licenseOk: true },
  { id: 'd7', name: 'Brian Mwangi',   score: 72, status: 'AVAILABLE', licenseOk: true },
  { id: 'd8', name: 'Carol Otieno',   score: 51, status: 'SUSPENDED', licenseOk: false },
  { id: 'd9', name: 'David Ngugi',    score: 66, status: 'OFF_DUTY',  licenseOk: true },
];

/* ── Custom Tooltips ── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.10)', padding: '10px 14px', fontSize: 13 }}>
      <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#1A1F27' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ margin: '2px 0', display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontWeight: 600, color: '#1A1F27' }}>{p.value}</span>
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
      <span style={{ color: '#374151' }}>{d.value} drivers</span>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 85 ? '#1E9E5A' : score >= 65 ? '#D98F1F' : '#B3261E';
  const bg    = score >= 85 ? '#D1F4E4' : score >= 65 ? '#FEF3C7' : '#FEE2E2';
  return (
    <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: '999px', background: bg, color, fontSize: '12px', fontWeight: 700 }}>
      {score}
    </span>
  );
}

function UrgencyBadge({ days }: { days: number }) {
  const color = days <= 7 ? '#B3261E' : days <= 14 ? '#D98F1F' : '#1D6FE0';
  const bg    = days <= 7 ? '#FEE2E2' : days <= 14 ? '#FEF3C7' : '#DBEAFE';
  const Icon  = days <= 7 ? XCircle : days <= 14 ? AlertTriangle : Clock;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: '999px', background: bg, color, fontSize: '12px', fontWeight: 600 }}>
      <Icon size={12} /> {days}d
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

export function SafetyDashboard({ onNavigate }: SafetyDashboardProps) {
  const totalDrivers     = DRIVER_STATUS_DIST.reduce((s, d) => s + d.value, 0);
  const suspended        = DRIVER_STATUS_DIST.find(d => d.name === 'Suspended')?.value ?? 0;
  const expiringSoon     = EXPIRING_LICENSES.length;
  const criticalExpiry   = EXPIRING_LICENSES.filter(d => d.daysLeft <= 7).length;
  const avgSafetyScore   = Math.round(DRIVER_COMPLIANCE.reduce((s, d) => s + d.score, 0) / DRIVER_COMPLIANCE.length);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, animation: 'fadeUp 0.45s ease both' }}>
        <h1 style={PAGE_TITLE}>Safety Officer Dashboard</h1>
        <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
          Driver compliance & safety overview —{' '}
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Alert banner if critical licenses */}
      {criticalExpiry > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: '#FEE2E2', border: '1px solid #F9A8A8', borderRadius: '10px',
          padding: '12px 18px', marginBottom: 20,
          animation: 'fadeUp 0.4s ease 0.05s both',
        }}>
          <ShieldAlert size={18} color="#B3261E" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#B3261E' }}>
            {criticalExpiry} driver license{criticalExpiry > 1 ? 's' : ''} expiring within 7 days — immediate action required.
          </span>
          <button onClick={() => onNavigate('drivers')}
            style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 600, color: '#B3261E', background: 'none', border: '1px solid #B3261E', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>
            Review →
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          <KPICard key="tot"   label="Total Drivers"      value={totalDrivers}   icon={<Users size={18} />}        accent="#004643" />,
          <KPICard key="susp"  label="Suspended"          value={suspended}      icon={<ShieldAlert size={18} />}  accent="#B3261E" trend="flat" trendText="Under review" />,
          <KPICard key="exp"   label="Licenses Expiring"  value={expiringSoon}   icon={<Clock size={18} />}        accent="#D98F1F" trend="up"   trendText="Next 30 days" />,
          <KPICard key="score" label="Avg Safety Score"   value={`${avgSafetyScore}`} icon={<CheckCircle2 size={18} />} accent="#1E9E5A" trend="up" trendText="+3 vs last month" />,
        ].map((card, i) => (
          <div key={i} style={{ animation: `fadeUp 0.45s ease ${0.05 * i + 0.1}s both` }}>{card}</div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 24 }}>
        {/* Monthly avg safety score trend */}
        <div style={{ ...CARD_STYLE, animation: 'scaleIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.3s both' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>Avg Safety Score Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={SAFETY_SCORES} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#004643" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#004643" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="avgScore" name="Avg Score" stroke="#004643" strokeWidth={2.5} fill="url(#gradScore)" dot={{ fill: '#004643', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }}
                isAnimationActive animationBegin={350} animationDuration={1000} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Driver status distribution */}
        <div style={{ ...CARD_STYLE, animation: 'scaleIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.4s both' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>Driver Status</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={DRIVER_STATUS_DIST} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                dataKey="value" paddingAngle={3}
                isAnimationActive animationBegin={200} animationDuration={900}>
                {DRIVER_STATUS_DIST.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {DRIVER_STATUS_DIST.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px' }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                <span style={{ flex: 1, color: '#374151' }}>{d.name}</span>
                <span style={{ fontWeight: 600, color: '#1A1F27' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, animation: 'fadeUp 0.5s ease 0.5s both' }}>
        {/* Expiring licenses */}
        <div style={{ ...CARD_STYLE, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>
              Expiring Licenses <span style={{ fontSize: '12px', color: '#D98F1F', fontWeight: 500 }}>Next 30 days</span>
            </h3>
            <button onClick={() => onNavigate('drivers')} style={{ background: 'none', border: 'none', color: '#004643', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>View all →</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['Driver', 'License', 'Cat.', 'Expires', 'Days Left'].map(h => <th key={h} style={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {EXPIRING_LICENSES.map((d, i) => (
                <tr key={d.id} style={{ borderTop: '1px solid rgba(0,0,0,0.05)', background: i % 2 === 0 ? '#fff' : '#FEFEFE' }}>
                  <td style={{ ...TD, fontWeight: 500, color: '#1A1F27' }}>{d.name}</td>
                  <td style={{ ...TD, fontFamily: 'monospace', fontSize: '12px' }}>{d.license}</td>
                  <td style={TD}><span style={{ background: '#EDE9FE', color: '#7C3AED', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', fontWeight: 600 }}>{d.category}</span></td>
                  <td style={{ ...TD, color: '#6B7280' }}>{d.expiry}</td>
                  <td style={TD}><UrgencyBadge days={d.daysLeft} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Driver compliance / safety scores */}
        <div style={{ ...CARD_STYLE, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>Driver Safety Scores</h3>
            <button onClick={() => onNavigate('drivers')} style={{ background: 'none', border: 'none', color: '#004643', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>View all →</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['Driver', 'Score', 'Status', 'License'].map(h => <th key={h} style={TH}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {[...DRIVER_COMPLIANCE].sort((a, b) => a.score - b.score).map((d, i) => (
                <tr key={d.id} style={{ borderTop: '1px solid rgba(0,0,0,0.05)', background: i % 2 === 0 ? '#fff' : '#FEFEFE' }}>
                  <td style={{ ...TD, fontWeight: 500, color: '#1A1F27' }}>{d.name}</td>
                  <td style={TD}><ScoreBadge score={d.score} /></td>
                  <td style={TD}><StatusBadge status={d.status} /></td>
                  <td style={TD}>
                    {d.licenseOk
                      ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#1E9E5A', fontWeight: 500 }}><CheckCircle2 size={13} /> Valid</span>
                      : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '12px', color: '#B3261E', fontWeight: 500 }}><XCircle size={13} /> Expired</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
