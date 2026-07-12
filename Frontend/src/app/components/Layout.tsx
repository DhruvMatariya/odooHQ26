import { useState, useRef, useEffect, ReactNode } from 'react';
import {
  LayoutDashboard, Truck, Users, MapPin, Wrench, Fuel,
  Receipt, BarChart3, ChevronLeft, ChevronRight,
  LogOut, UserCircle,
} from 'lucide-react';

export type Role = 'FLEET_MANAGER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';

export type PageKey =
  | 'dashboard' | 'vehicles' | 'drivers' | 'trips'
  | 'maintenance' | 'fuel-logs' | 'expenses' | 'reports';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface NavItem {
  key: PageKey;
  label: string;
  icon: ReactNode;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard',   label: 'Dashboard',   icon: <LayoutDashboard size={18} />, roles: ['FLEET_MANAGER','DRIVER','SAFETY_OFFICER','FINANCIAL_ANALYST'] },
  { key: 'vehicles',    label: 'Vehicles',    icon: <Truck size={18} />,           roles: ['FLEET_MANAGER','DRIVER','SAFETY_OFFICER','FINANCIAL_ANALYST'] },
  { key: 'drivers',     label: 'Drivers',     icon: <Users size={18} />,           roles: ['FLEET_MANAGER','DRIVER','SAFETY_OFFICER','FINANCIAL_ANALYST'] },
  { key: 'trips',       label: 'Trips',       icon: <MapPin size={18} />,          roles: ['FLEET_MANAGER','DRIVER','SAFETY_OFFICER','FINANCIAL_ANALYST'] },
  { key: 'maintenance', label: 'Maintenance', icon: <Wrench size={18} />,          roles: ['FLEET_MANAGER','DRIVER','SAFETY_OFFICER','FINANCIAL_ANALYST'] },
  { key: 'fuel-logs',   label: 'Fuel Logs',   icon: <Fuel size={18} />,            roles: ['FLEET_MANAGER','FINANCIAL_ANALYST'] },
  { key: 'expenses',    label: 'Expenses',    icon: <Receipt size={18} />,         roles: ['FLEET_MANAGER','FINANCIAL_ANALYST'] },
  { key: 'reports',     label: 'Reports',     icon: <BarChart3 size={18} />,       roles: ['FINANCIAL_ANALYST'] },
];

const ROLE_LABEL: Record<Role, string> = {
  FLEET_MANAGER:    'Fleet Manager',
  DRIVER:           'Dispatcher',
  SAFETY_OFFICER:   'Safety Officer',
  FINANCIAL_ANALYST:'Financial Analyst',
};

const ROLE_COLOR: Record<Role, { bg: string; color: string }> = {
  FLEET_MANAGER:    { bg: '#CCEDE9', color: '#004643' },
  DRIVER:           { bg: '#DBEAFE', color: '#1D6FE0' },
  SAFETY_OFFICER:   { bg: '#FEF3C7', color: '#D98F1F' },
  FINANCIAL_ANALYST:{ bg: '#EDE9FE', color: '#7C3AED' },
};

interface LayoutProps {
  user: User;
  currentPage: PageKey;
  onNavigate: (page: PageKey) => void;
  onLogout: () => void;
  children: ReactNode;
}

