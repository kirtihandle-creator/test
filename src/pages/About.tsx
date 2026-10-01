const values = [
  { title: 'Integrity', text: 'Upholding honesty and strong ethical values in all endeavors.' },
  { title: 'Excellence', text: 'Striving for the highest standards in teaching, research, and service.' },
  { title: 'Patriotism', text: 'Instilling a deep sense of responsibility toward the nation.' },
  { title: 'Innovation', text: 'Encouraging creativity and forward-thinking solutions.' },
]

function About() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>About Desh Bhagt University</h1>
          <p>Building knowledge, character, and leadership since 1996.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-2" style={{ alignItems: 'center' }}>
            <div>
              <div className="eyebrow">Our Story</div>
              <h2>A Journey of Growth and Impact</h2>
              <p>
                Founded in 1996, Desh Bhagt University began with a mission to make quality
                higher education accessible to students from all walks of life. What started
                as a small institution has since grown into a thriving multi-disciplinary
                university, offering programs across engineering, management, health sciences,
                education, law, and the humanities.
              </p>
              <p>
                Guided by our motto of service to the nation, we focus on producing graduates
                who are not only professionally skilled but also socially responsible citizens.
              </p>
            </div>
            <div className="card" style={{ background: 'var(--bg-alt)', border: 'none' }}>
              <h3>Vision</h3>
              <p style={{ fontSize: 14 }}>
                To be a globally recognized center of academic excellence that nurtures
                capable, ethical, and future-ready individuals.
              </p>
              <h3 style={{ marginTop: 20 }}>Mission</h3>
              <p style={{ fontSize: 14 }}>
                To deliver transformative education through innovative teaching, impactful
                research, and strong industry partnerships — while fostering values of
                integrity and national service.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">What Drives Us</div>
            <h2>Our Core Values</h2>
          </div>
          <div className="grid grid-4">
            {values.map((v) => (
              <div className="card" key={v.title}>
                <h3>{v.title}</h3>
                <p style={{ fontSize: 14 }}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Our Campus</div>
            <h2>Infrastructure Built for Learning</h2>
            <p>
              Spread across acres of green campus, our facilities support academics, research,
              sports, and student life.
            </p>
          </div>
          <div className="grid grid-4">
            {[
              'Smart Classrooms',
              'Central Library',
              'Research Labs',
              'Sports Complex',
              'Student Hostels',
              'Health Center',
              'Auditorium',
              'Wi-Fi Campus',
            ].map((item) => (
              <div className="card" key={item} style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: 16 }}>{item}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default About
