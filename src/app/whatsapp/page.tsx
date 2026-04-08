'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';

type ProviderType = 'META_OFFICIAL' | 'EVOLUTION';
type EvolutionMode = 'BAILEYS' | 'CLOUD_API';

interface WhatsAppConnection {
  id: string;
  providerType: ProviderType;
  isActive: boolean;
  displayName?: string | null;
  phoneNumber?: string | null;
  metaBusinessAccountId?: string | null;
  metaPhoneNumberId?: string | null;
  metaVerifyToken?: string | null;
  evolutionBaseUrl?: string | null;
  evolutionApiKey?: string | null;
  evolutionInstanceName?: string | null;
  evolutionWebhookSecret?: string | null;
  evolutionMode?: EvolutionMode | null;
  webhookSecret?: string | null;
  metaAccessToken?: string | null;
  createdAt: string;
}

const emptyForm = {
  providerType: 'EVOLUTION' as ProviderType,
  displayName: '',
  phoneNumber: '',
  webhookSecret: '',
  metaBusinessAccountId: '',
  metaPhoneNumberId: '',
  metaAccessToken: '',
  metaVerifyToken: '',
  evolutionBaseUrl: '',
  evolutionApiKey: '',
  evolutionInstanceName: '',
  evolutionWebhookSecret: '',
  evolutionMode: 'BAILEYS' as EvolutionMode,
  isActive: true,
};

const WEBHOOK_BASE = 'https://pydelivery.metasync.com.br/webhooks/whatsapp';

