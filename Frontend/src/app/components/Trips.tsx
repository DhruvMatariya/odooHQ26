import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, X, ArrowLeft, Check, AlertCircle, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from './StatusBadge';
import { ConfirmModal } from './ConfirmModal';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { SortableHeader, PlainHeader, type SortDir } from './SortableHeader';
import type { Role } from './Layout';
import {
  apiGetTrips, apiCreateTrip, apiDispatchTrip, apiCompleteTrip, apiCancelTrip,
  apiGetAvailableVehicles, apiGetAvailableDrivers, type ApiTrip, type ApiVehicle, type ApiDriver, ApiError
} from '../../lib/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export type Trip = ApiTrip;

const STATUS_TABS = ['ALL', 'DRAFT', 'DISPATCHED', 'COMPLETED', 'CANCELLED'];
const PAGE_SIZE = 6;

const TABLE_TH: React.CSSProperties = {
  padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600,
  color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.06em', whiteSpace: 'nowrap',
};
const TABLE_TD: React.CSSProperties = { padding: '12px 16px', fontSize: '13px', color: '#374151' };
const PAGE_TITLE: React.CSSProperties = {
  fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '24px', color: '#1A1F27', margin: '0 0 4px',
};
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

// Status stepper
function TripStepper({ status }: { status: Trip['status'] }) {
  const steps = ['DRAFT', 'DISPATCHED', 'COMPLETED'] as const;
  const isCancelled = status === 'CANCELLED';
  const activeIdx = steps.indexOf(status as any);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {steps.map((step, i) => {
        const done = activeIdx > i || (status === 'CANCELLED' && i < 2);
        const active = i === activeIdx && !isCancelled;
        const cancelled = isCancelled && i === 1;
        return (
          <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : undefined }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: cancelled ? '#FEE2E2' : done || active ? '#004643' : '#E5E7EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `2px solid ${cancelled ? '#B3261E' : done || active ? '#004643' : '#D1D5DB'}`,
                transition: 'all 0.2s',
              }}>
                {done && !active ? (
                  <Check size={16} color="#fff" />
                ) : cancelled ? (
                  <X size={16} color="#B3261E" />
                ) : (
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: active ? '#fff' : '#9CA3AF' }} />
                )}
              </div>
              <span style={{
                fontSize: '11px', fontWeight: active ? 700 : 500,
                color: cancelled ? '#B3261E' : active ? '#004643' : done ? '#374151' : '#9CA3AF',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
              }}>
                {step.charAt(0) + step.slice(1).toLowerCase()}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 8px',
                marginBottom: 20,
                background: (done || (activeIdx > i)) && !isCancelled ? '#004643' : isCancelled && i === 0 ? '#004643' : '#E5E7EB',
                transition: 'background 0.2s',
              }} />
            )}
          </div>
        );
      })}
      {isCancelled && (
        <div style={{ marginLeft: 16, padding: '4px 12px', borderRadius: 999, background: '#FEE2E2', color: '#B3261E', fontSize: '12px', fontWeight: 600 }}>
          Cancelled
        </div>
      )}
    </div>
  );
}

interface TripsProps { userRole: Role }

