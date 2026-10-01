import { useState } from 'react'

function Profile() {
  const [saved, setSaved] = useState(false)

  return (
    <>
      <h1 style={{ fontSize: 28 }}>My Profile</h1>
      <p style={{ marginBottom: 28 }}>View and update your personal information.</p>

      <div className="dash-card" style={{ maxWidth: 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <div className="dash-avatar" style={{ width: 72, height: 72, fontSize: 22 }}>AS</div>
          <div>
            <h3 style={{ margin: 0 }}>Aman Sharma</h3>
            <p style={{ fontSize: 14, margin: 0 }}>B.Tech CSE &middot; Semester 5 &middot; Roll No. DBU21CS045</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSaved(true)
          }}
        >
          <div className="form-grid">
            <div>
              <label htmlFor="p-name">Full Name</label>
              <input id="p-name" type="text" defaultValue="Aman Sharma" />
            </div>
            <div>
              <label htmlFor="p-email">Email</label>
              <input id="p-email" type="email" defaultValue="aman.sharma@dbu.edu" />
            </div>
            <div>
              <label htmlFor="p-phone">Phone</label>
              <input id="p-phone" type="tel" defaultValue="+91 98765 43210" />
            </div>
            <div>
              <label htmlFor="p-dob">Date of Birth</label>
              <input id="p-dob" type="date" defaultValue="2004-03-12" />
            </div>
            <div>
              <label htmlFor="p-program">Program</label>
              <input id="p-program" type="text" defaultValue="B.Tech Computer Science" disabled />
            </div>
            <div>
              <label htmlFor="p-roll">Roll Number</label>
              <input id="p-roll" type="text" defaultValue="DBU21CS045" disabled />
            </div>
            <div className="full">
              <label htmlFor="p-address">Address</label>
              <textarea id="p-address" defaultValue="123 Model Town, Phagwara, Punjab, India" />
            </div>
            <div className="full">
              <button type="submit" className="btn btn-primary" style={{ border: 'none', cursor: 'pointer' }}>
                Save Changes
              </button>
              {saved && <span style={{ marginLeft: 16, color: '#2e7d32', fontSize: 14 }}>Profile updated successfully.</span>}
            </div>
          </div>
        </form>
      </div>

      <div className="dash-card" style={{ maxWidth: 700, marginTop: 24 }}>
        <h3>Change Password</h3>
        <div className="form-grid">
          <div>
            <label htmlFor="p-current">Current Password</label>
            <input id="p-current" type="password" placeholder="••••••••" />
          </div>
          <div>
            <label htmlFor="p-new">New Password</label>
            <input id="p-new" type="password" placeholder="••••••••" />
          </div>
          <div className="full">
            <button type="button" className="btn btn-outline" style={{ color: 'var(--navy)', borderColor: 'var(--navy)', cursor: 'pointer' }}>
              Update Password
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Profile
