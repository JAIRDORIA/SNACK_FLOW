import React, { useState, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, X,
  Search, DollarSign, Layers, AlertTriangle,
  PackageOpen
} from 'lucide-react';
import api from '../api/axios';

const FORM_INICIAL = { nombre: '', precio_frito: '', precio_congelado: '' };

export default function CombosManager() {
  const [combos, setCombos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState(FORM_INICIAL);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [deleteNombre, setDeleteNombre] = useState('');
  const [buscarProducto, setBuscarProducto] = useState('');
  const [showProductoPicker, setShowProductoPicker] = useState(false);

  useEffect(() => {
    loadCombos();
    loadProductos();
  }, []);

  const loadCombos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/combos/', { params: { page: 1, per_page: 15 } });
      const data = res.data;
      setCombos(Array.isArray(data) ? data : data.datos || data.items || data.combos || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los combos');
    } finally {
      setLoading(false);
    }
  };

  const loadProductos = async () => {
    try {
      const res = await api.get('/productos/', { params: { pagina: 1, limite: 100 } });
      const data = res.data;
      setProductos(Array.isArray(data) ? data : data.datos || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const agregarProducto = (producto) => {
    const existe = productosSeleccionados.find(p => p.producto_id === producto.id);
    if (existe) return;
    setProductosSeleccionados([
      ...productosSeleccionados,
      { producto_id: producto.id, nombre: producto.nombre, cantidad_unidades: 1 }
    ]);
    setBuscarProducto('');
    setShowProductoPicker(false);
  };

  const actualizarCantidad = (producto_id, cantidad) => {
    setProductosSeleccionados(prev =>
      prev.map(p => p.producto_id === producto_id
        ? { ...p, cantidad_unidades: Number(cantidad) }
        : p
      )
    );
  };

  const quitarProducto = (producto_id) => {
    setProductosSeleccionados(prev => prev.filter(p => p.producto_id !== producto_id));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (productosSeleccionados.length === 0) {
      alert('Debes agregar al menos un producto al combo');
      return;
    }
    if (productosSeleccionados.some(p => p.cantidad_unidades < 1)) {
      alert('La cantidad de unidades debe ser mayor a 0');
      return;
    }
    try {
      const payload = {
        nombre: formData.nombre,

        precio_frito: Number(formData.precio_frito),
        precio_congelado: Number(formData.precio_congelado),
        productos: productosSeleccionados.map(p => ({
          producto_id: p.producto_id,
          cantidad_unidades: p.cantidad_unidades,
        })),
      };
      if (editingId) {
        await api.put(`/combos/${editingId}`, payload);
      } else {
        await api.post('/combos/', payload);
      }
      setFormData(FORM_INICIAL);
      setProductosSeleccionados([]);
      setEditingId(null);
      setShowForm(false);
      loadCombos();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.response?.data?.mensaje || 'Error al guardar el combo';
      alert(msg);
    }
  };

  const handleEdit = (combo) => {
    setEditingId(combo.id);
    setFormData({
      nombre: combo.nombre || '',
      precio_frito: combo.precio_frito || '',
      precio_congelado: combo.precio_congelado
    });
    if (combo.productos && Array.isArray(combo.productos)) {
      setProductosSeleccionados(combo.productos.map(p => ({
        producto_id: p.producto_id,
        nombre: p.nombre_producto || p.nombre || '',
        cantidad_unidades: p.cantidad_unidades,
      })));
    } else {
      setProductosSeleccionados([]);
    }
    setShowForm(true);
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

  const handleCancelar = () => {
    setEditingId(null);
    setFormData(FORM_INICIAL);
    setProductosSeleccionados([]);
    setShowForm(false);
  };

  const filteredCombos = combos.filter(
    (c) => c.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const productosFiltrados = productos.filter(p =>
    p.nombre?.toLowerCase().includes(buscarProducto.toLowerCase()) &&
    !productosSeleccionados.find(s => s.producto_id === p.id)
  );

  const totalCombos = combos.length;
  const precioPromedio = totalCombos > 0
    ? Math.round(combos.reduce((acc, c) => acc + Number(c.precio_frito || 0), 0) / totalCombos)
    : 0;
  const valorTotal = combos.reduce((acc, c) => acc + Number(c.precio_frito || 0), 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">Cargando combos...</p>
      </div>
    </div>
  );

  return (
    <div style={{ padding: "16px" }} className="flex-1 bg-gray-50 p-4 sm:p-6 lg:p-8">

      {/* HEADER */}
      <div style={{ marginBottom: "24px" }} className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <p style={{ fontSize: '11px', letterSpacing: '0.2em', color: '#6366f1', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>
            módulo operativo
          </p>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#000000', margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Gestión de Combos
          </h1>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setFormData(FORM_INICIAL); setProductosSeleccionados([]); }}
          style={{ padding: '8px 16px' }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-500/30 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Nuevo Combo</span>
        </button>
      </div>

      {/* KPI CARDS */}
      <div style={{ marginBottom: '32px' }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4"
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
          style={{ transition: 'all 0.2s', padding: "10px" }}>
          <div style={{ margin: '12px 0 12px 14px' }} className="bg-[#13152280] ring-2 ring-indigo-500/30 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
            <Layers size={18} className="text-indigo-300" />
          </div>
          <div>
            <p style={{ fontSize: '24px', fontWeight: 800, color: 'white', lineHeight: 1 }}>{totalCombos}</p>
            <p style={{ marginTop: '3px', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Combos activos</p>
          </div>
        </div>

        <div className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4"
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
          style={{ transition: 'all 0.2s' }}>
          <div style={{ margin: '12px 0 12px 14px' }} className="bg-[#13152280] ring-2 ring-cyan-500/30 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
            <PackageOpen size={18} className="text-cyan-300" />
          </div>
          <div>
            <p style={{ fontSize: '23px', fontWeight: 800, color: 'white', lineHeight: 1 }}>${precioPromedio.toLocaleString('es-CO')}</p>
            <p style={{ marginTop: '3px', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Precio promedio</p>
          </div>
        </div>

        <div className="bg-[#1B1D2E] rounded-2xl flex items-center gap-4"
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none' }}
          style={{ transition: 'all 0.2s' }}>
          <div style={{ margin: '12px 0 12px 14px' }} className="bg-[#13152280] ring-2 ring-emerald-500/30 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">
            <DollarSign size={18} className="text-emerald-300" />
          </div>
          <div>
            <p style={{ fontSize: '23px', fontWeight: 800, color: 'white', lineHeight: 1 }}>${valorTotal.toLocaleString('es-CO')}</p>
            <p style={{ marginTop: '3px', fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Valor total</p>
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
                {editingId ? 'Editar Combo' : 'Registrar Combo'}
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
                <input
                  type="text"
                  name="nombre"
                  placeholder="Ej: Combo Tradicional"
                  value={formData.nombre}
                  onChange={(e) => {
                    const valor = e.target.value.slice(0, 40)  // Máximo 40 caracteres
                    handleChange({ target: { name: 'nombre', value: valor } })
                  }}
                  required
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Productos del combo *
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Buscar y agregar producto..."
                      value={buscarProducto}
                      onChange={e => { setBuscarProducto(e.target.value); setShowProductoPicker(true); }}
                      onFocus={() => setShowProductoPicker(true)}
                      style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px 10px 38px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    />
                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  </div>
                  {showProductoPicker && productosFiltrados.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: '200px', overflowY: 'auto', marginTop: '4px' }}>
                      {productosFiltrados.map(p => (
                        <div key={p.id} onClick={() => agregarProducto(p)}
                          style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', borderBottom: '1px solid #f1f5f9' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          <span style={{ fontWeight: 500, color: '#334155' }}>{p.nombre}</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>{p.unidades_por_bandeja} und/bandeja</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {productosSeleccionados.length > 0 && (
                  <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {productosSeleccionados.map(p => (
                      <div key={p.producto_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '8px 12px' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155', margin: 0 }}>{p.nombre}</p>
                          <p style={{ fontSize: '11px', color: '#94a3b8', margin: 0 }}>unidades en el combo</p>
                        </div>
                        <input type="number" min="1" value={p.cantidad_unidades}
                          onChange={e => actualizarCantidad(p.producto_id, e.target.value)}
                          maxLength={5}
                          style={{ width: '64px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 8px', fontSize: '14px', fontWeight: 600, textAlign: 'center', outline: 'none', color: '#4f46e5' }}
                          onFocus={e => e.target.style.borderColor = '#6366f1'}
                          onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                        <button type="button" onClick={() => quitarProducto(p.producto_id)}
                          style={{ width: '28px', height: '28px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <X size={14} color="#ef4444" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {productosSeleccionados.length === 0 && (
                  <div style={{ marginTop: '8px', padding: '12px', background: '#fafafa', border: '1px dashed #e2e8f0', borderRadius: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Busca y agrega productos al combo</p>
                  </div>
                )}
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Precio Frito *</label>
                <input type="number" name="precio_frito" placeholder="$ 0"
                  value={formData.precio_frito} onChange={handleChange} required min="0" step="0.01"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
              </div>

              {/* Precio Congelado */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Precio Congelado *</label>
                <input type="number" name="precio_congelado" placeholder="$ 0"
                  value={formData.precio_congelado} onChange={handleChange} required min="0" step="0.01"
                  style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 14px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                <button type="submit"
                  style={{ flex: 1, background: 'linear-gradient(to right, #4f46e5, #7c3aed)', color: 'white', padding: '11px', borderRadius: '10px', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' }}>
                  {editingId ? 'Actualizar' : 'Guardar Combo'}
                </button>
                <button type="button" onClick={handleCancelar}
                  style={{ background: '#f1f5f9', border: 'none', padding: '11px 16px', borderRadius: '10px', fontWeight: 500, fontSize: '14px', cursor: 'pointer', color: '#475569' }}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className={showForm ? 'xl:col-span-2' : 'xl:col-span-3'}
          style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

          <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ position: 'relative', maxWidth: '360px' }}>
              <input type="text" placeholder="Buscar combo..." maxLength={50}
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 16px 10px 40px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                onFocus={e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)' }}
                onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }} />
              <Search size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '460px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {[
                    { label: 'Combo', align: 'left' },
                    { label: 'Productos', align: 'left' },
                    { label: 'Precio_frito', align: 'right' },
                    { label: 'Precio_congelado', align: 'right' },
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
                ) : filteredCombos.map((combo) => (
                  <tr key={combo.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#334155', fontSize: '14px', whiteSpace: 'nowrap' }}>{combo.nombre}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#334155' }}>
                      {combo.productos && combo.productos.length > 0 ? (
                        <span>{combo.productos.map(p => p.nombre).join(', ')}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#334155', fontSize: '14px', whiteSpace: 'nowrap' }}>
                      ${Number(combo.precio_frito || 0).toLocaleString('es-CO')}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#334155', fontSize: '14px', whiteSpace: 'nowrap' }}>
                      ${Number(combo.precio_congelado || 0).toLocaleString('es-CO')}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                        <button onClick={() => handleEdit(combo)}
                          style={{ width: '34px', height: '34px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <Pencil size={15} color="#4f46e5" />
                        </button>
                        <button onClick={() => { setDeleteId(combo.id); setDeleteNombre(combo.nombre); }}
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

      {deleteId && (
        <div style={{ padding: '16px' }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div style={{ width: '100%', maxWidth: '400px', borderRadius: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)', padding: '32px', textAlign: 'center', background: 'white' }}>
            <div style={{ width: '56px', height: '56px', background: '#fef2f2', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <AlertTriangle size={28} color="#ef4444" />
            </div>
            <p style={{ fontWeight: 700, fontSize: '18px', color: '#1e293b', marginBottom: '8px' }}>Eliminar Combo</p>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
              Seguro que deseas eliminar <strong style={{ color: '#4f46e5' }}>{deleteNombre}</strong>? Esta accion no se puede deshacer.
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
