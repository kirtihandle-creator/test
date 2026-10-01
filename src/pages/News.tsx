const news = [
  {
    title: 'Desh Bhagt University Signs MoU with Industry Partner',
    date: '02 Sep 2026',
    category: 'Announcement',
    excerpt: 'The university has partnered with a leading tech firm to offer internships and live projects to engineering students.',
  },
  {
    title: 'Annual Cultural Fest "Josh 2026" Concludes Successfully',
    date: '20 Aug 2026',
    category: 'Campus Life',
    excerpt: 'Students showcased talent across music, dance, and drama in a three-day celebration attended by thousands.',
  },
  {
    title: 'DBU Research Team Publishes Paper in International Journal',
    date: '10 Aug 2026',
    category: 'Research',
    excerpt: 'Faculty and students from the School of Engineering contributed to a study on renewable energy systems.',
  },
  {
    title: 'Placement Drive Brings 40+ Companies to Campus',
    date: '28 Jul 2026',
    category: 'Placements',
    excerpt: 'Students across all schools participated in the biggest placement drive of the year, with offers from top recruiters.',
  },
]

const events = [
  { title: 'Annual Convocation Ceremony', date: '15 Dec 2026', location: 'Main Auditorium' },
  { title: 'National Level Tech Symposium', date: '22 Nov 2026', location: 'Engineering Block' },
  { title: 'Inter-University Sports Meet', date: '05 Nov 2026', location: 'Sports Complex' },
  { title: 'Career Guidance Workshop', date: '18 Oct 2026', location: 'Seminar Hall' },
]

function News() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>News &amp; Events</h1>
          <p>Stay updated with the latest happenings at Desh Bhagt University.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Latest Updates</div>
            <h2>News</h2>
          </div>
          <div className="grid grid-2">
            {news.map((n) => (
              <div className="card" key={n.title}>
                <span className="tag">{n.category}</span>
                <h3 style={{ marginTop: 10 }}>{n.title}</h3>
                <p style={{ fontSize: 14 }}>{n.excerpt}</p>
                <div className="dash-time">{n.date}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">What's Coming Up</div>
            <h2>Upcoming Events</h2>
          </div>
          <div className="timeline">
            {events.map((e) => (
              <div className="step" key={e.title}>
                <h3>{e.title}</h3>
                <p>{e.date} &middot; {e.location}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default News
