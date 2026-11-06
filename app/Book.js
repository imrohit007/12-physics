'use client';
import { useEffect, useRef, useState } from 'react';
import { LESSONS } from './lessons';
import { Circled } from './kit';

const N = LESSONS.length;
const KEY = 'mcm-book-v1';

function Bulbs({ done, i }) {
  return (
    <span className="bulbs">
      {LESSONS.map((_, k) => (
        <svg key={k} viewBox="0 0 10 14" className={(done[k] ? 'lit ' : '') + (k === i ? 'cur' : '')}>
          <path d="M5 1a4 4 0 0 0-2.4 7.2c.6.5.9 1 .9 1.8h3c0-.8.3-1.3.9-1.8A4 4 0 0 0 5 1z" />
          <rect x="3.5" y="10.6" width="3" height="2.2" rx=".6" />
        </svg>
      ))}
    </span>
  );
}

function LeftPage({ i, st, act }) {
  const L = LESSONS[i], pick = st.pred[i], open = st.flap[i], count = Object.keys(st.done).length;
  return (
    <div className="pg pg-l">
      <div className="run">Chapter 4 · Moving Charges and Magnetism</div>
      <aside className="notes">{L.margin.map((m, k) => <div key={k}>{m}</div>)}</aside>
      <div className="main">
        <div className="kicker">Lesson {i + 1} <span className="sec">NCERT § {L.sec}</span></div>
        <h1>{L.title}</h1>
        <div className="intro">{L.intro.map((p, k) => <p key={k}>{p}</p>)}</div>
        <div className="eq" tabIndex={0}>
          <div className="eq-big">{L.eq.big}</div>
          <div className="eq-say">{L.eq.say}</div>
          <div className="eq-units">{L.eq.units}</div>
          <div className="tip"><b>The equation</b><div className="tip-eq">{L.eq.big}</div><p>{L.eq.tip}</p></div>
        </div>
        <div className="kicker">Key words</div>
        <dl className="keys">{L.keys.map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}</dl>
        <div className="kicker">Predict</div>
        <p className="q">{L.predict.q}</p>
        <ul className="opts">
          {L.predict.opts.map((o, k) => (
            <li key={k} onClick={() => act.pred(i, k)}>
              <span className="box">{pick === k ? '✓' : ''}</span>
              <span className="ot">{o}{pick === k && <Circled />}</span>
              {open && k === L.predict.ans && <span className="right">← {pick === k ? 'yes!' : 'this one'}</span>}
            </li>
          ))}
        </ul>
        <div className={'flap' + (open ? ' open' : '')}>
          <div className="why"><div className="kicker">Why?</div><p>{L.why}</p></div>
          <button className="lid" onClick={() => act.flap(i)} aria-label="Lift the flap">
            <span className="kicker">Why?</span>
            <b>Lift the flap to see the answer</b>
            <i>…after you have made your prediction.</i>
            <span className="lift">lift here ↘</span>
          </button>
        </div>
      </div>
      <div className="chal"><div className="kicker">Challenge</div><i>{L.challenge}</i></div>
      {st.done[i] && <div className="stamp"><span>✓</span><small>{count}/{N}</small></div>}
      <div className="folio">{6 + i * 2}</div>
    </div>
  );
}

function RightPage({ i, act, live }) {
  const L = LESSONS[i], Fig = L.Fig;
  return (
    <div className="pg pg-r">
      <div className="run r">{L.title}</div>
      <div className="fig"><Fig onDone={live ? () => act.done(i) : () => {}} /></div>
      <ol className="legend">{L.legend.map((t, k) => <li key={k}><b>{k + 1}</b> {t}</li>)}</ol>
      <p className="cap">{L.caption}</p>
      <p className="ins">{L.instruct}</p>
      <div className="folio">{7 + i * 2}</div>
    </div>
  );
}

