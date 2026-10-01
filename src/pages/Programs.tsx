const programs = [
  {
    school: 'School of Engineering & Technology',
    icon: '⚙️',
    courses: ['B.Tech (CSE, Mechanical, Civil, Electrical)', 'M.Tech', 'Diploma in Engineering'],
  },
  {
    school: 'School of Management',
    icon: '💼',
    courses: ['BBA', 'MBA', 'Ph.D in Management'],
  },
  {
    school: 'School of Health Sciences',
    icon: '🩺',
    courses: ['B.Sc Nursing', 'B.Pharmacy', 'Physiotherapy', 'Paramedical Sciences'],
  },
  {
    school: 'School of Education',
    icon: '📚',
    courses: ['B.Ed', 'M.Ed', 'D.El.Ed'],
  },
  {
    school: 'School of Law',
    icon: '⚖️',
    courses: ['LLB', 'LLM', 'BA LLB (Hons)'],
  },
  {
    school: 'School of Arts & Humanities',
    icon: '🎨',
    courses: ['BA', 'MA', 'Mass Communication'],
  },
]

function Programs() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Academic Programs</h1>
          <p>Undergraduate, postgraduate, and doctoral programs across six schools.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-3">
            {programs.map((p) => (
              <div className="card" key={p.school}>
                <div className="icon">{p.icon}</div>
                <h3>{p.school}</h3>
                <ul style={{ marginTop: 12 }}>
                  {p.courses.map((c) => (
                    <li key={c} className="tag">{c}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Why Study With Us</div>
            <h2>A Curriculum Built for the Real World</h2>
          </div>
          <div className="grid grid-3">
            <div className="card">
              <h3>Industry Aligned</h3>
              <p style={{ fontSize: 14 }}>Curriculum co-designed with industry experts to keep pace with evolving demands.</p>
            </div>
            <div className="card">
              <h3>Experienced Faculty</h3>
              <p style={{ fontSize: 14 }}>Learn from professors and practitioners with deep academic and field experience.</p>
            </div>
            <div className="card">
              <h3>Hands-on Learning</h3>
              <p style={{ fontSize: 14 }}>Labs, workshops, internships, and live projects integrated into every program.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Programs
