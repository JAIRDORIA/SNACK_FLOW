import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '@/api/axios'

const ACCENT = '#4f46e5'
const DARK   = '#0f1117'
const CARD   = '#1a1d2e'
const BORDER = 'rgba(255,255,255,0.07)'

const inputStyle = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)',
  border: '1.5px solid rgba(255,255,255,0.08)',
  borderRadius: '10px', padding: '13px 16px',
  color: 'white', fontSize: '14px', outline: 'none',
  transition: 'all 0.2s', fontFamily: 'inherit'
}

function Campo({ label, name, type = 'text', placeholder, value, onChange, extra }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        display: 'block', color: 'rgba(255,255,255,0.4)',
        fontSize: '11px', letterSpacing: '1.5px',
        textTransform: 'uppercase', marginBottom: '7px'
      }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <input
          type={type} name={name} value={value}
          onChange={onChange} placeholder={placeholder}
          autoComplete={type === 'password' ? 'current-password' : name}
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = ACCENT; e.target.style.background = 'rgba(79,70,229,0.08)' }}
          onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(255,255,255,0.05)' }}
        />
        {extra}
      </div>
    </div>
  )
}

function ErrorMsg({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: '8px', padding: '11px 14px', marginBottom: '16px',
      color: '#f87171', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
    }}>⚠ {msg}</div>
  )
}

function SuccessMsg({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
      borderRadius: '8px', padding: '11px 14px', marginBottom: '16px',
      color: '#34d399', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
    }}>✓ {msg}</div>
  )
}

function SubmitBtn({ loading, label }) {
  const [hover, setHover] = useState(false)
  return (
    <button type="submit" disabled={loading}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', border: 'none', borderRadius: '10px',
        padding: '14px', fontSize: '14px', fontWeight: 600,
        fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s', color: 'white',
        background: loading ? 'rgba(79,70,229,0.35)' : `linear-gradient(135deg, ${hover ? '#6366f1' : ACCENT}, #3730a3)`,
        boxShadow: hover && !loading ? '0 6px 20px rgba(79,70,229,0.35)' : 'none',
        transform: hover && !loading ? 'translateY(-1px)' : 'translateY(0)'
      }}>
      {loading ? 'Procesando...' : label}
    </button>
  )
}

