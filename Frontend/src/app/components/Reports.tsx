import { Download, TrendingUp, TrendingDown } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import type { Role } from './Layout';

interface VehicleReport {
  id: string;
  reg: string;
  name: string;
  fuelEfficiency: number;
  operationalCost: number;
  roi: number;
  totalDistance: number;
  acquisitionCost: number;
}

const VEHICLE_REPORTS: VehicleReport[] = [
  { id: '1', reg: 'KCB 123A', name: 'Toyota Hino 300',   fuelEfficiency: 2.8, operationalCost: 178845, roi:  14.2, totalDistance: 2356, acquisitionCost: 4200000 },
  { id: '2', reg: 'KBZ 456B', name: 'Mercedes Sprinter',  fuelEfficiency: 3.6, operationalCost: 89500,  roi:  22.5, totalDistance: 3210, acquisitionCost: 3100000 },
  { id: '3', reg: 'KDA 789C', name: 'Isuzu FRR 90L',      fuelEfficiency: 1.9, operationalCost: 312400, roi:  -4.8, totalDistance: 1890, acquisitionCost: 6800000 },
  { id: '4', reg: 'KDB 321D', name: 'MAN TGX 26.440',     fuelEfficiency: 1.4, operationalCost: 267800, roi:   8.9, totalDistance: 4120, acquisitionCost: 9500000 },
  { id: '5', reg: 'KDE 654E', name: 'Ford Transit',        fuelEfficiency: 4.1, operationalCost: 56200,  roi:  -2.1, totalDistance: 890,  acquisitionCost: 2400000 },
  { id: '6', reg: 'KDH 910F', name: 'Mitsubishi Fuso',    fuelEfficiency: 2.2, operationalCost: 142300, roi:  11.4, totalDistance: 3050, acquisitionCost: 5600000 },
];

const PAGE_TITLE: React.CSSProperties = {
  fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '24px', color: '#1A1F27', margin: '0 0 4px',
};
const TABLE_TH: React.CSSProperties = {
  padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600,
  color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.06em', whiteSpace: 'nowrap',
};
const TABLE_TD: React.CSSProperties = { padding: '12px 16px', fontSize: '13px', color: '#374151' };

function roiColor(roi: number) {
  return roi >= 10 ? '#1E9E5A' : roi >= 0 ? '#D98F1F' : '#B3261E';
}

function effColor(eff: number) {
  return eff >= 3 ? '#1E9E5A' : eff >= 2 ? '#D98F1F' : '#B3261E';
}

function exportCSV() {
  const headers = ['Reg No', 'Name', 'Fuel Efficiency (km/L)', 'Operational Cost (₹)', 'ROI (%)', 'Total Distance (km)'];
  const rows = VEHICLE_REPORTS.map(v => [v.reg, v.name, v.fuelEfficiency, v.operationalCost, v.roi, v.totalDistance]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transitops-vehicle-report.csv';
  a.click();
  URL.revokeObjectURL(url);
}

interface ReportsProps { userRole: Role }

export function Reports({ userRole }: ReportsProps) {
  const totalOpCost = VEHICLE_REPORTS.reduce((s, v) => s + v.operationalCost, 0);
  const avgROI = (VEHICLE_REPORTS.reduce((s, v) => s + v.roi, 0) / VEHICLE_REPORTS.length).toFixed(1);
  const avgEff = (VEHICLE_REPORTS.reduce((s, v) => s + v.fuelEfficiency, 0) / VEHICLE_REPORTS.length).toFixed(2);

  const chartData = VEHICLE_REPORTS.map(v => ({
    reg: v.reg, cost: Math.round(v.operationalCost / 1000), roi: v.roi,
  }));

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={PAGE_TITLE}>Fleet Reports</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Vehicle performance & financial analysis</p>
        </div>
        <button
          onClick={exportCSV}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: '8px',
            background: '#004643', color: '#fff', fontSize: '14px', fontWeight: 600, border: 'none', cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,70,67,0.3)',
          }}
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Operational Cost', value: `₹${totalOpCost.toLocaleString()}`, sub: 'All vehicles combined' },
          { label: 'Avg Fleet ROI', value: `${avgROI}%`, sub: 'Revenue vs total cost', positive: Number(avgROI) > 0 },
          { label: 'Avg Fuel Efficiency', value: `${avgEff} km/L`, sub: 'Fleet average' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: '12px', padding: '22px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            <div style={{
              fontSize: '26px', fontWeight: 700, fontFamily: 'Poppins, sans-serif',
              color: s.positive !== undefined ? (s.positive ? '#1E9E5A' : '#B3261E') : '#1A1F27',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {s.value}
              {s.positive !== undefined && (s.positive ? <TrendingUp size={18} /> : <TrendingDown size={18} />)}
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>Operational Cost by Vehicle (₹'000)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="reg" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => [`₹${(v * 1000).toLocaleString()}`, 'Op. Cost']}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 13 }}
              />
              <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => <Cell key={i} fill="#004643" fillOpacity={0.75 + i * 0.04} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>ROI by Vehicle (%)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="reg" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => [`${v}%`, 'ROI']}
                contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontSize: 13 }}
              />
              <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.roi >= 0 ? '#1E9E5A' : '#B3261E'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Per-vehicle table */}
      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>Per-Vehicle Breakdown</h3>
          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>All figures are cumulative to date</span>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FAFAFA' }}>
              {['Vehicle', 'Total Distance', 'Fuel Efficiency', 'Operational Cost', 'Acquisition Cost', 'ROI'].map(h => (
                <th key={h} style={TABLE_TH}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VEHICLE_REPORTS.map((v, i) => (
              <tr key={v.id} style={{ borderTop: '1px solid rgba(0,0,0,0.05)', background: i % 2 === 0 ? '#fff' : '#FEFEFE' }}>
                <td style={TABLE_TD}>
                  <div style={{ fontWeight: 600, color: '#004643' }}>{v.reg}</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{v.name}</div>
                </td>
                <td style={TABLE_TD}>{v.totalDistance.toLocaleString()} km</td>
                <td style={{ ...TABLE_TD, fontWeight: 600, color: effColor(v.fuelEfficiency) }}>{v.fuelEfficiency} km/L</td>
                <td style={{ ...TABLE_TD, fontWeight: 500 }}>₹{v.operationalCost.toLocaleString()}</td>
                <td style={TABLE_TD}>₹{v.acquisitionCost.toLocaleString()}</td>
                <td style={{ ...TABLE_TD, fontWeight: 700, color: roiColor(v.roi) }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {v.roi >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                    {v.roi > 0 ? '+' : ''}{v.roi}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
