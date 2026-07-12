import { useState, ReactNode } from 'react';
import {
  LayoutDashboard, Truck, Users, MapPin, Wrench, Fuel,
  Receipt, BarChart3, LogOut, ChevronLeft, ChevronRight, Menu,
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

export function Layout({ user, currentPage, onNavigate, onLogout, children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  const visibleNav = NAV_ITEMS.filter(n => n.roles.includes(user.role));
  const roleStyle = ROLE_COLOR[user.role];

  const sidebarW = collapsed ? 64 : 240;

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#F0EDE5' }}>
      {/* Sidebar */}
      <div
        style={{
          width: sidebarW,
          minWidth: sidebarW,
          background: '#004643',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.2s ease',
          overflow: 'hidden',
          zIndex: 10,
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        }}
      >
        {/* Logo */}
        <div style={{
          padding: collapsed ? '20px 0' : '20px 20px',
          borderBottom: '1px solid #003835',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
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
            <span style={{
              fontFamily: 'Poppins, sans-serif',
              fontWeight: 700, fontSize: '16px', color: '#F0EDE5', whiteSpace: 'nowrap',
            }}>
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
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: collapsed ? '10px 0' : '10px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? '#F0EDE5' : 'transparent',
                  color: isActive ? '#004643' : 'rgba(255,255,255,0.75)',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '14px',
                  transition: 'all 0.15s',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  whiteSpace: 'nowrap',
                  width: '100%',
                  textAlign: 'left',
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
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#005a55'; (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'; }}
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
          {/* User name */}
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#004643', color: '#F0EDE5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700,
          }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: '14px', fontWeight: 500, color: '#1A1F27' }}>{user.name}</span>
          <button
            onClick={onLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)',
              background: '#fff', color: '#6B7280', fontSize: '13px', cursor: 'pointer',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#FEE2E2'; (e.currentTarget as HTMLButtonElement).style.color = '#B3261E'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; (e.currentTarget as HTMLButtonElement).style.color = '#6B7280'; }}
          >
            <LogOut size={14} />
            <span>Logout</span>
          </button>
        </div>

        {/* Page content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
