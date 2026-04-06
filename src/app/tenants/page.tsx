'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import api from '@/lib/api';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  paymentGateway: string;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', phone: '', address: '' });
  const [error, setError] = useState('');

  const fetchTenants = async () => {
    try {
      const r = await api.get('/tenants');
      setTenants(r.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTenants(); }, []);

  // Auto-generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editingId) {
        await api.patch(`/tenants/${editingId}`, form);
      } else {
        await api.post('/tenants', form);
      }
      setForm({ name: '', slug: '', phone: '', address: '' });
      setShowForm(false);
      setEditingId(null);
      fetchTenants();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al guardar');
    }
  };

  const handleEdit = (t: Tenant) => {
    setForm({ name: t.name, slug: t.slug, phone: t.phone || '', address: t.address || '' });
    setEditingId(t.id);
    setShowForm(true);
    setError('');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('⚠️ ¿Eliminar este establecimiento? Se borrarán TODOS sus datos (pedidos, productos, etc). Esta acción NO se puede deshacer.')) return;
    try {
      await api.delete(`/tenants/${id}`);
      fetchTenants();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al eliminar');
    }
  };

  const toggleActive = async (t: Tenant) => {
    try {
      await api.patch(`/tenants/${t.id}`, { isActive: !t.isActive });
      fetchTenants();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">🏪 Establecimientos</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">Gestione los restaurantes/establecimientos de la plataforma</p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', slug: '', phone: '', address: '' }); setError(''); }}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-all"
          >
            {showForm ? '✕ Cerrar' : '+ Nuevo establecimiento'}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            ❌ {error}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
            <h3 className="text-lg font-semibold text-white">{editingId ? '✏️ Editar establecimiento' : '🏪 Nuevo establecimiento'}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Nombre del establecimiento *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="Ej: Burger House"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Slug (URL) *</label>
                <input
                  type="text"
                  required
                  value={form.slug}
                  onChange={e => setForm({ ...form, slug: e.target.value })}
                  placeholder="burger-house"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500"
                />
                <p className="text-xs text-[var(--text-muted)] mt-1">Identificador único, sin espacios ni acentos</p>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+595981..."
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Dirección</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Av. Mariscal López 1234"
                  className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500"
                />
              </div>
            </div>
            <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-all">
              {editingId ? '💾 Guardar cambios' : '+ Crear establecimiento'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tenants.map(t => (
              <div key={t.id} className={`rounded-2xl border bg-[var(--bg-card)] p-5 transition-all hover:border-violet-500/30 ${t.isActive ? 'border-[var(--border)]' : 'border-red-500/30 opacity-60'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{t.name}</h3>
                    <p className="text-xs text-[var(--text-muted)] font-mono">/{t.slug}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-lg text-xs font-medium ${t.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                    {t.isActive ? '✅ Activo' : '⏸️ Inactivo'}
                  </span>
                </div>

                {t.phone && <p className="text-sm text-[var(--text-secondary)] mb-1">📞 {t.phone}</p>}
                {t.address && <p className="text-sm text-[var(--text-secondary)] mb-1">📍 {t.address}</p>}
                <p className="text-xs text-[var(--text-muted)] mb-3">💳 {t.paymentGateway || 'MANUAL'}</p>

                <p className="text-xs text-[var(--text-muted)] mb-4">
                  Creado: {new Date(t.createdAt).toLocaleDateString('es-PY')}
                </p>

                <div className="flex gap-2">
                  <button onClick={() => handleEdit(t)} className="flex-1 px-3 py-2 rounded-xl text-xs font-medium bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 transition-all">
                    ✏️ Editar
                  </button>
                  <button onClick={() => toggleActive(t)} className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all ${t.isActive ? 'bg-amber-600/20 text-amber-300 hover:bg-amber-600/30' : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30'}`}>
                    {t.isActive ? '⏸️ Desactivar' : '▶️ Activar'}
                  </button>
                  <button onClick={() => handleDelete(t.id)} className="px-3 py-2 rounded-xl text-xs font-medium bg-red-600/20 text-red-300 hover:bg-red-600/30 transition-all">
                    🗑️
                  </button>
                </div>
              </div>
            ))}

            {tenants.length === 0 && (
              <div className="col-span-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-12 text-center">
                <p className="text-4xl mb-3">🏪</p>
                <p className="text-[var(--text-muted)]">No hay establecimientos registrados</p>
                <p className="text-sm text-[var(--text-muted)] mt-1">Cree el primero haciendo clic en &quot;+ Nuevo establecimiento&quot;</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
