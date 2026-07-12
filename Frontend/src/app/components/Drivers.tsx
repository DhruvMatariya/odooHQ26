import { useState, useMemo } from 'react';
import { Plus, Search, X, ArrowLeft, AlertTriangle, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from './StatusBadge';
import { ConfirmModal } from './ConfirmModal';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { SortableHeader, PlainHeader, type SortDir } from './SortableHeader';
import type { Role } from './Layout';

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: string;
  licenseExpiryDate: string;
  contactNumber: string;
  safetyScore: number;
  status: string;
}

const INITIAL_DRIVERS: Driver[] = [
  { id: '1', name: 'John Kamau',       licenseNumber: 'DL-ABC-123456', licenseCategory: 'CE', licenseExpiryDate: '2027-08-15', contactNumber: '+254712345678', safetyScore: 95, status: 'AVAILABLE' },
  { id: '2', name: 'Mary Wanjiru',     licenseNumber: 'DL-DEF-789012', licenseCategory: 'B',  licenseExpiryDate: '2025-03-20', contactNumber: '+254723456789', safetyScore: 88, status: 'ON_TRIP'   },
  { id: '3', name: 'Peter Odhiambo',  licenseNumber: 'DL-GHI-345678', licenseCategory: 'CE', licenseExpiryDate: '2027-01-10', contactNumber: '+254734567890', safetyScore: 72, status: 'OFF_DUTY'  },
  { id: '4', name: 'Susan Achieng',   licenseNumber: 'DL-JKL-901234', licenseCategory: 'C',  licenseExpiryDate: '2026-11-30', contactNumber: '+254745678901', safetyScore: 60, status: 'SUSPENDED' },
  { id: '5', name: 'James Otieno',    licenseNumber: 'DL-MNO-567890', licenseCategory: 'CE', licenseExpiryDate: '2028-05-01', contactNumber: '+254756789012', safetyScore: 82, status: 'AVAILABLE' },
  { id: '6', name: 'Grace Mutua',     licenseNumber: 'DL-PQR-234567', licenseCategory: 'B',  licenseExpiryDate: '2027-09-14', contactNumber: '+254767890123', safetyScore: 91, status: 'AVAILABLE' },
  { id: '7', name: 'Samuel Kipchoge', licenseNumber: 'DL-STU-890123', licenseCategory: 'CE', licenseExpiryDate: '2026-04-08', contactNumber: '+254778901234', safetyScore: 78, status: 'OFF_DUTY'  },
];

const LICENSE_CATS = ['A', 'B', 'C', 'CE', 'D', 'DE'];
const DRIVER_STATUSES = ['AVAILABLE', 'ON_TRIP', 'OFF_DUTY', 'SUSPENDED'];
const PAGE_SIZE = 6;

const BTN_PRIMARY: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: '8px',
  background: '#004643', color: '#fff', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
};
const BTN_GHOST: React.CSSProperties = {
  padding: '6px 12px', borderRadius: '6px', background: 'transparent',
  border: '1px solid rgba(0,0,0,0.12)', fontSize: '12px', cursor: 'pointer', color: '#374151',
};
const TABLE_TD: React.CSSProperties = { padding: '12px 16px', fontSize: '13px', color: '#374151' };
const INPUT_STYLE: React.CSSProperties = {
  padding: '8px 12px', borderRadius: '8px', border: '1.5px solid rgba(0,0,0,0.12)',
  fontSize: '13px', background: '#FAFAFA', color: '#1A1F27', outline: 'none',
};
const LABEL: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: 5 };
const PAGE_TITLE: React.CSSProperties = { fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '24px', color: '#1A1F27', margin: '0 0 4px' };

function isExpiredOrNear(dateStr: string): 'expired' | 'near' | 'ok' {
  const expiry = new Date(dateStr);
  const now = new Date();
  const soon = new Date(); soon.setDate(soon.getDate() + 30);
  if (expiry < now) return 'expired';
  if (expiry < soon) return 'near';
  return 'ok';
}
function safetyColor(score: number) {
  return score >= 85 ? '#1E9E5A' : score >= 65 ? '#D98F1F' : '#B3261E';
}

interface DriversProps { userRole: Role }

