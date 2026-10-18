import { useEffect, useState } from 'react';
import { api } from '../api';
import { CalendarCheck, Stethoscope, XCircle } from 'lucide-react';
import { Badge } from '../components/Badge.jsx';

const blank = { name: '', specialization: '', experience: 0, fees: 500, about: '', email: '', password: '' };

export default function Admin() {
  const [docs, setDocs] = useState([]);
  const [appts, setAppts] = useState([]);
  const [form, setForm] = useState(blank);
  const [msg, setMsg] = useState('');
  const load = () => {
    api('/doctors').then(setDocs).catch((e) => setMsg(e.message));
    api('/appointments').then(setAppts).catch((e) => setMsg(e.message));
  };
  useEffect(load, []);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const add = async (e) => {
    e.preventDefault(); setMsg('');
    try {
      await api('/doctors', { method: 'POST', body: { ...form, experience: +form.experience, fees: +form.fees } });
      setForm(blank); load();
    } catch (x) { setMsg(x.message); }
  };
  const remove = async (id) => {
    if (!confirm('Remove this doctor and cancel their appointments?')) return;
    try { await api(`/doctors/${id}`, { method: 'DELETE' }); load(); } catch (x) { setMsg(x.message); }
  };

  return (
    <section className="wrap">
      <h1 className="page-title">Admin</h1>
      {msg && <p className="error">{msg}</p>}
      <div className="stats">
        {[['Doctors', docs.length, Stethoscope], ['Appointments', appts.length, CalendarCheck], ['Upcoming', appts.filter((a) => ['booked', 'confirmed'].includes(a.status)).length, CalendarCheck], ['Cancelled', appts.filter((a) => a.status === 'cancelled').length, XCircle]]
          .map(([l, v, Icon]) => <div className="stat" key={l}><span className="stat-icon"><Icon size={18} /></span><b>{v}</b><span>{l}</span></div>)}
      </div>
      <h3 className="group-title">Add doctor</h3>
      <form className="adminform card" onSubmit={add}>
        <input required placeholder="Name (Dr. …)" value={form.name} onChange={set('name')} />
        <input required placeholder="Specialization" value={form.specialization} onChange={set('specialization')} />
        <input type="number" min="0" placeholder="Experience (yrs)" value={form.experience} onChange={set('experience')} />
        <input type="number" min="0" placeholder="Fees ₹" value={form.fees} onChange={set('fees')} />
        <input placeholder="Login email" type="email" value={form.email} onChange={set('email')} />
        <input placeholder="Login password" type="password" value={form.password} onChange={set('password')} />
        <input className="full" placeholder="About" value={form.about} onChange={set('about')} />
        <button className="btn">Add doctor</button>
      </form>

      <h3 className="group-title">Doctors ({docs.length})</h3>
      <div className="table">
        {docs.map((d) => (
          <div className="trow" key={d._id}>
            <strong>{d.name}</strong><span>{d.specialization}</span><span>₹{d.fees}</span>
            <button className="btn ghost" onClick={() => remove(d._id)}>Remove</button>
          </div>
        ))}
      </div>

      <h3 className="group-title">All appointments ({appts.length})</h3>
      <div className="table">
        {appts.map((a) => (
          <div className="trow wide" key={a._id}>
            <span>{a.patient?.name}</span><span>{a.doctor?.name || '—'}</span>
            <span>{a.date} {a.time}</span><Badge status={a.status} /><span />
          </div>
        ))}
      </div>
    </section>
  );
}
