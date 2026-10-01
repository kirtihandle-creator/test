const courses = [
  { code: 'CS501', name: 'Data Structures & Algorithms', instructor: 'Dr. Arjun Rao', credits: 4, progress: 78 },
  { code: 'CS502', name: 'Operating Systems', instructor: 'Dr. Anita Sharma', credits: 4, progress: 65 },
  { code: 'CS503', name: 'Database Systems', instructor: 'Prof. Kavita Nair', credits: 3, progress: 90 },
  { code: 'CS504', name: 'Computer Networks', instructor: 'Dr. Vikram Singh', credits: 3, progress: 55 },
  { code: 'CS505', name: 'Software Engineering', instructor: 'Dr. Neha Gupta', credits: 3, progress: 70 },
  { code: 'HS501', name: 'Technical Communication', instructor: 'Prof. Sanjay Mehta', credits: 2, progress: 95 },
]

function Courses() {
  return (
    <>
      <h1 style={{ fontSize: 28 }}>My Courses</h1>
      <p style={{ marginBottom: 28 }}>Semester 5 &mdash; 6 courses enrolled, 19 credits total.</p>

      <div className="dash-grid-2">
        {courses.map((c) => (
          <div className="dash-card" key={c.code}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="tag">{c.code}</span>
                <h3 style={{ marginTop: 8 }}>{c.name}</h3>
                <p style={{ fontSize: 13 }}>{c.instructor} &middot; {c.credits} credits</p>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${c.progress}%` }} />
            </div>
            <div className="dash-time">{c.progress}% complete</div>
          </div>
        ))}
      </div>
    </>
  )
}

export default Courses
