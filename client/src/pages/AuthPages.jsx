import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarCheck, ShieldCheck, Stethoscope, Zap } from 'lucide-react';
import { useAuth } from '../auth.jsx';

const home = (u) => (u.role === 'admin' ? '/admin' : u.role === 'doctor' ? '/dashboard' : '/');

function Form({ title, sub, fields, onSubmit, footer, quick }) {
  const [vals, setVals] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <div className="auth">
      <section className="auth-brand">
        <span className="brand-mark big"><Stethoscope size={26} /></span>
        <h1>Healthcare, scheduled.</h1>
        <p>Book trusted doctors in a few taps.</p>
        <ul>
          <li><Zap size={18} /> Live slot availability, no phone calls</li>
          <li><CalendarCheck size={18} /> Confirm, track and cancel in one place</li>
          <li><ShieldCheck size={18} /> Secure, private accounts</li>
        </ul>
      </section>
      <main className="auth-form">
        <div className="auth-card">
          <h2>{title}</h2>
          <p className="muted">{sub}</p>
          {quick && <div className="quick"><span className="small muted">Try a demo:</span>{quick.map(([l, e]) => <button type="button" key={e} className="chip" onClick={() => setVals({ email: e, password: 'password123' })}>{l}</button>)}</div>}
          <form onSubmit={async (e) => { e.preventDefault(); setBusy(true); setErr(''); try { await onSubmit(vals); } catch (x) { setErr(x.message); } finally { setBusy(false); } }}>
            {fields.map(([name, label, type = 'text', req = true]) => (
              <label key={name}>{label}<input type={type} required={req} value={vals[name] || ''} onChange={(e) => setVals({ ...vals, [name]: e.target.value })} /></label>
            ))}
            {err && <p className="error">{err}</p>}
            <button className="btn big wide" disabled={busy}>{busy ? 'Please wait…' : title}</button>
          </form>
          <p className="muted small center">{footer}</p>
        </div>
      </main>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  return <Form title="Log in" sub="Welcome back to CareSlot." fields={[['email', 'Email', 'email'], ['password', 'Password', 'password']]}
    quick={[['Patient', 'patient@clinic.com'], ['Doctor', 'doctor1@clinic.com'], ['Admin', 'admin@clinic.com']]}
    onSubmit={async (v) => nav(home(await login(v.email, v.password)))} footer={<>New here? <Link to="/register">Create an account</Link></>} />;
}

export function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  return <Form title="Sign up" sub="Create a patient account to start booking."
    fields={[['name', 'Full name'], ['email', 'Email', 'email'], ['phone', 'Phone', 'tel', false], ['password', 'Password (6+ characters)', 'password']]}
    onSubmit={async (v) => { await register(v); nav('/'); }} footer={<>Already registered? <Link to="/login">Log in</Link></>} />;
}
