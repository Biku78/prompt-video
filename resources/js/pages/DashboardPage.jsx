import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import '../styles/dashboard.scss'

// ── Axios instance with token ─────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

// ── Attach token to every request automatically ───────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// ── Mock data ─────────────────────────────────────────────
const NAV = [
  {
    section: 'WORKSPACE',
    items: [
      { icon: '▦', label: 'DASHBOARD', badge: null, id: 'dashboard' },
      { icon: '◈', label: 'PROJECTS', badge: '4', id: 'projects' },
      { icon: '⬡', label: 'ANALYTICS', badge: null, id: 'analytics' },
      { icon: '◎', label: 'REPORTS', badge: null, id: 'reports' },
    ]
  },
  {
    section: 'MANAGE',
    items: [
      { icon: '⊞', label: 'TEAM', badge: null, id: 'team' },
      { icon: '◷', label: 'SCHEDULE', badge: '2', id: 'schedule' },
      { icon: '⊡', label: 'FILES', badge: null, id: 'files' },
    ]
  },
  {
    section: 'SYSTEM',
    items: [
      { icon: '◫', label: 'SETTINGS', badge: null, id: 'settings' },
      { icon: '⊘', label: 'INTEGRATIONS', badge: null, id: 'integrations' },
    ]
  }
]

const STATS = [
  { label: 'TOTAL REVENUE', value: '$48,295', change: '+12.4%', dir: 'up', icon: '◈', color: 'red', bar: '72%' },
  { label: 'ACTIVE USERS', value: '3,847', change: '+8.1%', dir: 'up', icon: '⬡', color: 'green', bar: '61%' },
  { label: 'OPEN TICKETS', value: '24', change: '-3.2%', dir: 'down', icon: '◎', color: 'yellow', bar: '28%' },
  { label: 'UPTIME', value: '99.9%', change: '+0.1%', dir: 'up', icon: '▦', color: 'blue', bar: '99%' },
]

const CHART_DATA = [
  { day: 'MON', val: 60 },
  { day: 'TUE', val: 80 },
  { day: 'WED', val: 45 },
  { day: 'THU', val: 90 },
  { day: 'FRI', val: 70 },
  { day: 'SAT', val: 30 },
  { day: 'SUN', val: 55 },
]

const ACTIVITY = [
  { color: 'red', text: 'New deployment pushed to production', sub: 'nexus-api v2.6.1', time: '2m ago' },
  { color: 'green', text: 'User registration spike detected', sub: '+142 signups today', time: '15m ago' },
  { color: 'yellow', text: 'Scheduled backup completed', sub: 'All systems nominal', time: '1h ago' },
  { color: 'blue', text: 'New team member joined workspace', sub: 'Sara K. — Designer', time: '3h ago' },
  { color: 'red', text: 'SSL certificate renewed', sub: 'Valid for 90 days', time: '5h ago' },
]

const QUICK = [
  { label: 'Storage Used', val: '68%', bar: '68%', color: '#e8341c' },
  { label: 'API Calls Today', val: '12.4K', bar: '54%', color: '#4a9eff' },
  { label: 'Team Capacity', val: '82%', bar: '82%', color: '#4caf7d' },
  { label: 'Bandwidth', val: '41%', bar: '41%', color: '#f0c040' },
]

const TABLE_ROWS = [
  { id: '#001', project: 'NEXUS CORE API', status: 'success', date: '25 Feb 2026', amount: '$12,400' },
  { id: '#002', project: 'DASHBOARD REDESIGN', status: 'pending', date: '24 Feb 2026', amount: '$8,200' },
  { id: '#003', project: 'MOBILE APP v3', status: 'success', date: '23 Feb 2026', amount: '$21,000' },
  { id: '#004', project: 'DATA PIPELINE', status: 'failed', date: '22 Feb 2026', amount: '$5,600' },
  { id: '#005', project: 'AUTH MODULE', status: 'info', date: '21 Feb 2026', amount: '$3,900' },
]

