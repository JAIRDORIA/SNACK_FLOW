import React, { useState, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, X,
  Search, DollarSign, Layers, AlertTriangle, PackageOpen
} from 'lucide-react';
import api from '../api/axios';

const FORM_INICIAL = { nombre: '', descripcion: '', precio: '' };

export default function CombosManager() {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState(FORM_INICIAL);
  const [editingId, setEditingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteNombre, setDeleteNombre] = useState('');

  useEffect(() => { loadCombos(); }, []);

  const loadCombos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/combos/');
       setCombos(res.data.items || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los combos');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nombre || !formData.precio) {
      alert('Nombre y precio son obligatorios');
      return;
    }
    try {
      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio: Number(formData.precio),
      };
      if (editingId) {
        await api.put(`/combos/${editingId}`, payload);
      } else {
        await api.post('/combos', payload);
      }
      setFormData(FORM_INICIAL);
      setEditingId(null);
      loadCombos();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || 'Error al guardar el combo';
      alert(msg);
    }
  };

  const handleEdit = (combo) => {
    setEditingId(combo.id);
    setFormData({
      nombre: combo.nombre || '',
      descripcion: combo.descripcion || '',
      precio: combo.precio || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/combos/${deleteId}`);
      setDeleteId(null);
      setDeleteNombre('');
      loadCombos();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar el combo');
    }
  };

  const filteredCombos = combos.filter(
    (c) =>
      c.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCombos = combos.length;
  const precioPromedio = totalCombos > 0
    ? Math.round(combos.reduce((acc, c) => acc + Number(c.precio || 0), 0) / totalCombos)
    : 0;
  const valorTotal = combos.reduce((acc, c) => acc + Number(c.precio || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Cargando combos...</p>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '32px' }} className="flex-1 bg-gray-50">

      {/* HEADER */}
      <div style={{ marginBottom: '24px' }} className="flex items-center justify-between">
        <div>
          <p style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#6366f1', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
            módulo operativo
          </p>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#000000', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Gestión de Combos
          </h1>
        </div>
        <button
          style={{ padding: '8px 16px' }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-500/30 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Nuevo Combo</span>
        </button>
      </div>

      {/* KPI CARDS */}
      <div style={{ marginBottom: '32px' }} className="grid grid-cols-2 lg:grid-cols-3 gap-4">

        <div
          className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4"
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
          style={{ transition: 'all 0.2s' }}
        >
          <div style={{ margin: '12px 0 12px 14px' }} className="bg-[#13152280] ring-2 ring-indigo-500/30 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
            <Layers size={15} className="text-indigo-300" />
          </div>
          <div>
            <p style={{ fontSize: '18px', fontWeight: 800, color: 'white', lineHeight: 1 }}>{totalCombos}</p>
            <p style={{ marginTop: '3px', fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Combos activos</p>
          </div>
        </div>

        <div
          className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4"
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
          style={{ transition: 'all 0.2s' }}
        >
          <div style={{ margin: '12px 0 12px 14px' }} className="bg-[#13152280] ring-2 ring-cyan-500/30 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
            <PackageOpen size={15} className="text-cyan-300" />
          </div>
          <div>
            <p style={{ fontSize: '18px', fontWeight: 800, color: 'white', lineHeight: 1 }}>${precioPromedio.toLocaleString('es-CO')}</p>
            <p style={{ marginTop: '3px', fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Precio promedio</p>
          </div>
        </div>

        <div
          className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4"
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
          style={{ transition: 'all 0.2s' }}
        >
          <div style={{ margin: '12px 0 12px 14px' }} className="bg-[#13152280] ring-2 ring-emerald-500/30 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
            <DollarSign size={15} className="text-emerald-300" />
          </div>
          <div>
            <p style={{ fontSize: '17px', fontWeight: 800, color: 'white', lineHeight: 1 }}>${valorTotal.toLocaleString('es-CO')}</p>
            <p style={{ marginTop: '3px', fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Valor total</p>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '20px' }} className="bg-red-100 border border-red-200 text-red-700 rounded-xl p-3 flex items-center gap-2 text-sm">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">

        {/* FORMULARIO */}
        <div style={{ padding: '24px' }} className="bg-white border border-slate-200 rounded-2xl shadow-sm h-fit sticky top-6">
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '20px' }}>
            {editingId ? 'Editar Combo' : 'Registrar Combo'}
          </h3>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Nombre
              </label>
              <input
                type="text" name="nombre"
                placeholder="Nombre del combo"
                value={formData.nombre} onChange={handleChange} required
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Descripción
              </label>
              <textarea
                name="descripcion"
                placeholder="Descripción del combo"
                value={formData.descripcion} onChange={handleChange} rows="3"
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Precio
              </label>
              <input
                type="number" name="precio"
                placeholder="$ 0"
                value={formData.precio} onChange={handleChange} required
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <button
                type="submit"
                style={{ flex: 1, background: 'linear-gradient(to right, #4f46e5, #7c3aed)', color: 'white', padding: '11px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' }}
              >
                {editingId ? 'Actualizar' : 'Guardar Combo'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => { setEditingId(null); setFormData(FORM_INICIAL); }}
                  style={{ background: '#f1f5f9', border: 'none', padding: '11px 16px', borderRadius: '10px', fontWeight: 500, fontSize: '14px', cursor: 'pointer', color: '#475569' }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* TABLA */}
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ position: 'relative', maxWidth: '360px' }}>
              <input
                type="text" placeholder="Buscar combo..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 16px 10px 40px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
              />
              <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {[
                    { label: 'Combo', align: 'left' },
                    { label: 'Descripción', align: 'left' },
                    { label: 'Precio', align: 'right' },
                    { label: 'Acciones', align: 'center' },
                  ].map(h => (
                    <th key={h.label} style={{ textAlign: h.align, padding: '10px 16px', fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {h.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCombos.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: '14px' }}>
                      No hay combos registrados
                    </td>
                  </tr>
                ) : (
                  filteredCombos.map((combo) => (
                    <tr
                      key={combo.id}
                      style={{ borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'white'}
                    >
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#334155', fontSize: '14px' }}>
                        {combo.nombre}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '14px', maxWidth: '220px' }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {combo.descripcion || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#334155', fontSize: '14px' }}>
                        ${Number(combo.precio).toLocaleString('es-CO')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                          <button
                            onClick={() => handleEdit(combo)}
                            style={{ width: '34px', height: '34px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <Pencil size={15} color="#4f46e5" />
                          </button>
                          <button
                            onClick={() => { setDeleteId(combo.id); setDeleteNombre(combo.nombre); }}
                            style={{ width: '34px', height: '34px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <Trash2 size={15} color="#ef4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PIE TABLA */}
          {filteredCombos.length > 0 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Mostrando <strong style={{ color: '#334155' }}>{filteredCombos.length}</strong> de{' '}
                <strong style={{ color: '#334155' }}>{totalCombos}</strong> combos
              </span>
            </div>
          )}
        </div>
      </div>

      {/* MODAL ELIMINAR */}
      {deleteId && (
        <div style={{ padding: '16px' }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div style={{ width: '100%', maxWidth: '400px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', padding: '32px', textAlign: 'center', background: 'white' }}>
            <div style={{ width: '56px', height: '56px', background: '#fef2f2', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertTriangle size={28} color="#ef4444" />
            </div>
            <p style={{ fontWeight: 700, fontSize: '18px', color: '#1e293b', marginBottom: '8px' }}>Eliminar Combo</p>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
              ¿Seguro que deseas eliminar{' '}
              <strong style={{ color: '#4f46e5' }}>{deleteNombre}</strong>?{' '}
              Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => { setDeleteId(null); setDeleteNombre(''); }}
                style={{ flex: 1, background: '#f1f5f9', border: 'none', padding: '11px', borderRadius: '10px', fontWeight: 500, fontSize: '14px', cursor: 'pointer', color: '#475569' }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '11px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
