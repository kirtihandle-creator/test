import { useState } from 'react'

const categories = ['All', 'Campus', 'Events', 'Sports', 'Convocation']

const photos = [
  { title: 'Main Academic Block', category: 'Campus', color: '#0b2545' },
  { title: 'Central Library', category: 'Campus', color: '#c9972d' },
  { title: 'Annual Cultural Fest', category: 'Events', color: '#2e7d32' },
  { title: 'Tech Symposium 2026', category: 'Events', color: '#6b4fa0' },
  { title: 'Inter-University Cricket Finals', category: 'Sports', color: '#c62828' },
  { title: 'Sports Complex', category: 'Sports', color: '#00838f' },
  { title: 'Convocation Ceremony 2025', category: 'Convocation', color: '#8d5524' },
  { title: 'Graduating Batch Photo', category: 'Convocation', color: '#37474f' },
  { title: 'Student Hostel Block', category: 'Campus', color: '#4527a0' },
  { title: 'Research Lab', category: 'Campus', color: '#00695c' },
  { title: 'Freshers Welcome Party', category: 'Events', color: '#ad1457' },
  { title: 'Athletics Meet', category: 'Sports', color: '#ef6c00' },
]

function Gallery() {
  const [active, setActive] = useState('All')
  const filtered = active === 'All' ? photos : photos.filter((p) => p.category === active)

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Campus Gallery</h1>
          <p>A glimpse into campus life, events, and milestones at Desh Bhagt University.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 36 }}>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                style={{
                  border: '1px solid var(--border)',
                  background: active === c ? 'var(--navy)' : '#fff',
                  color: active === c ? '#fff' : 'var(--text)',
                  padding: '8px 20px',
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-3">
            {filtered.map((p) => (
              <div className="card" key={p.title} style={{ padding: 0, overflow: 'hidden' }}>
                <div
                  style={{
                    height: 160,
                    background: p.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: 13,
                    fontWeight: 600,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                  }}
                >
                  {p.category}
                </div>
                <div style={{ padding: 18 }}>
                  <h3 style={{ fontSize: 16, margin: 0 }}>{p.title}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default Gallery
