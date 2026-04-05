'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  productPrice: number;
  subtotal: number;
}

interface Order {
  id: string;
  orderNumber: number;
  customerName: string | null;
  customerPhone: string;
  status: string;
  paymentMethod: string;
  totalAmount: number;
  deliveryFee: number;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
}

// Play alert sound using Web Audio API
function playAlertSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Play two beeps
    [0, 0.2].forEach(delay => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.15);
    });
  } catch (e) {
    console.warn('Audio alert not available');
  }
}

const STATUS_COLUMNS = [
  { key: 'PENDING', label: 'Pendientes', icon: '🕐', color: 'border-yellow-500/50', bg: 'bg-yellow-500/10', badge: 'bg-yellow-500' },
  { key: 'CONFIRMED', label: 'Confirmados', icon: '✅', color: 'border-blue-500/50', bg: 'bg-blue-500/10', badge: 'bg-blue-500' },
  { key: 'PREPARING', label: 'En Preparación', icon: '👨‍🍳', color: 'border-orange-500/50', bg: 'bg-orange-500/10', badge: 'bg-orange-500' },
  { key: 'READY', label: 'Listos', icon: '📦', color: 'border-green-500/50', bg: 'bg-green-500/10', badge: 'bg-green-500' },
  { key: 'OUT_FOR_DELIVERY', label: 'En Camino', icon: '🛵', color: 'border-purple-500/50', bg: 'bg-purple-500/10', badge: 'bg-purple-500' },
  { key: 'DELIVERED', label: 'Entregados', icon: '🎉', color: 'border-emerald-500/50', bg: 'bg-emerald-500/10', badge: 'bg-emerald-500' },
  { key: 'CANCELLED', label: 'Cancelados', icon: '❌', color: 'border-red-500/50', bg: 'bg-red-500/10', badge: 'bg-red-500' },
];

