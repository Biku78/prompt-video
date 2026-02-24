import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../styles/login.scss'

export default function LoginPage() {
    const [form, setForm] = useState({ email: '', password: '' })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false)
    const [remember, setRemember] = useState(false)
    
    const navigate = useNavigate()

    const set = (key) => (e) => {
        setForm(f => ({ ...f, [key]: e.target.value }))
        setErrors(prev => ({ ...prev, [key]: '' }))
    }

    const validate = () => {
        const e = {}
        if (!form.email) e.email = 'Email is required'
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
        if (!form.password) e.password = 'Password is required'
        return e
    }

    const handleSubmit = async () => {
        const e = validate()
        setErrors(e)
        if (Object.keys(e).length) return
        setLoading(true)
        // TODO: await axios.post('/api/login', form)
        setTimeout(() => { setLoading(false), navigate('/dashboard') }, 2000)
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
                    <h1 className="login__title">
                        LOG<span>_</span>IN
                    </h1>
                    <p className="login__subtitle"></p>
                </div>

                <div className="login__form">
                    <div className={`login__field ${errors.email ? 'login__field--error' : ''}`}>
                        <label>Email Address</label>
                        <div className="login__field-wrap">
                            <span className="icon">◈</span>
                            <input
                                type="email"
                                value={form.email}
                                onChange={set('email')}
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
                                autoComplete="current-password"
                            />
                            <button
                                onClick={() => setShowPass(p => !p)}
                                style={{ background: 'none', border: 'none', color: '#333', cursor: 'pointer', fontSize: 12, fontFamily: 'JetBrains Mono', letterSpacing: 1 }}
                            >
                                {showPass ? 'HIDE' : 'SHOW'}
                            </button>
                        </div>
                        {errors.password && <p className="error-msg">{errors.password}</p>}
                    </div>

                    {/* Options */}
                    <div className="login__options">
                        <label className="remember">
                            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                            Remember me
                        </label>
                        <a href="#" className="forgot">Forgot password?</a>
                    </div>

                    {/* Submit */}
                    <div className="login__submit">
                        <button onClick={handleSubmit} disabled={loading}>
                            <span>{loading ? '[ AUTHENTICATING... ]' : '[ AUTHENTICATE →  ]'}</span>
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
                        <button className="login__social-btn">
                            <span>G</span> Google
                        </button>
                        <button className="login__social-btn">
                            <span>⌥</span> GitHub
                        </button>
                    </div>

                    {/* Footer */}
                    <p className="login__footer">
                        No account?&nbsp;&nbsp;
                        <Link to="/register">REGISTER →</Link>
                    </p>
                </div>
            </div>

            {/* Corner decoration */}
            <div className="login__corner">
                <span className="blink">● LIVE</span>
            </div>
        </div>
    )
}