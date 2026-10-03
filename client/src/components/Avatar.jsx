const hues = [215, 170, 260, 340, 25, 190, 290, 140];
export default function Avatar({ name = '?', size = 48 }) {
  const clean = name.replace(/^Dr\.?\s*/i, '');
  const h = hues[[...clean].reduce((a, c) => a + c.charCodeAt(0), 0) % hues.length];
  const initials = clean.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(135deg,hsl(${h} 80% 62%),hsl(${h + 25} 75% 45%))` }}>{initials}</span>;
}
