import { useState } from 'react'

function Contact() {
  const [sent, setSent] = useState(false)

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Contact Us</h1>
          <p>We'd love to hear from you. Reach out with any questions.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="contact-wrap">
            <div>
              <div className="eyebrow">Get in Touch</div>
              <h2>Send Us a Message</h2>
              {sent ? (
                <div className="card" style={{ background: 'var(--bg-alt)', border: 'none' }}>
                  <h3>Message Sent</h3>
                  <p>Thank you for reaching out. We'll respond within 1-2 business days.</p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    setSent(true)
                  }}
                >
                  <div className="form-grid">
                    <div>
                      <label htmlFor="c-name">Name</label>
                      <input id="c-name" type="text" required placeholder="Your name" />
                    </div>
                    <div>
                      <label htmlFor="c-email">Email</label>
                      <input id="c-email" type="email" required placeholder="you@example.com" />
                    </div>
                    <div className="full">
                      <label htmlFor="c-subject">Subject</label>
                      <input id="c-subject" type="text" required placeholder="How can we help?" />
                    </div>
                    <div className="full">
                      <label htmlFor="c-message">Message</label>
                      <textarea id="c-message" required placeholder="Write your message here..." />
                    </div>
                    <div className="full">
                      <button type="submit" className="btn btn-primary" style={{ border: 'none', cursor: 'pointer' }}>
                        Send Message
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>

            <div>
              <div className="eyebrow">Reach Us</div>
              <h2>Contact Information</h2>

              <div className="info-item">
                <div className="icon">📍</div>
                <div>
                  <h3 style={{ fontSize: 16 }}>Address</h3>
                  <p style={{ fontSize: 14 }}>Rahon Road, Mandiala Teja, Phagwara, Punjab, India - 144401</p>
                </div>
              </div>
              <div className="info-item">
                <div className="icon">📞</div>
                <div>
                  <h3 style={{ fontSize: 16 }}>Phone</h3>
                  <p style={{ fontSize: 14 }}>+91 98765 43210</p>
                </div>
              </div>
              <div className="info-item">
                <div className="icon">✉️</div>
                <div>
                  <h3 style={{ fontSize: 16 }}>Email</h3>
                  <p style={{ fontSize: 14 }}>info@deshbhagtuniversity.edu</p>
                </div>
              </div>
              <div className="info-item">
                <div className="icon">🕒</div>
                <div>
                  <h3 style={{ fontSize: 16 }}>Office Hours</h3>
                  <p style={{ fontSize: 14 }}>Monday - Saturday, 9:00 AM - 5:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Contact