/* ── Profile dropdown ── */
function ProfileDropdown({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const menuItems = [
    {
      id: 'edit',
      label: 'Edit Profile',
      icon: <UserCircle size={15} />,
      onClick: () => { setOpen(false); /* TODO: open edit profile modal */ },
      color: '#1A1F27',
      hoverBg: '#F3F4F6',
    },
    {
      id: 'logout',
      label: 'Logout',
      icon: <LogOut size={15} />,
      onClick: () => { setOpen(false); onLogout(); },
      color: '#B3261E',
      hoverBg: '#FEE2E2',
    },
  ];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Avatar button */}
      <button
        onClick={() => setOpen(o => !o)}
        title={user.name}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: open ? 'rgba(0,70,67,0.08)' : 'transparent',
          border: '2px solid transparent',
          borderRadius: '999px',
          padding: '3px 10px 3px 3px',
          cursor: 'pointer',
          transition: 'background 0.18s, border-color 0.18s',
          outline: 'none',
        }}
        onMouseEnter={e => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(0,70,67,0.07)'; }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        {/* Avatar circle */}
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'linear-gradient(135deg, #004643 0%, #006b65 100%)',
          color: '#F0EDE5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '12px', fontWeight: 700,
          boxShadow: '0 1px 4px rgba(0,70,67,0.35)',
          flexShrink: 0,
          transition: 'box-shadow 0.18s',
        }}>
          {initials}
        </div>
        <span style={{ fontSize: '14px', fontWeight: 500, color: '#1A1F27', whiteSpace: 'nowrap' }}>
          {user.name}
        </span>
        {/* Chevron indicator */}
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: '#6B7280' }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.06)',
          border: '1px solid rgba(0,0,0,0.07)',
          minWidth: 200,
          zIndex: 999,
          overflow: 'hidden',
          animation: 'dropdownIn 0.18s cubic-bezier(0.22,1,0.36,1)',
        }}>
          {/* User info header */}
          <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#1A1F27' }}>{user.name}</p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6B7280' }}>{user.email}</p>
          </div>
          {/* Menu items */}
          <div style={{ padding: '6px' }}>
            {menuItems.map(item => (
              <button
                key={item.id}
                onClick={item.onClick}
                onMouseEnter={() => setHovered(item.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '9px 12px',
                  borderRadius: '8px', border: 'none',
                  background: hovered === item.id ? item.hoverBg : 'transparent',
                  color: hovered === item.id ? item.color : '#374151',
                  fontSize: '13px', fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                  textAlign: 'left',
                }}
              >
                <span style={{ color: hovered === item.id ? item.color : '#6B7280', transition: 'color 0.15s' }}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function Layout({ user, currentPage, onNavigate, onLogout, children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  // Inject dropdown animation keyframe once
  useEffect(() => {
    if (!document.getElementById('layout-kf')) {
      const s = document.createElement('style');
      s.id = 'layout-kf';
      s.textContent = `
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `;
      document.head.appendChild(s);
    }
  }, []);

  const visibleNav = NAV_ITEMS.filter(n => n.roles.includes(user.role));
  const roleStyle = ROLE_COLOR[user.role];
  const sidebarW = collapsed ? 64 : 240;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F0EDE5' }}>
      {/* Sidebar */}
      <div
        style={{
          width: sidebarW, minWidth: sidebarW,
          background: '#004643',
          display: 'flex', flexDirection: 'column',
          transition: 'width 0.2s ease',
          overflow: 'hidden', zIndex: 10,
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        }}
      >
        {/* Logo */}
        <div style={{
          padding: collapsed ? '20px 0' : '20px 20px',
          borderBottom: '1px solid #003835',
          display: 'flex', alignItems: 'center', gap: 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
          minHeight: 64,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '8px',
            background: '#F0EDE5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Truck size={18} color="#004643" />
          </div>
          {!collapsed && (
            <span style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: '16px', color: '#F0EDE5', whiteSpace: 'nowrap' }}>
              TransitOps
            </span>
          )}
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {visibleNav.map(item => {
            const isActive = currentPage === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                title={collapsed ? item.label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: collapsed ? '10px 0' : '10px 12px',
                  borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: isActive ? '#F0EDE5' : 'transparent',
                  color: isActive ? '#004643' : 'rgba(255,255,255,0.75)',
                  fontWeight: isActive ? 600 : 400, fontSize: '14px',
                  transition: 'all 0.15s',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  whiteSpace: 'nowrap', width: '100%', textAlign: 'left',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = '#005a55';
                    (e.currentTarget as HTMLButtonElement).style.color = '#fff';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.75)';
                  }
                }}
              >
                <span style={{ flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid #003835' }}>
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: collapsed ? '8px 0' : '8px 12px',
              borderRadius: '8px', border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'rgba(255,255,255,0.5)',
              width: '100%', justifyContent: collapsed ? 'center' : 'flex-start',
              fontSize: '13px',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = '#005a55';
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)';
            }}
          >
            {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span>Collapse</span></>}
          </button>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top bar */}
        <div style={{
          height: 56, background: '#fff',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          display: 'flex', alignItems: 'center',
          padding: '0 24px', gap: 16, flexShrink: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <div style={{ flex: 1 }} />
          {/* Role badge */}
          <span style={{
            padding: '3px 10px', borderRadius: '999px',
            background: roleStyle.bg, color: roleStyle.color,
            fontSize: '11px', fontWeight: 600,
          }}>
            {ROLE_LABEL[user.role]}
          </span>
          {/* Profile avatar dropdown (replaces logout button) */}
          <ProfileDropdown user={user} onLogout={onLogout} />
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
