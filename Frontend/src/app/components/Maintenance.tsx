import { useState, useMemo, useEffect } from 'react';
import { Plus, X, AlertTriangle, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from './StatusBadge';
import { ConfirmModal } from './ConfirmModal';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { SortableHeader, PlainHeader, type SortDir } from './SortableHeader';
import type { Role } from './Layout';
import { apiGetMaintenanceLogs, apiCreateMaintenance, apiCloseMaintenance, apiGetVehicles, type ApiMaintenanceLog, type ApiVehicle, ApiError } from '../../lib/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export type MaintenanceLog = ApiMaintenanceLog & { vehicleName?: string; vehicleReg?: string; vehicleStatus?: string };

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
const TABLE_TH: React.CSSProperties = {
  padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600,
  color: '#6B7280', textTransform: 'uppercase' as const, letterSpacing: '0.06em', whiteSpace: 'nowrap',
};
const TABLE_TD: React.CSSProperties = { padding: '12px 16px', fontSize: '13px', color: '#374151' };
const INPUT_STYLE: React.CSSProperties = {
  padding: '8px 12px', borderRadius: '8px', border: '1.5px solid rgba(0,0,0,0.12)',
  fontSize: '13px', background: '#FAFAFA', color: '#1A1F27', outline: 'none',
};

const PAGE_SIZE = 6;

interface MaintenanceProps { userRole: Role }

export function Maintenance({ userRole }: MaintenanceProps) {
  const canWrite = userRole === 'FLEET_MANAGER';

  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const [sortField, setSortField] = useState<keyof MaintenanceLog>('dateOpened');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [closeConfirm, setCloseConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({ vehicleId: '', description: '', cost: '' });
  const [formError, setFormError] = useState('');

  const [loading, setLoading] = useState(!USE_MOCK);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);

  useEffect(() => {
    if (USE_MOCK) return;
    let mounted = true;
    Promise.all([apiGetMaintenanceLogs(), apiGetVehicles()])
      .then(([logsData, vehiclesData]) => {
        if (mounted) {
          setLogs(logsData.map(l => ({ ...l, vehicleName: l.vehicle?.name, vehicleReg: l.vehicle?.registrationNumber, vehicleStatus: l.vehicle?.status })));
          setVehicles(vehiclesData);
          setLoading(false);
        }
      })
      .catch(err => { toast.error(err.message); if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  function handleSort(field: string) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field as keyof MaintenanceLog); setSortDir('asc'); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    let list = logs.filter(l => {
      if (filterVehicle && l.vehicleId !== filterVehicle) return false;
      if (filterActive === 'active' && !l.isActive) return false;
      if (filterActive === 'closed' && l.isActive) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      const va = (a as any)[sortField]; const vb = (b as any)[sortField];
      if (va === vb) return 0;
      const cmp = va < vb ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [logs, filterVehicle, filterActive, sortField, sortDir]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const selectedVehicle = vehicles.find(v => v.id === form.vehicleId);

  async function addLog() {
    setFormError('');
    if (!form.vehicleId || !form.description || !form.cost) {
      setFormError('All fields are required.');
      return;
    }
    if (selectedVehicle?.status === 'ON_TRIP') {
      setFormError('Cannot log maintenance — vehicle is currently ON_TRIP.');
      return;
    }
    
    if (USE_MOCK) {
      const v = vehicles.find(v => v.id === form.vehicleId)!;
      setLogs(ls => [{
        id: String(Date.now()), vehicleId: v.id, vehicleName: v.name, vehicleReg: v.registrationNumber,
        vehicleStatus: 'IN_SHOP', description: form.description, cost: Number(form.cost),
        isActive: true, createdAt: new Date().toISOString(), dateOpened: new Date().toISOString().slice(0, 10),
      }, ...ls]);
      setForm({ vehicleId: '', description: '', cost: '' });
      setShowAdd(false);
      toast.success(`Maintenance logged`, { description: `Vehicle is now IN_SHOP.` });
      return;
    }

    try {
      const created = await apiCreateMaintenance({
        vehicleId: form.vehicleId,
        description: form.description,
        cost: Number(form.cost)
      });
      const v = vehicles.find(v => v.id === form.vehicleId);
      setLogs(ls => [{ ...created, vehicleName: v?.name, vehicleReg: v?.registrationNumber, vehicleStatus: 'IN_SHOP' }, ...ls]);
      setForm({ vehicleId: '', description: '', cost: '' });
      setShowAdd(false);
      toast.success(`Maintenance logged`, { description: `Vehicle is now IN_SHOP.` });
    } catch (err: any) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        setFormError(Object.values(err.fieldErrors).join(', '));
      } else {
        setFormError(err.message || 'Failed to log maintenance');
      }
    }
  }

  async function closeLog(id: string) {
    if (USE_MOCK) {
      const log = logs.find(l => l.id === id);
      setLogs(ls => ls.map(l => l.id === id ? { ...l, isActive: false, vehicleStatus: 'AVAILABLE' } : l));
      setCloseConfirm(null);
      toast.success(`Maintenance closed`, { description: `${log?.vehicleReg} is now AVAILABLE.` });
      return;
    }

    try {
      await apiCloseMaintenance(id);
      const log = logs.find(l => l.id === id);
      setLogs(ls => ls.map(l => l.id === id ? { ...l, isActive: false, vehicleStatus: 'AVAILABLE' } : l));
      setCloseConfirm(null);
      toast.success(`Maintenance closed`, { description: `${log?.vehicleReg} is now AVAILABLE.` });
    } catch (err: any) {
      toast.error(err.message || 'Failed to close maintenance');
    }
  }

  const uniqueVehicles = Array.from(new Map(logs.map(l => [l.vehicleId, { id: l.vehicleId, reg: l.vehicleReg }])).values());

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={PAGE_TITLE}>Maintenance</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>
            {logs.filter(l => l.isActive).length} active · {logs.filter(l => !l.isActive).length} closed
          </p>
        </div>
        {canWrite && (
          <button onClick={() => { setShowAdd(true); setFormError(''); }} style={BTN_PRIMARY}>
            <Plus size={15} /> Log Maintenance
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <select style={{ ...INPUT_STYLE, cursor: 'pointer' }} value={filterVehicle} onChange={e => { setFilterVehicle(e.target.value); setPage(1); }}>
          <option value="">All vehicles</option>
          {uniqueVehicles.map(v => <option key={v.id} value={v.id}>{v.reg}</option>)}
        </select>
        <select style={{ ...INPUT_STYLE, cursor: 'pointer' }} value={filterActive} onChange={e => { setFilterActive(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="closed">Closed</option>
        </select>
        {(filterVehicle || filterActive) && (
          <button onClick={() => { setFilterVehicle(''); setFilterActive(''); setPage(1); }} style={{ ...BTN_GHOST, display: 'flex', alignItems: 'center', gap: 4 }}><X size={13} />Clear</button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#6B7280' }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FAFAFA' }}>
              <PlainHeader label="Vehicle" />
              <PlainHeader label="Description" />
              <SortableHeader label="Cost"        field="cost"       sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Date Opened" field="createdAt"  sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <PlainHeader label="Status" />
              <PlainHeader label="" />
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <EmptyState icon={<Wrench size={24} />} title="No maintenance records" message="No records match your current filters." />
            ) : paged.map((log, i) => (
              <tr key={log.id} style={{ borderTop: '1px solid rgba(0,0,0,0.05)', background: i % 2 === 0 ? '#fff' : '#FEFEFE' }}>
                <td style={TABLE_TD}>
                  <div style={{ fontWeight: 600, color: '#004643' }}>{log.vehicleReg}</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{log.vehicleName}</div>
                </td>
                <td style={{ ...TABLE_TD, maxWidth: 300 }}>{log.description}</td>
                <td style={{ ...TABLE_TD, fontWeight: 600, color: '#1A1F27' }}>KES {log.cost.toLocaleString()}</td>
                <td style={{ ...TABLE_TD, color: '#6B7280' }}>{new Date(log.createdAt).toLocaleDateString()}</td>
                <td style={TABLE_TD}><StatusBadge status={log.isActive ? 'ACTIVE' : 'CLOSED'} /></td>
                <td style={TABLE_TD}>
                  {canWrite && log.isActive && (
                    <button onClick={() => setCloseConfirm(log.id)} style={{ ...BTN_GHOST, color: '#1E9E5A', borderColor: '#D1F4E4' }}>Close</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination total={filtered.length} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      {/* Add modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowAdd(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px 32px', width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#1A1F27' }}>Log Maintenance</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={18} /></button>
            </div>

            {formError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#FEE2E2', borderRadius: '8px', padding: '10px 14px', marginBottom: 16, fontSize: '13px', color: '#B3261E' }}>
                <AlertTriangle size={14} />{formError}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: 5 }}>Vehicle</label>
                <select style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' as const, cursor: 'pointer' }}
                  value={form.vehicleId} onChange={e => { setForm(f => ({ ...f, vehicleId: e.target.value })); setFormError(''); }}>
                  <option value="">Select vehicle…</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.registrationNumber} — {v.name} [{v.status}]</option>
                  ))}
                </select>
                {selectedVehicle?.status === 'ON_TRIP' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: '12px', color: '#D98F1F' }}>
                    <AlertTriangle size={12} /> Vehicle is ON_TRIP — cannot log maintenance
                  </div>
                )}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: 5 }}>Description</label>
                <textarea
                  rows={3} style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' as const, resize: 'vertical' as const }}
                  placeholder="Describe the maintenance work…"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: 5 }}>Cost (KES)</label>
                <input type="number" min="0" style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' as const }} placeholder="e.g. 25000"
                  value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button onClick={() => setShowAdd(false)} style={BTN_GHOST}>Cancel</button>
              <button onClick={addLog} style={BTN_PRIMARY}>Log Maintenance</button>
            </div>
          </div>
        </div>
      )}

      {closeConfirm && (() => {
        const log = logs.find(l => l.id === closeConfirm);
        return (
          <ConfirmModal
            title="Close Maintenance"
            message={`Mark maintenance on ${log?.vehicleReg} as closed? The vehicle will return to AVAILABLE status (unless it was retired).`}
            confirmLabel="Close Maintenance"
            onConfirm={() => closeLog(closeConfirm)}
            onCancel={() => setCloseConfirm(null)}
          />
        );
      })()}
    </div>
  );
}
