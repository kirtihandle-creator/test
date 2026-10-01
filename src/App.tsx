import { Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import DashboardLayout from './components/DashboardLayout'
import Home from './pages/Home'
import About from './pages/About'
import Programs from './pages/Programs'
import Admissions from './pages/Admissions'
import Faculty from './pages/Faculty'
import News from './pages/News'
import Gallery from './pages/Gallery'
import Contact from './pages/Contact'
import Overview from './pages/dashboard/Overview'
import Courses from './pages/dashboard/Courses'
import Grades from './pages/dashboard/Grades'
import Attendance from './pages/dashboard/Attendance'
import Fees from './pages/dashboard/Fees'
import Profile from './pages/dashboard/Profile'
import Timetable from './pages/dashboard/Timetable'

function SiteLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100svh' }}>
      <Header />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/programs" element={<Programs />} />
          <Route path="/admissions" element={<Admissions />} />
          <Route path="/faculty" element={<Faculty />} />
          <Route path="/news" element={<News />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route
        path="/dashboard/*"
        element={
          <DashboardLayout>
            <Routes>
              <Route index element={<Overview />} />
              <Route path="courses" element={<Courses />} />
              <Route path="timetable" element={<Timetable />} />
              <Route path="grades" element={<Grades />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="fees" element={<Fees />} />
              <Route path="profile" element={<Profile />} />
            </Routes>
          </DashboardLayout>
        }
      />
      <Route path="/*" element={<SiteLayout />} />
    </Routes>
  )
}

export default App