// ── Clock ─────────────────────────────────────────────────
function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="dash__header-time">
      {time.toLocaleTimeString('en-US', { hour12: false })}
    </span>
  )
}

// ── Get initials ──────────────────────────────────────────
function getInitials(name) {
  if (!name) return 'U'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

// ── Dashboard ─────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate()
  const [active, setActive] = useState('dashboard')
  const [sideOpen, setSideOpen] = useState(false)
  const [authUser, setAuthUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    const user = localStorage.getItem('auth_user')

    if (!token || !user) {
      // ❌ No token — redirect to login
      navigate('/login')
      return
    }

    // ✅ Set user data
    setAuthUser(JSON.parse(user))
  }, [])

  // ── Logout ────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      // Tell Laravel to delete the token
      await api.post('/api/logout')
    } catch (err) {
      // logout anyway even if request fails
    } finally {
      // ✅ Clear localStorage and go to login
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      navigate('/login')
    }
  }

  const maxChart = Math.max(...CHART_DATA.map(d => d.val))

  // ── Show nothing while checking auth ─────────────────────
  if (!authUser) return null

  return (
    <div className="dash">

      {/* ── SIDEBAR ── */}
      <aside className={`dash__sidebar ${sideOpen ? 'dash__sidebar--open' : ''}`}>

        <div className="dash__logo">
          <div className="dash__logo-mark" />
          <div className="dash__logo-text">NEXUS</div>
          <div className="dash__logo-dot" />
        </div>

        {/* Real user from localStorage */}
        <div className="dash__user">
          <div className="dash__user-avatar">
            {getInitials(authUser.name)}
          </div>
          <div className="dash__user-info">
            <div className="dash__user-name">{authUser.name ?? authUser.email}</div>
            <div className="dash__user-role">{authUser.role ?? 'USER'}</div>
          </div>
        </div>

        <nav className="dash__nav">
          {NAV.map(group => (
            <div className="dash__nav-section" key={group.section}>
              <div className="dash__nav-label">{group.section}</div>
              {group.items.map(item => (
                <div
                  key={item.id}
                  className={`dash__nav-item ${active === item.id ? 'dash__nav-item--active' : ''}`}
                  onClick={() => { setActive(item.id); setSideOpen(false) }}
                >
                  <span className="dash__nav-icon">{item.icon}</span>
                  <span className="dash__nav-text">{item.label}</span>
                  {item.badge && <span className="dash__nav-badge">{item.badge}</span>}
                </div>
              ))}
            </div>
          ))}
        </nav>

        <div className="dash__sidebar-bottom">
          <button className="dash__logout" onClick={handleLogout}>
            <span>⊗</span>
            <span>LOGOUT</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="dash__main">

        <header className="dash__header">
          <button className="dash__hamburger" onClick={() => setSideOpen(o => !o)}>
            <span /><span /><span />
          </button>
          <div className="dash__breadcrumb">
            <span>NEXUS</span>
            <span>›</span>
            <strong>{active.toUpperCase()}</strong>
          </div>
          <div className="dash__header-right">
            <Clock />
            <button className="dash__header-btn dash__header-btn--notif">◎</button>
            <button className="dash__header-btn">⬡</button>
            <div className="dash__header-avatar">{getInitials(authUser.name)}</div>
          </div>
        </header>

        <div className="dash__content">

          {/* Page Header */}
          <div className="dash__page-header">
            <div>
              <div className="dash__page-eyebrow">OVERVIEW</div>
              <h1 className="dash__page-title">DASH<span>_</span>BOARD</h1>
              <p className="dash__page-meta">// Welcome back, {authUser.name ?? authUser.email}</p>
            </div>
            <div className="dash__header-actions">
              <button className="dash__btn dash__btn--ghost">EXPORT</button>
              <button className="dash__btn dash__btn--primary">+ NEW PROJECT</button>
            </div>
          </div>

          {/* Stats */}
          <div className="dash__stats">
            {STATS.map((s, i) => (
              <div key={i} className={`dash__stat dash__stat--${s.color}`}>
                <div className="dash__stat-icon">{s.icon}</div>
                <div className="dash__stat-label">{s.label}</div>
                <div className="dash__stat-value">{s.value}</div>
                <div className={`dash__stat-change dash__stat-change--${s.dir}`}>
                  {s.dir === 'up' ? '▲' : '▼'} {s.change} vs last month
                </div>
                <div className="dash__stat-bar">
                  <div
                    className={`dash__stat-bar-fill dash__stat-bar-fill--${s.color}`}
                    style={{ width: s.bar, animationDelay: `${i * 0.1 + 0.5}s` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Chart + Quick */}
          <div className="dash__grid">
            <div className="dash__panel">
              <div className="dash__panel-header">
                <div className="dash__panel-title">WEEKLY ACTIVITY</div>
                <button className="dash__panel-action">VIEW ALL →</button>
              </div>
              <div className="dash__panel-body">
                <div className="dash__chart">
                  {CHART_DATA.map((d, i) => (
                    <div className="dash__chart-bar" key={i}>
                      <div
                        className={`dash__chart-bar-fill ${d.val === maxChart ? 'dash__chart-bar-fill--active' : ''}`}
                        style={{ height: `${(d.val / maxChart) * 100}%`, animationDelay: `${i * 0.08}s` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="dash__chart-labels">
                  {CHART_DATA.map((d, i) => <span key={i}>{d.day}</span>)}
                </div>
              </div>
            </div>

            <div className="dash__panel">
              <div className="dash__panel-header">
                <div className="dash__panel-title">SYSTEM HEALTH</div>
                <button className="dash__panel-action">REFRESH</button>
              </div>
              <div className="dash__panel-body">
                <div className="dash__quick">
                  {QUICK.map((q, i) => (
                    <div className="dash__quick-item" key={i}>
                      <div style={{ flex: 1 }}>
                        <div className="dash__quick-label">{q.label}</div>
                        <div className="dash__quick-bar">
                          <div style={{ width: q.bar, background: q.color, animationDelay: `${i * 0.1 + 0.6}s` }} />
                        </div>
                      </div>
                      <div className="dash__quick-val">{q.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="dash__table-wrap">
            <div className="dash__panel-header">
              <div className="dash__panel-title">RECENT PROJECTS</div>
              <button className="dash__panel-action">VIEW ALL →</button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="dash__table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>PROJECT</th>
                    <th>STATUS</th>
                    <th>DATE</th>
                    <th>AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {TABLE_ROWS.map((row, i) => (
                    <tr key={i}>
                      <td style={{ color: '#444', fontSize: 10 }}>{row.id}</td>
                      <td>{row.project}</td>
                      <td><span className={`dash__badge dash__badge--${row.status}`}>{row.status}</span></td>
                      <td style={{ color: '#555', fontSize: 10 }}>{row.date}</td>
                      <td>{row.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Activity */}
          <div className="dash__panel">
            <div className="dash__panel-header">
              <div className="dash__panel-title">ACTIVITY LOG</div>
              <button className="dash__panel-action">CLEAR ALL</button>
            </div>
            <div className="dash__panel-body">
              <div className="dash__activity">
                {ACTIVITY.map((a, i) => (
                  <div className="dash__activity-item" key={i}>
                    <div className={`dash__activity-dot dash__activity-dot--${a.color}`} />
                    <div className="dash__activity-text">
                      <strong>{a.text}</strong>
                      <span>{a.sub}</span>
                    </div>
                    <div className="dash__activity-time">{a.time}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        <div className="dash__statusbar">
          <div className="dash__status-item">
            <span className="dash__status-dot" />
            <span>ALL SYSTEMS OPERATIONAL</span>
          </div>
          <div className="dash__status-item">API: 24ms</div>
          <div className="dash__status-item">DB: 8ms</div>
          <div className="dash__status-item">v2.6.0</div>
        </div>
      </div>

    </div>
  )
}