'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { useAuth } from '@/lib/auth-context';
import api from '@/lib/api';
interface User { id: string; email: string; name: string; role: string; createdAt: string; }
const ROLES: Record<string, {label:string;color:string}> = { SUPER_ADMIN:{label:'👑 Super Admin',color:'bg-yellow-500/20 text-yellow-300'}, TENANT_ADMIN:{label:'🏢 Admin',color:'bg-violet-500/20 text-violet-300'}, MANAGER:{label:'👔 Manager',color:'bg-blue-500/20 text-blue-300'}, OPERATOR:{label:'🎧 Operador',color:'bg-green-500/20 text-green-300'} };
export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({email:'',name:'',password:'',role:'MANAGER'});
  const fetch = async () => { try{const r=await api.get('/users');setUsers(r.data);}catch(e){console.error(e);}finally{setLoading(false);} };
  useEffect(()=>{fetch();},[]);
  const submit = async (e:React.FormEvent) => { e.preventDefault(); try{await api.post('/users',form);setForm({email:'',name:'',password:'',role:'MANAGER'});setShowForm(false);fetch();}catch(e){console.error(e);} };
  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">👤 Usuarios</h2>
          <button onClick={()=>setShowForm(!showForm)} className="px-4 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-all">{showForm?'✕ Cerrar':'+ Nuevo'}</button>
        </div>
        {showForm&&<form onSubmit={submit} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4"><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div><label className="block text-xs text-[var(--text-muted)] mb-1">Nombre *</label><input type="text" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500"/></div>
          <div><label className="block text-xs text-[var(--text-muted)] mb-1">Email *</label><input type="email" required value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500"/></div>
          <div><label className="block text-xs text-[var(--text-muted)] mb-1">Contraseña *</label><input type="password" required value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500"/></div>
          <div><label className="block text-xs text-[var(--text-muted)] mb-1">Rol</label><select value={form.role} onChange={e=>setForm({...form,role:e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500"><option value="MANAGER">Manager</option><option value="OPERATOR">Operador</option><option value="TENANT_ADMIN">Admin</option></select></div>
        </div><button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-all">+ Crear</button></form>}
        {loading?<div className="flex items-center justify-center h-40"><div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full"/></div>:
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden"><table className="w-full text-sm"><thead><tr className="border-b border-[var(--border)] text-[var(--text-muted)]"><th className="text-left p-4 font-medium">Usuario</th><th className="text-left p-4 font-medium">Email</th><th className="text-left p-4 font-medium">Rol</th><th className="text-left p-4 font-medium">Registrado</th></tr></thead><tbody>
          {users.map(u=>{const r=ROLES[u.role]||{label:u.role,color:'bg-gray-500/20 text-gray-300'}; return <tr key={u.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)]"><td className="p-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-violet-600/30 flex items-center justify-center text-sm font-bold">{u.name?.[0]||'?'}</div><span className="font-medium">{u.name} {u.id===me?.id&&<span className="text-xs text-violet-400">(tú)</span>}</span></div></td><td className="p-4 text-[var(--text-secondary)]">{u.email}</td><td className="p-4"><span className={`px-2 py-1 rounded-lg text-xs font-medium ${r.color}`}>{r.label}</span></td><td className="p-4 text-xs text-[var(--text-muted)]">{new Date(u.createdAt).toLocaleDateString('es-PY')}</td></tr>;})}
          {users.length===0&&<tr><td colSpan={4} className="p-8 text-center text-[var(--text-muted)]">Sin usuarios</td></tr>}
        </tbody></table></div>}
      </div>
    </DashboardLayout>
  );
}