export default function WhatsAppPage() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [testTo, setTestTo] = useState('');
  const [testText, setTestText] = useState('Hola, este es un mensaje de prueba desde PyDelivery 🚀');
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState('');

  const tenantId = user?.tenantId || '';

  async function load() {
    try {
      const res = await api.get('/whatsapp/connections');
      setConnections(res.data);
    } catch { setMsg({ text: 'Error al cargar conexiones', type: 'error' }); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function upd(field: string, value: unknown) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function flash(text: string, type: 'success' | 'error') {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: '', type: '' }), 5000);
  }

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(c: WhatsAppConnection) {
    setForm({
      providerType: c.providerType,
      displayName: c.displayName || '',
      phoneNumber: c.phoneNumber || '',
      webhookSecret: c.webhookSecret || '',
      metaBusinessAccountId: c.metaBusinessAccountId || '',
      metaPhoneNumberId: c.metaPhoneNumberId || '',
      metaAccessToken: c.metaAccessToken || '',
      metaVerifyToken: c.metaVerifyToken || '',
      evolutionBaseUrl: c.evolutionBaseUrl || '',
      evolutionApiKey: c.evolutionApiKey || '',
      evolutionInstanceName: c.evolutionInstanceName || '',
      evolutionWebhookSecret: c.evolutionWebhookSecret || '',
      evolutionMode: (c.evolutionMode || 'BAILEYS') as EvolutionMode,
      isActive: c.isActive,
    });
    setEditingId(c.id);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/whatsapp/connections/${editingId}`, form);
        flash('✅ Conexión actualizada', 'success');
      } else {
        await api.post('/whatsapp/connections', form);
        flash('✅ Conexión creada', 'success');
      }
      setForm(emptyForm);
      setShowForm(false);
      setEditingId(null);
      await load();
    } catch (err: any) {
      flash(err?.response?.data?.message || 'Error al guardar', 'error');
    } finally { setSaving(false); }
  }

  async function handleActivate(id: string) {
    try {
      await api.patch(`/whatsapp/connections/${id}/activate`);
      flash('✅ Conexión activada', 'success');
      await load();
    } catch (err: any) { flash(err?.response?.data?.message || 'Error al activar', 'error'); }
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/whatsapp/connections/${id}`);
      setDeletingId(null);
      flash('✅ Conexión eliminada', 'success');
      await load();
    } catch (err: any) {
      setDeletingId(null);
      flash(err?.response?.data?.message || 'Error al eliminar', 'error');
    }
  }

  async function handleTestSend(e: React.FormEvent) {
    e.preventDefault();
    setTesting(true);
    try {
      await api.post('/whatsapp/send-test', { to: testTo, text: testText });
      flash('✅ Mensaje de prueba enviado', 'success');
    } catch (err: any) { flash(err?.response?.data?.message || 'Error al enviar', 'error'); }
    finally { setTesting(false); }
  }

  function copyUrl(url: string) {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(''), 2000);
  }

  const activeConn = connections.find((c) => c.isActive);
  const webhookUrl = `${WEBHOOK_BASE}/evolution/${tenantId}`;
  const metaWebhookUrl = `${WEBHOOK_BASE}/meta/${tenantId}`;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">💬 WhatsApp</h2>
            <p className="text-[var(--text-muted)] mt-1">
              Configurá tu conexión Evolution API o Meta Oficial. Solo 1 activa por vez.
            </p>
          </div>
          <button
            onClick={() => { showForm ? setShowForm(false) : openCreate(); }}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/20"
          >
            {showForm ? '✕ Cancelar' : '+ Nueva conexión'}
          </button>
        </div>

        {/* Flash Message */}
        {msg.text && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${
            msg.type === 'success'
              ? 'border-green-500/30 bg-green-500/10 text-green-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}>{msg.text}</div>
        )}

        {/* ═══ CREATE / EDIT FORM ═══ */}
        {showForm && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-semibold text-white mb-5">
              {editingId ? '✏️ Editar conexión' : '➕ Nueva conexión'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              {/* Provider Selector */}
              <div className="grid gap-3 sm:grid-cols-2">
                {(['EVOLUTION', 'META_OFFICIAL'] as ProviderType[]).map((type) => (
                  <button key={type} type="button" onClick={() => upd('providerType', type)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      form.providerType === type
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--text-muted)]'
                    }`}>
                    <p className="font-semibold text-white">
                      {type === 'EVOLUTION' ? '🟢 Evolution API' : '🔵 Meta Oficial'}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {type === 'EVOLUTION' ? 'Baileys / Cloud API — Gratis, self-hosted' : 'WhatsApp Business API — Oficial de Meta'}
                    </p>
                  </button>
                ))}
              </div>

              {/* Common Fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Nombre de la conexión</label>
                  <input value={form.displayName} onChange={(e) => upd('displayName', e.target.value)}
                    placeholder="Ej: WhatsApp Principal" className="input-field" />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Número WhatsApp</label>
                  <input value={form.phoneNumber} onChange={(e) => upd('phoneNumber', e.target.value)}
                    placeholder="+595981123456" className="input-field" />
                </div>
              </div>

              {/* ── EVOLUTION fields ── */}
              {form.providerType === 'EVOLUTION' && (
                <div className="space-y-4 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                  <p className="text-sm font-medium text-green-300">🟢 Configuración Evolution API</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">URL Base *</label>
                      <input value={form.evolutionBaseUrl} onChange={(e) => upd('evolutionBaseUrl', e.target.value)}
                        placeholder="http://10.17.3.247:8080" className="input-field" required />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Nombre de Instancia *</label>
                      <input value={form.evolutionInstanceName} onChange={(e) => upd('evolutionInstanceName', e.target.value)}
                        placeholder="3237delta" className="input-field" required />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Modo</label>
                      <select value={form.evolutionMode} onChange={(e) => upd('evolutionMode', e.target.value)}
                        className="input-field">
                        <option value="BAILEYS">BAILEYS</option>
                        <option value="CLOUD_API">CLOUD_API</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Webhook Secret (opcional)</label>
                      <input value={form.evolutionWebhookSecret} onChange={(e) => upd('evolutionWebhookSecret', e.target.value)}
                        placeholder="Secret para validar webhooks" className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">API Key *</label>
                    <input type="password" value={form.evolutionApiKey} onChange={(e) => upd('evolutionApiKey', e.target.value)}
                      placeholder="Global API Key da Evolution" className="input-field" required />
                  </div>
                </div>
              )}

              {/* ── META fields ── */}
              {form.providerType === 'META_OFFICIAL' && (
                <div className="space-y-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <p className="text-sm font-medium text-blue-300">🔵 Configuración Meta</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Business Account ID</label>
                      <input value={form.metaBusinessAccountId} onChange={(e) => upd('metaBusinessAccountId', e.target.value)}
                        placeholder="ID da conta business" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Phone Number ID *</label>
                      <input value={form.metaPhoneNumberId} onChange={(e) => upd('metaPhoneNumberId', e.target.value)}
                        placeholder="ID do número" className="input-field" required />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Verify Token</label>
                      <input value={form.metaVerifyToken} onChange={(e) => upd('metaVerifyToken', e.target.value)}
                        placeholder="Token de verificação" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Webhook Secret</label>
                      <input value={form.webhookSecret} onChange={(e) => upd('webhookSecret', e.target.value)}
                        placeholder="Secret do webhook" className="input-field" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Access Token *</label>
                    <input type="password" value={form.metaAccessToken} onChange={(e) => upd('metaAccessToken', e.target.value)}
                      placeholder="Token de acesso" className="input-field" required />
                  </div>
                </div>
              )}

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isActive}
                  onChange={(e) => upd('isActive', e.target.checked)}
                  className="w-4 h-4 accent-violet-500" />
                <span className="text-sm text-[var(--text-secondary)]">Activar al guardar (desactiva las demás)</span>
              </label>

              <div className="flex gap-3">
                <button type="submit" disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 font-semibold text-white hover:from-violet-500 hover:to-purple-500 disabled:opacity-60 transition-all shadow-lg shadow-violet-500/20">
                  {saving ? '⏳ Guardando...' : editingId ? '💾 Guardar cambios' : '+ Crear conexión'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="rounded-xl border border-[var(--border)] px-6 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ═══ ACTIVE CONNECTION CARD ═══ */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Conexión activa</h3>
          {activeConn ? (
            <div className="rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-purple-500/10 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="font-semibold text-white text-lg">
                      {activeConn.displayName || 'Sin nombre'}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {activeConn.providerType === 'META_OFFICIAL' ? '🔵 Meta Oficial' : '🟢 Evolution API'}
                    {activeConn.evolutionMode ? ` (${activeConn.evolutionMode})` : ''}
                    {activeConn.evolutionInstanceName ? ` — ${activeConn.evolutionInstanceName}` : ''}
                  </p>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">
                    📱 {activeConn.phoneNumber || 'Sin número'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEdit(activeConn)}
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-blue-300 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all">
                    ✏️ Editar
                  </button>
                  <span className="inline-block rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-300">
                    ● Activa
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[var(--text-muted)] text-sm">Ninguna conexión activa. Creá una nueva arriba.</p>
          )}
        </div>

        {/* ═══ WEBHOOK CONFIGURATION ═══ */}
        {activeConn && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
            <h3 className="text-lg font-semibold text-white mb-2">🔗 Configuración Webhook</h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">
              Configurá esta URL en tu {activeConn.providerType === 'EVOLUTION' ? 'Evolution API' : 'Meta Developer'} para recibir mensajes.
            </p>

            <div className="space-y-3">
              {/* Webhook URL */}
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">URL del Webhook</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-xl bg-[var(--bg-primary)] border border-[var(--border)] px-4 py-2.5 text-sm text-emerald-400 font-mono break-all">
                    {activeConn.providerType === 'EVOLUTION' ? webhookUrl : metaWebhookUrl}
                  </code>
                  <button
                    onClick={() => copyUrl(activeConn.providerType === 'EVOLUTION' ? webhookUrl : metaWebhookUrl)}
                    className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm text-white hover:bg-[var(--bg-hover)] transition-all whitespace-nowrap">
                    {copied === (activeConn.providerType === 'EVOLUTION' ? webhookUrl : metaWebhookUrl) ? '✅ Copiado!' : '📋 Copiar'}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              {activeConn.providerType === 'EVOLUTION' && (
                <div className="rounded-xl bg-green-500/5 border border-green-500/15 p-4 space-y-2">
                  <p className="text-sm font-medium text-green-300">📋 Pasos para configurar en Evolution API:</p>
                  <ol className="text-sm text-[var(--text-secondary)] space-y-1 list-decimal list-inside">
                    <li>Accedé al panel de tu Evolution API</li>
                    <li>Seleccioná la instancia <code className="text-emerald-400">{activeConn.evolutionInstanceName}</code></li>
                    <li>Andá a <strong className="text-white">Configuraciones → Webhook</strong></li>
                    <li>Pegá la URL de arriba en el campo de Webhook</li>
                    <li>Activá el evento <code className="text-emerald-400">messages.upsert</code></li>
                    <li>Guardá la configuración</li>
                  </ol>
                </div>
              )}

              {activeConn.providerType === 'META_OFFICIAL' && (
                <div className="rounded-xl bg-blue-500/5 border border-blue-500/15 p-4 space-y-2">
                  <p className="text-sm font-medium text-blue-300">📋 Pasos para configurar en Meta:</p>
                  <ol className="text-sm text-[var(--text-secondary)] space-y-1 list-decimal list-inside">
                    <li>Andá a <strong className="text-white">Meta for Developers → Tu App → WhatsApp → Configuración</strong></li>
                    <li>En "Webhook", pegá la URL de arriba</li>
                    <li>Usá el Verify Token: <code className="text-blue-400">{activeConn.metaVerifyToken || '(no configurado)'}</code></li>
                    <li>Suscribite al campo <code className="text-blue-400">messages</code></li>
                  </ol>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ TEST SEND ═══ */}
        {activeConn && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
            <h3 className="text-lg font-semibold text-white mb-4">🧪 Enviar mensaje de prueba</h3>
            <form onSubmit={handleTestSend} className="flex flex-col sm:flex-row gap-3">
              <input value={testTo} onChange={(e) => setTestTo(e.target.value)}
                placeholder="Número destino (+595...)" className="input-field flex-1" required />
              <input value={testText} onChange={(e) => setTestText(e.target.value)}
                placeholder="Mensaje" className="input-field flex-[2]" required />
              <button type="submit" disabled={testing}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg-hover)] px-5 py-3 text-sm font-medium text-white hover:bg-violet-600/20 hover:border-violet-500/30 disabled:opacity-60 transition-all whitespace-nowrap">
                {testing ? '⏳ Enviando...' : '📤 Enviar'}
              </button>
            </form>
          </div>
        )}

        {/* ═══ ALL CONNECTIONS TABLE ═══ */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Todas las conexiones</h3>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full" />
            </div>
          ) : connections.length === 0 ? (
            <p className="text-center text-[var(--text-muted)] py-8">No hay conexiones. Creá una nueva arriba.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-[var(--text-muted)]">
                    <th className="pb-3 pr-4 font-medium">Nombre</th>
                    <th className="pb-3 pr-4 font-medium">Provider</th>
                    <th className="pb-3 pr-4 font-medium">Instancia</th>
                    <th className="pb-3 pr-4 font-medium">Número</th>
                    <th className="pb-3 pr-4 font-medium">Estado</th>
                    <th className="pb-3 font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {connections.map((conn) => (
                    <tr key={conn.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors">
                      <td className="py-3.5 pr-4 text-white font-medium">{conn.displayName || '—'}</td>
                      <td className="py-3.5 pr-4 text-[var(--text-secondary)]">
                        {conn.providerType === 'META_OFFICIAL' ? '🔵 Meta' : '🟢 Evolution'}
                        {conn.evolutionMode ? <span className="text-xs text-[var(--text-muted)] ml-1">({conn.evolutionMode})</span> : ''}
                      </td>
                      <td className="py-3.5 pr-4 text-[var(--text-secondary)] font-mono text-xs">
                        {conn.evolutionInstanceName || conn.metaPhoneNumberId || '—'}
                      </td>
                      <td className="py-3.5 pr-4 text-[var(--text-secondary)]">{conn.phoneNumber || '—'}</td>
                      <td className="py-3.5 pr-4">
                        {conn.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-2.5 py-1 text-xs font-medium text-green-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-400" /> Activa
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-500/20 px-2.5 py-1 text-xs font-medium text-gray-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" /> Inactiva
                          </span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <div className="flex gap-2">
                          <button onClick={() => openEdit(conn)}
                            className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-blue-300 hover:bg-blue-500/10 hover:border-blue-500/30 transition-all">
                            ✏️ Editar
                          </button>
                          {!conn.isActive && (
                            <button onClick={() => handleActivate(conn.id)}
                              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-violet-300 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all">
                              ⚡ Activar
                            </button>
                          )}
                          {deletingId === conn.id ? (
                            <div className="flex gap-1 items-center">
                              <button onClick={() => handleDelete(conn.id)}
                                className="rounded-lg px-3 py-1.5 text-xs bg-red-600 text-white font-medium animate-pulse">Sí</button>
                              <button onClick={() => setDeletingId(null)}
                                className="rounded-lg px-3 py-1.5 text-xs bg-gray-600/30 text-gray-300">No</button>
                            </div>
                          ) : (
                            <button onClick={() => setDeletingId(conn.id)}
                              className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10 transition-all">
                              🗑 Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        :global(.input-field) {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--border);
          background: var(--bg-primary);
          padding: 0.75rem 1rem;
          color: white;
          font-size: 0.875rem;
          transition: border-color 0.2s;
        }
        :global(.input-field:focus) {
          outline: none;
          border-color: var(--accent);
        }
        :global(.input-field::placeholder) {
          color: var(--text-muted);
        }
      `}</style>
    </DashboardLayout>
  );
}
