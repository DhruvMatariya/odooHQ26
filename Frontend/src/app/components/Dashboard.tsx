import React, { useState, useEffect } from 'react';
import { KPICard } from './KPICard';
import { StatusBadge } from './StatusBadge';
import {
  Truck, Users, Wrench, MapPin, Clock, PercentIcon,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import type { Role } from './Layout';
import { apiGetKpis, apiGetTrips, apiGetVehicles, type KpiData, type ApiTrip, type ApiVehicle } from '../../lib/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

interface DashboardProps {
  userRole: Role;
  onNavigate: (page: string) => void;
}

const FLEET_STATUS_DATA = [
  { name: 'Available', value: 8, color: '#1E9E5A' },
  { name: 'On Trip', value: 4, color: '#1D6FE0' },
  { name: 'In Shop', value: 2, color: '#D98F1F' },
  { name: 'Retired', value: 1, color: '#B3261E' },
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

/* ── Custom Tooltip so no dark background appears ── */
function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff',
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
      padding: '10px 14px',
      fontSize: 13,
      minWidth: 130,
    }}>
      <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#1A1F27' }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ margin: '2px 0', color: p.color, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span>{p.name}</span>
          <span style={{ fontWeight: 600, color: '#1A1F27' }}>{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function CustomPieTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div style={{
      background: '#fff',
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
      padding: '8px 14px',
      fontSize: 13,
    }}>
      <span style={{ color: d.payload.color, fontWeight: 700 }}>● </span>
      <span style={{ color: '#1A1F27', fontWeight: 600 }}>{d.name}:</span>{' '}
      <span style={{ color: '#374151' }}>{d.value} vehicles</span>
    </div>
  );
}

/* ── Inject keyframes synchronously at module load (safe in browser) ── */
if (typeof document !== 'undefined' && !document.getElementById('dash-kf')) {
  const s = document.createElement('style');
  s.id = 'dash-kf';
  s.textContent = `
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0);    }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.96); }
      to   { opacity: 1; transform: scale(1);    }
    }
    @keyframes barGrow {
      from { opacity: 0; transform: scaleY(0); transform-origin: bottom; }
      to   { opacity: 1; transform: scaleY(1); transform-origin: bottom; }
    }
  `;
  document.head.appendChild(s);
}

const PAGE_TITLE_STYLE: React.CSSProperties = {
  fontFamily: 'Poppins, sans-serif', fontWeight: 700,
  fontSize: '24px', color: '#1A1F27', margin: '0 0 4px',
};

