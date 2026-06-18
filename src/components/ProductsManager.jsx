import React, { useState, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, X,
  Search, AlertTriangle,
  Package
} from 'lucide-react';
import api from '../api/axios';

const FORM_INICIAL = { nombre: '', descripcion: '', precio: '', unidades_por_bandeja: '' };

export default function ProductosManager() {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState(FORM_INICIAL);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteNombre, setDeleteNombre] = useState('');

  useEffect(() => {
    loadProductos();
  }, []);

  const loadProductos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/productos/', { params: { pagina: 1, limite: 100 } });
      const data = res.data;
      setProductos(Array.isArray(data) ? data : data.datos || data.items || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        precio_venta: Number(formData.precio),
        unidades_por_bandeja: Number(formData.unidades_por_bandeja),
      };
      if (editingId) {
        await api.put(`/productos/${editingId}`, payload);
      } else {
        await api.post('/productos/', payload);
      }
      setFormData(FORM_INICIAL);
      setEditingId(null);
      setShowForm(false);
      loadProductos();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.response?.data?.mensaje || 'Error al guardar el producto';
      alert(msg);
    }
  };

  const handleEdit = (producto) => {
    setEditingId(producto.id);
    setFormData({
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      precio: producto.precio_venta || '',
      unidades_por_bandeja: producto.unidades_por_bandeja || '',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/productos/${deleteId}`);
      setDeleteId(null);
      setDeleteNombre('');
      loadProductos();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar el producto');
    }
  };

  const handleCancelar = () => {
    setEditingId(null);
    setFormData(FORM_INICIAL);
    setShowForm(false);
  };

  const filteredProductos = productos.filter(
    (p) =>
      p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProductos = productos.length;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Cargando productos...</p>
      </div>
    </div>
  );

  return (
    <div style={{padding:"16px"}} className="flex-1 bg-gray-50 p-4 sm:p-6 lg:p-8">

      {/* HEADER */}
      <div style={{marginBottom:"24px"}} className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#6366f1', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
            módulo operativo
          </p>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#000000', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Gestión de Productos
          </h1>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setFormData(FORM_INICIAL); }}
          style={{ padding: '8px 16px' }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-500/30 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Nuevo Producto</span>
        </button>
      </div>

      {/* KPI CARD */}
      <div style={{ marginBottom: '32px' }}>
        <div
          className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4 w-full sm:w-auto sm:inline-flex"
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
          style={{ transition: 'all 0.2s', minWidth: '260px', maxWidth: '340px' }}
        >
          <div style={{ margin: '12px 0 12px 14px' }} className="bg-[#13152280] ring-2 ring-indigo-500/30 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
            <Package size={15} className="text-indigo-300" />
          </div>
          <div>
            <p style={{ fontSize: '18px', fontWeight: 800, color: 'white', lineHeight: 1 }}>{totalProductos}</p>
            <p style={{ marginTop: '3px', fontSize: '10px', color: 'rgba(255,255,255,0.5)' }}>Productos activos</p>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: '20px' }} className="bg-red-100 border border-red-200 text-red-700 rounded-xl p-3 flex items-center gap-2 text-sm">
          <AlertTriangle size={16} />{error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">

        {showForm && (
          <div style={{ padding: '24px' }} className="bg-white border border-slate-200 rounded-2xl shadow-sm h-fit xl:sticky top-6">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                {editingId ? 'Editar Producto' : 'Registrar Producto'}
              </h3>
              <button onClick={handleCancelar}
                style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <X size={16} color="#64748b" />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre *</label>
                <input type="text" name="nombre" placeholder="Ej: Empanada de pipián"
                  value={formData.nombre} onChange={handleChange} required
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descripción</label>
                <textarea name="descripcion" placeholder="Descripción opcional"
                  value={formData.descripcion} onChange={handleChange} rows="2"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Precio *</label>
                <input type="number" name="precio" placeholder="$ 0"
                  value={formData.precio} onChange={handleChange} required min="0"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unidades por bandeja *</label>
                <input type="number" name="unidades_por_bandeja" placeholder="Ej: 30"
                  value={formData.unidades_por_bandeja} onChange={handleChange} required min="1"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button type="submit"
                  style={{ flex: 1, background: 'linear-gradient(to right, #4f46e5, #7c3aed)', color: 'white', padding: '11px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' }}>
                  {editingId ? 'Actualizar' : 'Guardar Producto'}
                </button>
                <button type="button" onClick={handleCancelar}
                  style={{ background: '#f1f5f9', border: 'none', padding: '11px 16px', borderRadius: '10px', fontWeight: 500, fontSize: '14px', cursor: 'pointer', color: '#475569' }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TABLA */}
        <div className={showForm ? 'xl:col-span-2' : 'xl:col-span-3'}
          style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ position: 'relative', maxWidth: '360px' }}>
              <input type="text" placeholder="Buscar producto..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 16px 10px 40px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
              <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '480px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {[
                    { label: 'Producto', align: 'left' },
                    { label: 'Descripción', align: 'left' },
                    { label: 'Und/Bandeja', align: 'center' },
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
                {filteredProductos.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '48px', color: '#94a3b8', fontSize: '14px' }}>
                      No hay productos registrados
                    </td>
                  </tr>
                ) : filteredProductos.map((producto) => (
                  <tr key={producto.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#334155', fontSize: '14px' }}>
                      {producto.nombre}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '14px', maxWidth: '180px' }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {producto.descripcion || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <span style={{ background: '#eef2ff', color: '#4f46e5', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700 }}>
                        {producto.unidades_por_bandeja ?? '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#334155', fontSize: '14px' }}>
                      ${Number(producto.precio_venta || 0).toLocaleString('es-CO')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        <button onClick={() => handleEdit(producto)}
                          style={{ width: '34px', height: '34px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <Pencil size={15} color="#4f46e5" />
                        </button>
                        <button onClick={() => { setDeleteId(producto.id); setDeleteNombre(producto.nombre); }}
                          style={{ width: '34px', height: '34px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <Trash2 size={15} color="#ef4444" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProductos.length > 0 && (
            <div style={{ padding: '12px 20px', borderTop: '1px solid #f1f5f9', background: '#f8fafc' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>
                Mostrando <strong style={{ color: '#334155' }}>{filteredProductos.length}</strong> de{' '}
                <strong style={{ color: '#334155' }}>{totalProductos}</strong> productos
              </span>
            </div>
          )}
        </div>
      </div>

      {deleteId && (
        <div style={{ padding: '16px' }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div style={{ width: '100%', maxWidth: '400px', borderRadius: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', padding: '32px', textAlign: 'center', background: 'white' }}>
            <div style={{ width: '56px', height: '56px', background: '#fef2f2', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertTriangle size={28} color="#ef4444" />
            </div>
            <p style={{ fontWeight: 700, fontSize: '18px', color: '#1e293b', marginBottom: '8px' }}>Eliminar Producto</p>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
              ¿Seguro que deseas eliminar <strong style={{ color: '#4f46e5' }}>{deleteNombre}</strong>? Esta acción no se puede deshacer.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => { setDeleteId(null); setDeleteNombre(''); }}
                style={{ flex: 1, background: '#f1f5f9', border: 'none', padding: '11px', borderRadius: '10px', fontWeight: 500, fontSize: '14px', cursor: 'pointer', color: '#475569' }}>
                Cancelar
              </button>
              <button onClick={handleDelete}
                style={{ flex: 1, background: '#ef4444', color: 'white', border: 'none', padding: '11px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}