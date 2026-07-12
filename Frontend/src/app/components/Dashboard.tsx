import { KPICard } from './KPICard';
import { StatusBadge } from './StatusBadge';
import {
  Truck, Users, Wrench, MapPin, Clock, Activity, PercentIcon,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { Role } from './Layout';

interface DashboardProps {
  userRole: Role;
  onNavigate: (page: string) => void;
}

const FLEET_STATUS_DATA = [
  { name: 'Available', value: 8, color: '#1E9E5A' },
  { name: 'On Trip',   value: 4, color: '#1D6FE0' },
  { name: 'In Shop',   value: 2, color: '#D98F1F' },
  { name: 'Retired',   value: 1, color: '#B3261E' },
];

const MONTHLY_TRIPS = [
  { month: 'Feb', completed: 24, cancelled: 3 },
  { month: 'Mar', completed: 31, cancelled: 2 },
  { month: 'Apr', completed: 28, cancelled: 4 },
  { month: 'May', completed: 36, cancelled: 1 },
  { month: 'Jun', completed: 42, cancelled: 5 },
  { month: 'Jul', completed: 18, cancelled: 2 },
];

const RECENT_TRIPS = [
  { id: '1', source: 'Nairobi', destination: 'Mombasa', vehicle: 'KBZ 456B', driver: 'Mary Wanjiru', status: 'DISPATCHED', date: '2026-07-10' },
  { id: '2', source: 'Kisumu', destination: 'Nakuru', vehicle: 'KCB 123A', driver: 'John Kamau', status: 'COMPLETED', date: '2026-07-08' },
  { id: '3', source: 'Nairobi', destination: 'Thika', vehicle: 'KDB 321D', driver: 'Peter Odhiambo', status: 'DRAFT', date: '2026-07-12' },
  { id: '4', source: 'Nairobi', destination: 'Eldoret', vehicle: 'KCB 123A', driver: 'John Kamau', status: 'CANCELLED', date: '2026-07-05' },
  { id: '5', source: 'Nakuru', destination: 'Kisumu', vehicle: 'KDB 321D', driver: 'Peter Odhiambo', status: 'COMPLETED', date: '2026-07-03' },
];

const PAGE_TITLE_STYLE: React.CSSProperties = {
  fontFamily: 'Poppins, sans-serif', fontWeight: 700,
  fontSize: '24px', color: '#1A1F27', margin: '0 0 4px',
};

export function Dashboard({ userRole, onNavigate }: DashboardProps) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={PAGE_TITLE_STYLE}>Dashboard</h1>
        <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
          Fleet operations overview — {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <KPICard label="Active Vehicles" value={12} icon={<Truck size={18} />} trend="up" trendText="+2 this month" />
        <KPICard label="Available" value={8} icon={<Truck size={18} />} accent="#1E9E5A" trend="flat" trendText="Steady" />
        <KPICard label="In Maintenance" value={2} icon={<Wrench size={18} />} accent="#D98F1F" trend="down" trendText="−1 vs last week" />
        <KPICard label="Active Trips" value={4} icon={<MapPin size={18} />} accent="#1D6FE0" trend="up" trendText="+1 today" />
        <KPICard label="Pending Trips" value={3} icon={<Clock size={18} />} accent="#6B7280" />
        <KPICard label="Drivers on Duty" value={4} icon={<Users size={18} />} accent="#7C3AED" />
        <KPICard label="Fleet Utilisation" value="67%" icon={<PercentIcon size={18} />} accent="#004643" trend="up" trendText="+5% vs last month" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 24 }}>
        {/* Monthly trips bar chart */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>Monthly Trip Volume</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MONTHLY_TRIPS} barSize={20} barGap={4}>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 13 }}
              />
              <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="completed" name="Completed" fill="#004643" radius={[4,4,0,0]} />
              <Bar dataKey="cancelled" name="Cancelled" fill="#FCA5A5" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fleet status donut */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>Fleet Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={FLEET_STATUS_DATA}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={80}
                dataKey="value" paddingAngle={3}
              >
                {FLEET_STATUS_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {FLEET_STATUS_DATA.map(d => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '13px' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: d.color, flexShrink: 0 }} />
                <span style={{ flex: 1, color: '#374151' }}>{d.name}</span>
                <span style={{ fontWeight: 600, color: '#1A1F27' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent trips */}
      <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>Recent Trips</h3>
          <button
            onClick={() => onNavigate('trips')}
            style={{ background: 'none', border: 'none', color: '#004643', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            View all →
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FAFAFA' }}>
              {['Route', 'Vehicle', 'Driver', 'Status', 'Date'].map(h => (
                <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RECENT_TRIPS.map((trip, i) => (
              <tr key={trip.id} style={{ borderTop: '1px solid rgba(0,0,0,0.05)', background: i % 2 === 0 ? '#fff' : '#FEFEFE' }}>
                <td style={{ padding: '12px 20px', fontSize: '13px', color: '#1A1F27', fontWeight: 500 }}>
                  {trip.source} → {trip.destination}
                </td>
                <td style={{ padding: '12px 20px', fontSize: '13px', color: '#374151' }}>{trip.vehicle}</td>
                <td style={{ padding: '12px 20px', fontSize: '13px', color: '#374151' }}>{trip.driver}</td>
                <td style={{ padding: '12px 20px' }}>
                  <StatusBadge status={trip.status} />
                </td>
                <td style={{ padding: '12px 20px', fontSize: '12px', color: '#6B7280' }}>{trip.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
