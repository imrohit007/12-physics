'use client';
import { useEffect, useRef, useState } from 'react';
import { LESSONS, SUMMARY, EXERCISES } from './lessons';
import { Circled } from './kit';

const N = LESSONS.length, NCH = LESSONS.filter((l) => l.Fig).length;
const KEY = 'mcm-book-v3';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function Bulbs({ done, i }) {
  return (
    <span className="bulbs">
      {LESSONS.map((l, k) => l.Fig && (
        <svg key={k} viewBox="0 0 10 14" className={(done[k] ? 'lit ' : '') + (k === i ? 'cur' : '')}>
          <path d="M5 1a4 4 0 0 0-2.4 7.2c.6.5.9 1 .9 1.8h3c0-.8.3-1.3.9-1.8A4 4 0 0 0 5 1z" />
          <rect x="3.5" y="10.6" width="3" height="2.2" rx=".6" />
        </svg>
      ))}
    </span>
  );
}

const Run = ({ r, children }) => <div className={'run' + (r ? ' r' : '')}>{children || 'Chapter 4 · Moving Charges and Magnetism'}</div>;

function LeftPage({ i, st, act }) {
  const L = LESSONS[i];
  if (L.intro) return (
    <div className="pg pg-l">
      <Run />
      <div className="kicker">Chapter 4 · Start here</div>
      <h1>Moving Charges and Magnetism</h1>
      <p className="big">{L.big}</p>
      {L.basics.map(([h, t]) => <div className="basic" key={h}><h3>{h}</h3><p>{t}</p></div>)}
      <div className="folio">{4 + i * 2}</div>
    </div>
  );
  if (L.summary) return (
    <div className="pg pg-l">
      <Run />
      <div className="kicker">Chapter 4</div>
      <h1>Summary</h1>
      <ol className="sumlist">{SUMMARY.map((s, k) => <li key={k}>{s}</li>)}</ol>
      <h3>Points to ponder</h3>
      <p className="ponder">Electric field lines begin and end on charges, but <b>magnetic field lines always form closed loops</b>. Everything in this chapter is for steady currents. Ampère’s law is not a separate law from Biot–Savart: it is to Biot–Savart what Gauss’s law is to Coulomb’s law. If you move along with a charge, the magnetic force on it disappears and an electric field appears instead, which is a sign that electricity and magnetism are really one thing: electromagnetism.</p>
      <div className="folio">{4 + i * 2}</div>
    </div>
  );
  const pick = st.pred[i];
  return (
    <div className="pg pg-l">
      <Run />
      <div className="kicker">Lesson {i} <span className="sec">NCERT § {L.sec}</span></div>
      <h1>{L.title}</h1>
      <p className="big">{L.big}</p>
      <div className="analogy"><b>Think of it like this.</b> {L.analogy}</div>
      <h3>Step by step</h3>
      <ol className="steps">{L.steps.map((t, k) => <li key={k}>{t}</li>)}</ol>
      <div className="eq">
        <div className="eq-big">{L.eq.big}</div>
        <div className="eq-say">{L.eq.say}</div>
        <dl className="syms">{L.symbols.map(([a, b]) => <div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>
      </div>
      <h3>Remember</h3>
      <ul className="points">{L.points.map((t, k) => <li key={k}>{t}</li>)}</ul>
      <div className="mistake"><b>Careful!</b> {L.mistake}</div>
      <h3>Check yourself</h3>
      <p className="q">{L.predict.q}</p>
      <ul className="opts">
        {L.predict.opts.map((o, k) => (
          <li key={k} onClick={() => act.pred(i, k)} className={pick === k ? (k === L.predict.ans ? 'ok' : 'no') : ''}>
            <span className="box">{pick === k ? (k === L.predict.ans ? '✓' : '✗') : ''}</span>
            <span className="ot">{o}{pick === k && <Circled />}</span>
            {pick != null && pick !== L.predict.ans && k === L.predict.ans && <span className="right">← this one</span>}
          </li>
        ))}
      </ul>
      <p className="why"><b>Why:</b> {L.why}</p>
      <div className="foot2">
        <div className="notes"><div className="kicker">Quick numbers</div>{L.notes.map((m, k) => <div key={k}>{m}</div>)}</div>
        <div className="chal">
          <div className="kicker">Challenge</div><i>{L.challenge}</i>
          {st.done[i] && <div className="stamp"><span>✓</span><small>{Object.keys(st.done).length}/{NCH}</small></div>}
        </div>
      </div>
      <div className="folio">{4 + i * 2}</div>
    </div>
  );
}

function RightPage({ i, act, p, set, live, still, go }) {
  const L = LESSONS[i];
  if (L.intro) return (
    <div className="pg pg-r">
      <Run r>Chapter map</Run>
      <div className="kicker">What you will learn</div>
      <h2>The chapter, one lesson at a time</h2>
      <ol className="map">
        {LESSONS.map((l, k) => k > 0 && (
          <li key={k} onClick={() => go?.(k)}><b>{l.Fig ? k : '★'}</b><span><em>{l.title}</em> <small>§ {l.sec}</small>{l.big && <><br />{l.big}</>}</span></li>
        ))}
      </ol>
      <h3>How to use this book</h3>
      <ul className="points">
        <li>Read the left page from the top: first the big idea, then an everyday picture, then the physics step by step.</li>
        <li>On the right, play with the 3D figure. Drag it to turn it round, click the switches and cells, and move the sliders.</li>
        <li>Every control follows the physics. The list under each figure tells you what changes when you change one thing.</li>
        <li>Press ▶ at the top for a guided tour of each lesson.</li>
      </ul>
      <div className="folio">{5 + i * 2}</div>
    </div>
  );
  if (L.summary) return (
    <div className="pg pg-r">
      <Run r>Exercises</Run>
      <div className="kicker">Exercises 4.1–4.13</div>
      <p className="cap">Work each one out yourself first, then compare with the answer in blue.</p>
      <ol className="ex">{EXERCISES.map(([n, q, a]) => <li key={n}><b>{n}</b> {q}<span className="ans">{a}</span></li>)}</ol>
      <div className="folio">{5 + i * 2}</div>
    </div>
  );
  const Fig = L.Fig, legend = L.legend.filter(Boolean);
  return (
    <div className="pg pg-r">
      <Run r>{L.title}</Run>
      <div className="fig">
        {still !== undefined ? <div className="scene3">{still && <img src={still} alt="" />}</div>
          : <Fig p={p} set={set} done={live ? () => act.done(i) : undefined} />}
      </div>
      {legend.length > 0 && <ol className="legend">{legend.map((t, k) => <li key={k}><b>{k + 1}</b> {t}</li>)}</ol>}
      <p className="cap">{L.caption} <span className="drag">Drag to turn it round.</span></p>
      <p className="ins">{L.instruct}</p>
      <div className="notice">
        <div className="kicker">Change one thing, watch the others</div>
        <ul>{L.notice.map(([a, b]) => <li key={a}><b>{a}</b> <span>→ {b}</span></li>)}</ul>
      </div>
      <div className="exbox">
        <div><span className="kicker">{L.example.t}</span> {L.example.q}</div>
        <div className="exa"><b>Solution.</b> {L.example.a}</div>
      </div>
      <div className="folio">{5 + i * 2}</div>
    </div>
  );
}

export default function Book() {
  const [i, setI] = useState(0);
  const [turn, setTurn] = useState(null);
  const [st, setSt] = useState({ pred: {}, done: {} });
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
    // 3D open book only when it can be shown big enough to read; otherwise the pages flow as a normal web page
    const fit = () => {
      const w = innerWidth, h = innerHeight, s = Math.min(w / 1620, h / 1130);
      setView({ flat: s < 0.72 || w < 1100, s });
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

  const turnRef = useRef(null); turnRef.current = turn;
  const endRef = useRef(); endRef.current = () => { const t = turnRef.current; if (!t) return; setI(t.to); setTurn(null); };
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
  const act = {
    pred: (k, o) => { noise(0.08, 3000, 0.4); setSt((s) => ({ ...s, pred: { ...s.pred, [k]: o } })); },
    done: (k) => {
      if (doneRef.current[k] || st.done[k]) return;
      doneRef.current[k] = true; chime();
      setSt((s) => ({ ...s, done: { ...s.done, [k]: true } }));
    },
  };

  // guided tour: captions on screen, drives each figure, then turns the page
  const iRef = useRef(i); iRef.current = i;
  useEffect(() => {
    if (!play) { setSub(''); return; }
    let off = false;
    const say = async (text) => { setSub(text); await sleep(1200 + text.split(' ').length * 330); };
    (async () => {
      let k = iRef.current;
      while (!off) {
        setSt((s) => ({ ...s, pred: { ...s.pred, [k]: undefined } }));
        for (const step of LESSONS[k].tour) {
          if (off) return;
          if (step.set) setP(k, step.set);
          await sleep(250);
          await say(step.say);
          if (off) return;
          if (step.pred != null) { act.pred(k, step.pred); await sleep(2500); }
        }
        if (off || k >= N - 1) break;
        await sleep(500);
        if (off || !goRef.current(k + 1)) break;
        await sleep(1400); k++;
      }
      if (!off) { setPlay(false); setSub(''); }
    })();
    return () => { off = true; };
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
            <span className="kicker">{L.summary ? 'End of chapter' : L.intro ? 'Start here' : `Lesson ${i}`} <Bulbs done={st.done} i={i} /></span>
            <span className="t">{L.title}</span>
          </button>
          <button onClick={() => go(i + 1)} disabled={i === N - 1} aria-label="Next lesson">›</button>
        </div>
        <div className="pill tools">
          <button className={play ? 'on' : ''} onClick={() => setPlay(!play)} aria-label={play ? 'Pause' : 'Play the guided tour'} title="Guided tour">{play ? '❚❚' : '▶'}</button>
          <button onClick={() => setMenu(menu === 'toc' ? null : 'toc')} aria-label="Contents" title="Contents">☰</button>
          <button className={snd ? 'on' : ''} onClick={() => setSnd(!snd)} aria-label="Sound effects" title="Page sounds">{snd ? '🔊' : '🔈'}</button>
          <button onClick={() => setMenu(menu === 'more' ? null : 'more')} aria-label="More">⋯</button>
        </div>
        {menu === 'toc' && (
          <nav className="menu toc">
            <div className="kicker">Contents — Chapter 4</div>
            {LESSONS.map((l, k) => (
              <button key={k} className={k === i ? 'cur' : ''} onClick={() => go(k)}>
                <span className="n">{l.Fig ? k : '★'}</span>{l.title}<span className="d">{st.done[k] ? '💡' : ''}</span>
              </button>
            ))}
          </nav>
        )}
        {menu === 'more' && (
          <nav className="menu more">
            <button onClick={() => { setSt({ pred: {}, done: {} }); setPrm({}); doneRef.current = {}; setMenu(null); }}>Reset progress</button>
            <a href="https://ncert.nic.in/textbook.php?leph1=4-8" target="_blank" rel="noreferrer">Open the NCERT chapter ↗</a>
            <p>▶ plays a guided tour of every lesson, with captions. The ← → keys turn pages. Drag any figure to rotate it, and click its switches and cells.</p>
          </nav>
        )}
      </header>

      <div className="stage" style={{ '--s': view.s }}>
        <div className="book">
          <div className="cover" />
          <div className="block l" /><div className="block r" />
          <div className="slot l"><LeftPage i={lo} st={st} act={act} /></div>
          <div className="slot r"><RightPage key={hi} i={hi} act={act} p={P(hi)} set={(patch) => setP(hi, patch)} live={!turn} go={go} /></div>
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
