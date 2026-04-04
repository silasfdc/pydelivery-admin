'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
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
  evolutionInstanceName?: string | null;
  evolutionMode?: EvolutionMode | null;
  createdAt: string;
}

const initialForm = {
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

export default function WhatsAppPage() {
  const [connections, setConnections] = useState<WhatsAppConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [testTo, setTestTo] = useState('');
  const [testText, setTestText] = useState('Hola, este es un mensaje de prueba desde PyDelivery 🚀');
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);

  async function loadConnections() {
    try {
      const res = await api.get('/whatsapp/connections');
      setConnections(res.data);
    } catch {
      setMessage({ text: 'Error al cargar conexiones', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadConnections(); }, []);

  function updateForm(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function showMsg(text: string, type: 'success' | 'error') {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/whatsapp/connections', form);
      setForm(initialForm);
      setShowForm(false);
      showMsg('✅ Conexión creada exitosamente', 'success');
      await loadConnections();
    } catch (err: any) {
      showMsg(err?.response?.data?.message || 'Error al crear conexión', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleActivate(id: string) {
    try {
      await api.patch(`/whatsapp/connections/${id}/activate`);
      showMsg('✅ Conexión activada', 'success');
      await loadConnections();
    } catch (err: any) {
      showMsg(err?.response?.data?.message || 'Error al activar', 'error');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Deseas eliminar esta conexión?')) return;
    try {
      await api.delete(`/whatsapp/connections/${id}`);
      showMsg('✅ Conexión eliminada', 'success');
      await loadConnections();
    } catch (err: any) {
      showMsg(err?.response?.data?.message || 'Error al eliminar', 'error');
    }
  }

  async function handleTestSend(e: React.FormEvent) {
    e.preventDefault();
    setTesting(true);
    try {
      await api.post('/whatsapp/send-test', { to: testTo, text: testText });
      showMsg('✅ Mensaje de prueba enviado', 'success');
    } catch (err: any) {
      showMsg(err?.response?.data?.message || 'Error al enviar', 'error');
    } finally {
      setTesting(false);
    }
  }

  const activeConnection = connections.find((c) => c.isActive);

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">💬 Conexiones WhatsApp</h2>
            <p className="text-[var(--text-muted)] mt-1">
              Configurá Meta Oficial o Evolution API. Solo 1 conexión activa por vez.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-violet-500 hover:to-purple-500 transition-all shadow-lg shadow-violet-500/20"
          >
            {showForm ? '✕ Cancelar' : '+ Nueva conexión'}
          </button>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`rounded-xl border px-4 py-3 text-sm ${
            message.type === 'success'
              ? 'border-green-500/30 bg-green-500/10 text-green-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Create Form */}
        {showForm && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 animate-in fade-in duration-200">
            <h3 className="text-lg font-semibold text-white mb-5">Nueva conexión</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              {/* Provider selector */}
              <div className="grid gap-3 sm:grid-cols-2">
                {(['EVOLUTION', 'META_OFFICIAL'] as ProviderType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateForm('providerType', type)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      form.providerType === type
                        ? 'border-violet-500 bg-violet-500/10'
                        : 'border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--text-muted)]'
                    }`}
                  >
                    <p className="font-semibold text-white">
                      {type === 'EVOLUTION' ? '🟢 Evolution API' : '🔵 Meta Oficial'}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {type === 'EVOLUTION' ? 'Baileys / Cloud API' : 'WhatsApp Business API'}
                    </p>
                  </button>
                ))}
              </div>

              {/* Common fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <input value={form.displayName} onChange={(e) => updateForm('displayName', e.target.value)}
                  placeholder="Nombre de la conexión" className="input-field" />
                <input value={form.phoneNumber} onChange={(e) => updateForm('phoneNumber', e.target.value)}
                  placeholder="Número WhatsApp (+595...)" className="input-field" />
              </div>

              {/* Meta fields */}
              {form.providerType === 'META_OFFICIAL' && (
                <div className="space-y-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                  <p className="text-sm font-medium text-blue-300">🔵 Configuración Meta</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input value={form.metaBusinessAccountId} onChange={(e) => updateForm('metaBusinessAccountId', e.target.value)}
                      placeholder="Business Account ID" className="input-field" />
                    <input value={form.metaPhoneNumberId} onChange={(e) => updateForm('metaPhoneNumberId', e.target.value)}
                      placeholder="Phone Number ID *" className="input-field" required />
                    <input value={form.metaVerifyToken} onChange={(e) => updateForm('metaVerifyToken', e.target.value)}
                      placeholder="Verify Token" className="input-field" />
                    <input value={form.webhookSecret} onChange={(e) => updateForm('webhookSecret', e.target.value)}
                      placeholder="Webhook Secret" className="input-field" />
                  </div>
                  <textarea value={form.metaAccessToken} onChange={(e) => updateForm('metaAccessToken', e.target.value)}
                    placeholder="Access Token *" className="input-field min-h-[90px] resize-none" required />
                </div>
              )}

              {/* Evolution fields */}
              {form.providerType === 'EVOLUTION' && (
                <div className="space-y-4 rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                  <p className="text-sm font-medium text-green-300">🟢 Configuración Evolution</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <input value={form.evolutionBaseUrl} onChange={(e) => updateForm('evolutionBaseUrl', e.target.value)}
                      placeholder="URL base (https://...) *" className="input-field" required />
                    <input value={form.evolutionInstanceName} onChange={(e) => updateForm('evolutionInstanceName', e.target.value)}
                      placeholder="Nombre de instancia *" className="input-field" required />
                    <select value={form.evolutionMode} onChange={(e) => updateForm('evolutionMode', e.target.value)}
                      className="input-field">
                      <option value="BAILEYS">BAILEYS</option>
                      <option value="CLOUD_API">CLOUD_API</option>
                    </select>
                    <input value={form.evolutionWebhookSecret} onChange={(e) => updateForm('evolutionWebhookSecret', e.target.value)}
                      placeholder="Webhook Secret" className="input-field" />
                  </div>
                  <textarea value={form.evolutionApiKey} onChange={(e) => updateForm('evolutionApiKey', e.target.value)}
                    placeholder="API Key *" className="input-field min-h-[90px] resize-none" required />
                </div>
              )}

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isActive}
                  onChange={(e) => updateForm('isActive', e.target.checked)}
                  className="w-4 h-4 accent-violet-500" />
                <span className="text-sm text-[var(--text-secondary)]">Activar al guardar (desactiva las demás)</span>
              </label>

              <button type="submit" disabled={saving}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 font-semibold text-white hover:from-violet-500 hover:to-purple-500 disabled:opacity-60 transition-all shadow-lg shadow-violet-500/20">
                {saving ? 'Guardando...' : 'Guardar conexión'}
              </button>
            </form>
          </div>
        )}

        {/* Active Connection Card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Conexión activa</h3>
          {activeConnection ? (
            <div className="rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 to-purple-500/10 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="font-semibold text-white text-lg">
                      {activeConnection.displayName || 'Sin nombre'}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {activeConnection.providerType === 'META_OFFICIAL' ? '🔵 Meta Oficial' : '🟢 Evolution API'}
                    {activeConnection.evolutionMode ? ` (${activeConnection.evolutionMode})` : ''}
                  </p>
                  <p className="text-sm text-[var(--text-muted)] mt-0.5">
                    📱 {activeConnection.phoneNumber || 'Sin número'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="inline-block rounded-full bg-green-500/20 px-3 py-1 text-xs font-medium text-green-300">
                    ● Activa
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[var(--text-muted)] text-sm">Ninguna conexión activa. Creá una arriba.</p>
          )}
        </div>

        {/* Test Send */}
        {activeConnection && (
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

        {/* Connections Table */}
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
                          {!conn.isActive && (
                            <button onClick={() => handleActivate(conn.id)}
                              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-violet-300 hover:bg-violet-500/10 hover:border-violet-500/30 transition-all">
                              ⚡ Activar
                            </button>
                          )}
                          <button onClick={() => handleDelete(conn.id)}
                            className="rounded-lg border border-red-500/30 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10 transition-all">
                            🗑 Eliminar
                          </button>
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
