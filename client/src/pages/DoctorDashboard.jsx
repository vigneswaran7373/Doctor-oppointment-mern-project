import { useEffect, useState } from 'react';
import { Check, CheckCheck, Clock, Hourglass, X } from 'lucide-react';
import { api } from '../api';
import { Badge } from '../components/Badge.jsx';
import Avatar from '../components/Avatar.jsx';

const today = () => new Date().toLocaleDateString('en-CA');

export default function DoctorDashboard() {
  const [list, setList] = useState(null);
  const [err, setErr] = useState('');
  const load = () => api('/appointments/doctor').then(setList).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  const act = async (id, path, body) => { try { await api(`/appointments/${id}/${path}`, { method: 'PATCH', body }); load(); } catch (e) { setErr(e.message); } };

  const all = list || [];
  const stats = [
    ['Today', all.filter((a) => a.date === today() && a.status !== 'cancelled').length, Clock],
    ['Awaiting confirmation', all.filter((a) => a.status === 'booked').length, Hourglass],
    ['Confirmed', all.filter((a) => a.status === 'confirmed').length, Check],
    ['Completed', all.filter((a) => a.status === 'completed').length, CheckCheck],
  ];

  return (
    <section className="wrap">
      <h1 className="page-title">My schedule</h1>
      {err && <p className="error">{err}</p>}
      <div className="stats">{stats.map(([l, v, Icon]) => <div className="stat" key={l}><span className="stat-icon"><Icon size={18} /></span><b>{v}</b><span>{l}</span></div>)}</div>
      {!list ? <p className="muted">Loading…</p> : all.length === 0 ? <p className="empty">No appointments yet.</p> : (
        <div className="stack">
          {all.map((a) => (
            <article className="appt" key={a._id}>
              <div className="datebox"><small>{a.date.slice(5)}</small><b>{a.time}</b></div>
              <div className="appt-main">
                <div className="who2"><Avatar name={a.patient?.name || '?'} size={34} /><div><h3>{a.patient?.name}</h3><span className="muted small">{a.patient?.phone || a.patient?.email}</span></div></div>
                {a.reason && <p className="reason">“{a.reason}”</p>}
              </div>
              <div className="appt-side">
                <Badge status={a.status} />
                <div className="row gap">
                  {a.status === 'booked' && <button className="btn sm" onClick={() => act(a._id, 'status', { status: 'confirmed' })}>Confirm</button>}
                  {a.status === 'confirmed' && <button className="btn sm" onClick={() => act(a._id, 'status', { status: 'completed' })}>Complete</button>}
                  {['booked', 'confirmed'].includes(a.status) && <button className="icon-btn danger" title="Cancel" onClick={() => act(a._id, 'cancel')}><X size={16} /></button>}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
