'use client';
import { useEffect, useRef, useState } from 'react';
import { LESSONS, SUMMARY, EXERCISES } from './lessons';
import { Circled } from './kit';

const N = LESSONS.length, NCH = LESSONS.filter((l) => !l.summary).length;
const KEY = 'mcm-book-v2';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function Bulbs({ done, i }) {
  return (
    <span className="bulbs">
      {LESSONS.map((l, k) => !l.summary && (
        <svg key={k} viewBox="0 0 10 14" className={(done[k] ? 'lit ' : '') + (k === i ? 'cur' : '')}>
          <path d="M5 1a4 4 0 0 0-2.4 7.2c.6.5.9 1 .9 1.8h3c0-.8.3-1.3.9-1.8A4 4 0 0 0 5 1z" />
          <rect x="3.5" y="10.6" width="3" height="2.2" rx=".6" />
        </svg>
      ))}
    </span>
  );
}

function LeftPage({ i, st, act }) {
  const L = LESSONS[i];
  if (L.summary) return (
    <div className="pg pg-l sum">
      <div className="run">Chapter 4 · Moving Charges and Magnetism</div>
      <div className="main">
        <div className="kicker">Chapter 4</div>
        <h1>Summary</h1>
        <ol className="sumlist">{SUMMARY.map((s, k) => <li key={k}>{s}</li>)}</ol>
        <div className="kicker">Points to ponder</div>
        <p className="ponder">Electric field lines begin and end on charges; <b>magnetic field lines always form closed loops</b>. Everything here holds for steady currents. Ampère’s law is not independent of Biot–Savart: it is to Biot–Savart what Gauss’s law is to Coulomb’s law.</p>
      </div>
      <div className="folio">{6 + i * 2}</div>
    </div>
  );
  const pick = st.pred[i], open = st.flap[i];
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
      {st.done[i] && <div className="stamp"><span>✓</span><small>{Object.keys(st.done).length}/{NCH}</small></div>}
      <div className="folio">{6 + i * 2}</div>
    </div>
  );
}

function Exercises() {
  const [open, setOpen] = useState({});
  return (
    <ol className="ex">
      {EXERCISES.map(([n, q, a]) => (
        <li key={n} onClick={() => setOpen({ ...open, [n]: !open[n] })}>
          <b>{n}</b> {q} {open[n] ? <span className="ans">{a}</span> : <span className="show">answer ↘</span>}
        </li>
      ))}
    </ol>
  );
}

function RightPage({ i, act, p, set, live, still }) {
  const L = LESSONS[i];
  const [ex, setEx] = useState(false);
  if (L.summary) return (
    <div className="pg pg-r">
      <div className="run r">Exercises</div>
      <div className="kicker" style={{ marginTop: 30 }}>Exercises 4.1–4.13</div>
      <p className="cap">Work each one out, then tap it to check the answer.</p>
      <Exercises />
      <div className="folio">{7 + i * 2}</div>
    </div>
  );
  const Fig = L.Fig, legend = L.legend.filter(Boolean);
  return (
    <div className="pg pg-r">
      <div className="run r">{L.title}</div>
      <div className="fig">
        {still !== undefined ? <div className="scene3">{still && <img src={still} alt="" />}</div>
          : <Fig p={p} set={set} done={live ? () => act.done(i) : undefined} />}
      </div>
      {legend.length > 0 && <ol className="legend">{legend.map((t, k) => <li key={k}><b>{k + 1}</b> {t}</li>)}</ol>}
      <p className="cap">{L.caption} <span className="drag">Drag to turn it round.</span></p>
      <p className="ins">{L.instruct}</p>
      <div className={'exbox' + (ex ? ' open' : '')} onClick={() => setEx(!ex)}>
        <span className="kicker">{L.example.t}</span> {L.example.q}
        {ex ? <div className="exa">{L.example.a}</div> : <span className="show"> solution ↘</span>}
      </div>
      <div className="folio">{7 + i * 2}</div>
    </div>
  );
}

