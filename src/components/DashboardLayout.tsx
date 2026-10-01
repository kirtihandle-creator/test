import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

const links = [
  { to: '/dashboard', label: 'Overview', icon: '🏠', end: true },
  { to: '/dashboard/courses', label: 'Courses', icon: '📘' },
  { to: '/dashboard/timetable', label: 'Timetable', icon: '📅' },
  { to: '/dashboard/grades', label: 'Grades', icon: '📊' },
  { to: '/dashboard/attendance', label: 'Attendance', icon: '🗓️' },
  { to: '/dashboard/fees', label: 'Fees', icon: '💳' },
  { to: '/dashboard/profile', label: 'Profile', icon: '👤' },
]

function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dash-shell">
      <aside className="dash-sidebar">
        <div className="dash-brand">
          <span className="crest" style={{ width: 36, height: 36, fontSize: 15 }}>DBU</span>
          <span>Student Portal</span>
        </div>
        <nav className="dash-nav">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `dash-link${isActive ? ' active' : ''}`}
            >
              <span className="dash-icon">{l.icon}</span>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="dash-main">
        <header className="dash-topbar">
          <div className="dash-user">
            <div className="dash-avatar">AS</div>
            <div>
              <div className="dash-user-name">Aman Sharma</div>
              <div className="dash-user-role">B.Tech CSE, Semester 5</div>
            </div>
          </div>
        </header>
        <main className="dash-content">{children}</main>
      </div>
    </div>
  )
}

export default DashboardLayout
