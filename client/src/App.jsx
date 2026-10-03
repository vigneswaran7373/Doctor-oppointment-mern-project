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

function Guard({ roles, children }) {
  const { user, ready } = useAuth();
  if (!ready) return <p className="muted pad">Loading…</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function Nav() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <header className="nav">
      <Link to="/" className="brand"><span className="brand-mark"><Stethoscope size={18} /></span>CareSlot</Link>
      <nav>
        <NavLink to="/" end><Stethoscope size={16} /> Doctors</NavLink>
        {user?.role === 'patient' && <NavLink to="/appointments"><CalendarCheck size={16} /> My appointments</NavLink>}
        {user?.role === 'doctor' && <NavLink to="/dashboard"><CalendarDays size={16} /> My schedule</NavLink>}
        {user?.role === 'admin' && <NavLink to="/admin"><ShieldCheck size={16} /> Admin</NavLink>}
      </nav>
      <div className="nav-right">
        {user ? (
          <>
            <span className="who"><Avatar name={user.name} size={32} /><span>{user.name.split(' ')[0]}</span></span>
            <button className="icon-btn" title="Log out" onClick={() => { logout(); nav('/'); }}><LogOut size={18} /></button>
          </>
        ) : (
          <><NavLink to="/login" className="textlink">Log in</NavLink><NavLink to="/register" className="btn sm">Sign up</NavLink></>
        )}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Doctors />} />
          <Route path="/doctors/:id" element={<Book />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/appointments" element={<Guard roles={['patient']}><MyAppointments /></Guard>} />
          <Route path="/dashboard" element={<Guard roles={['doctor']}><DoctorDashboard /></Guard>} />
          <Route path="/admin" element={<Guard roles={['admin']}><Admin /></Guard>} />
          <Route path="*" element={<p className="pad">Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
