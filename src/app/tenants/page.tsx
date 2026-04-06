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
  _count?: { users: number; orders: number; products: number };
}

interface CreatedCredentials {
  tenantName: string;
  adminEmail: string;
  adminPassword: string;
  adminName: string;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<CreatedCredentials | null>(null);
  const [form, setForm] = useState({
    name: '', slug: '', phone: '', address: '',
    adminName: '', adminEmail: '', adminPassword: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTenants = async () => {
    try {
      const r = await api.get('/tenants');
      setTenants(r.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTenants(); }, []);

  const generateSlug = (name: string) =>
    name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pw = '';
    for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    return pw + '!';
  };

  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      name,
      slug: editingId ? prev.slug : generateSlug(name),
    }));
  };

  const resetForm = () => {
    setForm({ name: '', slug: '', phone: '', address: '', adminName: '', adminEmail: '', adminPassword: generatePassword() });
    setEditingId(null);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/tenants/${editingId}`, {
          name: form.name, slug: form.slug, phone: form.phone, address: form.address,
        });
        setShowForm(false);
        setEditingId(null);
      } else {
        await api.post('/tenants', form);
        // Show credentials modal
        setCredentials({
          tenantName: form.name,
          adminEmail: form.adminEmail,
          adminPassword: form.adminPassword,
          adminName: form.adminName,
        });
        setShowForm(false);
      }
      resetForm();
      fetchTenants();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (t: Tenant) => {
    setForm({ name: t.name, slug: t.slug, phone: t.phone || '', address: t.address || '', adminName: '', adminEmail: '', adminPassword: '' });
    setEditingId(t.id);
    setShowForm(true);
    setError('');
    setCredentials(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('⚠️ ¿Eliminar este establecimiento? Se borrarán TODOS sus datos. Esta acción NO se puede deshacer.')) return;
    try { await api.delete(`/tenants/${id}`); fetchTenants(); }
    catch (e: any) { setError(e.response?.data?.message || 'Error al eliminar'); }
  };

  const toggleActive = async (t: Tenant) => {
    try { await api.patch(`/tenants/${t.id}`, { isActive: !t.isActive }); fetchTenants(); }
    catch (e) { console.error(e); }
  };

  const openNewForm = () => {
    resetForm();
    setForm(f => ({ ...f, adminPassword: generatePassword() }));
    setShowForm(true);
    setCredentials(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">🏪 Establecimientos</h2>
            <p className="text-sm text-[var(--text-muted)] mt-1">Cada establecimiento tiene su propio admin, productos y pedidos</p>
          </div>
          <button onClick={() => showForm ? (setShowForm(false), setEditingId(null)) : openNewForm()}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-all">
            {showForm ? '✕ Cerrar' : '+ Nuevo establecimiento'}
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">❌ {error}</div>
        )}

        {/* ── Credentials Modal ── */}
        {credentials && (
          <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-emerald-300">✅ Establecimiento creado con éxito!</h3>
              <button onClick={() => setCredentials(null)} className="text-[var(--text-muted)] hover:text-white text-lg">✕</button>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              Anote estas credenciales para entregar al cliente. <strong className="text-amber-300">La contraseña no se mostrará de nuevo.</strong>
            </p>
            <div className="rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] p-5 space-y-3 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Establecimiento:</span>
                <span className="text-white font-semibold">{credentials.tenantName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">Nombre admin:</span>
                <span className="text-white">{credentials.adminName}</span>
              </div>
              <hr className="border-[var(--border)]" />
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">📧 Email:</span>
                <span className="text-violet-300 font-semibold">{credentials.adminEmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-muted)]">🔑 Contraseña:</span>
                <span className="text-amber-300 font-bold text-base">{credentials.adminPassword}</span>
              </div>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`Establecimiento: ${credentials.tenantName}\nEmail: ${credentials.adminEmail}\nContraseña: ${credentials.adminPassword}`);
                alert('Credenciales copiadas al portapapeles ✓');
              }}
              className="px-4 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-all"
            >
              📋 Copiar credenciales
            </button>
          </div>
        )}

        {/* ── Create/Edit Form ── */}
        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 space-y-5">
            <h3 className="text-lg font-semibold text-white">
              {editingId ? '✏️ Editar establecimiento' : '🏪 Nuevo establecimiento + admin'}
            </h3>

            {/* Tenant info */}
            <div>
              <p className="text-sm font-medium text-violet-300 mb-3">Datos del establecimiento</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Nombre del establecimiento *</label>
                  <input type="text" required value={form.name} onChange={e => handleNameChange(e.target.value)}
                    placeholder="Ej: Burger House"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Slug (URL) *</label>
                  <input type="text" required value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })}
                    placeholder="burger-house"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Teléfono</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+595981..."
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Dirección</label>
                  <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="Av. Mariscal López 1234"
                    className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500" />
                </div>
              </div>
            </div>

            {/* Admin user - only on create */}
            {!editingId && (
              <div>
                <p className="text-sm font-medium text-emerald-300 mb-3">👤 Administrador del establecimiento</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Nombre del admin *</label>
                    <input type="text" required value={form.adminName} onChange={e => setForm({ ...form, adminName: e.target.value })}
                      placeholder="Juan Pérez"
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Email del admin *</label>
                    <input type="email" required value={form.adminEmail} onChange={e => setForm({ ...form, adminEmail: e.target.value })}
                      placeholder="admin@restaurante.com"
                      className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500" />
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Contraseña *</label>
                    <div className="flex gap-2">
                      <input type="text" required minLength={6} value={form.adminPassword}
                        onChange={e => setForm({ ...form, adminPassword: e.target.value })}
                        className="flex-1 bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-amber-300 font-mono focus:outline-none focus:border-violet-500" />
                      <button type="button" onClick={() => setForm({ ...form, adminPassword: generatePassword() })}
                        className="px-3 py-2 rounded-xl text-xs bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-muted)] hover:text-white hover:border-violet-500 transition-all"
                        title="Generar nueva contraseña">🎲</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button type="submit" disabled={saving}
              className="px-6 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-all disabled:opacity-50">
              {saving ? '⏳ Creando...' : editingId ? '💾 Guardar cambios' : '+ Crear establecimiento y admin'}
            </button>
          </form>
        )}

        {/* ── Tenant Cards ── */}
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

                {/* Stats */}
                {t._count && (
                  <div className="flex gap-3 my-3 text-xs text-[var(--text-muted)]">
                    <span>👤 {t._count.users} users</span>
                    <span>📦 {t._count.orders} pedidos</span>
                    <span>🍔 {t._count.products} prod.</span>
                  </div>
                )}

                <p className="text-xs text-[var(--text-muted)] mb-4">
                  Creado: {new Date(t.createdAt).toLocaleDateString('es-PY')}
                </p>

                <div className="flex gap-2">
                  <button onClick={() => handleEdit(t)} className="flex-1 px-3 py-2 rounded-xl text-xs font-medium bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 transition-all">
                    ✏️ Editar
                  </button>
                  <button onClick={() => toggleActive(t)} className={`flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all ${t.isActive ? 'bg-amber-600/20 text-amber-300 hover:bg-amber-600/30' : 'bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30'}`}>
                    {t.isActive ? '⏸️ Desact.' : '▶️ Activar'}
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
                <p className="text-sm text-[var(--text-muted)] mt-1">Cree el primero con &quot;+ Nuevo establecimiento&quot;</p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
