import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { CalendarCheck, CalendarDays, LogOut, ShieldCheck, Stethoscope } from 'lucide-react';
import { useAuth } from './auth.jsx';
import Avatar from './components/Avatar.jsx';
import Doctors from './pages/Doctors.jsx';
import Book from './pages/Book.jsx';
import { Login, Register } from './pages/AuthPages.jsx';
import MyAppointments from './pages/MyAppointments.jsx';
import DoctorDashboard from './pages/DoctorDashboard.jsx';
import Admin from './pages/Admin.jsx';

const homeFor = (u) => (u.role === 'admin' ? '/admin' : u.role === 'doctor' ? '/dashboard' : '/');
const only = (role, user, el) => (user.role === role ? el : <Navigate to={homeFor(user)} replace />);

function Nav({ user }) {
  const { logout } = useAuth();
  const nav = useNavigate();
  return (
    <header className="nav">
      <Link to={homeFor(user)} className="brand"><span className="brand-mark"><Stethoscope size={18} /></span>CareSlot</Link>
      <nav>
        <NavLink to="/" end><Stethoscope size={16} /> Doctors</NavLink>
        {user.role === 'patient' && <NavLink to="/appointments"><CalendarCheck size={16} /> My appointments</NavLink>}
        {user.role === 'doctor' && <NavLink to="/dashboard"><CalendarDays size={16} /> My schedule</NavLink>}
        {user.role === 'admin' && <NavLink to="/admin"><ShieldCheck size={16} /> Admin</NavLink>}
      </nav>
      <div className="nav-right">
        <span className="who"><Avatar name={user.name} size={32} /><span>{user.name.split(' ')[0]}</span></span>
        <button className="icon-btn" title="Log out" onClick={() => { logout(); nav('/login'); }}><LogOut size={18} /></button>
      </div>
    </header>
  );
}

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <p className="pad muted">Loading…</p>;

  // Not signed in: the ONLY pages available are Log in and Sign up.
  if (!user) return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );

  // Signed in: everything else.
  return (
    <>
      <Nav user={user} />
      <main>
        <Routes>
          <Route path="/" element={<Doctors />} />
          <Route path="/doctors/:id" element={<Book />} />
          <Route path="/login" element={<Navigate to={homeFor(user)} replace />} />
          <Route path="/register" element={<Navigate to={homeFor(user)} replace />} />
          <Route path="/appointments" element={only('patient', user, <MyAppointments />)} />
          <Route path="/dashboard" element={only('doctor', user, <DoctorDashboard />)} />
          <Route path="/admin" element={only('admin', user, <Admin />)} />
          <Route path="*" element={<p className="pad">Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
