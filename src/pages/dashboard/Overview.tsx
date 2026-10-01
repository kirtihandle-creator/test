const stats = [
  { label: 'Enrolled Courses', value: '6', icon: '📘' },
  { label: 'Overall Attendance', value: '87%', icon: '🗓️' },
  { label: 'CGPA', value: '8.4', icon: '📊' },
  { label: 'Fees Due', value: '₹0', icon: '💳' },
]

const activity = [
  { text: 'Grade posted for Data Structures Mid-term', time: '2 hours ago' },
  { text: 'Attendance marked for Operating Systems', time: '1 day ago' },
  { text: 'Fee payment of ₹45,000 received', time: '3 days ago' },
  { text: 'New assignment posted in Database Systems', time: '5 days ago' },
]

function Overview() {
  return (
    <>
      <h1 style={{ fontSize: 28 }}>Welcome back, Aman 👋</h1>
      <p style={{ marginBottom: 28 }}>Here's what's happening with your academics today.</p>

      <div className="dash-grid-4">
        {stats.map((s) => (
          <div className="dash-card" key={s.label}>
            <div className="dash-stat-icon">{s.icon}</div>
            <div className="dash-stat-value">{s.value}</div>
            <div className="dash-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="dash-card" style={{ marginTop: 24 }}>
        <h3>Recent Activity</h3>
        <ul className="dash-activity">
          {activity.map((a) => (
            <li key={a.text}>
              <span className="dot" />
              <div>
                <div>{a.text}</div>
                <div className="dash-time">{a.time}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

export default Overview
