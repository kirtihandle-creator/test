import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <h4>Desh Bhagt University</h4>
            <p style={{ fontSize: 14 }}>
              A leading center of higher education committed to academic excellence,
              research, and nation-building since 1996.
            </p>
          </div>
          <div>
            <h4>Explore</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/programs">Programs</Link></li>
              <li><Link to="/faculty">Faculty</Link></li>
              <li><Link to="/admissions">Admissions</Link></li>
              <li><Link to="/news">News & Events</Link></li>
              <li><Link to="/gallery">Gallery</Link></li>
            </ul>
          </div>
          <div>
            <h4>Resources</h4>
            <ul>
              <li><Link to="/admissions">Apply Now</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/programs">Academic Calendar</Link></li>
              <li><Link to="/about">Campus Life</Link></li>
            </ul>
          </div>
          <div>
            <h4>Contact</h4>
            <ul>
              <li>Rahon Road, Mandiala Teja</li>
              <li>Phagwara, Punjab, India</li>
              <li>+91 98765 43210</li>
              <li>info@deshbhagtuniversity.edu</li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          © {new Date().getFullYear()} Desh Bhagt University. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default Footer
