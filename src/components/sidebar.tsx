'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/tenants', label: 'Establecimientos', icon: '🏪' },
  { href: '/orders', label: 'Pedidos', icon: '📦' },
  { href: '/finance', label: 'Finanzas', icon: '💰' },
  { href: '/categories', label: 'Categorías', icon: '📁' },
  { href: '/products', label: 'Productos', icon: '🍔' },
  { href: '/delivery-zones', label: 'Zonas', icon: '🛵' },
  { href: '/whatsapp', label: 'WhatsApp', icon: '💬' },
  { href: '/users', label: 'Usuarios', icon: '👤' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 border-r border-[var(--border)] bg-[var(--bg-card)] flex flex-col z-50">
      <div className="p-5 border-b border-[var(--border)]">
        <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-500 bg-clip-text text-transparent">
          🚀 PyDelivery
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-1">Panel Administrativo</p>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--border)]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center text-sm">
            {user?.name?.[0] || '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.name}</p>
            <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