export default function Book() {
  const [i, setI] = useState(0);
  const [turn, setTurn] = useState(null);
  const [st, setSt] = useState({ pred: {}, flap: {}, done: {} });
  const [view, setView] = useState({ flat: false, s: 1 });
  const [snd, setSnd] = useState(true);
  const [menu, setMenu] = useState(null);
  const [play, setPlay] = useState(false);
  const ac = useRef(null), loaded = useRef(false);

  useEffect(() => {
    try { const v = JSON.parse(localStorage.getItem(KEY)); if (v) { setSt(v.st || st); setI(v.i || 0); } } catch {}
    const fit = () => {
      const w = innerWidth, h = innerHeight, flat = w < 900 || w / h < 1.05;
      setView({ flat, s: flat ? Math.min(1, (w - 16) / 720) : Math.min(w / 1620, h / 1000) });
    };
    fit(); addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, []);
  useEffect(() => { if (!loaded.current) { loaded.current = true; return; } try { localStorage.setItem(KEY, JSON.stringify({ st, i })); } catch {} }, [st, i]);

  const noise = (dur, freq, gain) => {
    if (!snd) return;
    try {
      const a = (ac.current ||= new AudioContext()), len = Math.floor(dur * a.sampleRate), b = a.createBuffer(1, len, a.sampleRate), c = b.getChannelData(0);
      for (let k = 0; k < len; k++) c[k] = (Math.random() * 2 - 1) * Math.sin((Math.PI * k) / len) ** 2;
      const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.7; g.gain.value = gain;
      s.connect(f).connect(g).connect(a.destination); s.start();
    } catch {}
  };
  const chime = () => {
    if (!snd) return;
    try {
      const a = (ac.current ||= new AudioContext());
      [880, 1320].forEach((fq, k) => { const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + k * 0.12; o.frequency.value = fq; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.15, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.7); });
    } catch {}
  };

  const go = (to) => {
    if (turn || to < 0 || to >= N || to === i) return;
    setMenu(null); noise(0.45, 1700, 0.6);
    if (view.flat) { setI(to); scrollTo({ top: 0, behavior: 'smooth' }); return; }
    setTurn({ from: i, to });
  };
  const doneRef = useRef({});
  const act = {
    pred: (k, o) => { noise(0.08, 3000, 0.4); setSt((s) => ({ ...s, pred: { ...s.pred, [k]: o } })); },
    flap: (k) => { noise(0.25, 1200, 0.5); setSt((s) => ({ ...s, flap: { ...s.flap, [k]: !s.flap[k] } })); },
    done: (k) => {
      if (doneRef.current[k] || st.done[k]) return;
      doneRef.current[k] = true; chime();
      setSt((s) => ({ ...s, done: { ...s.done, [k]: true } }));
    },
  };

  useEffect(() => {
    const key = (e) => { if (e.target.tagName === 'INPUT') return; if (e.key === 'ArrowRight') go(i + 1); if (e.key === 'ArrowLeft') go(i - 1); if (e.key === 'Escape') setMenu(null); };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  });
  useEffect(() => {
    if (!play || turn) return;
    if (i >= N - 1) { setPlay(false); return; }
    const t = setTimeout(() => go(i + 1), 9000);
    return () => clearTimeout(t);
  }, [play, i, turn]);

  const lo = turn ? Math.min(turn.from, turn.to) : i, hi = turn ? Math.max(turn.from, turn.to) : i;
  const L = LESSONS[i];

  return (
    <main className={'desk' + (view.flat ? ' flat' : '')}>
      <div className="lamp" />
      <header className="bar">
        <div className="pill nav">
          <button onClick={() => go(i - 1)} disabled={i === 0} aria-label="Previous lesson">‹</button>
          <button className="where" onClick={() => setMenu(menu === 'toc' ? null : 'toc')}>
            <span className="kicker">Lesson {i + 1} <Bulbs done={st.done} i={i} /></span>
            <span className="t">{L.title}</span>
          </button>
          <button onClick={() => go(i + 1)} disabled={i === N - 1} aria-label="Next lesson">›</button>
        </div>
        <div className="pill tools">
          <button onClick={() => setPlay(!play)} aria-label={play ? 'Stop tour' : 'Play tour'} title="Auto-turn the pages">{play ? '❚❚' : '▶'}</button>
          <button onClick={() => setMenu(menu === 'toc' ? null : 'toc')} aria-label="Contents" title="Contents">☰</button>
          <button className={snd ? 'on' : ''} onClick={() => setSnd(!snd)} aria-label="Sound" title="Sound">{snd ? '🔊' : '🔈'}</button>
          <button onClick={() => setMenu(menu === 'more' ? null : 'more')} aria-label="More">⋯</button>
        </div>
        {menu === 'toc' && (
          <nav className="menu toc">
            <div className="kicker">Contents — Chapter 4</div>
            {LESSONS.map((l, k) => (
              <button key={k} className={k === i ? 'cur' : ''} onClick={() => go(k)}>
                <span className="n">{k + 1}</span>{l.title}<span className="d">{st.done[k] ? '💡' : ''}</span>
              </button>
            ))}
          </nav>
        )}
        {menu === 'more' && (
          <nav className="menu more">
            <button onClick={() => { setSt({ pred: {}, flap: {}, done: {} }); doneRef.current = {}; setMenu(null); }}>Reset progress</button>
            <a href="https://ncert.nic.in/textbook.php?leph1=4-8" target="_blank" rel="noreferrer">Open the NCERT chapter ↗</a>
            <p>← → keys turn pages. Hover an equation to explain it.</p>
          </nav>
        )}
      </header>

      <div className="stage" style={{ '--s': view.s }}>
        <div className="book">
          <div className="cover" />
          <div className="block l" /><div className="block r" />
          <div className="slot l"><LeftPage i={lo} st={st} act={act} /></div>
          <div className="slot r"><RightPage key={hi} i={hi} act={act} live={!turn} /></div>
          {turn && (
            <div className={'leaf ' + (turn.to > turn.from ? 'next' : 'prev')} onAnimationEnd={() => { setI(turn.to); setTurn(null); }}>
              <div className="face front"><RightPage i={lo} act={act} live={false} /></div>
              <div className="face back"><LeftPage i={hi} st={st} act={act} /></div>
            </div>
          )}
          <div className="gutter" />
        </div>
      </div>
      <footer className="foot">NCERT Physics Part I · Chapter 4 · Moving Charges and Magnetism</footer>
    </main>
  );
}
