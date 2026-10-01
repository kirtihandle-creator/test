import { useState } from 'react'

const steps = [
  { title: 'Submit Application', text: 'Fill out the online application form with your personal and academic details.' },
  { title: 'Document Verification', text: 'Upload required documents for verification by our admissions team.' },
  { title: 'Entrance / Interview', text: 'Appear for an entrance test or interview, as applicable to your chosen program.' },
  { title: 'Offer & Enrollment', text: 'Receive your offer letter and complete enrollment formalities to secure your seat.' },
]

function Admissions() {
  const [submitted, setSubmitted] = useState(false)

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Admissions</h1>
          <p>Your journey at Desh Bhagt University starts here.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">How It Works</div>
            <h2>Admission Process</h2>
          </div>
          <div className="timeline">
            {steps.map((s, i) => (
              <div className="step" key={s.title}>
                <h3>{i + 1}. {s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">Apply Now</div>
            <h2>Application Form</h2>
            <p>Fill in your details and our admissions team will get in touch with you.</p>
          </div>

          {submitted ? (
            <div className="card" style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
              <h3>Thank You!</h3>
              <p>Your application has been received. Our admissions team will contact you shortly.</p>
            </div>
          ) : (
            <form
              className="card"
              style={{ maxWidth: 800, margin: '0 auto' }}
              onSubmit={(e) => {
                e.preventDefault()
                setSubmitted(true)
              }}
            >
              <div className="form-grid">
                <div>
                  <label htmlFor="name">Full Name</label>
                  <input id="name" type="text" required placeholder="Your full name" />
                </div>
                <div>
                  <label htmlFor="email">Email Address</label>
                  <input id="email" type="email" required placeholder="you@example.com" />
                </div>
                <div>
                  <label htmlFor="phone">Phone Number</label>
                  <input id="phone" type="tel" required placeholder="+91 98765 43210" />
                </div>
                <div>
                  <label htmlFor="program">Program of Interest</label>
                  <select id="program" required defaultValue="">
                    <option value="" disabled>Select a program</option>
                    <option>B.Tech</option>
                    <option>MBA</option>
                    <option>B.Sc Nursing</option>
                    <option>B.Ed</option>
                    <option>LLB</option>
                    <option>BA / MA</option>
                  </select>
                </div>
                <div className="full">
                  <label htmlFor="message">Message (optional)</label>
                  <textarea id="message" placeholder="Tell us anything else we should know" />
                </div>
                <div className="full">
                  <button type="submit" className="btn btn-primary" style={{ border: 'none', cursor: 'pointer' }}>
                    Submit Application
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  )
}

export default Admissions
