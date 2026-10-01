const attendance = [
  { code: 'CS501', name: 'Data Structures & Algorithms', attended: 42, total: 46 },
  { code: 'CS502', name: 'Operating Systems', attended: 36, total: 44 },
  { code: 'CS503', name: 'Database Systems', attended: 40, total: 42 },
  { code: 'CS504', name: 'Computer Networks', attended: 30, total: 40 },
  { code: 'CS505', name: 'Software Engineering', attended: 38, total: 42 },
  { code: 'HS501', name: 'Technical Communication', attended: 20, total: 22 },
]

function Attendance() {
  const totalAttended = attendance.reduce((a, c) => a + c.attended, 0)
  const totalClasses = attendance.reduce((a, c) => a + c.total, 0)
  const overall = Math.round((totalAttended / totalClasses) * 100)

  return (
    <>
      <h1 style={{ fontSize: 28 }}>Attendance</h1>
      <p style={{ marginBottom: 28 }}>
        Overall attendance: <strong style={{ color: overall >= 75 ? '#2e7d32' : '#c62828' }}>{overall}%</strong>
        {overall < 75 && ' — below the required 75% minimum'}
      </p>

      <div className="dash-grid-2">
        {attendance.map((a) => {
          const pct = Math.round((a.attended / a.total) * 100)
          return (
            <div className="dash-card" key={a.code}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <span className="tag">{a.code}</span>
                  <h3 style={{ marginTop: 8, fontSize: 17 }}>{a.name}</h3>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: pct >= 75 ? '#2e7d32' : '#c62828' }}>
                  {pct}%
                </div>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${pct}%`, background: pct >= 75 ? undefined : '#c62828' }}
                />
              </div>
              <div className="dash-time">{a.attended} / {a.total} classes attended</div>
            </div>
          )
        })}
      </div>
    </>
  )
}

export default Attendance