export function Drivers({ userRole }: DriversProps) {
  const canWrite = userRole === 'FLEET_MANAGER';
  const canSuspend = userRole === 'SAFETY_OFFICER' || userRole === 'FLEET_MANAGER';

  const [drivers, setDrivers] = useState<Driver[]>(INITIAL_DRIVERS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState<keyof Driver>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);
  const [suspendConfirm, setSuspendConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Driver>>({});

  function handleSort(field: string) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field as keyof Driver); setSortDir('asc'); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    let list = drivers.filter(d => {
      if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.licenseNumber.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus && d.status !== filterStatus) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      const va = a[sortField]; const vb = b[sortField];
      if (va === vb) return 0;
      const cmp = va < vb ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [drivers, search, filterStatus, sortField, sortDir]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selected = drivers.find(d => d.id === selectedId);

  function openAdd() { setForm({ licenseCategory: 'CE', status: 'AVAILABLE' }); setEditDriver(null); setShowAdd(true); }
  function openEdit(d: Driver) { setForm({ ...d }); setEditDriver(d); setShowAdd(true); }

  function saveDriver() {
    if (!form.name || !form.licenseNumber) return;
    if (editDriver) {
      setDrivers(ds => ds.map(d => d.id === editDriver.id ? { ...d, ...form } as Driver : d));
      toast.success(`${form.name}'s profile updated`);
    } else {
      setDrivers(ds => [...ds, { ...form, id: String(Date.now()), status: 'AVAILABLE', safetyScore: 80 } as Driver]);
      toast.success(`${form.name} added as a driver`);
    }
    setShowAdd(false);
  }

  function suspendDriver(id: string) {
    const d = drivers.find(dr => dr.id === id);
    setDrivers(ds => ds.map(dr => dr.id === id ? { ...dr, status: 'SUSPENDED' } : dr));
    setSuspendConfirm(null);
    toast.success(`${d?.name} has been suspended`, { description: 'They can no longer be assigned to trips.' });
  }

  // — Detail —
  if (view === 'detail' && selected) {
    const expiryState = isExpiredOrNear(selected.licenseExpiryDate);
    return (
      <div>
        <button onClick={() => setView('list')} style={{ ...BTN_GHOST, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
          <ArrowLeft size={14} /> Back to Drivers
        </button>
        <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#004643', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: '#F0EDE5', flexShrink: 0 }}>
                {selected.name.charAt(0)}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '20px', margin: 0, color: '#1A1F27' }}>{selected.name}</h2>
                  <StatusBadge status={selected.status} size="md" />
                </div>
                <p style={{ margin: '0 0 3px', fontSize: '13px', color: '#6B7280' }}>
                  License: <strong style={{ color: '#1A1F27' }}>{selected.licenseNumber}</strong> · Category: <strong style={{ color: '#1A1F27' }}>{selected.licenseCategory}</strong>
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#6B7280' }}>
                  Contact: <strong style={{ color: '#1A1F27' }}>{selected.contactNumber}</strong>
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {canWrite && <button onClick={() => openEdit(selected)} style={BTN_GHOST}>Edit</button>}
              {canSuspend && selected.status !== 'SUSPENDED' && (
                <button onClick={() => setSuspendConfirm(selected.id)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#FEF3C7', color: '#D98F1F', fontSize: '13px', fontWeight: 600 }}>
                  <Shield size={14} /> Suspend Driver
                </button>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Safety Score</div>
            <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: safetyColor(selected.safetyScore) }}>{selected.safetyScore}</div>
            <div style={{ marginTop: 8, height: 6, borderRadius: 3, background: '#E5E7EB', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${selected.safetyScore}%`, background: safetyColor(selected.safetyScore), borderRadius: 3 }} />
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>License Expiry</div>
            <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: expiryState === 'expired' ? '#B3261E' : expiryState === 'near' ? '#D98F1F' : '#1A1F27' }}>{selected.licenseExpiryDate}</div>
            {expiryState !== 'ok' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontSize: '12px', color: expiryState === 'expired' ? '#B3261E' : '#D98F1F' }}>
                <AlertTriangle size={12} />{expiryState === 'expired' ? 'License has expired' : 'Expires within 30 days'}
              </div>
            )}
          </div>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>License Category</div>
            <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Poppins, sans-serif', color: '#1A1F27' }}>Class {selected.licenseCategory}</div>
          </div>
        </div>
        {suspendConfirm && (
          <ConfirmModal title="Suspend Driver" message={`Suspend ${selected.name}? They will be removed from active duty.`} confirmLabel="Suspend" confirmDanger onConfirm={() => suspendDriver(suspendConfirm)} onCancel={() => setSuspendConfirm(null)} />
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={PAGE_TITLE}>Drivers</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>{drivers.length} registered drivers</p>
        </div>
        {canWrite && <button onClick={openAdd} style={BTN_PRIMARY}><Plus size={15} /> Add Driver</button>}
      </div>

      {/* Status chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {['', ...DRIVER_STATUSES].map(s => {
          const count = s ? drivers.filter(d => d.status === s).length : drivers.length;
          const active = filterStatus === s;
          return (
            <button key={s || 'ALL'} onClick={() => { setFilterStatus(s); setPage(1); }} style={{
              padding: '5px 14px', borderRadius: '999px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: active ? 600 : 400,
              background: active ? '#004643' : '#fff', color: active ? '#fff' : '#6B7280',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}>
              {s || 'All'} <span style={{ marginLeft: 4, opacity: 0.7 }}>{count}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input placeholder="Search drivers…" style={{ ...INPUT_STYLE, paddingLeft: 32, width: 240 }}
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        {search && <button onClick={() => { setSearch(''); setPage(1); }} style={BTN_GHOST}><X size={13} style={{ marginRight: 4 }} />Clear</button>}
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#6B7280' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FAFAFA' }}>
              <SortableHeader label="Name"          field="name"              sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="License No."   field="licenseNumber"     sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <PlainHeader    label="Category" />
              <SortableHeader label="Expiry Date"   field="licenseExpiryDate" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <PlainHeader    label="Contact" />
              <SortableHeader label="Safety Score"  field="safetyScore"       sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <PlainHeader    label="Status" />
              <PlainHeader    label="" />
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <EmptyState icon={<Users size={24} />} title="No drivers found" message="Adjust your search or status filter to see results." />
            ) : paged.map((d, i) => {
              const exState = isExpiredOrNear(d.licenseExpiryDate);
              return (
                <tr key={d.id}
                  style={{ borderTop: '1px solid rgba(0,0,0,0.05)', cursor: 'pointer', background: i % 2 === 0 ? '#fff' : '#FEFEFE' }}
                  onClick={() => { setSelectedId(d.id); setView('detail'); }}
                  onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#F7F8FA'}
                  onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? '#fff' : '#FEFEFE'}
                >
                  <td style={{ ...TABLE_TD, fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#004643', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#F0EDE5', flexShrink: 0 }}>
                        {d.name.charAt(0)}
                      </div>
                      {d.name}
                    </div>
                  </td>
                  <td style={{ ...TABLE_TD, fontFamily: 'monospace', fontSize: '12px', color: '#6B7280' }}>{d.licenseNumber}</td>
                  <td style={TABLE_TD}>{d.licenseCategory}</td>
                  <td style={{ ...TABLE_TD, color: exState === 'expired' ? '#B3261E' : exState === 'near' ? '#D98F1F' : '#374151', fontWeight: exState !== 'ok' ? 600 : 400 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {d.licenseExpiryDate}
                      {exState !== 'ok' && <AlertTriangle size={12} />}
                    </div>
                  </td>
                  <td style={TABLE_TD}>{d.contactNumber}</td>
                  <td style={TABLE_TD}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 5, borderRadius: 3, background: '#E5E7EB', overflow: 'hidden', minWidth: 60 }}>
                        <div style={{ height: '100%', width: `${d.safetyScore}%`, background: safetyColor(d.safetyScore), borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: safetyColor(d.safetyScore), minWidth: 24 }}>{d.safetyScore}</span>
                    </div>
                  </td>
                  <td style={TABLE_TD}><StatusBadge status={d.status} /></td>
                  <td style={TABLE_TD} onClick={e => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {canWrite && <button onClick={() => openEdit(d)} style={BTN_GHOST}>Edit</button>}
                      {canSuspend && d.status !== 'SUSPENDED' && (
                        <button onClick={() => setSuspendConfirm(d.id)} style={{ ...BTN_GHOST, borderColor: '#FEF3C7', color: '#D98F1F' }}>Suspend</button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Pagination total={filtered.length} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      {/* Add/Edit modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAdd(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px 32px', width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#1A1F27' }}>{editDriver ? 'Edit Driver' : 'Add Driver'}</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {([
                { label: 'Full Name',       key: 'name',          placeholder: 'e.g. John Kamau' },
                { label: 'License Number',  key: 'licenseNumber', placeholder: 'e.g. DL-ABC-123456' },
                { label: 'Contact Number',  key: 'contactNumber', placeholder: 'e.g. +254712345678' },
              ] as const).map(f => (
                <div key={f.key}>
                  <label style={LABEL}>{f.label}</label>
                  <input type="text" style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' }} placeholder={f.placeholder}
                    value={(form as any)[f.key] || ''} onChange={e => setForm(fv => ({ ...fv, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div>
                <label style={LABEL}>License Category</label>
                <select style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box', cursor: 'pointer' }}
                  value={form.licenseCategory || 'CE'} onChange={e => setForm(fv => ({ ...fv, licenseCategory: e.target.value }))}>
                  {LICENSE_CATS.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
              <div>
                <label style={LABEL}>License Expiry Date</label>
                <input type="date" style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' }}
                  value={form.licenseExpiryDate || ''} onChange={e => setForm(fv => ({ ...fv, licenseExpiryDate: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button onClick={() => setShowAdd(false)} style={BTN_GHOST}>Cancel</button>
              <button onClick={saveDriver} style={BTN_PRIMARY}>{editDriver ? 'Save Changes' : 'Add Driver'}</button>
            </div>
          </div>
        </div>
      )}

      {suspendConfirm && (() => {
        const d = drivers.find(dr => dr.id === suspendConfirm);
        return (
          <ConfirmModal title="Suspend Driver" message={`Suspend ${d?.name}? They cannot be assigned to new trips.`} confirmLabel="Suspend" confirmDanger onConfirm={() => suspendDriver(suspendConfirm)} onCancel={() => setSuspendConfirm(null)} />
        );
      })()}
    </div>
  );
}
