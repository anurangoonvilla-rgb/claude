/* NoteAI — interactions, scroll motion and the 3D hero scene (no dependencies) */
(() => {
  'use strict';

  const doc = document.documentElement;
  doc.classList.add('js');

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  $('#year').textContent = new Date().getFullYear();

  /* ---------- nav ---------- */
  const nav = $('#nav');
  const burger = $('#burger');
  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  burger.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  $$('#navLinks a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- scroll: progress bar, nav state, method stack ---------- */
  const bar = $('#progressBar');
  const hero = $('.hero');
  const method = $('#method');
  const layers = $$('#stack .layer');
  const steps = $$('#steps li');
  let lastY = 0;
  let heroProgress = 0;

  function updateStack() {
    const rect = method.getBoundingClientRect();
    const total = rect.height - innerHeight;
    const p = clamp(-rect.top / total, 0, 1);
    const pos = p * (layers.length - 1) * 1.08; // slight overshoot so the last card settles
    const active = clamp(Math.round(pos), 0, layers.length - 1);
    layers.forEach((el, i) => {
      const d = i - Math.min(pos, layers.length - 1);
      let tf, op;
      if (d < 0) { // already passed: lift up and tip away
        const k = clamp(-d, 0, 1);
        tf = `translate3d(${k * 40}px, ${-k * 115}%, ${k * 160}px) rotateX(${k * 38}deg) rotateZ(${k * 8}deg)`;
        op = 1 - smooth(k);
      } else { // waiting behind
        tf = `translate3d(${d * 16}px, ${d * 26}px, ${-d * 90}px)`;
        op = 1;
      }
      el.style.transform = tf;
      el.style.opacity = op;
      el.style.zIndex = String(layers.length - i);
    });
    steps.forEach((li, i) => li.classList.toggle('is-active', i === active));
  }

  function onScroll() {
    const y = scrollY;
    const max = doc.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
    nav.classList.toggle('is-solid', y > 40);
    if (!nav.classList.contains('is-open')) {
      nav.classList.toggle('is-hidden', y > lastY && y > 500);
    }
    lastY = y;
    heroProgress = clamp(y / (hero.offsetHeight * 0.85), 0, 1);
    updateStack();
  }
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScroll(); ticking = false; });
  }, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- reveal on scroll (staggered per group) ---------- */
  const revealEls = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const groups = new Map();
    revealEls.forEach((el) => {
      const n = groups.get(el.parentElement) || 0;
      el.style.setProperty('--d', `${Math.min(n * 0.09, 0.45)}s`);
      groups.set(el.parentElement, n + 1);
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- counters ---------- */
  const fmt = new Intl.NumberFormat('en-IN');
  const counters = $$('[data-count]');
  const runCounter = (el) => {
    const end = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = fmt.format(end); return; }
    const t0 = performance.now();
    const dur = 1800;
    const tick = (now) => {
      const t = clamp((now - t0) / dur, 0, 1);
      el.textContent = fmt.format(Math.round(end * (1 - Math.pow(1 - t, 4))));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        runCounter(e.target);
        cio.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => cio.observe(el));
  } else {
    counters.forEach((el) => { el.textContent = fmt.format(Number(el.dataset.count)); });
  }

  /* ---------- typewriter (example prompt) ---------- */
  const typeEl = $('#typeTarget');
  const prompts = [
    'Act as a study coach. My exam is in 12 days. Build a day-by-day revision plan, weak chapters first.',
    'Act as an interviewer for a fresher marketing role. Ask me 5 questions, one at a time, then review my answers.',
    'Turn these messy class notes into a one-page summary with 5 quick quiz questions.',
  ];
  if (reduceMotion) {
    typeEl.textContent = prompts[0];
  } else {
    let pi = 0, ci = 0, deleting = false;
    const typeTick = () => {
      const text = prompts[pi];
      ci += deleting ? -3 : 1;
      typeEl.textContent = text.slice(0, clamp(ci, 0, text.length));
      let delay = deleting ? 14 : 28 + Math.random() * 40;
      if (!deleting && ci >= text.length) { deleting = true; delay = 2600; }
      else if (deleting && ci <= 0) { deleting = false; pi = (pi + 1) % prompts.length; delay = 400; }
      setTimeout(typeTick, delay);
    };
    setTimeout(typeTick, 1200);
  }

  /* ---------- pointer: stage parallax, tilt cards, magnetic buttons ---------- */
  const pointer = { x: 0, y: 0 }; // -1..1 from viewport centre
  if (finePointer && !reduceMotion) {
    const stageInner = $('#stageInner');
    addEventListener('pointermove', (e) => {
      pointer.x = (e.clientX / innerWidth) * 2 - 1;
      pointer.y = (e.clientY / innerHeight) * 2 - 1;
      stageInner.style.transform = `rotateY(${pointer.x * 12}deg) rotateX(${-pointer.y * 9}deg)`;
    }, { passive: true });

    $$('[data-tilt]').forEach((card) => {
      const soft = card.hasAttribute('data-tilt-soft');
      const max = soft ? 4 : 12;
      const target = soft ? card : $('.tilt-inner', card);
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.classList.add('is-tilting');
        target.style.setProperty('--ry', `${(px - 0.5) * 2 * max}deg`);
        target.style.setProperty('--rx', `${(0.5 - py) * 2 * max}deg`);
        target.style.setProperty('--mx', `${px * 100}%`);
        target.style.setProperty('--my', `${py * 100}%`);
      });
      card.addEventListener('pointerleave', () => {
        card.classList.remove('is-tilting');
        target.style.setProperty('--ry', '0deg');
        target.style.setProperty('--rx', '0deg');
      });
    });

    $$('.magnetic').forEach((btn) => {
      btn.addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = `translate(${dx * 0.22}px, ${dy * 0.3}px)`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });
  }

  /* ---------- 3D hero scene ----------
     A cloud of points that lives as a rotating neural sphere and, as you
     scroll, flattens into a sheet of note paper. Hand-rolled perspective
     projection on a 2D canvas, so there is nothing to download. */
  const canvas = $('#scene');
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, dpr = 1, pts = [], links = [];

  function build() {
    const small = innerWidth < 700;
    const cols = small ? 16 : 24;
    const rows = small ? 22 : 32;
    const n = cols * rows;
    pts = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      // sphere (fibonacci lattice)
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      // sheet of paper
      const c = i % cols, rw = Math.floor(i / cols);
      pts.push({
        sx: Math.cos(th) * r, sy: y, sz: Math.sin(th) * r,
        gx: (c / (cols - 1) - 0.5) * 1.5,
        gy: (rw / (rows - 1) - 0.5) * 2.05,
        ruled: rw % 4 === 2 && c > 2 && c < cols - 3, // "written lines" on the page
        px: 0, py: 0, ps: 0,
      });
    }
    // connect each point to its two nearest neighbours on the sphere
    links = [];
    const step = small ? 3 : 2;
    for (let i = 0; i < n; i += step) {
      let b1 = -1, b2 = -1, d1 = 9, d2 = 9;
      const a = pts[i];
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const b = pts[j];
        const d = (a.sx - b.sx) ** 2 + (a.sy - b.sy) ** 2 + (a.sz - b.sz) ** 2;
        if (d < d1) { d2 = d1; b2 = b1; d1 = d; b1 = j; }
        else if (d < d2) { d2 = d; b2 = j; }
      }
      links.push(i, b1, i, b2);
    }
  }

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  let rotX = 0, rotY = 0, morph = 0;
  function frame(time) {
    const t = time / 1000;
    morph = lerp(morph, smooth(heroProgress), 0.08);
    const wide = W > 1020;
    const cx = wide ? W * 0.72 : W * 0.5;
    const cy = wide ? H * 0.5 : H * 0.62;
    const R = Math.min(W, H) * (wide ? 0.36 : 0.42);
    const focal = 3.2;

    // sphere spins freely; the sheet only sways
    const spin = t * 0.18;
    const ty = lerp(spin + pointer.x * 0.5, Math.sin(t * 0.5) * 0.28 + pointer.x * 0.3, morph);
    const tx = lerp(pointer.y * 0.35 + 0.2, 0.45 + pointer.y * 0.2, morph);
    rotY = ty; rotX = lerp(rotX, tx, 0.1);
    const cyR = Math.cos(rotY), syR = Math.sin(rotY), cxR = Math.cos(rotX), sxR = Math.sin(rotX);

    ctx.clearRect(0, 0, W, H);
    const baseAlpha = wide ? 1 : 0.5;

    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const breathe = 1 + Math.sin(t * 1.3 + i * 0.37) * 0.03 * (1 - morph);
      let x = lerp(p.sx * breathe, p.gx, morph);
      let y = lerp(p.sy * breathe, p.gy, morph);
      let z = lerp(p.sz * breathe, Math.sin(p.gx * 3 + t * 1.4) * 0.09, morph);
      // rotate Y then X
      const x1 = x * cyR + z * syR;
      const z1 = -x * syR + z * cyR;
      const y1 = y * cxR - z1 * sxR;
      const z2 = y * sxR + z1 * cxR;
      const s = focal / (focal + z2);
      p.px = cx + x1 * R * s;
      p.py = cy + y1 * R * s;
      p.ps = s;
      p.pz = z2;
    }

    // links
    const linkAlpha = (1 - morph * 0.85) * 0.22 * baseAlpha;
    if (linkAlpha > 0.01) {
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(169,160,255,${linkAlpha})`;
      ctx.beginPath();
      for (let k = 0; k < links.length; k += 2) {
        const a = pts[links[k]], b = pts[links[k + 1]];
        if (a.pz > 0.35 && b.pz > 0.35) continue; // cull the far side for depth
        ctx.moveTo(a.px, a.py);
        ctx.lineTo(b.px, b.py);
      }
      ctx.stroke();
    }

    // points
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      const depth = clamp((1.2 - p.pz) / 2.2, 0.08, 1);
      const hot = p.ruled ? morph : 0;
      const size = (0.9 + depth * 1.5) * p.ps * (1 + hot * 0.5);
      ctx.globalAlpha = depth * baseAlpha * (0.55 + hot * 0.45);
      ctx.fillStyle = hot > 0.5 ? '#FFD23F' : (i % 9 === 0 ? '#FFD23F' : '#B9B2FF');
      ctx.beginPath();
      ctx.arc(p.px, p.py, size, 0, 6.2832);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  let running = false, rafId = 0;
  const loop = (time) => { frame(time); if (running) rafId = requestAnimationFrame(loop); };
  const start = () => { if (!running && !reduceMotion) { running = true; rafId = requestAnimationFrame(loop); } };
  const stop = () => { running = false; cancelAnimationFrame(rafId); };

  build();
  resize();
  frame(0);
  let rw = innerWidth;
  addEventListener('resize', () => {
    if ((rw < 700) !== (innerWidth < 700)) build();
    rw = innerWidth;
    resize();
    if (!running) frame(performance.now());
  });
  // only animate while the hero is on screen and the tab is visible
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => (e.isIntersecting ? start() : stop())).observe(hero);
  } else {
    start();
  }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
    else if (hero.getBoundingClientRect().bottom > 0) start();
  });
})();