export default function Book() {
  const [i, setI] = useState(0);
  const [turn, setTurn] = useState(null);
  const [st, setSt] = useState({ pred: {}, flap: {}, done: {} });
  const [prm, setPrm] = useState({});
  const [view, setView] = useState({ flat: false, s: 1 });
  const [snd, setSnd] = useState(true);
  const [menu, setMenu] = useState(null);
  const [play, setPlay] = useState(false);
  const [sub, setSub] = useState('');
  const ac = useRef(null), loaded = useRef(false), doneRef = useRef({}), goRef = useRef(), sndRef = useRef(snd);
  sndRef.current = snd;

  useEffect(() => {
    try { const v = JSON.parse(localStorage.getItem(KEY)); if (v) { setSt(v.st || st); setI(Math.min(N - 1, v.i || 0)); } } catch {}
    const fit = () => {
      const w = innerWidth, h = innerHeight, flat = w < 900 || w / h < 1.05;
      setView({ flat, s: flat ? Math.min(1, (w - 16) / 720) : Math.min(w / 1620, h / 1130) });
    };
    fit(); addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, []);
  useEffect(() => { if (!loaded.current) { loaded.current = true; return; } try { localStorage.setItem(KEY, JSON.stringify({ st, i })); } catch {} }, [st, i]);

  const P = (k) => prm[k] || LESSONS[k].init;
  const setP = (k, patch) => setPrm((m) => ({ ...m, [k]: { ...(m[k] || LESSONS[k].init), ...patch } }));

  const noise = (dur, freq, gain) => {
    if (!sndRef.current) return;
    try {
      const a = (ac.current ||= new AudioContext()), len = Math.floor(dur * a.sampleRate), b = a.createBuffer(1, len, a.sampleRate), c = b.getChannelData(0);
      for (let k = 0; k < len; k++) c[k] = (Math.random() * 2 - 1) * Math.sin((Math.PI * k) / len) ** 2;
      const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.7; g.gain.value = gain;
      s.connect(f).connect(g).connect(a.destination); s.start();
    } catch {}
  };
  const chime = () => {
    if (!sndRef.current) return;
    try {
      const a = (ac.current ||= new AudioContext());
      [880, 1320].forEach((fq, k) => { const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + k * 0.12; o.frequency.value = fq; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.15, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); o.connect(g).connect(a.destination); o.start(t); o.stop(t + 0.7); });
    } catch {}
  };

  const go = (to) => {
    if (turn || to < 0 || to >= N || to === i) return false;
    setMenu(null); noise(0.45, 1700, 0.6);
    if (view.flat) { setI(to); scrollTo({ top: 0, behavior: 'smooth' }); return true; }
    let still = null;
    try { still = to > i ? document.querySelector('.slot.r .scene3')?.__snap?.() || null : null; } catch {}
    setTurn({ from: i, to, still });
    setTimeout(() => endRef.current(), 1300); // fallback if animationend never fires (background tab)
    return true;
  };
  goRef.current = go;
  const turnRef = useRef(null); turnRef.current = turn;
  const endRef = useRef(); endRef.current = () => { const t = turnRef.current; if (!t) return; setI(t.to); setTurn(null); };
  const act = {
    pred: (k, o) => { noise(0.08, 3000, 0.4); setSt((s) => ({ ...s, pred: { ...s.pred, [k]: o } })); },
    flap: (k, v) => { noise(0.25, 1200, 0.5); setSt((s) => ({ ...s, flap: { ...s.flap, [k]: v ?? !s.flap[k] } })); },
    done: (k) => {
      if (doneRef.current[k] || st.done[k]) return;
      doneRef.current[k] = true; chime();
      setSt((s) => ({ ...s, done: { ...s.done, [k]: true } }));
    },
  };

  // narrated play mode: walks each lesson's tour, driving the figure, then turns the page
  const iRef = useRef(i); iRef.current = i;
  useEffect(() => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (!play) { synth?.cancel(); setSub(''); return; }
    let off = false;
    const say = (text) => new Promise((res) => {
      setSub(text);
      const est = 900 + text.split(' ').length * 360;
      if (!sndRef.current || !synth) { setTimeout(res, est); return; }
      const u = new SpeechSynthesisUtterance(text);
      const vs = synth.getVoices();
      u.voice = vs.find((v) => v.lang === 'en-IN') || vs.find((v) => v.lang === 'en-GB') || vs.find((v) => v.lang?.startsWith('en')) || null;
      let fin = false; const end = () => { if (!fin) { fin = true; res(); } };
      u.onend = end; u.onerror = end; setTimeout(end, est * 1.8 + 3000);
      synth.cancel(); synth.speak(u);
    });
    (async () => {
      let k = iRef.current;
      while (!off) {
        const L = LESSONS[k];
        setSt((s) => ({ ...s, flap: { ...s.flap, [k]: false }, pred: { ...s.pred, [k]: undefined } }));
        for (const step of L.tour) {
          if (off) return;
          if (step.set) setP(k, step.set);
          await sleep(250);
          await say(step.say);
          if (off) return;
          if (step.pred != null) { act.pred(k, step.pred); await sleep(900); }
          if (step.flap) { act.flap(k, true); await sleep(500); await say(L.why); }
          await sleep(400);
        }
        if (off || k >= N - 1) break;
        await sleep(600);
        if (off || !goRef.current(k + 1)) break;
        await sleep(1300); k++;
      }
      if (!off) { setPlay(false); setSub(''); }
    })();
    return () => { off = true; synth?.cancel(); };
  }, [play]);

  useEffect(() => {
    const key = (e) => { if (e.target.tagName === 'INPUT') return; if (e.key === 'ArrowRight') go(i + 1); if (e.key === 'ArrowLeft') go(i - 1); if (e.key === 'Escape') setMenu(null); };
    addEventListener('keydown', key);
    return () => removeEventListener('keydown', key);
  });

  const lo = turn ? Math.min(turn.from, turn.to) : i, hi = turn ? Math.max(turn.from, turn.to) : i;
  const L = LESSONS[i];

  return (
    <main className={'desk' + (view.flat ? ' flat' : '')}>
      <div className="lamp" />
      <header className="bar">
        <div className="pill nav">
          <button onClick={() => go(i - 1)} disabled={i === 0} aria-label="Previous lesson">‹</button>
          <button className="where" onClick={() => setMenu(menu === 'toc' ? null : 'toc')}>
            <span className="kicker">{L.summary ? 'End of chapter' : `Lesson ${i + 1}`} <Bulbs done={st.done} i={i} /></span>
            <span className="t">{L.title}</span>
          </button>
          <button onClick={() => go(i + 1)} disabled={i === N - 1} aria-label="Next lesson">›</button>
        </div>
        <div className="pill tools">
          <button className={play ? 'on' : ''} onClick={() => setPlay(!play)} aria-label={play ? 'Pause' : 'Play the narrated lesson'} title="Narrated play mode">{play ? '❚❚' : '▶'}</button>
          <button onClick={() => setMenu(menu === 'toc' ? null : 'toc')} aria-label="Contents" title="Contents">☰</button>
          <button className={snd ? 'on' : ''} onClick={() => { setSnd(!snd); if (snd) window.speechSynthesis?.cancel(); }} aria-label="Sound" title="Sound and voice">{snd ? '🔊' : '🔈'}</button>
          <button onClick={() => setMenu(menu === 'more' ? null : 'more')} aria-label="More">⋯</button>
        </div>
        {menu === 'toc' && (
          <nav className="menu toc">
            <div className="kicker">Contents — Chapter 4</div>
            {LESSONS.map((l, k) => (
              <button key={k} className={k === i ? 'cur' : ''} onClick={() => go(k)}>
                <span className="n">{l.sec}</span>{l.title}<span className="d">{st.done[k] ? '💡' : ''}</span>
              </button>
            ))}
          </nav>
        )}
        {menu === 'more' && (
          <nav className="menu more">
            <button onClick={() => { setSt({ pred: {}, flap: {}, done: {} }); setPrm({}); doneRef.current = {}; setMenu(null); }}>Reset progress</button>
            <a href="https://ncert.nic.in/textbook.php?leph1=4-8" target="_blank" rel="noreferrer">Open the NCERT chapter ↗</a>
            <p>▶ plays a narrated walkthrough of every lesson. ← → keys turn pages. Drag any figure to rotate it; click the switches and cells.</p>
          </nav>
        )}
      </header>

      <div className="stage" style={{ '--s': view.s }}>
        <div className="book">
          <div className="cover" />
          <div className="block l" /><div className="block r" />
          <div className="slot l"><LeftPage i={lo} st={st} act={act} /></div>
          <div className="slot r"><RightPage key={hi} i={hi} act={act} p={P(hi)} set={(patch) => setP(hi, patch)} live={!turn} /></div>
          {turn && (
            <div className={'leaf ' + (turn.to > turn.from ? 'next' : 'prev')} onAnimationEnd={() => endRef.current()}>
              <div className="face front"><RightPage i={lo} act={act} p={P(lo)} set={() => {}} live={false} still={turn.still} /></div>
              <div className="face back"><LeftPage i={hi} st={st} act={act} /></div>
            </div>
          )}
          <div className="gutter" />
        </div>
      </div>
      {sub && <div className="sub">{sub}</div>}
      <footer className="foot">NCERT Physics Part I · Chapter 4 · Moving Charges and Magnetism</footer>
    </main>
  );
}
