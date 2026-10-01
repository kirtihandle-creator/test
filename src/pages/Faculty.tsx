const faculty = [
  { name: 'Dr. Ramesh Kumar', role: 'Vice Chancellor', dept: 'Office of the Vice Chancellor', initials: 'RK' },
  { name: 'Dr. Anita Sharma', role: 'Dean, Engineering & Technology', dept: 'School of Engineering', initials: 'AS' },
  { name: 'Dr. Vikram Singh', role: 'Dean, Management Studies', dept: 'School of Management', initials: 'VS' },
  { name: 'Dr. Neha Gupta', role: 'Dean, Health Sciences', dept: 'School of Health Sciences', initials: 'NG' },
  { name: 'Prof. Sanjay Mehta', role: 'Dean, Law', dept: 'School of Law', initials: 'SM' },
  { name: 'Dr. Priya Verma', role: 'Dean, Education', dept: 'School of Education', initials: 'PV' },
  { name: 'Dr. Arjun Rao', role: 'Head, Computer Science', dept: 'School of Engineering', initials: 'AR' },
  { name: 'Dr. Kavita Nair', role: 'Head, Arts & Humanities', dept: 'School of Arts', initials: 'KN' },
]

function Faculty() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Our Faculty</h1>
          <p>Meet the experienced educators and leaders guiding our students.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-4">
            {faculty.map((f) => (
              <div className="person" key={f.name}>
                <div className="avatar">{f.initials}</div>
                <h3 style={{ fontSize: 17 }}>{f.name}</h3>
                <div className="role">{f.role}</div>
                <p style={{ fontSize: 13, marginTop: 6 }}>{f.dept}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2>Join Our Team</h2>
          <p style={{ maxWidth: 500, margin: '0 auto 24px' }}>
            We are always looking for passionate educators and researchers to join our
            growing academic community.
          </p>
          <a href="mailto:careers@deshbhagtuniversity.edu" className="btn btn-primary">
            View Faculty Openings
          </a>
        </div>
      </section>
    </>
  )
}

export default Faculty
