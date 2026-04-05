'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
}

function formatGs(amount: number): string {
  return new Intl.NumberFormat('es-PY').format(amount);
}

function isToday(dateStr: string): boolean {
  return new Date(dateStr).toDateString() === new Date().toDateString();
}

export default function HomePage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const todayOrders = orders.filter(o => isToday(o.createdAt));
  const todayPaid = todayOrders.filter(o => !['PENDING', 'CANCELLED'].includes(o.status));
  const todayRevenue = todayPaid.reduce((sum, o) => sum + o.totalAmount, 0);
  const pending = orders.filter(o => o.status === 'PENDING').length;
  const totalOrders = orders.length;

  const cards = [
    { label: 'Pedidos hoy', value: loading ? '—' : todayOrders.length.toString(), icon: '📦', color: 'from-blue-500 to-cyan-500' },
    { label: 'Ingresos hoy', value: loading ? '—' : `₲${formatGs(todayRevenue)}`, icon: '💰', color: 'from-green-500 to-emerald-500' },
    { label: 'Pendientes', value: loading ? '—' : pending.toString(), icon: '🕐', color: 'from-orange-500 to-amber-500', pulse: pending > 0 },
    { label: 'Total pedidos', value: loading ? '—' : totalOrders.toString(), icon: '📊', color: 'from-violet-500 to-purple-500' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-white">¡Hola, {user?.name}! 👋</h2>
          <p className="text-[var(--text-muted)] mt-1">Bienvenido al panel de PyDelivery</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className={`rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 hover:border-violet-500/30 transition-all duration-200 ${card.pulse ? 'animate-pulse' : ''}`}
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

        {/* Recent Orders */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="font-semibold">Últimos Pedidos</h3>
            <a href="/orders" className="text-xs text-violet-400 hover:text-violet-300">Ver todos →</a>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {todayOrders.slice(0, 5).map(order => (
              <div key={order.id} className="px-5 py-3 flex items-center justify-between hover:bg-[var(--bg-hover)] transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${order.status === 'PENDING' ? 'bg-yellow-500 animate-pulse' : order.status === 'CANCELLED' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                  <span className="text-sm font-medium">Pedido</span>
                </div>
                <span className="text-sm font-bold text-emerald-400">₲{formatGs(order.totalAmount)}</span>
              </div>
            ))}
            {todayOrders.length === 0 && !loading && (
              <div className="py-8 text-center text-[var(--text-muted)] text-sm">
                Sin pedidos hoy. ¡Llegaran pronto! 🚀
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
