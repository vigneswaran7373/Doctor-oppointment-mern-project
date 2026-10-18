import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FileText } from 'lucide-react';
import { api } from '../api';
import { Badge } from '../components/Badge.jsx';

const today = () => new Date().toLocaleDateString('en-CA');

function Card({ a, onCancel }) {
  const d = new Date(`${a.date}T00:00:00`);
  return (
    <article className="appt">
      <div className="datebox"><small>{d.toLocaleDateString(undefined, { month: 'short' })}</small><b>{d.getDate()}</b><small>{d.toLocaleDateString(undefined, { weekday: 'short' })}</small></div>
      <div className="appt-main">
        <h3>{a.doctor?.name || 'Doctor removed'}</h3>
        <span className="muted">{a.doctor?.specialization}</span>
        <div className="appt-meta"><span><Clock size={14} /> {a.time}</span>{a.reason && <span><FileText size={14} /> {a.reason}</span>}</div>
      </div>
      <div className="appt-side"><Badge status={a.status} />{['booked', 'confirmed'].includes(a.status) && <button className="btn ghost sm danger" onClick={() => onCancel(a._id)}>Cancel</button>}</div>
    </article>
  );
}

export default function MyAppointments() {
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  const load = () => api('/appointments/mine').then(setList).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  const cancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    try { await api(`/appointments/${id}/cancel`, { method: 'PATCH' }); load(); } catch (e) { setErr(e.message); }
  };
  const upcoming = (list || []).filter((a) => a.date >= today() && ['booked', 'confirmed'].includes(a.status)).reverse();
  const past = (list || []).filter((a) => !upcoming.includes(a));

  return (
    <section className="wrap narrowish">
      <h1 className="page-title">My appointments</h1>
      {err && <p className="error">{err}</p>}
      {!list ? <p className="muted">Loading…</p> : list.length === 0 ? (
        <div className="empty"><p>You have no appointments yet.</p><Link className="btn" to="/">Find a doctor</Link></div>
      ) : (
        <>
          <h3 className="group-title">Upcoming ({upcoming.length})</h3>
          {upcoming.length === 0 && <p className="muted">Nothing upcoming.</p>}
          {upcoming.map((a) => <Card key={a._id} a={a} onCancel={cancel} />)}
          {past.length > 0 && <><h3 className="group-title">Past & cancelled</h3>{past.map((a) => <Card key={a._id} a={a} onCancel={cancel} />)}</>}
        </>
      )}
    </section>
  );
}