export function Dashboard({ userRole, onNavigate }: DashboardProps) {
  const [kpis, setKpis] = useState<KpiData | null>(null);
  const [trips, setTrips] = useState<ApiTrip[]>([]);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [loading, setLoading] = useState(!USE_MOCK);

  useEffect(() => {
    if (USE_MOCK) return;
    let mounted = true;
    Promise.all([apiGetKpis(), apiGetTrips(), apiGetVehicles()])
      .then(([kpiData, tripsData, vehiclesData]) => {
        if (!mounted) return;
        setKpis(kpiData);
        setTrips(tripsData.slice(0, 5)); // recent 5
        setVehicles(vehiclesData);
        setLoading(false);
      })
      .catch(console.error);
    return () => { mounted = false; };
  }, []);

  const displayKpis = USE_MOCK || !kpis ? {
    activeVehicles: 12,
    availableVehicles: 8,
    vehiclesInMaintenance: 2,
    activeTrips: 4,
    pendingTrips: 3,
    driversOnDuty: 4,
    fleetUtilizationPct: 67,
  } : kpis;

  let fleetStatusData = FLEET_STATUS_DATA;
  if (!USE_MOCK && vehicles.length > 0) {
    const counts = { AVAILABLE: 0, ON_TRIP: 0, IN_SHOP: 0, RETIRED: 0 };
    vehicles.forEach(v => counts[v.status as keyof typeof counts] = (counts[v.status as keyof typeof counts] || 0) + 1);
    fleetStatusData = [
      { name: 'Available', value: counts.AVAILABLE, color: '#1E9E5A' },
      { name: 'On Trip', value: counts.ON_TRIP, color: '#1D6FE0' },
      { name: 'In Shop', value: counts.IN_SHOP, color: '#D98F1F' },
      { name: 'Retired', value: counts.RETIRED, color: '#B3261E' },
    ];
  }

  const recentTrips = USE_MOCK || !trips.length ? RECENT_TRIPS : trips.map(t => ({
    id: t.id,
    source: t.source,
    destination: t.destination,
    vehicle: t.vehicle?.registrationNumber || 'Unknown',
    driver: t.driver?.name || 'Unknown',
    status: t.status,
    date: new Date(t.createdAt).toLocaleDateString('en-GB')
  }));

  if (loading) return <div style={{ padding: 24 }}>Loading dashboard...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, animation: 'fadeUp 0.45s ease both' }}>
        <h1 style={PAGE_TITLE_STYLE}>Dashboard</h1>
        <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
          Fleet operations overview —{' '}
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPI Cards — staggered */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          <KPICard key="av" label="Active Vehicles" value={displayKpis.activeVehicles} icon={<Truck size={18} />} trend="up" trendText="+2 this month" />,
          <KPICard key="av2" label="Available" value={displayKpis.availableVehicles} icon={<Truck size={18} />} accent="#1E9E5A" trend="flat" trendText="Steady" />,
          <KPICard key="mnt" label="In Maintenance" value={displayKpis.vehiclesInMaintenance} icon={<Wrench size={18} />} accent="#D98F1F" trend="down" trendText="−1 vs last week" />,
          <KPICard key="atr" label="Active Trips" value={displayKpis.activeTrips} icon={<MapPin size={18} />} accent="#1D6FE0" trend="up" trendText="+1 today" />,
          <KPICard key="pnd" label="Pending Trips" value={displayKpis.pendingTrips} icon={<Clock size={18} />} accent="#6B7280" />,
          <KPICard key="dod" label="Drivers on Duty" value={displayKpis.driversOnDuty} icon={<Users size={18} />} accent="#7C3AED" />,
          <KPICard key="fu" label="Fleet Utilisation" value={`${displayKpis.fleetUtilizationPct}%`} icon={<PercentIcon size={18} />} accent="#004643" trend="up" trendText="+5% vs last month" />,
        ].map((card, i) => (
          <div key={i} style={{ animation: `fadeUp 0.45s ease ${0.05 * i + 0.1}s both` }}>
            {card}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16, marginBottom: 24 }}>
        {/* Monthly trips bar chart */}
        <div style={{
          background: '#fff', borderRadius: '12px', padding: '20px 24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)',
          animation: 'scaleIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.3s both',
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>
            Monthly Trip Volume
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={MONTHLY_TRIPS} barSize={20} barGap={4}>
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,70,67,0.05)' }} />
              <Legend iconSize={10} iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="completed" name="Completed" fill="#004643" radius={[4, 4, 0, 0]}
                isAnimationActive animationBegin={350} animationDuration={900} animationEasing="ease-out" />
              <Bar dataKey="cancelled" name="Cancelled" fill="#FCA5A5" radius={[4, 4, 0, 0]}
                isAnimationActive animationBegin={500} animationDuration={900} animationEasing="ease-out" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Fleet status donut */}
        <div style={{
          background: '#fff', borderRadius: '12px', padding: '20px 24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)',
          animation: 'scaleIn 0.55s cubic-bezier(0.22,1,0.36,1) 0.4s both',
        }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>
            Fleet Status
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={fleetStatusData}
                cx="50%" cy="50%"
                innerRadius={55} outerRadius={80}
                dataKey="value" paddingAngle={3}
                isAnimationActive
                animationBegin={200}
                animationDuration={900}
              >
                {fleetStatusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {fleetStatusData.map(d => (
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
      <div style={{
        background: '#fff', borderRadius: '12px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)',
        overflow: 'hidden',
        animation: 'fadeUp 0.5s ease 0.5s both',
      }}>
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
            {recentTrips.map((trip, i) => (
              <tr
                key={trip.id}
                style={{
                  borderTop: '1px solid rgba(0,0,0,0.05)',
                  background: i % 2 === 0 ? '#fff' : '#FEFEFE',
                  animation: `fadeUp 0.35s ease ${0.55 + i * 0.06}s both`,
                }}
              >
                <td style={{ padding: '12px 20px', fontSize: '13px', color: '#1A1F27', fontWeight: 500 }}>
                  {trip.source} → {trip.destination}
                </td>
                <td style={{ padding: '12px 20px', fontSize: '13px', color: '#374151' }}>{trip.vehicle}</td>
                <td style={{ padding: '12px 20px', fontSize: '13px', color: '#374151' }}>{trip.driver}</td>
                <td style={{ padding: '12px 20px' }}><StatusBadge status={trip.status} /></td>
                <td style={{ padding: '12px 20px', fontSize: '12px', color: '#6B7280' }}>{trip.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
