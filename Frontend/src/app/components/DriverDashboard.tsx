import React from 'react';
import { KPICard } from './KPICard';
import { StatusBadge } from './StatusBadge';
import { MapPin, Clock, Truck, CheckCircle2, AlertCircle, PlusCircle } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell,
  PieChart, Pie, CartesianGrid
} from 'recharts';
import type { Role } from './Layout';

interface DriverDashboardProps {
  userRole: Role;
  onNavigate: (page: string) => void;
}

/* ── Mock data ── */
const TRIP_STATUS_DIST = [
  { name: 'Dispatched', value: 4, color: '#1D6FE0' },
  { name: 'Draft',      value: 3, color: '#6B7280' },
  { name: 'Completed',  value: 42, color: '#1E9E5A' },
  { name: 'Cancelled',  value: 5, color: '#B3261E' },
];

const WEEKLY_TRIPS = [
  { day: 'Mon', created: 5, dispatched: 4 },
  { day: 'Tue', created: 7, dispatched: 6 },
  { day: 'Wed', created: 4, dispatched: 4 },
  { day: 'Thu', created: 9, dispatched: 7 },
  { day: 'Fri', created: 6, dispatched: 5 },
  { day: 'Sat', created: 3, dispatched: 2 },
  { day: 'Sun', created: 1, dispatched: 1 },
];

const ACTIVE_DELIVERIES = [
  { id: 't1', route: 'Nairobi → Mombasa',  vehicle: 'KBZ 456B', driver: 'Mary Wanjiru',   status: 'DISPATCHED', eta: '~4 h' },
  { id: 't2', route: 'Kisumu → Nakuru',    vehicle: 'KCB 123A', driver: 'John Kamau',     status: 'DISPATCHED', eta: '~2 h' },
  { id: 't3', route: 'Nairobi → Thika',    vehicle: 'KDB 321D', driver: 'Peter Odhiambo', status: 'DRAFT',      eta: '—' },
  { id: 't4', route: 'Nakuru → Eldoret',   vehicle: 'KDH 910F', driver: 'Grace Njeri',    status: 'DISPATCHED', eta: '~1 h' },
];