const STATUS_ACTIONS: Record<string, { label: string; next: string; icon: string; color: string }[]> = {
  PENDING: [
    { label: 'Aceptar', next: 'CONFIRMED', icon: '✅', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Cancelar', next: 'CANCELLED', icon: '❌', color: 'bg-red-600 hover:bg-red-700' },
  ],
  CONFIRMED: [
    { label: 'Iniciar Preparo', next: 'PREPARING', icon: '👨‍🍳', color: 'bg-orange-600 hover:bg-orange-700' },
    { label: 'Cancelar', next: 'CANCELLED', icon: '❌', color: 'bg-red-600 hover:bg-red-700' },
  ],
  PREPARING: [
    { label: 'Marcar Listo', next: 'READY', icon: '📦', color: 'bg-green-600 hover:bg-green-700' },
  ],
  READY: [
    { label: 'Salió Delivery', next: 'OUT_FOR_DELIVERY', icon: '🛵', color: 'bg-purple-600 hover:bg-purple-700' },
    { label: 'Entregado', next: 'DELIVERED', icon: '🎉', color: 'bg-emerald-600 hover:bg-emerald-700' },
  ],
  OUT_FOR_DELIVERY: [
    { label: 'Entregado', next: 'DELIVERED', icon: '🎉', color: 'bg-emerald-600 hover:bg-emerald-700' },
  ],
};

const PAYMENT_LABELS: Record<string, string> = {
  CASH: '💵 Efectivo',
  QR: '📱 QR',
  CARD: '💳 Tarjeta',
  PAYMENT_LINK: '🔗 Link',
  POS_ON_DELIVERY: '💳 POS Delivery',
  BANCARD_VPOS: '💳 Bancard',
  BANCARD_QR: '📱 Bancard QR',
  PAGOPAR: '💳 PagoPar',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m`;
  return `${Math.floor(hrs / 24)}d`;
}

function formatGs(amount: number): string {
  return new Intl.NumberFormat('es-PY').format(amount);
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const prevPendingRef = useRef<number>(0);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/orders');
      const data: Order[] = res.data;
      const newPending = data.filter(o => o.status === 'PENDING').length;
      
      // Play alert if new pending orders appeared
      if (newPending > prevPendingRef.current && prevPendingRef.current >= 0) {
        playAlertSound();
        // Also update page title to grab attention
        document.title = `(${newPending}) 🔔 ¡Nuevo pedido! - PyDelivery`;
        setTimeout(() => { document.title = 'PyDelivery Admin'; }, 5000);
      }
      prevPendingRef.current = newPending;
      
      setOrders(data);
    } catch (err) {
      console.error('Error loading orders', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000); // Refresh every 15s
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, status: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status } : null);
      }
    } catch (err) {
      console.error('Error updating status', err);
    }
  };

  // Filter
  const filtered = orders.filter(o => {
    if (search) {
      const q = search.toLowerCase();
      if (!o.orderNumber.toString().includes(q) &&
          !o.customerPhone.includes(q) &&
          !(o.customerName || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filterType === 'delivery') return o.deliveryFee > 0;
    if (filterType === 'pickup') return o.deliveryFee === 0;
    if (filterType === 'paid') return ['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status);
    if (filterType === 'pending') return o.status === 'PENDING';
    return true;
  });

  const getColumnOrders = (status: string) =>
    filtered.filter(o => o.status === status).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pendingCount = orders.filter(o => o.status === 'PENDING').length;

  return (
    <DashboardLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">📦 Pedidos</h2>
            {pendingCount > 0 && (
              <span className="px-3 py-1 bg-yellow-500 text-black text-sm font-bold rounded-full animate-pulse">
                {pendingCount} nuevo{pendingCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${view === 'kanban' ? 'bg-violet-600 text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}
            >
              ▦ Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${view === 'list' ? 'bg-violet-600 text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-hover)]'}`}
            >
              ≡ Lista
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <input
              type="text"
              placeholder="Buscar # pedido, teléfono, nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-violet-500"
            />
          </div>
          {['all', 'pending', 'paid', 'delivery', 'pickup'].map(f => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                filterType === f ? 'bg-violet-600 text-white' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border)]'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'pending' ? '🕐 Pendientes' : f === 'paid' ? '✅ Pagados' : f === 'delivery' ? '🛵 Delivery' : '🏪 Retiro'}
            </button>
          ))}
          <button onClick={fetchOrders} className="px-3 py-2 rounded-lg text-xs bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] border border-[var(--border)] transition-all">
            🔄 Actualizar
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
          </div>
        ) : view === 'kanban' ? (
          /* ═══ KANBAN VIEW ═══ */
          <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
            {STATUS_COLUMNS.filter(c => !['DELIVERED', 'CANCELLED'].includes(c.key) || getColumnOrders(c.key).length > 0).map(col => {
              const colOrders = getColumnOrders(col.key);
              return (
                <div key={col.key} className={`flex-shrink-0 w-72 rounded-2xl border ${col.color} bg-[var(--bg-card)] flex flex-col`}>
                  <div className={`px-4 py-3 border-b ${col.color} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <span>{col.icon}</span>
                      <span className="font-semibold text-sm">{col.label}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold text-white ${col.badge}`}>
                      {colOrders.length}
                    </span>
                  </div>
                  <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[65vh]">
                    {colOrders.map(order => (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`rounded-xl border border-[var(--border)] p-3 cursor-pointer transition-all hover:border-violet-500/40 hover:bg-[var(--bg-hover)] ${
                          selectedOrder?.id === order.id ? 'border-violet-500 bg-violet-500/10' : 'bg-[var(--bg-primary)]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-sm">#{order.orderNumber}</span>
                          <span className="text-xs text-[var(--text-muted)]">{timeAgo(order.createdAt)}</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] truncate">
                          {order.customerName || order.customerPhone}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-[var(--text-muted)]">
                            {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}
                          </span>
                          <span className="font-bold text-sm text-emerald-400">₲{formatGs(order.totalAmount)}</span>
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">
                          {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                        </div>
                      </div>
                    ))}
                    {colOrders.length === 0 && (
                      <div className="text-center py-8 text-[var(--text-muted)] text-xs">
                        Sin pedidos
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ═══ LIST VIEW ═══ */
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                  <th className="text-left p-4 font-medium">#</th>
                  <th className="text-left p-4 font-medium">Cliente</th>
                  <th className="text-left p-4 font-medium">Total</th>
                  <th className="text-left p-4 font-medium">Pago</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Tiempo</th>
                  <th className="text-left p-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(order => {
                  const col = STATUS_COLUMNS.find(c => c.key === order.status);
                  return (
                    <tr key={order.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)] cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      <td className="p-4 font-bold">#{order.orderNumber}</td>
                      <td className="p-4">
                        <div>{order.customerName || '—'}</div>
                        <div className="text-xs text-[var(--text-muted)]">{order.customerPhone}</div>
                      </td>
                      <td className="p-4 font-bold text-emerald-400">₲{formatGs(order.totalAmount)}</td>
                      <td className="p-4 text-xs">{PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${col?.bg || ''}`}>
                          {col?.icon} {col?.label}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-[var(--text-muted)]">{timeAgo(order.createdAt)}</td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {(STATUS_ACTIONS[order.status] || []).map(act => (
                            <button
                              key={act.next}
                              onClick={(e) => { e.stopPropagation(); updateStatus(order.id, act.next); }}
                              className={`px-2 py-1 rounded-lg text-xs text-white ${act.color} transition-all`}
                            >
                              {act.icon}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══ ORDER DETAIL PANEL ═══ */}
      {selectedOrder && (
        <div className="fixed right-0 top-0 h-full w-96 bg-[var(--bg-card)] border-l border-[var(--border)] z-50 shadow-2xl overflow-y-auto">
          <div className="p-5 border-b border-[var(--border)] flex items-center justify-between">
            <h3 className="font-bold text-lg">Pedido #{selectedOrder.orderNumber}</h3>
            <button onClick={() => setSelectedOrder(null)} className="text-[var(--text-muted)] hover:text-white text-xl">✕</button>
          </div>
          <div className="p-5 space-y-5">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {(() => { const c = STATUS_COLUMNS.find(c => c.key === selectedOrder.status); return c ? (
                <span className={`px-3 py-1.5 rounded-xl text-sm font-medium ${c.bg} border ${c.color}`}>{c.icon} {c.label}</span>
              ) : null; })()}
              <span className="text-xs text-[var(--text-muted)]">{timeAgo(selectedOrder.createdAt)}</span>
            </div>

            {/* Customer */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Cliente</h4>
              <p className="font-medium">{selectedOrder.customerName || '—'}</p>
              <p className="text-sm text-[var(--text-secondary)]">📱 {selectedOrder.customerPhone}</p>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Items</h4>
              <div className="space-y-2">
                {selectedOrder.items?.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--bg-primary)]">
                    <div>
                      <span className="text-sm font-medium">{item.quantity}x</span>
                      <span className="text-sm ml-2">{item.productName}</span>
                    </div>
                    <span className="text-sm text-emerald-400">₲{formatGs(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 pt-2 border-t border-[var(--border)]">
              {selectedOrder.deliveryFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Delivery</span>
                  <span>₲{formatGs(selectedOrder.deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-emerald-400">₲{formatGs(selectedOrder.totalAmount)}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Pago</h4>
              <p className="text-sm">{PAYMENT_LABELS[selectedOrder.paymentMethod] || selectedOrder.paymentMethod}</p>
            </div>

            {/* Notes */}
            {selectedOrder.notes && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Notas</h4>
                <p className="text-sm text-[var(--text-secondary)] bg-[var(--bg-primary)] p-3 rounded-lg">{selectedOrder.notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-[var(--border)]">
              <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Acciones</h4>
              <div className="flex flex-col gap-2">
                {(STATUS_ACTIONS[selectedOrder.status] || []).map(act => (
                  <button
                    key={act.next}
                    onClick={() => updateStatus(selectedOrder.id, act.next)}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium text-white ${act.color} transition-all flex items-center justify-center gap-2`}
                  >
                    <span>{act.icon}</span> {act.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Print */}
            <button
              onClick={() => window.print()}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-medium bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all"
            >
              🖨️ Imprimir Pedido
            </button>

            {/* Time info */}
            <div className="text-xs text-[var(--text-muted)] text-center">
              Creado: {new Date(selectedOrder.createdAt).toLocaleString('es-PY')}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
