'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import api from '@/lib/api';
interface Zone { id: string; name: string; fee: number; minOrderAmount: number; estimatedMinutes: number; isActive: boolean; }
const fmt = (n:number|null|undefined) => new Intl.NumberFormat('es-PY').format(Number(n) || 0);
export default function DeliveryZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [form, setForm] = useState({name:'',fee:0,minOrderAmount:0,estimatedMinutes:30});
  const fetch = async () => { try{const r=await api.get('/delivery-zones');setZones(r.data);}catch(e){console.error(e);}finally{setLoading(false);} };
  useEffect(()=>{fetch();},[]);
  const submit = async (e:React.FormEvent) => { e.preventDefault(); try{const d={...form,fee:Number(form.fee),minOrderAmount:Number(form.minOrderAmount),estimatedMinutes:Number(form.estimatedMinutes)}; if(editingId) await api.patch(`/delivery-zones/${editingId}`,d); else await api.post('/delivery-zones',d); setForm({name:'',fee:0,minOrderAmount:0,estimatedMinutes:30}); setShowForm(false); setEditingId(null); fetch();}catch(e){console.error(e);} };
  const edit = (z:Zone) => { setForm({name:z.name,fee:z.fee,minOrderAmount:z.minOrderAmount,estimatedMinutes:z.estimatedMinutes}); setEditingId(z.id); setShowForm(true); };
  const del = async (id:string) => { if(!confirm('¿Eliminar?')) return; try{await api.delete(`/delivery-zones/${id}`); fetch();}catch(e){console.error(e);} };
  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">🛵 Zonas de Delivery</h2>
          <button onClick={()=>{setShowForm(!showForm);setEditingId(null);setForm({name:'',fee:0,minOrderAmount:0,estimatedMinutes:30});}} className="px-4 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-all">{showForm?'✕ Cerrar':'+ Nueva'}</button>
        </div>
        {showForm&&<form onSubmit={submit} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4"><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div><label className="block text-xs text-[var(--text-muted)] mb-1">Nombre *</label><input type="text" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500"/></div>
          <div><label className="block text-xs text-[var(--text-muted)] mb-1">Tarifa (₲)</label><input type="number" value={form.fee} onChange={e=>setForm({...form,fee:parseInt(e.target.value)||0})} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500"/></div>
          <div><label className="block text-xs text-[var(--text-muted)] mb-1">Pedido Mínimo (₲)</label><input type="number" value={form.minOrderAmount} onChange={e=>setForm({...form,minOrderAmount:parseInt(e.target.value)||0})} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500"/></div>
          <div><label className="block text-xs text-[var(--text-muted)] mb-1">Tiempo (min)</label><input type="number" value={form.estimatedMinutes} onChange={e=>setForm({...form,estimatedMinutes:parseInt(e.target.value)||0})} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500"/></div>
        </div><button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-all">{editingId?'💾 Guardar':'+ Crear'}</button></form>}
        {loading?<div className="flex items-center justify-center h-40"><div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full"/></div>:
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {zones.map(z=><div key={z.id} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 hover:border-violet-500/30 transition-all">
            <div className="flex items-center justify-between mb-3"><h3 className="font-bold">{z.name}</h3><span className={`px-2 py-0.5 rounded-lg text-xs ${z.isActive?'bg-emerald-500/20 text-emerald-300':'bg-red-500/20 text-red-300'}`}>{z.isActive?'Activa':'Inactiva'}</span></div>
            <div className="space-y-1 text-sm text-[var(--text-secondary)]"><p>💰 Tarifa: <span className="font-bold text-emerald-400">₲{fmt(z.fee)}</span></p><p>📦 Mín: ₲{fmt(z.minOrderAmount)}</p><p>⏱️ {z.estimatedMinutes} min</p></div>
            <div className="flex gap-2 mt-3"><button onClick={()=>edit(z)} className="px-3 py-1.5 rounded-lg text-xs bg-blue-600/20 text-blue-300">✏️ Editar</button><button onClick={()=>del(z.id)} className="px-3 py-1.5 rounded-lg text-xs bg-red-600/20 text-red-300">🗑️</button></div>
          </div>)}
          {zones.length===0&&<div className="col-span-full text-center py-12 text-[var(--text-muted)]">Sin zonas 🛵</div>}
        </div>}
      </div>
    </DashboardLayout>
  );
}