export function Trips({ userRole }: TripsProps) {
  const canCreate = userRole === 'DRIVER';

  const [trips, setTrips] = useState<Trip[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('ALL');
  const [sortField, setSortField] = useState<keyof Trip>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState<string | null>(null);
  const [showComplete, setShowComplete] = useState(false);
  const [completeForm, setCompleteForm] = useState({ finalOdometer: '', fuelConsumed: '' });
  const [createForm, setCreateForm] = useState({
    source: '', destination: '', vehicleId: '', driverId: '',
    cargoWeight: '', plannedDistance: '',
  });
  const [createError, setCreateError] = useState('');

  const [loading, setLoading] = useState(!USE_MOCK);
  const [availVehicles, setAvailVehicles] = useState<ApiVehicle[]>([]);
  const [availDrivers, setAvailDrivers] = useState<ApiDriver[]>([]);

  useEffect(() => {
    if (USE_MOCK) return;
    let mounted = true;
    apiGetTrips()
      .then(data => { if (mounted) { setTrips(data); setLoading(false); } })
      .catch(err => { toast.error(err.message); if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  async function loadCreateData() {
    if (USE_MOCK) return;
    try {
      const [vs, ds] = await Promise.all([apiGetAvailableVehicles(), apiGetAvailableDrivers()]);
      setAvailVehicles(vs);
      setAvailDrivers(ds);
    } catch (err: any) {
      toast.error('Failed to load available resources');
    }
  }

  function handleSort(field: string) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field as keyof Trip); setSortDir('asc'); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    let list = trips.filter(t => {
      if (activeTab !== 'ALL' && t.status !== activeTab) return false;
      if (search && !t.source.toLowerCase().includes(search.toLowerCase()) && !t.destination.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      const va = a[sortField]; const vb = b[sortField];
      if (va === vb) return 0;
      const cmp = va < vb ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [trips, activeTab, search, sortField, sortDir]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = trips.find(t => t.id === selectedId);

  async function createTrip() {
    setCreateError('');
    const cargo = Number(createForm.cargoWeight);
    if (!USE_MOCK) {
      try {
        const created = await apiCreateTrip({
          ...createForm,
          cargoWeight: cargo,
          plannedDistance: Number(createForm.plannedDistance)
        });
        setTrips(ts => [created, ...ts]);
        setCreateForm({ source: '', destination: '', vehicleId: '', driverId: '', cargoWeight: '', plannedDistance: '' });
        setShowCreate(false);
        toast.success(`Trip created: ${createForm.source} → ${createForm.destination}`, { description: 'Status: DRAFT — dispatch when ready.' });
      } catch (err: any) {
        if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
          setCreateError(Object.values(err.fieldErrors).join(', '));
        } else {
          setCreateError(err.message || 'Failed to create trip');
        }
      }
      return;
    }
    
    if (!createForm.source || !createForm.destination) {
      setCreateError('All fields are required.');
      return;
    }
    const newTrip: any = {
      id: String(Date.now()), source: createForm.source, destination: createForm.destination,
      vehicleId: createForm.vehicleId, driverId: createForm.driverId,
      cargoWeight: cargo, plannedDistance: Number(createForm.plannedDistance),
      status: 'DRAFT', createdAt: new Date().toISOString(),
    };
    setTrips(ts => [newTrip, ...ts]);
    setCreateForm({ source: '', destination: '', vehicleId: '', driverId: '', cargoWeight: '', plannedDistance: '' });
    setShowCreate(false);
    toast.success(`Trip created`);
  }

  async function dispatchTrip(id: string) {
    if (!USE_MOCK) {
      try {
        const updated = await apiDispatchTrip(id);
        setTrips(ts => ts.map(t => t.id === id ? updated : t));
        toast.success(`Trip dispatched`);
      } catch (err: any) {
        toast.error(err.message || 'Failed to dispatch');
      }
      return;
    }
    setTrips(ts => ts.map(t => t.id === id ? { ...t, status: 'DISPATCHED' } : t));
    toast.success(`Trip dispatched`);
  }

  async function completeTrip() {
    if (!selectedId) return;
    if (!USE_MOCK) {
      try {
        const updated = await apiCompleteTrip(selectedId, Number(completeForm.finalOdometer), Number(completeForm.fuelConsumed));
        setTrips(ts => ts.map(t => t.id === selectedId ? updated : t));
        setShowComplete(false);
        setCompleteForm({ finalOdometer: '', fuelConsumed: '' });
        toast.success(`Trip completed`);
      } catch (err: any) {
        toast.error(err.message || 'Failed to complete trip');
      }
      return;
    }
    setTrips(ts => ts.map(t => t.id === selectedId
      ? { ...t, status: 'COMPLETED', finalOdometer: Number(completeForm.finalOdometer), fuelConsumed: Number(completeForm.fuelConsumed) }
      : t));
    setShowComplete(false);
    setCompleteForm({ finalOdometer: '', fuelConsumed: '' });
    toast.success(`Trip completed`);
  }

  async function cancelTrip(id: string) {
    if (!USE_MOCK) {
      try {
        const updated = await apiCancelTrip(id);
        setTrips(ts => ts.map(t => t.id === id ? updated : t));
        setCancelConfirm(null);
        toast.error(`Trip cancelled`);
      } catch (err: any) {
        toast.error(err.message || 'Failed to cancel trip');
      }
      return;
    }
    setTrips(ts => ts.map(t => t.id === id ? { ...t, status: 'CANCELLED' } : t));
    setCancelConfirm(null);
    toast.error(`Trip cancelled`);
  }

  // Detail view
  if (view === 'detail' && selected) {
    return (
      <div>
        <button onClick={() => setView('list')} style={{ ...BTN_GHOST, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          <ArrowLeft size={14} /> Back to Trips
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <h1 style={{ ...PAGE_TITLE, marginBottom: 0 }}>{selected.source} → {selected.destination}</h1>
          <StatusBadge status={selected.status} size="md" />
        </div>

        {/* Stepper */}
        <div style={{ background: '#fff', borderRadius: '12px', padding: '24px 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <TripStepper status={selected.status} />

          {/* Action buttons */}
          {canCreate && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {selected.status === 'DRAFT' && (
                <button onClick={() => dispatchTrip(selected.id)} style={BTN_PRIMARY}>
                  Dispatch Trip
                </button>
              )}
              {selected.status === 'DISPATCHED' && (
                <>
                  <button onClick={() => setShowComplete(true)} style={BTN_PRIMARY}>
                    Complete Trip
                  </button>
                  <button
                    onClick={() => setCancelConfirm(selected.id)}
                    style={{ ...BTN_GHOST, borderColor: '#FCA5A5', color: '#B3261E' }}
                  >
                    Cancel Trip
                  </button>
                </>
              )}
              {(selected.status === 'COMPLETED' || selected.status === 'CANCELLED') && (
                <div style={{ fontSize: '13px', color: '#6B7280', padding: '8px 0' }}>
                  This trip is {selected.status.toLowerCase()} — no further actions available.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trip info + linked entities */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Trip Details</div>
            {[
              { label: 'Cargo Weight', value: `${selected.cargoWeight.toLocaleString()} kg` },
              { label: 'Planned Distance', value: `${selected.plannedDistance} km` },
              { label: 'Created', value: selected.createdAt },
              ...(selected.fuelConsumed ? [{ label: 'Fuel Consumed', value: `${selected.fuelConsumed} L` }] : []),
              ...(selected.finalOdometer ? [{ label: 'Final Odometer', value: `${selected.finalOdometer.toLocaleString()} km` }] : []),
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: '13px', color: '#6B7280' }}>{r.label}</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#1A1F27' }}>{r.value}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Vehicle</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1A1F27', marginBottom: 4, fontFamily: 'Poppins, sans-serif' }}>{selected.vehicle?.registrationNumber || 'Unknown'}</div>
            <div style={{ fontSize: '13px', color: '#6B7280', marginBottom: 12 }}>{selected.vehicle?.name || 'Unknown'}</div>
            <StatusBadge status={selected.status === 'DRAFT' || selected.status === 'COMPLETED' || selected.status === 'CANCELLED' ? 'AVAILABLE' : 'ON_TRIP'} />
          </div>

          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Driver</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#004643', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 700, color: '#F0EDE5' }}>
                {(selected.driver?.name || 'U').charAt(0)}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#1A1F27' }}>{selected.driver?.name || 'Unknown'}</div>
              </div>
            </div>
            <StatusBadge status={selected.status === 'DRAFT' || selected.status === 'COMPLETED' || selected.status === 'CANCELLED' ? 'AVAILABLE' : 'ON_TRIP'} />
          </div>
        </div>

        {/* Complete trip modal */}
        {showComplete && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowComplete(false)}>
            <div style={{ background: '#fff', borderRadius: '12px', padding: '28px 32px', width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
              onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#1A1F27' }}>Complete Trip</h3>
                <button onClick={() => setShowComplete(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={18} /></button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Final Odometer (km)', key: 'finalOdometer', placeholder: 'e.g. 45416' },
                  { label: 'Fuel Consumed (L)', key: 'fuelConsumed', placeholder: 'e.g. 85' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: 5 }}>{f.label}</label>
                    <input type="number" min="0"
                      style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' as const }}
                      placeholder={f.placeholder}
                      value={(completeForm as any)[f.key]}
                      onChange={e => setCompleteForm(fv => ({ ...fv, [f.key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
                <button onClick={() => setShowComplete(false)} style={BTN_GHOST}>Cancel</button>
                <button onClick={completeTrip} style={BTN_PRIMARY}>Mark as Completed</button>
              </div>
            </div>
          </div>
        )}

        {cancelConfirm && (
          <ConfirmModal
            title="Cancel Trip"
            message="Cancel this dispatched trip? The vehicle and driver will return to AVAILABLE status."
            confirmLabel="Cancel Trip" confirmDanger
            onConfirm={() => cancelTrip(cancelConfirm)}
            onCancel={() => setCancelConfirm(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={PAGE_TITLE}>Trips</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>{trips.length} total trips</p>
        </div>
        {canCreate && (
          <button onClick={() => { setShowCreate(true); loadCreateData(); }} style={BTN_PRIMARY}><Plus size={15} /> Create Trip</button>
        )}
      </div>

      {/* Status tab filter */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#fff', borderRadius: '10px', padding: 4, width: 'fit-content', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        {STATUS_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '6px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer',
              background: activeTab === tab ? '#004643' : 'transparent',
              color: activeTab === tab ? '#fff' : '#6B7280',
              fontSize: '12px', fontWeight: activeTab === tab ? 600 : 400,
              transition: 'all 0.15s',
            }}>
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
            <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: '999px', background: activeTab === tab ? 'rgba(255,255,255,0.2)' : '#F3F4F6', fontSize: '10px' }}>
              {tab === 'ALL' ? trips.length : trips.filter(t => t.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input placeholder="Search routes…" style={{ ...INPUT_STYLE, paddingLeft: 32, width: 240 }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {search && <button onClick={() => setSearch('')} style={{ ...BTN_GHOST, display: 'flex', alignItems: 'center', gap: 4 }}><X size={13} />Clear</button>}
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#6B7280' }}>{filtered.length} trip{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FAFAFA' }}>
              <PlainHeader label="Route" />
              <SortableHeader label="Vehicle"  field="vehicleReg"      sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Driver"   field="driverName"      sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Cargo"    field="cargoWeight"     sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Distance" field="plannedDistance" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <PlainHeader label="Status" />
              <SortableHeader label="Date"     field="createdAt"       sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <PlainHeader label="" />
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <EmptyState icon={<MapPin size={24} />} title="No trips found" message="Try changing the status tab or clearing your search." />
            ) : paged.map((t, i) => (
              <tr key={t.id}
                style={{ borderTop: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer', background: i % 2 === 0 ? '#fff' : '#FEFEFE' }}
                onClick={() => { setSelectedId(t.id); setView('detail'); }}
                onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#F7F8FA'}
                onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? '#fff' : '#FEFEFE'}
              >
                <td style={{ ...TABLE_TD, fontWeight: 600, color: '#1A1F27' }}>{t.source} → {t.destination}</td>
                <td style={TABLE_TD}>
                  <div style={{ fontWeight: 500, color: '#004643' }}>{t.vehicle?.registrationNumber || 'Unknown'}</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{t.vehicle?.name || 'Unknown'}</div>
                </td>
                <td style={TABLE_TD}>{t.driver?.name || 'Unknown'}</td>
                <td style={TABLE_TD}>{t.cargoWeight.toLocaleString()} kg</td>
                <td style={TABLE_TD}>{t.plannedDistance} km</td>
                <td style={TABLE_TD}><StatusBadge status={t.status} /></td>
                <td style={{ ...TABLE_TD, fontSize: '12px', color: '#6B7280' }}>{t.createdAt}</td>
                <td style={TABLE_TD} onClick={e => e.stopPropagation()}>
                  {canCreate && t.status === 'DRAFT' && (
                    <button onClick={() => dispatchTrip(t.id)} style={BTN_GHOST}>Dispatch</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination total={filtered.length} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      {/* Create Trip modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => { setShowCreate(false); setCreateError(''); }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px 32px', width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#1A1F27' }}>Create Trip</h3>
              <button onClick={() => { setShowCreate(false); setCreateError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={18} /></button>
            </div>

            {createError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEE2E2', borderRadius: '8px', padding: '10px 14px', marginBottom: 16, fontSize: '13px', color: '#B3261E' }}>
                <AlertCircle size={14} />{createError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { label: 'Source', key: 'source', placeholder: 'e.g. Nairobi' },
                  { label: 'Destination', key: 'destination', placeholder: 'e.g. Mombasa' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: 5 }}>{f.label}</label>
                    <input style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' as const }} placeholder={f.placeholder}
                      value={(createForm as any)[f.key]}
                      onChange={e => setCreateForm(fv => ({ ...fv, [f.key]: e.target.value }))} />
                  </div>
                ))}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: 5 }}>Vehicle (Available only)</label>
                <select style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' as const, cursor: 'pointer' }}
                  value={createForm.vehicleId}
                  onChange={e => setCreateForm(fv => ({ ...fv, vehicleId: e.target.value }))}>
                  <option value="">Select a vehicle…</option>
                  {availVehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registrationNumber} — {v.name} (max {v.maxLoadCapacity.toLocaleString()} kg)</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: 5 }}>Driver (Available, valid license)</label>
                <select style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' as const, cursor: 'pointer' }}
                  value={createForm.driverId}
                  onChange={e => setCreateForm(fv => ({ ...fv, driverId: e.target.value }))}>
                  <option value="">Select a driver…</option>
                  {availDrivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name} (expires {new Date(d.licenseExpiryDate).toLocaleDateString()})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: 5 }}>Cargo Weight (kg)</label>
                  <input type="number" min="0" style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' as const }} placeholder="e.g. 3000"
                    value={createForm.cargoWeight}
                    onChange={e => { setCreateForm(fv => ({ ...fv, cargoWeight: e.target.value })); setCreateError(''); }} />
                  {createForm.vehicleId && createForm.cargoWeight && (() => {
                    const v = availVehicles.find(v => v.id === createForm.vehicleId);
                    const cargo = Number(createForm.cargoWeight);
                    if (v && cargo > v.maxLoadCapacity) {
                      return <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: '12px', color: '#B3261E' }}><AlertCircle size={12} />Exceeds vehicle max load ({v.maxLoadCapacity.toLocaleString()} kg)</div>;
                    }
                  })()}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: 5 }}>Planned Distance (km)</label>
                  <input type="number" min="0" style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' as const }} placeholder="e.g. 486"
                    value={createForm.plannedDistance}
                    onChange={e => setCreateForm(fv => ({ ...fv, plannedDistance: e.target.value }))} />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button onClick={() => { setShowCreate(false); setCreateError(''); }} style={BTN_GHOST}>Cancel</button>
              <button onClick={createTrip} style={BTN_PRIMARY}>Create Trip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
