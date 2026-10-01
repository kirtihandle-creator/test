import { Link } from 'react-router-dom'

const stats = [
  { num: '25+', label: 'Years of Excellence' },
  { num: '15,000+', label: 'Alumni Worldwide' },
  { num: '60+', label: 'Programs Offered' },
  { num: '300+', label: 'Expert Faculty' },
]

const highlights = [
  {
    icon: '🎓',
    title: 'Quality Education',
    text: 'UGC-recognized programs across engineering, management, health sciences, and the arts.',
  },
  {
    icon: '🔬',
    title: 'Research Driven',
    text: 'State-of-the-art labs and research centers fostering innovation and real-world impact.',
  },
  {
    icon: '🌍',
    title: 'Global Exposure',
    text: 'Exchange programs and collaborations with international universities and industry.',
  },
  {
    icon: '💼',
    title: 'Placement Support',
    text: 'Dedicated career cell connecting students with leading recruiters every year.',
  },
]

function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="tagline">Shaping Futures Since 1996</div>
          <h1>Welcome to Desh Bhagt University</h1>
          <p>
            Empowering students with knowledge, skills, and values to become responsible
            leaders and changemakers for the nation and the world.
          </p>
          <div className="actions">
            <Link to="/admissions" className="btn btn-primary">Apply Now</Link>
            <Link to="/programs" className="btn btn-outline">Explore Programs</Link>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="stats">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="num">{s.num}</div>
                <div className="label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Why Choose Us</div>
            <h2>Excellence in Every Endeavor</h2>
            <p>
              We combine rigorous academics with holistic development to prepare students
              for a rapidly changing world.
            </p>
          </div>
          <div className="grid grid-4">
            {highlights.map((h) => (
              <div className="card" key={h.title}>
                <div className="icon">{h.icon}</div>
                <h3>{h.title}</h3>
                <p style={{ fontSize: 14 }}>{h.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid grid-2" style={{ alignItems: 'center' }}>
            <div>
              <div className="eyebrow">About the University</div>
              <h2>A Legacy of Nation-Building Education</h2>
              <p>
                Desh Bhagt University was established with a vision to provide accessible,
                high-quality education rooted in the spirit of patriotism and service.
                Over the years, it has grown into a multi-disciplinary institution offering
                undergraduate, postgraduate, and doctoral programs across diverse fields.
              </p>
              <p>
                Our campus provides a vibrant environment for learning, research, sports,
                and cultural activities — nurturing well-rounded individuals ready to make
                a difference.
              </p>
              <Link to="/about" className="btn btn-primary">Learn More About Us</Link>
            </div>
            <div className="card" style={{ background: 'var(--bg-alt)', border: 'none' }}>
              <ul className="check-list">
                <li><span className="mark">✓</span> UGC recognized and NAAC accredited</li>
                <li><span className="mark">✓</span> Modern campus with world-class infrastructure</li>
                <li><span className="mark">✓</span> Industry-aligned curriculum</li>
                <li><span className="mark">✓</span> Scholarships for meritorious students</li>
                <li><span className="mark">✓</span> Strong alumni network across the globe</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2>Ready to Begin Your Journey?</h2>
          <p style={{ maxWidth: 500, margin: '0 auto 24px' }}>
            Admissions for the upcoming academic session are now open. Take the first step
            toward a brighter future.
          </p>
          <Link to="/admissions" className="btn btn-primary">Start Your Application</Link>
        </div>
      </section>
    </>
  )
}

export default Home
