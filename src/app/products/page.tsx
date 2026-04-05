'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import api from '@/lib/api';
interface Product { id: string; name: string; description: string|null; price: number; isActive: boolean; categoryId: string; category?: {name:string}; }
interface Category { id: string; name: string; }
const fmt = (n:number) => new Intl.NumberFormat('es-PY').format(n);
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [form, setForm] = useState({name:'',description:'',price:0,categoryId:'',isActive:true});
  const fetch = async () => { try { const [p,c] = await Promise.all([api.get('/products'),api.get('/categories')]); setProducts(p.data); setCategories(c.data); } catch(e){console.error(e);} finally{setLoading(false);} };
  useEffect(() => { fetch(); }, []);
  const submit = async (e: React.FormEvent) => { e.preventDefault(); try { const d={...form,price:Number(form.price)}; if(editingId) await api.patch(`/products/${editingId}`,d); else await api.post('/products',d); setForm({name:'',description:'',price:0,categoryId:'',isActive:true}); setShowForm(false); setEditingId(null); fetch(); } catch(e){console.error(e);} };
  const edit = (p:Product) => { setForm({name:p.name,description:p.description||'',price:p.price,categoryId:p.categoryId,isActive:p.isActive}); setEditingId(p.id); setShowForm(true); };
  const del = async (id:string) => { if(!confirm('¿Eliminar?')) return; try{await api.delete(`/products/${id}`); fetch();}catch(e){console.error(e);} };
  const toggle = async (p:Product) => { try{await api.patch(`/products/${p.id}`,{isActive:!p.isActive}); fetch();}catch(e){console.error(e);} };
  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">🍔 Productos</h2>
          <button onClick={()=>{setShowForm(!showForm);setEditingId(null);setForm({name:'',description:'',price:0,categoryId:'',isActive:true});}} className="px-4 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-all">{showForm?'✕ Cerrar':'+ Nuevo'}</button>
        </div>
        {showForm&&<form onSubmit={submit} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4"><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div><label className="block text-xs text-[var(--text-muted)] mb-1">Nombre *</label><input type="text" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500"/></div>
          <div><label className="block text-xs text-[var(--text-muted)] mb-1">Categoría *</label><select required value={form.categoryId} onChange={e=>setForm({...form,categoryId:e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500"><option value="">Seleccionar...</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div><label className="block text-xs text-[var(--text-muted)] mb-1">Precio (₲) *</label><input type="number" required value={form.price} onChange={e=>setForm({...form,price:parseInt(e.target.value)||0})} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500"/></div>
          <div><label className="block text-xs text-[var(--text-muted)] mb-1">Descripción</label><input type="text" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500"/></div>
        </div><button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-all">{editingId?'💾 Guardar':'+ Crear'}</button></form>}
        {loading?<div className="flex items-center justify-center h-40"><div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full"/></div>:
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden"><table className="w-full text-sm"><thead><tr className="border-b border-[var(--border)] text-[var(--text-muted)]"><th className="text-left p-4 font-medium">Producto</th><th className="text-left p-4 font-medium">Categoría</th><th className="text-left p-4 font-medium">Precio</th><th className="text-left p-4 font-medium">Estado</th><th className="text-left p-4 font-medium">Acciones</th></tr></thead><tbody>
          {products.map(p=><tr key={p.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)]"><td className="p-4"><div className="font-medium">{p.name}</div>{p.description&&<div className="text-xs text-[var(--text-muted)]">{p.description}</div>}</td><td className="p-4 text-[var(--text-secondary)]">{p.category?.name||'—'}</td><td className="p-4 font-bold text-emerald-400">₲{fmt(p.price)}</td><td className="p-4"><button onClick={()=>toggle(p)} className={`px-2 py-1 rounded-lg text-xs font-medium ${p.isActive?'bg-emerald-500/20 text-emerald-300':'bg-red-500/20 text-red-300'}`}>{p.isActive?'✅ Activo':'❌ Inactivo'}</button></td><td className="p-4"><div className="flex gap-2"><button onClick={()=>edit(p)} className="px-2 py-1 rounded-lg text-xs bg-blue-600/20 text-blue-300">✏️</button><button onClick={()=>del(p.id)} className="px-2 py-1 rounded-lg text-xs bg-red-600/20 text-red-300">🗑️</button></div></td></tr>)}
          {products.length===0&&<tr><td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">Sin productos 🍔</td></tr>}
        </tbody></table></div>}
      </div>
    </DashboardLayout>
  );
}
