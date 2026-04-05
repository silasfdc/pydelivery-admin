'use client';
import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import api from '@/lib/api';

interface Category { id: string; name: string; description: string | null; sortOrder: number; isActive: boolean; _count?: { products: number }; }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', sortOrder: 0 });
  const fetchCategories = async () => { try { const r = await api.get('/categories'); setCategories(r.data); } catch(e){console.error(e);} finally{setLoading(false);} };
  useEffect(() => { fetchCategories(); }, []);
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); try { if(editingId) await api.patch(`/categories/${editingId}`, form); else await api.post('/categories', form); setForm({name:'',description:'',sortOrder:0}); setShowForm(false); setEditingId(null); fetchCategories(); } catch(e){console.error(e);} };
  const handleEdit = (c: Category) => { setForm({name:c.name,description:c.description||'',sortOrder:c.sortOrder}); setEditingId(c.id); setShowForm(true); };
  const handleDelete = async (id: string) => { if(!confirm('¿Eliminar?')) return; try { await api.delete(`/categories/${id}`); fetchCategories(); } catch(e){console.error(e);} };
  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">📁 Categorías</h2>
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({name:'',description:'',sortOrder:0}); }} className="px-4 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-all">{showForm ? '✕ Cerrar' : '+ Nueva'}</button>
        </div>
        {showForm && (<form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div><label className="block text-xs text-[var(--text-muted)] mb-1">Nombre *</label><input type="text" required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500"/></div>
            <div><label className="block text-xs text-[var(--text-muted)] mb-1">Descripción</label><input type="text" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500"/></div>
            <div><label className="block text-xs text-[var(--text-muted)] mb-1">Orden</label><input type="number" value={form.sortOrder} onChange={e=>setForm({...form,sortOrder:parseInt(e.target.value)||0})} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-violet-500"/></div>
          </div>
          <button type="submit" className="px-6 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white transition-all">{editingId ? '💾 Guardar' : '+ Crear'}</button>
        </form>)}
        {loading ? <div className="flex items-center justify-center h-40"><div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full"/></div> : (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden"><table className="w-full text-sm"><thead><tr className="border-b border-[var(--border)] text-[var(--text-muted)]"><th className="text-left p-4 font-medium">Nombre</th><th className="text-left p-4 font-medium">Descripción</th><th className="text-left p-4 font-medium">Orden</th><th className="text-left p-4 font-medium">Acciones</th></tr></thead><tbody>
            {categories.map(c=><tr key={c.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)]"><td className="p-4 font-medium">{c.name}</td><td className="p-4 text-[var(--text-secondary)]">{c.description||'—'}</td><td className="p-4">{c.sortOrder}</td><td className="p-4"><div className="flex gap-2"><button onClick={()=>handleEdit(c)} className="px-2 py-1 rounded-lg text-xs bg-blue-600/20 text-blue-300 hover:bg-blue-600/30">✏️</button><button onClick={()=>handleDelete(c.id)} className="px-2 py-1 rounded-lg text-xs bg-red-600/20 text-red-300 hover:bg-red-600/30">🗑️</button></div></td></tr>)}
            {categories.length===0&&<tr><td colSpan={4} className="p-8 text-center text-[var(--text-muted)]">Sin categorías 📁</td></tr>}
          </tbody></table></div>
        )}
      </div>
    </DashboardLayout>
  );
}
