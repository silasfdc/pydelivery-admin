'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import api from '@/lib/api';

interface Order {
  id: string;
  orderNumber: number;
  customerName: string | null;
  customerPhone: string;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
}

function formatGs(amount: number): string {
  return new Intl.NumberFormat('es-PY').format(amount);
}

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default function FinancePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('today');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data);
      } catch (err) {
        console.error('Error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Filter by date range
  const filtered = orders.filter(o => {
    const d = new Date(o.createdAt);
    const now = new Date();
    if (dateRange === 'today') return isToday(o.createdAt);
    if (dateRange === 'week') return now.getTime() - d.getTime() < 7 * 86400000;
    if (dateRange === 'month') return now.getTime() - d.getTime() < 30 * 86400000;
    return true;
  });

  const paid = filtered.filter(o => ['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status));
  const pending = filtered.filter(o => o.status === 'PENDING');
  const cancelled = filtered.filter(o => o.status === 'CANCELLED');

  const totalSales = paid.reduce((sum, o) => sum + o.totalAmount, 0);
  const avgTicket = paid.length > 0 ? totalSales / paid.length : 0;

  // By payment method
  const byMethod: Record<string, { count: number; total: number }> = {};
  paid.forEach(o => {
    if (!byMethod[o.paymentMethod]) byMethod[o.paymentMethod] = { count: 0, total: 0 };
    byMethod[o.paymentMethod].count++;
    byMethod[o.paymentMethod].total += o.totalAmount;
  });

  // By status
  const byStatus: Record<string, number> = {};
  filtered.forEach(o => {
    byStatus[o.status] = (byStatus[o.status] || 0) + 1;
  });

  const METHOD_LABELS: Record<string, string> = {
    CASH: '💵 Efectivo',
    QR: '📱 QR',
    CARD: '💳 Tarjeta',
    PAYMENT_LINK: '🔗 Link',
    POS_ON_DELIVERY: '💳 POS',
    BANCARD_VPOS: '💳 Bancard',
    BANCARD_QR: '📱 Bancard QR',
    PAGOPAR: '💳 PagoPar',
  };

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    PENDING: { label: '🕐 Pendiente', color: 'bg-yellow-500/20 text-yellow-300' },
    CONFIRMED: { label: '✅ Confirmado', color: 'bg-blue-500/20 text-blue-300' },
    PREPARING: { label: '👨‍🍳 Preparando', color: 'bg-orange-500/20 text-orange-300' },
    READY: { label: '📦 Listo', color: 'bg-green-500/20 text-green-300' },
    OUT_FOR_DELIVERY: { label: '🛵 En Camino', color: 'bg-purple-500/20 text-purple-300' },
    DELIVERED: { label: '🎉 Entregado', color: 'bg-emerald-500/20 text-emerald-300' },
    CANCELLED: { label: '❌ Cancelado', color: 'bg-red-500/20 text-red-300' },
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ['#Pedido', 'Cliente', 'Teléfono', 'Total', 'Pago', 'Status', 'Fecha'];
    const rows = filtered.map(o => [
      o.orderNumber,
      o.customerName || '',
      o.customerPhone,
      o.totalAmount,
      o.paymentMethod,
      o.status,
      new Date(o.createdAt).toLocaleString('es-PY'),
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos_${dateRange}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">💰 Finanzas</h2>
          <div className="flex items-center gap-2">
            {(['today', 'week', 'month', 'all'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  dateRange === range ? 'bg-violet-600 text-white' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border)]'
                }`}
              >
                {range === 'today' ? 'Hoy' : range === 'week' ? 'Semana' : range === 'month' ? 'Mes' : 'Todo'}
              </button>
            ))}
            <button onClick={exportCSV} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-all">
              📥 Exportar CSV
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <p className="text-sm text-[var(--text-muted)]">Ventas</p>
            <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent">
              ₲{formatGs(totalSales)}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{paid.length} pedidos pagados</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <p className="text-sm text-[var(--text-muted)]">Ticket Medio</p>
            <p className="text-3xl font-bold mt-1 text-blue-400">₲{formatGs(Math.round(avgTicket))}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">promedio por pedido</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <p className="text-sm text-[var(--text-muted)]">Pedidos Pendientes</p>
            <p className="text-3xl font-bold mt-1 text-yellow-400">{pending.length}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">esperando confirmación</p>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <p className="text-sm text-[var(--text-muted)]">Total Pedidos</p>
            <p className="text-3xl font-bold mt-1 text-violet-400">{filtered.length}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">{cancelled.length} cancelados</p>
          </div>
        </div>

        {/* Two column layout */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* By Payment Method */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <h3 className="font-semibold mb-4">💳 Por Método de Pago</h3>
            <div className="space-y-3">
              {Object.entries(byMethod).sort((a, b) => b[1].total - a[1].total).map(([method, data]) => {
                const pct = totalSales > 0 ? (data.total / totalSales) * 100 : 0;
                return (
                  <div key={method}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{METHOD_LABELS[method] || method}</span>
                      <span className="text-sm font-bold text-emerald-400">₲{formatGs(data.total)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-[var(--text-muted)] w-16 text-right">{data.count} ({pct.toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
              {Object.keys(byMethod).length === 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">Sin datos</p>
              )}
            </div>
          </div>

          {/* By Status */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
            <h3 className="font-semibold mb-4">📊 Por Status</h3>
            <div className="space-y-2">
              {Object.entries(byStatus).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                const info = STATUS_LABELS[status] || { label: status, color: 'bg-gray-500/20 text-gray-300' };
                const pct = filtered.length > 0 ? (count / filtered.length) * 100 : 0;
                return (
                  <div key={status} className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-hover)]">
                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${info.color}`}>{info.label}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-bold w-8 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
              {Object.keys(byStatus).length === 0 && (
                <p className="text-sm text-[var(--text-muted)] text-center py-4">Sin datos</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
