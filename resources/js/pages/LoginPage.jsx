import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import '../styles/login.scss'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:9000',
  headers: {
    'Content-Type': 'application/json',
    'Accept':       'application/json',
  },
})

export default function LoginPage() {
  const [form,     setForm]     = useState({ email: '', password: '' })
  const [errors,   setErrors]   = useState({})
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [apiError, setApiError] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('auth_token')) {
      navigate('/dashboard')
    }
  }, [])

  const set = (key) => (e) => {
    setForm(f => ({ ...f, [key]: e.target.value }))
    setErrors(prev => ({ ...prev, [key]: '' }))
    setApiError('')
  }

  const validate = () => {
    const e = {}
    if (!form.email)
      e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email))
      e.email = 'Enter a valid email'
    if (!form.password)
      e.password = 'Password is required'
    else if (form.password.length < 6)
      e.password = 'Password must be at least 6 characters'
    return e
  }

  const handleSubmit = async () => {
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return

    setLoading(true)
    setApiError('')

    try {
      const { data } = await api.post('/api/login', {
        email:    form.email,
        password: form.password,
      })

      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user',  JSON.stringify(data.user))

      navigate('/dashboard')

    } catch (err) {
      if (err.response) {
        const status = err.response.status
        const data   = err.response.data

        if (status === 422) {
          const laravelErrors = data.errors ?? {}
          setErrors({
            email:    laravelErrors.email?.[0]    ?? '',
            password: laravelErrors.password?.[0] ?? '',
          })
        } else if (status === 401) {
          setApiError('Invalid email or password. Please try again.')
        } else if (status === 429) {
          setApiError('Too many attempts. Please wait a moment.')
        } else {
          setApiError('Something went wrong. Please try again.')
        }
      } else {
        setApiError('Cannot connect to server. Check your connection.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="login">
      {/* ── LEFT PANEL ── */}
      <div className="login__left">
        <div className="login__left-bg" />
        <div className="login__left-spinner" />
        <div className="login__strips">
          <span /><span /><span /><span /><span />
        </div>
        <div className="login__brand">
          <div className="login__logo">NEXUS</div>
          <div className="login__tagline">DIGITAL WORKSPACE</div>
        </div>
        <div className="login__geo-text">
          <h2>
            YOUR
            <span>CREATIVE</span>
            STUDIO
          </h2>
          <p>
            A space where ideas<br />
            collide with precision.<br />
            Access your workspace.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="login__right">
        <div className="login__header">
          <div className="login__eyebrow">WELCOME BACK</div>
          <h1 className="login__title">LOG<span>_</span>IN</h1>
        </div>

        <div className="login__form">

          {/* API error banner */}
          {apiError && (
            <div style={{
              background: 'rgba(232,52,28,0.08)',
              border: '1px solid rgba(232,52,28,0.3)',
              color: '#e8341c',
              padding: '12px 16px',
              fontSize: 11,
              letterSpacing: 1,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span>⊗</span> {apiError}
            </div>
          )}

          {/* Email */}
          <div className={`login__field ${errors.email ? 'login__field--error' : ''}`}>
            <label>Email Address</label>
            <div className="login__field-wrap">
              <span className="icon">◈</span>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                onKeyDown={handleKeyDown}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="error-msg">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className={`login__field ${errors.password ? 'login__field--error' : ''}`}>
            <label>Password</label>
            <div className="login__field-wrap">
              <span className="icon">⬡</span>
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
              />
              <button
                onClick={() => setShowPass(p => !p)}
                style={{
                  background: 'none', border: 'none', color: '#333',
                  cursor: 'pointer', fontSize: 12,
                  fontFamily: 'JetBrains Mono', letterSpacing: 1
                }}
              >
                {showPass ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            {errors.password && <p className="error-msg">{errors.password}</p>}
          </div>

          {/* Options */}
          <div className="login__options">
            <label className="remember">
              <input type="checkbox" />
              Remember me
            </label>
            <a href="#" className="forgot">Forgot password?</a>
          </div>

          {/* Submit */}
          <div className="login__submit">
            <button onClick={handleSubmit} disabled={loading}>
              <span>{loading ? 'AUTHENTICATING...' : 'AUTHENTICATE →'}</span>
            </button>
          </div>

          {/* Divider */}
          <div className="login__divider">
            <div className="login__divider-line" />
            <span>or</span>
            <div className="login__divider-line" />
          </div>

          {/* Socials */}
          <div className="login__socials">
            <button className="login__social-btn"><span>G</span> Google</button>
            <button className="login__social-btn"><span>⌥</span> GitHub</button>
          </div>

          {/* Footer */}
          <p className="login__footer">
            No account?&nbsp;&nbsp;
            <Link to="/register">REGISTER →</Link>
          </p>
        </div>
      </div>

      <div className="login__corner">
        <span className="blink">● LIVE</span>
      </div>
    </div>
  )
}