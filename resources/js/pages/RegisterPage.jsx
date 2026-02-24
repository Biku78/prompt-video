import { useState } from 'react'
import { Link } from 'react-router-dom'
import '../styles/register.scss'

const STEPS = ['Identity', 'Security', 'Confirm']

function StrengthMeter({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score = checks.filter(Boolean).length
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const cls    = ['', '1', '2', '3', '4']

  if (!password) return null

  return (
    <div className="register__strength">
      <div className="register__strength-bars">
        {[0,1,2,3].map(i => (
          <div
            key={i}
            className={`register__strength-bar ${i < score ? `register__strength-bar--fill-${cls[score]}` : ''}`}
          />
        ))}
      </div>
      {score > 0 && (
        <span className="register__strength-label">{labels[score]} password</span>
      )}
    </div>
  )
}

export default function RegisterPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    firstName: '', lastName: '',
    email: '', phone: '',
    password: '', confirm: '',
    agreed: false,
  })
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const validateStep = (s) => {
    const e = {}
    if (s === 0) {
      if (!form.firstName) e.firstName = 'Required'
      if (!form.lastName)  e.lastName  = 'Required'
      if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
    }
    if (s === 1) {
      if (!form.password || form.password.length < 8) e.password = 'Min 8 characters'
      if (form.password !== form.confirm) e.confirm = 'Passwords do not match'
    }
    if (s === 2) {
      if (!form.agreed) e.agreed = 'You must agree to continue'
    }
    return e
  }

  const handleNext = () => {
    const e = validateStep(step)
    setErrors(e)
    if (!Object.keys(e).length) setStep(s => s + 1)
  }

  const handleSubmit = () => {
    const e = validateStep(step)
    setErrors(e)
    if (Object.keys(e).length) return
    setLoading(true)
    // TODO: await axios.post('/api/register', form)
    setTimeout(() => setLoading(false), 2000)
  }

  return (
    <div className="register">
      {/* Background */}
      <div className="register__bg">
        <div className="register__bg-circle register__bg-circle--lg" />
        <div className="register__bg-circle register__bg-circle--md" />
        <div className="register__bg-circle register__bg-circle--sm" />
        <div className="register__bg-dot" />
        <div className="register__bg-dot" />
        <div className="register__bg-dot" />
        <div className="register__bg-line register__bg-line--h" />
        <div className="register__bg-line register__bg-line--v" />
        <div className="register__bg-line register__bg-line--v" />
      </div>

      {/* Left side column */}
      <div className="register__side register__side--left">
        <div className="register__side-text">Est. 2024 — Premium Workspace</div>
        <div className="register__side-number">01</div>
      </div>

      {/* Center */}
      <div className="register__center">
        {/* Logo */}
        <div style={{ display:'flex', justifyContent:'center', marginBottom:40 }}>
          <div className="register__logo">
            <div className="register__logo-mark" />
            <div className="register__logo-text">NEXUS</div>
          </div>
        </div>

        {/* Header */}
        <div className="register__header">
          <div className="register__eyebrow">
            <span />
            Create Account
            <span />
          </div>
          <h1 className="register__title">
            Join the <em>Studio</em>
          </h1>
          <p className="register__subtitle">
            Step {step + 1} of {STEPS.length} — {STEPS[step]}
          </p>
        </div>

        {/* Step Indicator */}
        <div className="register__progress">
          <div className="register__steps">
            {STEPS.map((label, i) => (
              <>
                <div
                  key={i}
                  className={`register__step ${
                    i === step ? 'register__step--active' :
                    i < step   ? 'register__step--done'   : ''
                  }`}
                >
                  <div className="register__step-num">
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span>{label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    key={`c${i}`}
                    className={`register__step-connector ${i < step ? 'register__step-connector--done' : ''}`}
                  />
                )}
              </>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="register__card">

          {/* ── STEP 0: Identity ── */}
          {step === 0 && (
            <div style={{ animation:'riseUp 0.4s ease' }}>
              <div className="register__row">
                <div className={`register__field ${errors.firstName ? 'register__field--error' : ''}`}>
                  <label>First Name</label>
                  <div className="register__field-wrap">
                    <span className="icon">◈</span>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={set('firstName')}
                      placeholder="Jane"
                    />
                  </div>
                  {errors.firstName && <p className="error-msg">{errors.firstName}</p>}
                </div>

                <div className={`register__field ${errors.lastName ? 'register__field--error' : ''}`}>
                  <label>Last Name</label>
                  <div className="register__field-wrap">
                    <span className="icon">◈</span>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={set('lastName')}
                      placeholder="Smith"
                    />
                  </div>
                  {errors.lastName && <p className="error-msg">{errors.lastName}</p>}
                </div>
              </div>

              <div className={`register__field ${errors.email ? 'register__field--error' : ''}`}>
                <label>Email Address</label>
                <div className="register__field-wrap">
                  <span className="icon">✉</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    placeholder="jane@studio.com"
                  />
                </div>
                {errors.email && <p className="error-msg">{errors.email}</p>}
              </div>

              <div className="register__field">
                <label>Phone (Optional)</label>
                <div className="register__field-wrap">
                  <span className="icon">◎</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <button className="register__next-btn" onClick={handleNext}>
                Continue →
              </button>
            </div>
          )}

          {/* ── STEP 1: Security ── */}
          {step === 1 && (
            <div style={{ animation:'riseUp 0.4s ease' }}>
              <div className={`register__field ${errors.password ? 'register__field--error' : ''}`}>
                <label>Create Password</label>
                <div className="register__field-wrap">
                  <span className="icon">⬡</span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Minimum 8 characters"
                  />
                  <button className="toggle-pass" onClick={() => setShowPass(p => !p)}>
                    {showPass ? '👁' : '👁‍🗨'}
                  </button>
                </div>
                {errors.password && <p className="error-msg">{errors.password}</p>}
              </div>

              <StrengthMeter password={form.password} />

              <div className={`register__field ${errors.confirm ? 'register__field--error' : ''}`}>
                <label>Confirm Password</label>
                <div className="register__field-wrap">
                  <span className="icon">⬡</span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirm}
                    onChange={set('confirm')}
                    placeholder="Repeat password"
                  />
                  <button className="toggle-pass" onClick={() => setShowConfirm(p => !p)}>
                    {showConfirm ? '👁' : '👁‍🗨'}
                  </button>
                </div>
                {errors.confirm && <p className="error-msg">{errors.confirm}</p>}
              </div>

              <div className="register__actions">
                <button className="register__back-btn" onClick={() => setStep(0)}>← Back</button>
                <button
                  className="register__next-btn"
                  onClick={handleNext}
                  style={{ flex:1 }}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 2: Confirm ── */}
          {step === 2 && (
            <div style={{ animation:'riseUp 0.4s ease' }}>
              {/* Summary card */}
              <div style={{ background:'#f7f3ed', border:'1px solid rgba(184,134,11,0.12)', borderRadius:2, padding:'20px 24px', marginBottom:24 }}>
                <p style={{ fontSize:10, letterSpacing:3, textTransform:'uppercase', color:'#9c8d7a', marginBottom:12 }}>Account Summary</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 0' }}>
                  {[
                    ['Name',  `${form.firstName} ${form.lastName}`],
                    ['Email', form.email],
                    ['Phone', form.phone || '—'],
                    ['Plan',  'Free Tier'],
                  ].map(([k,v]) => (
                    <div key={k}>
                      <p style={{ fontSize:9, color:'#9c8d7a', letterSpacing:2, textTransform:'uppercase', marginBottom:2 }}>{k}</p>
                      <p style={{ fontSize:13, color:'#1a1410', fontWeight:500 }}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              <label className={`register__terms ${errors.agreed ? 'register__terms--error' : ''}`}
                onClick={() => setForm(f => ({ ...f, agreed: !f.agreed }))}
              >
                <div className={`register__terms-box ${form.agreed ? 'register__terms-box--checked' : ''}`}>
                  {form.agreed && (
                    <svg viewBox="0 0 10 10" fill="none">
                      <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div className="register__terms-text">
                  I agree to the <a href="#" onClick={e=>e.stopPropagation()}>Terms of Service</a> and{' '}
                  <a href="#" onClick={e=>e.stopPropagation()}>Privacy Policy</a>. I confirm all information is accurate.
                  {errors.agreed && <span className="error-msg">{errors.agreed}</span>}
                </div>
              </label>

              <div className="register__actions">
                <button className="register__back-btn" onClick={() => setStep(1)}>← Back</button>
                <button
                  className="register__submit-btn"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading
                    ? <><span className="spinner" /> Creating...</>
                    : 'Create Account'
                  }
                </button>
              </div>

              <div className="register__divider">
                <div className="register__divider-line" />
                <span>or register with</span>
                <div className="register__divider-line" />
              </div>

              <div className="register__socials">
                <button className="register__social-btn">G&nbsp; Google</button>
                <button className="register__social-btn">⌥&nbsp; GitHub</button>
              </div>
            </div>
          )}
        </div>

        <p className="register__footer">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>

      {/* Right side column */}
      <div className="register__side register__side--right">
        <div className="register__side-number">02</div>
        <div className="register__side-text">Secure · Private · Encrypted</div>
      </div>

      {/* Bottom bar */}
      <div className="register__bottom">
        <span>© 2025 Nexus Studio</span>
        <span>🔒 256-bit SSL Encrypted</span>
        <span>Privacy · Terms</span>
      </div>
    </div>
  )
}