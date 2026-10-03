import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Award, CalendarDays, Clock, IndianRupee } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth.jsx';
import Avatar from '../components/Avatar.jsx';

const iso = (d) => d.toLocaleDateString('en-CA');
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const part = (t) => { const h = +t.slice(0, 2); return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'; };

export default function Book() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const days = useMemo(() => Array.from({ length: 21 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; }), []);
  const [doc, setDoc] = useState(null);
  const [date, setDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/doctors/${id}`).then((d) => { setDoc(d); setDate(iso(days.find((x) => d.availableDays.includes(x.getDay())) || days[0])); })
      .catch((e) => setMsg({ type: 'error', text: e.message }));
  }, [id]);
  const loadSlots = () => date && api(`/doctors/${id}/slots?date=${date}`).then((d) => setSlots(d.slots)).catch((e) => setMsg({ type: 'error', text: e.message }));
  useEffect(() => { setTime(''); loadSlots(); }, [id, date]);

  async function submit() {
    setBusy(true); setMsg({ type: '', text: '' });
    try { await api('/appointments', { method: 'POST', body: { doctorId: id, date, time, reason } }); nav('/appointments'); }
    catch (e) { setMsg({ type: 'error', text: e.message }); loadSlots(); setTime(''); }
    finally { setBusy(false); }
  }

  if (!doc) return <p className="pad muted">{msg.text || 'Loading…'}</p>;
  const pretty = date && new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <section className="wrap">
      <Link to="/" className="back"><ArrowLeft size={16} /> All doctors</Link>
      <div className="book-grid">
        <aside className="profile">
          <Avatar name={doc.name} size={84} />
          <h2>{doc.name}</h2>
          <span className="spec-pill">{doc.specialization}</span>
          <p className="muted">{doc.about}</p>
          <ul className="facts">
            <li><Award size={16} /> {doc.experience} years experience</li>
            <li><IndianRupee size={16} /> ₹{doc.fees} per visit</li>
            <li><Clock size={16} /> {doc.slotMinutes}-minute slots, {doc.slotStart}–{doc.slotEnd}</li>
            <li><CalendarDays size={16} /> {doc.availableDays.map((d) => WD[d]).join(', ')}</li>
          </ul>
        </aside>

        <div className="booking">
          <h3>1. Pick a date</h3>
          <div className="datestrip">
            {days.map((d) => {
              const ok = doc.availableDays.includes(d.getDay());
              return (
                <button key={iso(d)} disabled={!ok} className={`day ${date === iso(d) ? 'on' : ''}`} onClick={() => setDate(iso(d))}>
                  <small>{WD[d.getDay()]}</small><b>{d.getDate()}</b><small>{d.toLocaleDateString(undefined, { month: 'short' })}</small>
                </button>
              );
            })}
          </div>

          <h3>2. Pick a time</h3>
          {slots.length === 0 && <p className="muted">No slots on this day.</p>}
          {['Morning', 'Afternoon', 'Evening'].map((g) => {
            const items = slots.filter((s) => part(s.time) === g);
            return items.length > 0 && (
              <div key={g}><p className="group">{g}</p>
                <div className="slots">{items.map((s) => (
                  <button key={s.time} disabled={!s.available} className={`slot ${time === s.time ? 'on' : ''}`} onClick={() => setTime(s.time)}>{s.time}</button>
                ))}</div></div>
            );
          })}

          {user?.role === 'patient' ? (
            <>
              <h3>3. Reason for visit <span className="muted small">(optional)</span></h3>
              <textarea rows="3" placeholder="e.g. chest pain since yesterday" value={reason} onChange={(e) => setReason(e.target.value)} />
              {msg.text && <p className={msg.type}>{msg.text}</p>}
              <div className="summary">
                <div><small>Your appointment</small><b>{time ? `${pretty} · ${time}` : 'Choose a time slot'}</b></div>
                <button className="btn big" disabled={!time || busy} onClick={submit}>{busy ? 'Booking…' : 'Confirm booking'}</button>
              </div>
            </>
          ) : user ? <p className="notice">Only patient accounts can book appointments.</p>
            : <div className="summary"><div><small>Log in to book</small><b>It takes less than a minute</b></div><Link to="/login" className="btn big">Log in</Link></div>}
        </div>
      </div>
    </section>
  );
}
