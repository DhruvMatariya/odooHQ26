import { useState } from 'react';
import { Toaster } from 'sonner';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Vehicles } from './components/Vehicles';
import { Drivers } from './components/Drivers';
import { Trips } from './components/Trips';
import { Maintenance } from './components/Maintenance';
import { FuelLogs } from './components/FuelLogs';
import { Expenses } from './components/Expenses';
import { Reports } from './components/Reports';
import type { Role, PageKey } from './components/Layout';
import { clearToken } from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

const ROLE_DEFAULT_PAGE: Record<Role, PageKey> = {
  FLEET_MANAGER:    'dashboard',
  DRIVER:           'trips',
  SAFETY_OFFICER:   'drivers',
  FINANCIAL_ANALYST:'reports',
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<PageKey>('dashboard');

  function handleLogin(u: User) {
    setUser(u);
    setPage(ROLE_DEFAULT_PAGE[u.role]);
  }

  function handleLogout() {
    clearToken();   // remove JWT from localStorage
    setUser(null);
    setPage('dashboard');
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  function renderPage() {
    switch (page) {
      case 'dashboard':   return <Dashboard userRole={user!.role} onNavigate={p => setPage(p as PageKey)} />;
      case 'vehicles':    return <Vehicles userRole={user!.role} />;
      case 'drivers':     return <Drivers userRole={user!.role} />;
      case 'trips':       return <Trips userRole={user!.role} />;
      case 'maintenance': return <Maintenance userRole={user!.role} />;
      case 'fuel-logs':   return <FuelLogs userRole={user!.role} />;
      case 'expenses':    return <Expenses userRole={user!.role} />;
      case 'reports':     return <Reports userRole={user!.role} />;
      default:            return <Dashboard userRole={user!.role} onNavigate={p => setPage(p as PageKey)} />;
    }
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#fff',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: '10px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          },
        }}
      />
      <Layout
        user={user}
        currentPage={page}
        onNavigate={setPage}
        onLogout={handleLogout}
      >
        {renderPage()}
      </Layout>
    </>
  );
}
