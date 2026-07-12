import { useState, useMemo } from 'react';
import { Plus, Search, X, ArrowLeft, Info, Truck } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from './StatusBadge';
import { ConfirmModal } from './ConfirmModal';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { SortableHeader, PlainHeader, type SortDir } from './SortableHeader';
import type { Role } from './Layout';

export interface Vehicle {
  id: string;
  registrationNumber: string;
  name: string;
  type: string;
  maxLoadCapacity: number;
  odometer: number;
  acquisitionCost: number;
  status: string;
}

const INITIAL_VEHICLES: Vehicle[] = [
  { id: '1', registrationNumber: 'KCB 123A', name: 'Toyota Hino 300',   type: 'TRUCK',       maxLoadCapacity: 5000,  odometer: 45230,  acquisitionCost: 4200000, status: 'AVAILABLE' },
  { id: '2', registrationNumber: 'KBZ 456B', name: 'Mercedes Sprinter', type: 'VAN',         maxLoadCapacity: 2000,  odometer: 78900,  acquisitionCost: 3100000, status: 'ON_TRIP'   },
  { id: '3', registrationNumber: 'KDA 789C', name: 'Isuzu FRR 90L',     type: 'TRUCK',       maxLoadCapacity: 8000,  odometer: 112400, acquisitionCost: 6800000, status: 'IN_SHOP'   },
  { id: '4', registrationNumber: 'KDB 321D', name: 'MAN TGX 26.440',    type: 'HEAVY_TRUCK', maxLoadCapacity: 12000, odometer: 203560, acquisitionCost: 9500000, status: 'AVAILABLE' },
  { id: '5', registrationNumber: 'KDE 654E', name: 'Ford Transit',       type: 'VAN',         maxLoadCapacity: 1500,  odometer: 289000, acquisitionCost: 2400000, status: 'RETIRED'   },
  { id: '6', registrationNumber: 'KDH 910F', name: 'Mitsubishi Fuso',   type: 'TRUCK',       maxLoadCapacity: 7000,  odometer: 67800,  acquisitionCost: 5600000, status: 'AVAILABLE' },
  { id: '7', registrationNumber: 'KDF 221G', name: 'Hino 500 Series',   type: 'HEAVY_TRUCK', maxLoadCapacity: 10000, odometer: 156300, acquisitionCost: 8200000, status: 'AVAILABLE' },
  { id: '8', registrationNumber: 'KDG 445H', name: 'Isuzu NKR',         type: 'TRUCK',       maxLoadCapacity: 3500,  odometer: 88400,  acquisitionCost: 4700000, status: 'ON_TRIP'   },
];

const VEHICLE_TYPES = ['TRUCK', 'VAN', 'HEAVY_TRUCK', 'MINIBUS', 'PICKUP'];
const STATUSES = ['AVAILABLE', 'ON_TRIP', 'IN_SHOP', 'RETIRED'];

const MAINTENANCE_HISTORY = [
  { id: '1', description: 'Engine oil change + filter', cost: 15000, date: '2026-06-10', isActive: false },
  { id: '2', description: 'Brake pad replacement',      cost: 28000, date: '2026-05-18', isActive: false },
];
const TRIP_HISTORY = [
  { id: '2', route: 'Kisumu → Nakuru',    date: '2026-07-08', status: 'COMPLETED', distance: 186 },
  { id: '4', route: 'Nairobi → Eldoret',  date: '2026-07-05', status: 'CANCELLED', distance: 314 },
];
const FUEL_HISTORY = [
  { id: '1', liters: 85, cost: 15725, date: '2026-07-08' },
  { id: '2', liters: 72, cost: 13320, date: '2026-06-25' },
];

const PAGE_TITLE: React.CSSProperties = {
  fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '24px', color: '#1A1F27', margin: '0 0 4px',
};
const TABLE_TD: React.CSSProperties = { padding: '12px 16px', fontSize: '13px', color: '#374151' };
const BTN_PRIMARY: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: '8px',
  background: '#004643', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
};
const BTN_GHOST: React.CSSProperties = {
  padding: '6px 12px', borderRadius: '6px', background: 'transparent',
  border: '1px solid rgba(0,0,0,0.12)', fontSize: '12px', cursor: 'pointer', color: '#374151',
};
const INPUT_STYLE: React.CSSProperties = {
  padding: '8px 12px', borderRadius: '8px', border: '1.5px solid rgba(0,0,0,0.12)',
  fontSize: '13px', background: '#FAFAFA', color: '#1A1F27', outline: 'none',
};
const LABEL: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: 5 };

