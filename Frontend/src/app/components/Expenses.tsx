import { useState, useMemo, useEffect } from 'react';
import { Plus, X, Info, Receipt } from 'lucide-react';
import { toast } from 'sonner';
import { StatusBadge } from './StatusBadge';
import { Pagination } from './Pagination';
import { EmptyState } from './EmptyState';
import { SortableHeader, PlainHeader, type SortDir } from './SortableHeader';
import type { Role } from './Layout';
import { apiGetExpenses, apiCreateExpense, apiGetVehicles, type ApiExpense, type ApiVehicle, ApiError } from '../../lib/api';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

type Expense = ApiExpense & { vehicleReg?: string; vehicleName?: string };

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

interface ExpensesProps { userRole: Role }

export function Expenses({ userRole }: ExpensesProps) {
  const canWrite = userRole === 'FLEET_MANAGER' || userRole === 'FINANCIAL_ANALYST';

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [loading, setLoading] = useState(!USE_MOCK);
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortField, setSortField] = useState<string>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ vehicleId: '', type: 'TOLL' as 'TOLL' | 'OTHER', amount: '', date: '' });

  useEffect(() => {
    if (USE_MOCK) return;
    let mounted = true;
    Promise.all([apiGetExpenses(), apiGetVehicles()])
      .then(([expensesData, vehiclesData]) => {
        if (mounted) {
          setExpenses(expensesData.map(e => ({ ...e, vehicleReg: e.vehicle?.registrationNumber, vehicleName: e.vehicle?.name })));
          setVehicles(vehiclesData);
          setLoading(false);
        }
      })
      .catch(err => { toast.error(err.message); if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  function handleSort(field: string) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
    setPage(1);
  }

  const filtered = useMemo(() => {
    let list = expenses.filter(e => {
      if (filterVehicle && e.vehicleId !== filterVehicle) return false;
      if (filterType && e.type !== filterType) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      const va = (a as any)[sortField]; const vb = (b as any)[sortField];
      if (va === vb) return 0;
      const cmp = va < vb ? -1 : 1;
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [expenses, filterVehicle, filterType, sortField, sortDir]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);
  const tollTotal = filtered.filter(e => e.type === 'TOLL').reduce((s, e) => s + e.amount, 0);
  const otherTotal = filtered.filter(e => e.type === 'OTHER').reduce((s, e) => s + e.amount, 0);

  async function addExpense() {
    if (!form.vehicleId || !form.amount || !form.date) {
      toast.error('All fields are required');
      return;
    }
    const v = vehicles.find(v => v.id === form.vehicleId);
    if (USE_MOCK) {
      setExpenses(es => [{
        id: String(Date.now()), vehicleId: form.vehicleId,
        vehicleReg: v?.registrationNumber, vehicleName: v?.name,
        type: form.type, amount: Number(form.amount), date: form.date,
      }, ...es]);
      setForm({ vehicleId: '', type: 'TOLL', amount: '', date: '' });
      setShowAdd(false);
      toast.success(`Expense logged`);
      return;
    }
    try {
      const created = await apiCreateExpense({
        vehicleId: form.vehicleId,
        type: form.type,
        amount: Number(form.amount),
        date: form.date,
      });
      setExpenses(es => [{ ...created, vehicleReg: v?.registrationNumber, vehicleName: v?.name }, ...es]);
      setForm({ vehicleId: '', type: 'TOLL', amount: '', date: '' });
      setShowAdd(false);
      toast.success(`Expense logged for ${v?.registrationNumber}`, { description: `${form.type} — ₹${Number(form.amount).toLocaleString()}` });
    } catch (err: any) {
      if (err instanceof ApiError && Object.keys(err.fieldErrors).length > 0) {
        Object.entries(err.fieldErrors).forEach(([field, msg]) => toast.error(`${field}: ${msg}`));
      } else {
        toast.error(err.message || 'Failed to add expense');
      }
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={PAGE_TITLE}>Expenses</h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: 0 }}>Toll charges and other vehicle expenses</p>
        </div>
        {canWrite && (
          <button onClick={() => setShowAdd(true)} style={BTN_PRIMARY}><Plus size={15} /> Add Expense</button>
        )}
      </div>

      {/* Note */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F0EDE5', borderRadius: '8px', padding: '10px 14px', marginBottom: 20, fontSize: '13px', color: '#004643' }}>
        <Info size={14} />
        Maintenance costs are tracked separately in the Maintenance module and are not shown here.
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total Expenses', value: `₹${totalAmount.toLocaleString()}` },
          { label: 'Toll Charges', value: `₹${tollTotal.toLocaleString()}` },
          { label: 'Other Expenses', value: `₹${otherTotal.toLocaleString()}` },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#1A1F27', fontFamily: 'Poppins, sans-serif' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <select style={{ ...INPUT_STYLE, cursor: 'pointer' }} value={filterVehicle} onChange={e => setFilterVehicle(e.target.value)}>
          <option value="">All vehicles</option>
          {vehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNumber}</option>)}
        </select>
        <select style={{ ...INPUT_STYLE, cursor: 'pointer' }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All types</option>
          <option value="TOLL">Toll</option>
          <option value="OTHER">Other</option>
        </select>
        {(filterVehicle || filterType) && (
          <button onClick={() => { setFilterVehicle(''); setFilterType(''); }} style={BTN_GHOST}>
            <X size={13} style={{ marginRight: 4 }} />Clear
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#6B7280' }}>{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.06)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FAFAFA' }}>
              <PlainHeader label="Vehicle" />
              <PlainHeader label="Type" />
              <SortableHeader label="Amount" field="amount" sortField={sortField} sortDir={sortDir} onSort={handleSort} />
              <SortableHeader label="Date"   field="date"   sortField={sortField} sortDir={sortDir} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <EmptyState icon={<Receipt size={24} />} title="No expenses found" message="No records match your current filters." />
            ) : paged.map((exp, i) => (
              <tr key={exp.id} style={{ borderTop: '1px solid rgba(0,0,0,0.05)', background: i % 2 === 0 ? '#fff' : '#FEFEFE' }}>
                <td style={TABLE_TD}>
                  <div style={{ fontWeight: 600, color: '#004643' }}>{exp.vehicleReg || exp.vehicle?.registrationNumber}</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{exp.vehicleName || exp.vehicle?.name}</div>
                </td>
                <td style={TABLE_TD}><StatusBadge status={exp.type} /></td>
                <td style={{ ...TABLE_TD, fontWeight: 600, color: '#1A1F27' }}>₹{exp.amount.toLocaleString()}</td>
                <td style={{ ...TABLE_TD, color: '#6B7280' }}>{new Date(exp.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
          {filtered.length > 0 && (
            <tfoot>
              <tr style={{ borderTop: '2px solid rgba(0,0,0,0.08)', background: '#FAFAFA' }}>
                <td colSpan={2} style={{ ...TABLE_TD, fontWeight: 700, color: '#1A1F27' }}>Total ({filtered.length} records)</td>
                <td style={{ ...TABLE_TD, fontWeight: 700, color: '#004643' }}>₹{totalAmount.toLocaleString()}</td>
                <td style={TABLE_TD} />
              </tr>
            </tfoot>
          )}
        </table>
        <Pagination total={filtered.length} page={page} pageSize={PAGE_SIZE} onPageChange={setPage} />
      </div>

      {/* Add modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowAdd(false)}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px 32px', width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: '#1A1F27' }}>Add Expense</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: 5 }}>Vehicle</label>
                <select style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' as const, cursor: 'pointer' }}
                   value={form.vehicleId} onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}>
                  <option value="">Select vehicle…</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} — {v.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: 5 }}>Expense Type</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {(['TOLL', 'OTHER'] as const).map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, type: t }))}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                        border: `2px solid ${form.type === t ? '#004643' : 'rgba(0,0,0,0.12)'}`,
                        background: form.type === t ? '#CCEDE9' : '#fff',
                        color: form.type === t ? '#004643' : '#374151',
                        fontWeight: form.type === t ? 600 : 400, fontSize: '13px',
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: 5 }}>Amount (₹)</label>
                <input type="number" min="0" style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' as const }} placeholder="e.g. 2400"
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: 5 }}>Date</label>
                <input type="date" style={{ ...INPUT_STYLE, width: '100%', boxSizing: 'border-box' as const }}
                  value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24 }}>
              <button onClick={() => setShowAdd(false)} style={BTN_GHOST}>Cancel</button>
              <button onClick={addExpense} style={BTN_PRIMARY}>Add Expense</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