const AVAILABLE_VEHICLES = [
  { reg: 'KCB 123A', model: 'Toyota Hino 300',   capacity: '5 t' },
  { reg: 'KDB 321D', model: 'MAN TGX 26.440',    capacity: '26 t' },
  { reg: 'KDH 910F', model: 'Mitsubishi Fuso',   capacity: '8 t' },
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
      <span style={{ color: '#374151' }}>{d.value} trips</span>
    </div>
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

export function DriverDashboard({ onNavigate }: DriverDashboardProps) {
  const activeCount     = TRIP_STATUS_DIST.find(d => d.name === 'Dispatched')?.value ?? 0;
  const draftCount      = TRIP_STATUS_DIST.find(d => d.name === 'Draft')?.value ?? 0;
  const completedToday  = 6;
  const availableVehicles = AVAILABLE_VEHICLES.length;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', animation: 'fadeUp 0.45s ease both' }}>
        <div>
          <h1 style={PAGE_TITLE}>Dispatcher Dashboard</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
            Trip operations overview —{' '}
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button
          onClick={() => onNavigate('trips')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#004643', color: '#fff', border: 'none',
            borderRadius: '8px', padding: '9px 16px', fontSize: '13px',
            fontWeight: 600, cursor: 'pointer',
          }}
        >
          <PlusCircle size={15} /> New Trip
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          <KPICard key="active"    label="Active Trips"        value={activeCount}       icon={<MapPin size={18} />}        accent="#1D6FE0" trend="up"   trendText="+1 today" />,
          <KPICard key="draft"     label="Pending Dispatch"    value={draftCount}        icon={<Clock size={18} />}         accent="#6B7280" />,
          <KPICard key="done"      label="Completed Today"     value={completedToday}    icon={<CheckCircle2 size={18} />}  accent="#1E9E5A" trend="up"   trendText="+2 vs yesterday" />,
          <KPICard key="vehicles"  label="Available Vehicles"  value={availableVehicles} icon={<Truck size={18} />}         accent="#004643" trend="flat" trendText="Steady" />,
        ].map((card, i) => (
          <div key={i} style={{ animation: `fadeUp 0.45s ease ${0.05 * i + 0.1}s both` }}>{card}</div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 24 }}>
        {/* Weekly trip activity bar chart */}
        <div style={{ ...CARD_STYLE, animation: 'scaleIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.3s both' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>Weekly Trip Activity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={WEEKLY_TRIPS} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#1D6FE0" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#1D6FE0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradDispatched" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#004643" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#004643" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="rgba(0,0,0,0.04)" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="created"    name="Created"    stroke="#1D6FE0" strokeWidth={2.5} fill="url(#gradCreated)" dot={{ fill: '#1D6FE0', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }}
                isAnimationActive animationBegin={350} animationDuration={1000} />
              <Area type="monotone" dataKey="dispatched" name="Dispatched" stroke="#004643" strokeWidth={2.5} fill="url(#gradDispatched)" dot={{ fill: '#004643', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }}
                isAnimationActive animationBegin={500} animationDuration={1000} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Trip status distribution donut */}
        <div style={{ ...CARD_STYLE, animation: 'scaleIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.4s both' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>Trip Status</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={TRIP_STATUS_DIST} cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                dataKey="value" paddingAngle={3}
                isAnimationActive animationBegin={200} animationDuration={900}>
                {TRIP_STATUS_DIST.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<PieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {TRIP_STATUS_DIST.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '12px' }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                <span style={{ flex: 1, color: '#374151' }}>{d.name}</span>
                <span style={{ fontWeight: 600, color: '#1A1F27' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active deliveries + available vehicles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, animation: 'fadeUp 0.5s ease 0.5s both' }}>
        {/* Active deliveries table */}
        <div style={{ ...CARD_STYLE, padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>Active Deliveries</h3>
            <button onClick={() => onNavigate('trips')}
              style={{ background: 'none', border: 'none', color: '#004643', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}>
              View all →
            </button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#FAFAFA' }}>
                {['Route', 'Vehicle', 'Driver', 'Status', 'ETA'].map(h => (
                  <th key={h} style={TH}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ACTIVE_DELIVERIES.map((t, i) => (
                <tr key={t.id} style={{ borderTop: '1px solid rgba(0,0,0,0.05)', background: i % 2 === 0 ? '#fff' : '#FEFEFE' }}>
                  <td style={{ ...TD, fontWeight: 500, color: '#1A1F27' }}>{t.route}</td>
                  <td style={TD}>{t.vehicle}</td>
                  <td style={TD}>{t.driver}</td>
                  <td style={TD}><StatusBadge status={t.status} /></td>
                  <td style={{ ...TD, color: t.status === 'DRAFT' ? '#9CA3AF' : '#1D6FE0', fontWeight: 500 }}>{t.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Available vehicles panel */}
        <div style={{ ...CARD_STYLE }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>Available Vehicles</h3>
            <span style={{ fontSize: '11px', fontWeight: 600, background: '#CCEDE9', color: '#004643', borderRadius: '999px', padding: '2px 10px' }}>
              {AVAILABLE_VEHICLES.length} ready
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {AVAILABLE_VEHICLES.map(v => (
              <div key={v.reg} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: '8px', background: '#F9FAFB', border: '1px solid rgba(0,0,0,0.05)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '8px', background: '#CCEDE9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Truck size={16} color="#004643" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#1A1F27' }}>{v.reg}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>{v.model} · {v.capacity}</div>
                </div>
              </div>
            ))}
            <button onClick={() => onNavigate('vehicles')}
              style={{ marginTop: 4, fontSize: '13px', color: '#004643', fontWeight: 500, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              View all vehicles →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
