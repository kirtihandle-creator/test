const grades = [
  { code: 'CS501', name: 'Data Structures & Algorithms', mid: 42, final: 45, grade: 'A' },
  { code: 'CS502', name: 'Operating Systems', mid: 38, final: 40, grade: 'B+' },
  { code: 'CS503', name: 'Database Systems', mid: 47, final: 48, grade: 'A+' },
  { code: 'CS504', name: 'Computer Networks', mid: 35, final: '—', grade: 'Pending' },
  { code: 'CS505', name: 'Software Engineering', mid: 40, final: 43, grade: 'A' },
  { code: 'HS501', name: 'Technical Communication', mid: 48, final: 49, grade: 'A+' },
]

const gradeColor: Record<string, string> = {
  'A+': '#2e7d32',
  'A': '#388e3c',
  'B+': '#c9972d',
  'Pending': '#999',
}

function Grades() {
  return (
    <>
      <h1 style={{ fontSize: 28 }}>Grades</h1>
      <p style={{ marginBottom: 28 }}>Current CGPA: <strong style={{ color: 'var(--navy)' }}>8.4</strong></p>

      <div className="dash-card">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Mid-term</th>
              <th>Final</th>
              <th>Grade</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((g) => (
              <tr key={g.code}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{g.code}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-light)' }}>{g.name}</div>
                </td>
                <td>{g.mid} / 50</td>
                <td>{g.final === '—' ? '—' : `${g.final} / 50`}</td>
                <td>
                  <span style={{ color: gradeColor[g.grade] ?? 'var(--text)', fontWeight: 700 }}>
                    {g.grade}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Grades
