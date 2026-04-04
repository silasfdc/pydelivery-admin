'use client';

import DashboardLayout from '@/components/dashboard-layout';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">¡Hola, {user?.name}! 👋</h2>
          <p className="text-[var(--text-muted)] mt-1">Bienvenido al panel de PyDelivery</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Pedidos hoy', value: '—', icon: '📦', color: 'from-blue-500 to-cyan-500' },
            { label: 'Ingresos hoy', value: '—', icon: '💰', color: 'from-green-500 to-emerald-500' },
            { label: 'Productos', value: '—', icon: '🍔', color: 'from-orange-500 to-amber-500' },
            { label: 'Clientes', value: '—', icon: '👤', color: 'from-violet-500 to-purple-500' },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 hover:border-violet-500/30 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--text-muted)]">{card.label}</p>
                  <p className="text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-lg`}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