// ── Bienvenida + Setup ────────────────────────────────────────────────────────
function Bienvenida({ onSetupComplete }) {
  const navigate = useNavigate()
  const [paso, setPaso]       = useState('welcome')
  const [verPass, setVerPass] = useState(false)
  const [form, setForm]       = useState({ nombre: '', username: '', password: '', rol: 'admin' })
  const [error, setError]     = useState('')
  const [exito, setExito]     = useState('')
  const [guardando, setGuardando] = useState(false)

  const change = e => { setForm({ ...form, [e.target.name]: e.target.value }); setError('') }

  const submit = async e => {
    e.preventDefault()
    if (!form.nombre || !form.username || !form.password) { setError('Completa todos los campos.'); return }
    setGuardando(true)
    try {
      await api.post('/usuarios/setup', form)
      setExito('Administrador creado. Redirigiendo al login...')
      setTimeout(() => {
      onSetupComplete()
     }, 2000)
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error al crear el administrador.')
    } finally { setGuardando(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', background: DARK,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif", padding: '24px',
      position: 'relative', overflow: 'hidden'
    }}>
      <style>{`
        input::placeholder { color: rgba(255,255,255,0.18); }
        @keyframes fadeUp { from { opacity:0; transform:translateY(32px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      <div style={{ position:'absolute', width:'600px', height:'600px', borderRadius:'50%', background:'radial-gradient(circle, rgba(79,70,229,0.1) 0%, transparent 70%)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)', backgroundSize:'36px 36px', pointerEvents:'none' }} />

      {paso === 'welcome' ? (
        <div style={{ textAlign:'center', zIndex:1, animation:'fadeUp 0.7s ease forwards', maxWidth:'420px', width:'100%' }}>
          <img src="/SNACKFLOW_LOGO_BLANCO.png" alt="SnackFlow" style={{ width:'200px', objectFit:'contain', display:'block', margin:'0 auto 32px', marginBottom:'32px', filter:'drop-shadow(0 4px 20px rgba(79,70,229,0.4))' }} />
          <div style={{
            display:'inline-flex', alignItems:'center', gap:'6px',
            background:'rgba(79,70,229,0.15)', border:'1px solid rgba(79,70,229,0.3)',
            color:'#a5b4fc', fontSize:'11px', fontWeight:600,
            letterSpacing:'1.5px', textTransform:'uppercase',
            padding:'5px 14px', borderRadius:'20px', marginBottom:'20px'
          }}>✦ Primera configuración</div>

          <h1 style={{ color:'white', fontSize:'30px', fontWeight:700, margin:'0 0 10px', lineHeight:1.2 }}>
            Bienvenido al sistema
          </h1>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'15px', lineHeight:1.7, margin:'0 0 36px' }}>
            No hay administradores registrados aún.<br/>Crea tu cuenta para comenzar.
          </p>

          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:'14px', padding:'20px 24px', marginBottom:'28px', textAlign:'left' }}>
            {[
              { icon:'🔐', text:'Control total del sistema' },
              { icon:'📦', text:'Gestión de inventario y ventas' },
              { icon:'👥', text:'Puedes crear más admins después' },
            ].map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'9px 0', borderBottom: i < 2 ? `1px solid ${BORDER}` : 'none' }}>
                <span style={{ fontSize:'18px' }}>{item.icon}</span>
                <span style={{ color:'rgba(255,255,255,0.55)', fontSize:'13px' }}>{item.text}</span>
              </div>
            ))}
          </div>

          <button onClick={() => setPaso('form')} style={{
            width:'100%', border:'none', borderRadius:'10px',
            padding:'16px', fontSize:'15px', fontWeight:600,
            background:`linear-gradient(135deg, ${ACCENT}, #3730a3)`,
            color:'white', cursor:'pointer', fontFamily:'inherit',
            boxShadow:'0 8px 28px rgba(79,70,229,0.35)', transition:'all 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 36px rgba(79,70,229,0.45)' }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(79,70,229,0.35)' }}
          >
            Registrar administrador →
          </button>
        </div>

      ) : (
        <div style={{ zIndex:1, animation:'fadeUp 0.5s ease forwards', width:'100%', maxWidth:'400px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '28px', width: '100%'}}>
          <img src="/SNACKFLOW_LOGO_BLANCO.png" alt="SnackFlow" style={{ width: '140px', objectFit: 'contain',display: 'block'}}/>
        </div>

          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:'16px', padding:'36px 32px', boxShadow:'0 24px 60px rgba(0,0,0,0.5)' }}>
            <h2 style={{ color:'white', fontSize:'20px', fontWeight:700, margin:'0 0 6px' }}>Crear administrador</h2>
            <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'13px', margin:'0 0 24px' }}>Esta acción solo se realiza una vez.</p>

            <form onSubmit={submit}>
              <Campo label="Nombre completo" name="nombre"   placeholder="Carlos Pérez"      value={form.nombre}   onChange={change} />
              <Campo label="Usuario"         name="username" placeholder="cperez"             value={form.username} onChange={change} />
              <Campo label="Contraseña" name="password" type={verPass ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={form.password} onChange={change}
                extra={
                  <button type="button" onClick={() => setVerPass(!verPass)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', fontSize:'12px', fontFamily:'inherit' }}>
                    {verPass ? 'Ocultar' : 'Ver'}
                  </button>
                }
              />
              <ErrorMsg msg={error} />
              <SuccessMsg msg={exito} />
              <div style={{ marginTop:'8px' }}>
                <SubmitBtn loading={guardando} label="Crear administrador" />
              </div>
            </form>

            <button onClick={() => setPaso('welcome')} style={{ display:'block', margin:'16px auto 0', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.25)', fontSize:'12px', fontFamily:'inherit', transition:'color 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.color='rgba(255,255,255,0.5)'}
              onMouseLeave={e => e.currentTarget.style.color='rgba(255,255,255,0.25)'}
            >← Volver</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Login normal ──────────────────────────────────────────────────────────────
function LoginScreen() {
  const navigate = useNavigate()
  const [form, setForm]       = useState({ username: '', password: '' })
  const [verPass, setVerPass] = useState(false)
  const [error, setError]     = useState('')
  const [cargando, setCargando] = useState(false)

  const change = e => { setForm({ ...form, [e.target.name]: e.target.value }); setError('') }

  const submit = async e => {
    e.preventDefault()
    if (!form.username || !form.password) { setError('Completa todos los campos.'); return }
    setCargando(true)
    try {
      const res = await api.post('/auth/login', form)
      localStorage.setItem('access_token', res.data.access_token)
      localStorage.setItem('usuario', JSON.stringify(res.data.usuario))
      navigate('/')
    } catch (err) {
      setError(err.response?.status === 401 ? 'Usuario o contraseña incorrectos.' : 'Error al conectar con el servidor.')
    } finally { setCargando(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', background: DARK,
      display: 'flex', fontFamily: "'Segoe UI', system-ui, sans-serif",
      position: 'relative', overflow: 'hidden'
    }}>
      <style>{`
        input::placeholder { color: rgba(255,255,255,0.18); }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }
      `}</style>

      {/* panel izquierdo */}
      <div style={{
        width: '45%', flexShrink: 0,
        background: 'linear-gradient(160deg, #4f46e5 0%, #3730a3 50%, #1e1b6e 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position:'absolute', width:'350px', height:'350px', borderRadius:'50%', border:'1px solid rgba(255,255,255,0.06)', top:'-80px', right:'-80px' }} />
        <div style={{ position:'absolute', width:'250px', height:'250px', borderRadius:'50%', border:'1px solid rgba(255,255,255,0.05)', bottom:'-60px', left:'-60px' }} />
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize:'28px 28px', pointerEvents:'none' }} />

        <div style={{ zIndex:1, textAlign:'center' }}>
          <img src="/SNACKFLOW_LOGO_BLANCO.png" alt="SnackFlow" style={{ width:'220px', objectFit:'contain', marginBottom:'28px', filter:'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' }} />
          <div style={{ width:'40px', height:'2px', background:'rgba(255,255,255,0.3)', borderRadius:'2px', margin:'0 auto 16px' }} />
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'11px', letterSpacing:'3px', textTransform:'uppercase', margin:0 }}>Sistema de gestión</p>
        </div>

        <div style={{ position:'absolute', bottom:'32px', left:'32px', right:'32px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px', zIndex:1 }}>
          {[{ label:'Ventas', val:'∞' }, { label:'Productos', val:'∞' }, { label:'Clientes', val:'∞' }].map((s,i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', padding:'10px', textAlign:'center' }}>
              <p style={{ color:'white', fontSize:'16px', fontWeight:700, margin:'0 0 2px' }}>{s.val}</p>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'10px', textTransform:'uppercase', letterSpacing:'1px', margin:0 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* panel derecho */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'48px 60px', background:DARK }}>
        <div style={{ width:'100%', maxWidth:'360px', animation:'fadeUp 0.5s ease forwards' }}>

          <div style={{ marginBottom:'36px' }}>
            <div style={{
              display:'inline-flex', alignItems:'center', gap:'6px',
              background:'rgba(79,70,229,0.15)', border:'1px solid rgba(79,70,229,0.25)',
              color:'#a5b4fc', fontSize:'11px', fontWeight:600,
              letterSpacing:'1.5px', textTransform:'uppercase',
              padding:'5px 14px', borderRadius:'20px', marginBottom:'16px'
            }}>Bienvenido de nuevo</div>
            <h2 style={{ color:'white', fontSize:'26px', fontWeight:700, margin:'0 0 8px', lineHeight:1.2 }}>Inicia sesión</h2>
            <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'14px', margin:0 }}>Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={submit}>
            <Campo label="Usuario" name="username" placeholder="Ej: admin_01" value={form.username} onChange={change} />
            <Campo label="Contraseña" name="password" type={verPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={change}
              extra={
                <button type="button" onClick={() => setVerPass(!verPass)} style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)', fontSize:'12px', fontFamily:'inherit' }}>
                  {verPass ? 'Ocultar' : 'Ver'}
                </button>
              }
            />
            <div style={{ marginBottom:'24px' }} />
            <ErrorMsg msg={error} />
            <SubmitBtn loading={cargando} label="Entrar al sistema" />
          </form>

          <p style={{ color:'rgba(255,255,255,0.15)', fontSize:'12px', textAlign:'center', marginTop:'32px' }}>
            © 2026 SnackFlow v1.0
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Raíz ──────────────────────────────────────────────────────────────────────
export default function Login() {
  const [modo, setModo] = useState(null)
  const navigate        = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('access_token')) { navigate('/'); return }
    api.get('/usuarios/check-setup')
      .then(res => setModo(res.data.setup_completado ? 'login' : 'setup'))
      .catch(() => setModo('login'))
  }, [])

  if (!modo) return (
    <div style={{ minHeight:'100vh', background:DARK, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'40px', height:'40px', borderRadius:'50%', border:'3px solid rgba(79,70,229,0.15)', borderTop:`3px solid ${ACCENT}`, animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

return modo === 'login'
  ? <LoginScreen />
  : <Bienvenida onSetupComplete={() => setModo('login')} />
}