import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, Search } from 'lucide-react';
import { api } from '../api';
import Avatar from '../components/Avatar.jsx';

export default function Doctors() {
  const [q, setQ] = useState('');
  const [spec, setSpec] = useState('');
  const [specs, setSpecs] = useState([]);
  const [list, setList] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { api('/doctors/specializations').then(setSpecs).catch(() => {}); }, []);
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      api(`/doctors?q=${encodeURIComponent(q)}&specialization=${encodeURIComponent(spec)}`)
        .then((d) => { setList(d); setErr(''); }).catch((e) => setErr(e.message)).finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [q, spec]);

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <span className="eyebrow">Trusted doctors · instant booking</span>
          <h1>Find the right doctor.<br />Book in seconds.</h1>
          <label className="search-big"><Search size={20} /><input placeholder="Search by doctor name or specialty" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        </div>
      </section>
      <section className="wrap">
        <div className="chips">
          <button className={`chip ${spec === '' ? 'on' : ''}`} onClick={() => setSpec('')}>All</button>
          {specs.map((s) => <button key={s} className={`chip ${spec === s ? 'on' : ''}`} onClick={() => setSpec(s)}>{s}</button>)}
        </div>
        {err && <p className="error">{err}</p>}
        {loading ? <p className="muted">Loading doctors…</p> : list.length === 0 ? <p className="empty">No doctors match your search.</p> : (
          <>
            <p className="muted small">{list.length} doctor{list.length > 1 ? 's' : ''} available</p>
            <div className="grid">
              {list.map((d) => (
                <article key={d._id} className="doc">
                  <div className="doc-head"><Avatar name={d.name} size={56} />
                    <div><h3>{d.name}</h3><span className="spec-pill">{d.specialization}</span></div></div>
                  <p className="about">{d.about}</p>
                  <div className="doc-meta"><span><Award size={14} /> {d.experience} yrs experience</span></div>
                  <div className="doc-foot"><div><small>Consultation fee</small><b>₹{d.fees}</b></div><Link className="btn" to={`/doctors/${d._id}`}>Book appointment</Link></div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