function fmt(n: number) { return n.toLocaleString(); }

const PAGE_SIZE = 6;

interface VehiclesProps { userRole: Role }

export function Vehicles({ userRole }: VehiclesProps) {
  const canWrite = userRole === 'FLEET_MANAGER';
  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortField, setSortField] = useState<keyof Vehicle>('registrationNumber');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAdd, setShowAdd] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [retireConfirm, setRetireConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Vehicle>>({});

  function handleSort(field: string) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field as keyof Vehicle);
      setSortDir('asc');
    }
    setCurrentPage(1);
  }

  const filtered = useMemo(() => {
    let list = vehicles.filter(v => {
      if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.registrationNumber.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus && v.status !== filterStatus) return false;
      if (filterType && v.type !== filterType) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      const va = a[sortField]; const vb = b[sortField];
      if (va === vb) return 0;
      const cmp = va < vb ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [vehicles, search, filterStatus, filterType, sortField, sortDir]);

  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selected = vehicles.find(v => v.id === selectedId);

  function openAdd() {
    setForm({ type: 'TRUCK', status: 'AVAILABLE' });
    setEditVehicle(null);
    setShowAdd(true);
  }

  function openEdit(v: Vehicle) {
    setForm({ ...v });
    setEditVehicle(v);
    setShowAdd(true);
  }

  function saveVehicle() {
    if (!form.registrationNumber || !form.name) return;
    if (editVehicle) {
      setVehicles(vs => vs.map(v => v.id === editVehicle.id ? { ...v, ...form } as Vehicle : v));
      toast.success(`${form.name} updated successfully`);
    } else {
      setVehicles(vs => [...vs, { ...form, id: String(Date.now()), status: 'AVAILABLE' } as Vehicle]);
      toast.success(`${form.name} added to fleet`);
    }
    setShowAdd(false);
  }

  function retireVehicle(id: string) {
    const v = vehicles.find(v => v.id === id);
    setVehicles(vs => vs.map(v => v.id === id ? { ...v, status: 'RETIRED' } : v));
    setRetireConfirm(null);
    toast.success(`${v?.name} has been retired`);
    if (selectedId === id) setView('list');
  }

  // — Detail view —
  if (view === 'detail' && selected) {
    const TABS = ['overview', 'trips', 'maintenance', 'fuel', 'report'];
    return (
      <div>
        <button onClick={() => setView('list')} style={{ ...BTN_GHOST, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          <ArrowLeft size={14} /> Back to Vehicles
        </button>

        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '20px', margin: 0, color: '#1A1F27' }}>{selected.name}</h2>
                <StatusBadge status={selected.status} size="md" />
              </div>
              <p style={{ margin: 0, fontSize: '14px', color: '#6B7280' }}>
                Reg: <strong style={{ color: '#1A1F27' }}>{selected.registrationNumber}</strong>
                &nbsp;·&nbsp; Type: <strong style={{ color: '#1A1F27' }}>{selected.type.replace(/_/g, ' ')}</strong>
                &nbsp;·&nbsp; Max Load: <strong style={{ color: '#1A1F27' }}>{fmt(selected.maxLoadCapacity)} kg</strong>
              </p>
            </div>
            {canWrite && selected.status !== 'RETIRED' && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => openEdit(selected)} style={BTN_GHOST}>Edit Vehicle</button>
                <button onClick={() => setRetireConfirm(selected.id)} style={{ ...BTN_GHOST, borderColor: '#FCA5A5', color: '#B3261E' }}>Retire Vehicle</button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: activeTab === tab ? '#004643' : '#fff',
              color: activeTab === tab ? '#fff' : '#6B7280',
              fontSize: '13px', fontWeight: activeTab === tab ? 600 : 400,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              {tab === 'fuel' ? 'Fuel & Expenses' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { label: 'Odometer',         value: `${fmt(selected.odometer)} km` },
              { label: 'Acquisition Cost', value: `KES ${fmt(selected.acquisitionCost)}` },
              { label: 'Max Load',         value: `${fmt(selected.maxLoadCapacity)} kg` },
              { label: 'Vehicle Type',     value: selected.type.replace(/_/g, ' ') },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: '#1A1F27', fontFamily: 'Poppins, sans-serif' }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'trips' && (
          <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#FAFAFA' }}>
                {['Route', 'Date', 'Distance', 'Status'].map(h => <PlainHeader key={h} label={h} />)}
              </tr></thead>
              <tbody>
                {TRIP_HISTORY.map(t => (
                  <tr key={t.id} style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <td style={TABLE_TD}>{t.route}</td>
                    <td style={TABLE_TD}>{t.date}</td>
                    <td style={TABLE_TD}>{t.distance} km</td>
                    <td style={TABLE_TD}><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#FAFAFA' }}>
                {['Description', 'Cost', 'Date', 'Status'].map(h => <PlainHeader key={h} label={h} />)}
              </tr></thead>
              <tbody>
                {MAINTENANCE_HISTORY.map(m => (
                  <tr key={m.id} style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <td style={TABLE_TD}>{m.description}</td>
                    <td style={TABLE_TD}>KES {fmt(m.cost)}</td>
                    <td style={TABLE_TD}>{m.date}</td>
                    <td style={TABLE_TD}><StatusBadge status={m.isActive ? 'ACTIVE' : 'CLOSED'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'fuel' && (
          <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#FAFAFA' }}>
                {['Date', 'Liters', 'Cost'].map(h => <PlainHeader key={h} label={h} />)}
              </tr></thead>
              <tbody>
                {FUEL_HISTORY.map(f => (
                  <tr key={f.id} style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <td style={TABLE_TD}>{f.date}</td>
                    <td style={TABLE_TD}>{f.liters} L</td>
                    <td style={TABLE_TD}>KES {fmt(f.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'report' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              { label: 'Fuel Efficiency',    value: '2.6 km/L',        good: true },
              { label: 'Operational Cost',   value: 'KES 178,845',     good: null },
              { label: 'Return on Investment', value: '12.4%',         good: true },
            ].map(s => (
              <div key={s.label} style={{ background: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: s.good === true ? '#1E9E5A' : s.good === false ? '#B3261E' : '#1A1F27' }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {retireConfirm && (
          <ConfirmModal
            title="Retire Vehicle"
            message={`Retire ${selected.name}? Status will be set to RETIRED and it will no longer be available for trips.`}
            confirmLabel="Retire" confirmDanger
            onConfirm={() => retireVehicle(retireConfirm)}
            onCancel={() => setRetireConfirm(null)}
          />
        )}
      </div>
    );
  }

  // — List view —
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={PAGE_TITLE}>Vehicles</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>{vehicles.length} total in fleet</p>
        </div>
        {canWrite && (
          <button onClick={openAdd} style={BTN_PRIMARY}><Plus size={15} /> Add Vehicle</button>
        )}
      </div>

      {/* Status chip row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['', ...STATUSES].map(s => {
          const count = s ? vehicles.filter(v => v.status === s).length : vehicles.length;
          const active = filterStatus === s;
          return (
            <button key={s || 'ALL'} onClick={() => { setFilterStatus(s); setCurrentPage(1); }} style={{
              padding: '5px 14px', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: active ? 600 : 400,
              background: active ? '#004643' : '#fff', color: active ? '#fff' : '#6B7280',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}>
              {s || 'All'} <span style={{ marginLeft: 4, opacity: 0.7 }}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search + type filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input placeholder="Search name or reg…" style={{ ...INPUT_STYLE, paddingLeft: 32, width: 240 }}
            value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} />
        </div>
        <select style={{ ...INPUT_STYLE, cursor: 'pointer' }} value={filterType} onChange={e => { setFilterType(e.target.value); setCurrentPage(1); }}>
          <option value="">All types</option>
          {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
        </select>
        {(filterType || search) && (
          <button onClick={() => { setSearch(''); setFilterType(''); setCurrentPage(1); }} style={BTN_GHOST}>
            <X size={13} style={{ marginRight: 4 }} />Clear
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#6B7280' }}>{filtered.length} vehicle{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FAFAFA' }}>
              <SortableHeader label="Reg No."     field="registrationNumber" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Name"        field="name"               sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Type"        field="type"               sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Max Load"    field="maxLoadCapacity"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Odometer"    field="odometer"           sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Acq. Cost"   field="acquisitionCost"    sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <PlainHeader    label="Status" />
              <PlainHeader    label="" />
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <EmptyState icon={<Truck size={24} />} title="No vehicles found" message="Try adjusting your search or filter criteria." />
            ) : paged.map((v, i) => (
              <tr key={v.id}
                style={{ borderTop: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'background 0.1s', background: i % 2 === 0 ? '#fff' : '#FEFEFE' }}
                onClick={() => { setSelectedId(v.id); setActiveTab('overview'); setView('detail'); }}
                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#F7F8FA'}
                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? '#fff' : '#FEFEFE'}
              >
                <td style={{ ...TABLE_TD, fontWeight: 600, color: '#004643' }}>{v.registrationNumber}</td>
                <td style={{ ...TABLE_TD, fontWeight: 500 }}>{v.name}</td>
                <td style={{ ...TABLE_TD, color: '#6B7280' }}>{v.type.replace(/_/g, ' ')}</td>
                <td style={TABLE_TD}>{fmt(v.maxLoadCapacity)} kg</td>
                <td style={TABLE_TD}>{fmt(v.odometer)} km</td>
                <td style={TABLE_TD}>KES {fmt(v.acquisitionCost)}</td>
                <td style={TABLE_TD}><StatusBadge status={v.status} /></td>
                <td style={TABLE_TD} onClick={e => e.stopPropagation()}>
                  {canWrite && <button onClick={() => openEdit(v)} style={BTN_GHOST}>Edit</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination total={filtered.length} page={currentPage} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} />
      </div>

      {/* Add/Edit modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowAdd(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px 32px', width: 480, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#1A1F27' }}>{editVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={18} /></button>
            </div>
            {editVehicle && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F0EDE5', borderRadius: '8px', padding: '8px 12px', marginBottom: 16, fontSize: '12px', color: '#004643' }}>
                <Info size={13} /> Status is read-only here — changes only via Trip / Maintenance actions. &nbsp;<StatusBadge status={form.status || 'AVAILABLE'} />
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {([
                { label: 'Registration Number', key: 'registrationNumber', placeholder: 'e.g. KCB 123A' },
                { label: 'Vehicle Name',        key: 'name',               placeholder: 'e.g. Toyota Hino 300' },
              ] as const).map(f => (
                <div key={f.key}>
                  <label style={LABEL}>{f.label}</label>
                  <input style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' }} placeholder={f.placeholder}
                    value={(form as any)[f.key] || ''} onChange={e => setForm(fv => ({ ...fv, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label style={LABEL}>Type</label>
                <select style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
                  value={form.type || 'TRUCK'} onChange={e => setForm(fv => ({ ...fv, type: e.target.value }))}>
                  {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              {([
                { label: 'Max Load Capacity (kg)', key: 'maxLoadCapacity' },
                { label: 'Odometer (km)',           key: 'odometer' },
                { label: 'Acquisition Cost (KES)',  key: 'acquisitionCost' },
              ] as const).map(f => (
                <div key={f.key}>
                  <label style={LABEL}>{f.label}</label>
                  <input type="number" min="0" style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' }}
                    value={(form as any)[f.key] || ''}
                    onChange={e => setForm(fv => ({ ...fv, [f.key]: Number(e.target.value) }))} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button onClick={() => setShowAdd(false)} style={BTN_GHOST}>Cancel</button>
              <button onClick={saveVehicle} style={BTN_PRIMARY}>{editVehicle ? 'Save Changes' : 'Add Vehicle'}</button>
            </div>
          </div>
        </div>
      )}

      {retireConfirm && (
        <ConfirmModal
          title="Retire Vehicle"
          message="Retire this vehicle? Status will be set to RETIRED permanently."
          confirmLabel="Retire" confirmDanger
          onConfirm={() => retireVehicle(retireConfirm)}
          onCancel={() => setRetireConfirm(null)}
        />
      )}
    </div>
  );
}
