const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const slots = ['9:00 - 10:00', '10:00 - 11:00', '11:15 - 12:15', '12:15 - 1:15', '2:00 - 3:00', '3:00 - 4:00']

const schedule: Record<string, (string | null)[]> = {
  Monday: ['CS501', 'CS502', 'CS503', null, 'CS504', 'Lab: CS501'],
  Tuesday: ['CS503', 'CS501', null, 'CS505', 'CS502', 'Lab: CS503'],
  Wednesday: ['CS502', 'HS501', 'CS504', 'CS501', null, 'CS505'],
  Thursday: ['CS504', 'CS503', 'CS502', null, 'Lab: CS504', 'HS501'],
  Friday: ['HS501', 'CS505', 'CS501', 'CS503', 'CS502', null],
  Saturday: [null, 'CS504', null, null, null, null],
}

const courseColor: Record<string, string> = {
  CS501: '#0b2545',
  CS502: '#c9972d',
  CS503: '#2e7d32',
  CS504: '#6b4fa0',
  CS505: '#00838f',
  HS501: '#8d5524',
}

function cellColor(code: string) {
  const base = code.replace('Lab: ', '')
  return courseColor[base] ?? '#888'
}

function Timetable() {
  return (
    <>
      <h1 style={{ fontSize: 28 }}>Timetable</h1>
      <p style={{ marginBottom: 28 }}>Your weekly class schedule &mdash; Semester 5.</p>

      <div className="dash-card" style={{ overflowX: 'auto' }}>
        <table className="dash-table" style={{ minWidth: 720 }}>
          <thead>
            <tr>
              <th>Time</th>
              {days.map((d) => (
                <th key={d}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.map((slot, i) => (
              <tr key={slot}>
                <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{slot}</td>
                {days.map((d) => {
                  const code = schedule[d][i]
                  return (
                    <td key={d}>
                      {code ? (
                        <span
                          className="tag"
                          style={{ background: cellColor(code), color: '#fff', whiteSpace: 'nowrap' }}
                        >
                          {code}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-light)', fontSize: 12 }}>—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="dash-card" style={{ marginTop: 24 }}>
        <h3>Legend</h3>
        <div>
          {Object.entries(courseColor).map(([code, color]) => (
            <span key={code} className="tag" style={{ background: color, color: '#fff' }}>
              {code}
            </span>
          ))}
        </div>
      </div>
    </>
  )
}

export default Timetable
