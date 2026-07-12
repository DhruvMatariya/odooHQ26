import { useState } from 'react';
import { Truck, Eye, EyeOff, AlertCircle } from 'lucide-react';
import type { Role } from './Layout';

interface AuthProps {
  onLogin: (user: { id: string; name: string; email: string; role: Role }) => void;
}

const MOCK_USERS = [
  { id: '1', name: 'Alice Kimani',    email: 'alice@transitops.io',   password: 'password', role: 'FLEET_MANAGER' as Role },
  { id: '2', name: 'Brian Mwangi',    email: 'brian@transitops.io',   password: 'password', role: 'DRIVER' as Role },
  { id: '3', name: 'Carol Otieno',    email: 'carol@transitops.io',   password: 'password', role: 'SAFETY_OFFICER' as Role },
  { id: '4', name: 'David Ngugi',     email: 'david@transitops.io',   password: 'password', role: 'FINANCIAL_ANALYST' as Role },
];

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'FLEET_MANAGER',    label: 'Fleet Manager' },
  { value: 'DRIVER',           label: 'Dispatcher' },
  { value: 'SAFETY_OFFICER',   label: 'Safety Officer' },
  { value: 'FINANCIAL_ANALYST',label: 'Financial Analyst' },
];

export function Auth({ onLogin }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({ name: '', email: '', password: '', role: 'FLEET_MANAGER' as Role });
  // Mirrors the contract error shape: { title, detail, errors: [{field, message}] }
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const found = MOCK_USERS.find(u => u.email === loginForm.email && u.password === loginForm.password);
    if (!found) {
      setError('Invalid email or password.');
      return;
    }
    setError('');
    onLogin({ id: found.id, name: found.name, email: found.email, role: found.role });
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!regForm.name)     errs.name     = 'Name is required.';
    if (!regForm.email)    errs.email    = 'Email is required.';
    if (!regForm.password) errs.password = 'Password is required.';
    if (regForm.password && regForm.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (Object.keys(errs).length > 0) { setFieldErrors(errs); setError('Please fix the errors below.'); return; }
    setError('');
    setFieldErrors({});
    const newUser = { id: String(Date.now()), name: regForm.name, email: regForm.email, role: regForm.role };
    MOCK_USERS.push({ ...newUser, password: regForm.password });
    onLogin(newUser);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: '8px',
    border: '1.5px solid rgba(0,0,0,0.12)', fontSize: '14px',
    background: '#FAFAFA', color: '#1A1F27', outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 500,
    color: '#374151', marginBottom: '6px',
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#F0EDE5',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '-10%', left: '-5%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'rgba(0,70,67,0.06)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', right: '-5%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'rgba(0,70,67,0.04)',
        }} />
      </div>

      <div style={{
        background: '#fff', borderRadius: '16px', padding: '40px',
        width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '12px',
            background: '#004643', display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 12px',
          }}>
            <Truck size={24} color="#F0EDE5" />
          </div>
          <h1 style={{
            fontFamily: 'Poppins, sans-serif', fontWeight: 700,
            fontSize: '22px', color: '#1A1F27', margin: '0 0 4px',
          }}>TransitOps</h1>
          <p style={{ color: '#6B7280', fontSize: '13px', margin: 0 }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        {/* Quick login hints */}
        {mode === 'login' && (
          <div style={{
            background: '#CCEDE9', borderRadius: '8px', padding: '10px 14px',
            marginBottom: 20, fontSize: '12px', color: '#004643',
          }}>
            <strong>Demo:</strong> alice@transitops.io / password (Fleet Manager) &nbsp;·&nbsp; brian / Dispatcher &nbsp;·&nbsp; carol / Safety &nbsp;·&nbsp; david / Finance
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#FEE2E2', borderRadius: '8px', padding: '10px 14px',
            marginBottom: 16, fontSize: '13px', color: '#B3261E',
          }}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email" required style={inputStyle} placeholder="you@company.com"
                value={loginForm.email}
                onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} required style={{ ...inputStyle, paddingRight: 40 }}
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                />
                <button
                  type="button" onClick={() => setShowPw(v => !v)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#6B7280',
                  }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              style={{
                width: '100%', padding: '11px', borderRadius: '8px',
                background: '#004643', color: '#fff', fontSize: '15px',
                fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 4,
              }}
            >
              Sign in
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input
                type="text" style={{ ...inputStyle, borderColor: fieldErrors.name ? '#B3261E' : undefined }} placeholder="Jane Doe"
                value={regForm.name}
                onChange={e => { setRegForm(f => ({ ...f, name: e.target.value })); setFieldErrors(fe => ({ ...fe, name: '' })); }}
              />
              {fieldErrors.name && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#B3261E' }}>{fieldErrors.name}</p>}
            </div>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                type="email" style={{ ...inputStyle, borderColor: fieldErrors.email ? '#B3261E' : undefined }} placeholder="you@company.com"
                value={regForm.email}
                onChange={e => { setRegForm(f => ({ ...f, email: e.target.value })); setFieldErrors(fe => ({ ...fe, email: '' })); }}
              />
              {fieldErrors.email && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#B3261E' }}>{fieldErrors.email}</p>}
            </div>
            <div>
              <label style={labelStyle}>Role</label>
              <select
                style={{ ...inputStyle, cursor: 'pointer' }}
                value={regForm.role}
                onChange={e => setRegForm(f => ({ ...f, role: e.target.value as Role }))}
              >
                {ROLE_OPTIONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password" style={{ ...inputStyle, borderColor: fieldErrors.password ? '#B3261E' : undefined }} placeholder="••••••••"
                value={regForm.password}
                onChange={e => { setRegForm(f => ({ ...f, password: e.target.value })); setFieldErrors(fe => ({ ...fe, password: '' })); }}
              />
              {fieldErrors.password && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#B3261E' }}>{fieldErrors.password}</p>}
            </div>
            <button
              type="submit"
              style={{
                width: '100%', padding: '11px', borderRadius: '8px',
                background: '#004643', color: '#fff', fontSize: '15px',
                fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 4,
              }}
            >
              Create Account
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: '13px', color: '#6B7280' }}>
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button onClick={() => { setMode('register'); setError(''); setFieldErrors({}); }}
                style={{ background: 'none', border: 'none', color: '#004643', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                Register
              </button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(''); setFieldErrors({}); }}
                style={{ background: 'none', border: 'none', color: '#004643', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
