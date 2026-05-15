/* Shivani Sudhir — portfolio interactions
   No frameworks. Progressive enhancement. Respects reduced-motion. */

(() => {
  'use strict';

  const doc      = document.documentElement;
  const reduced  = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarse = matchMedia('(pointer: coarse)').matches;
  const raf      = window.requestAnimationFrame;

  /* ============================================================
     1 · INTRO / LOAD CHOREOGRAPHY
     ============================================================ */
  const intro     = document.querySelector('.intro');
  const heroTitle = document.querySelector('.hero-title');

  function beginReveals() {
    doc.classList.add('is-loaded');
    if (heroTitle) heroTitle.classList.add('is-revealed');
  }

  if (reduced || !intro) {
    if (intro) intro.classList.add('is-gone');
    beginReveals();
  } else {
    doc.classList.add('is-intro');
    intro.addEventListener('animationend', (e) => {
      if (e.animationName === 'introLift') {
        intro.classList.add('is-gone');
        doc.classList.remove('is-intro');
        beginReveals();
      }
    });
    // Safety: never let the curtain stick.
    setTimeout(() => {
      if (!intro.classList.contains('is-gone')) {
        intro.classList.add('is-gone');
        doc.classList.remove('is-intro');
        beginReveals();
      }
    }, 2800);
  }

  /* ============================================================
     2 · SPLIT HERO TITLE INTO LETTERS
     ============================================================ */
  const splitTitle = document.querySelector('[data-split]');
  let letters = [];
  if (splitTitle) {
    let idx = 0;
    splitTitle.querySelectorAll('.word').forEach((word) => {
      const text = word.textContent;
      const soft = word.dataset.soft || '50';
      word.textContent = '';
      [...text].forEach((ch) => {
        const span = document.createElement('span');
        span.className = 'ltr';
        span.textContent = ch;
        span.style.setProperty('--i', idx++);
        span.dataset.soft = soft;
        word.appendChild(span);
      });
    });
    letters = [...splitTitle.querySelectorAll('.ltr')];
  }

  /* ============================================================
     3 · SCROLL SYSTEMS — header state, progress, scroll-spy
     ============================================================ */
  const header   = document.querySelector('.site-header');
  const progress = document.querySelector('.scroll-progress');
  const spyLinks = [...document.querySelectorAll('[data-spy]')];
  const spyTargets = spyLinks
    .map((a) => ({ link: a, el: document.getElementById(a.dataset.spy) }))
    .filter((t) => t.el);

  let scrollQueued = false;
  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    raf(() => {
      const y = window.scrollY || window.pageYOffset;

      if (header) header.classList.toggle('is-scrolled', y > 24);

      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
      }

      if (spyTargets.length) {
        const line = y + window.innerHeight * 0.35;
        let current = null;
        spyTargets.forEach((t) => {
          if (t.el.offsetTop <= line) current = t.link;
        });
        spyLinks.forEach((l) => l.classList.toggle('is-current', l === current));
      }

      scrollQueued = false;
    });
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ============================================================
     4 · REVEAL ON SCROLL + LEDGER COUNT-UP
     ============================================================ */
  const revealEls = document.querySelectorAll('[data-reveal]');
  revealEls.forEach((el) => {
    const d = el.dataset.revealDelay;
    if (d) el.style.setProperty('--reveal-delay', `${d}ms`);
  });

  function countUp(el) {
    const target = parseInt(el.dataset.count, 10);
    if (isNaN(target) || reduced) { el.textContent = el.dataset.count; return; }
    const dur = 1100;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(eased * target);
      if (t < 1) raf(tick);
    };
    raf(tick);
  }

  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-visible');
        e.target.querySelectorAll?.('[data-count]').forEach(countUp);
        if (e.target.matches?.('[data-count]')) countUp(e.target);
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
    document.querySelectorAll('[data-count]').forEach((el) => { el.textContent = el.dataset.count; });
  }

  /* ============================================================
     5 · LIVE SYDNEY CLOCK
     ============================================================ */
  const clockEls = document.querySelectorAll('[data-clock]');
  if (clockEls.length) {
    const fmt = new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Sydney', hour: 'numeric', minute: '2-digit', hour12: true
    });
    const drawClock = () => {
      const t = fmt.format(new Date()).replace(/\s?(am|pm)/i, (m, p) => ` ${p.toLowerCase()}`);
      clockEls.forEach((el) => { el.textContent = t; });
    };
    drawClock();
    setInterval(drawClock, 20000);
  }

  /* ============================================================
     6 · FLOATING GLYPH PARALLAX
     ============================================================ */
  const glyphs = document.querySelectorAll('.float-glyph');
  let mxN = 0, myN = 0;            // normalised mouse, shared
  if (glyphs.length && !isCoarse && !reduced) {
    let tx = 0, ty = 0;
    const tick = () => {
      tx += (mxN - tx) * 0.06;
      ty += (myN - ty) * 0.06;
      glyphs.forEach((g) => {
        const d = parseFloat(g.dataset.depth || 0.05);
        g.style.transform = `translate3d(${tx * d * 60}px, ${ty * d * 60}px, 0)`;
      });
      raf(tick);
    };
    raf(tick);
  }

  /* ============================================================
     7 · CUSTOM CURSOR + MAGNETIC + HERO LETTER FIELD
     ============================================================ */
  let cursorPos = { x: innerWidth / 2, y: innerHeight / 2 };

  if (!isCoarse && !reduced) {
    const cursor = document.querySelector('.cursor');
    const dot    = document.querySelector('.cursor-dot');
    const ring   = document.querySelector('.cursor-ring');

    let dx = cursorPos.x, dy = cursorPos.y;
    let rx = cursorPos.x, ry = cursorPos.y;

    window.addEventListener('mousemove', (e) => {
      cursorPos.x = e.clientX; cursorPos.y = e.clientY;
      mxN = (e.clientX / innerWidth  - 0.5) * 2;
      myN = (e.clientY / innerHeight - 0.5) * 2;
    }, { passive: true });

    document.addEventListener('mousedown', () => cursor && cursor.classList.add('is-down'));
    document.addEventListener('mouseup',   () => cursor && cursor.classList.remove('is-down'));

    const animateCursor = () => {
      dx += (cursorPos.x - dx) * 0.35;
      dy += (cursorPos.y - dy) * 0.35;
      rx += (cursorPos.x - rx) * 0.18;
      ry += (cursorPos.y - ry) * 0.18;
      if (dot)  dot.style.transform  = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
      if (ring) ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      raf(animateCursor);
    };
    raf(animateCursor);

    // Cursor hover state — works on dynamically-added nodes too
    function bindCursorHovers(root) {
      root.querySelectorAll('a, button, [role="link"], [data-magnetic]').forEach((el) => {
        if (el.dataset.cursorBound) return;
        el.dataset.cursorBound = '1';
        el.addEventListener('mouseenter', () => cursor && cursor.classList.add('is-hover'));
        el.addEventListener('mouseleave', () => {
          cursor && cursor.classList.remove('is-hover');
          if (el.dataset.magnetic !== undefined) el.style.transform = '';
        });
      });
    }
    bindCursorHovers(document);
    window.__bindCursorHovers = bindCursorHovers;

    // Magnetic pull
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
      const STRENGTH = el.classList.contains('case-link') ? 0.05 : 0.22;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width  / 2);
        const y = e.clientY - (r.top  + r.height / 2);
        el.style.transform = `translate3d(${x * STRENGTH}px, ${y * STRENGTH}px, 0)`;
      });
    });

    // Hero letter field — proximity-driven offset + variable weight
    if (letters.length) {
      const RADIUS = 150;
      const tickLetters = () => {
        for (let i = 0; i < letters.length; i++) {
          const el = letters[i];
          const r = el.getBoundingClientRect();
          if (r.bottom < -200 || r.top > innerHeight + 200) {
            el.style.transform = '';
            el.style.fontVariationSettings = '';
            continue;
          }
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const dxL = cursorPos.x - cx;
          const dyL = cursorPos.y - cy;
          const dist = Math.hypot(dxL, dyL);
          if (dist < RADIUS) {
            const force = 1 - dist / RADIUS;          // 0..1
            const push  = -force * 9;                  // letters lean away gently
            const ox = (dxL / (dist || 1)) * push;
            const oy = (dyL / (dist || 1)) * push;
            const wght = Math.round(360 + force * 320); // 360 → 680
            el.style.transform = `translate(${ox}px, ${oy}px)`;
            el.style.fontVariationSettings = `'opsz' 144, 'SOFT' ${el.dataset.soft}, 'wght' ${wght}`;
          } else if (el.style.transform) {
            el.style.transform = '';
            el.style.fontVariationSettings = '';
          }
        }
        raf(tickLetters);
      };
      raf(tickLetters);
    }
  }

  /* ============================================================
     8 · MARQUEE — clone if short
     ============================================================ */
  const marquee = document.querySelector('.marquee-track');
  if (marquee) {
    raf(() => {
      if (marquee.scrollWidth < innerWidth * 2) marquee.innerHTML += marquee.innerHTML;
    });
  }

  /* ============================================================
     9 · CASE STUDY OVERLAY
     ============================================================ */
  const PROJECTS = {
    utilify: {
      n: '01', title: 'Utilify', cat: 'Utilities · Flagship',
      tag: 'Your everyday tech toolkit.',
      year: '2024', platforms: 'iOS & Android',
      shot: 'assets/work/01-utilify.png', icon: 'assets/icons/utilify.png',
      url: 'https://playpalapps.github.io/UtilifyApp/',
      tint: 'radial-gradient(ellipse 120% 95% at 50% 72%, rgba(239,68,68,0.46), rgba(251,146,60,0.22) 58%, rgba(251,146,60,0.06) 100%)',
      brief: 'Eighteen separate utilities — the kind most people keep as eighteen separate apps. The design problem was making a single app that holds all of them not feel like a junk drawer.',
      role: 'Lead designer — UX architecture, the full UI system, brand, the app icon, and the App Store presence.',
      decisions: [
        { h: 'The home screen is the navigation.', p: 'One calm grid, every tool a single tap away. No nested menus, no folders, no hunting — the structure is flat because the mental model is flat.' },
        { h: 'One component language across all eighteen tools.', p: 'A converter and a password generator are built from the same buttons, fields and spacing. They feel like siblings, not strangers sharing a shell.' },
        { h: 'Adaptive, not duplicated.', p: 'The system speaks native iOS and native Android from one set of tokens — the platform translation happens in variables, not in two divergent design files.' }
      ],
      outcome: 'A toolkit that reads as one product — the rare utility app that survives a home-screen cull.'
    },
    canwasa: {
      n: '02', title: 'Canwasa', cat: 'Creativity',
      tag: 'A piece of slow software.',
      year: '2023', platforms: 'iOS & Android',
      shot: 'assets/work/02-canwasa.png', icon: 'assets/icons/canwasa.png',
      url: 'https://playpalapps.github.io/canwasa/',
      tint: 'radial-gradient(ellipse 120% 95% at 50% 72%, rgba(236,72,153,0.42), rgba(6,182,212,0.18) 58%, rgba(6,182,212,0.06) 100%)',
      brief: 'Generative wallpaper apps usually drown you in sliders and options. Canwasa had to make “infinite” feel calm — a tool you open to make one beautiful thing, not to be kept busy.',
      role: 'Lead designer — UX, UI, brand, and the generation-paired motion.',
      decisions: [
        { h: 'The canvas is the interface.', p: 'Controls stay out of the way until you reach for them. The artwork is always the loudest thing on the screen; the chrome is a whisper.' },
        { h: 'Privacy as a felt feature.', p: 'Everything generates on-device. The UI had to make “no cloud, no account, no tracking” read as generosity, not as a limitation it was apologising for.' },
        { h: 'A muted shell, on purpose.', p: 'Every surface around the canvas is desaturated so the colour you create is never competing with the colour of the app.' }
      ],
      outcome: 'Slow software — an app with the confidence to do one thing, beautifully, and then get out of the way.'
    },
    nightbloom: {
      n: '03', title: 'Night Bloom', cat: 'Wellness',
      tag: 'Designed to be used in the dark.',
      year: '2023', platforms: 'iOS & Android',
      shot: 'assets/work/03-nightbloom.png', icon: 'assets/icons/nightbloom.png',
      url: 'https://playpalapps.github.io/NightBloom/',
      tint: 'radial-gradient(ellipse 120% 95% at 50% 72%, rgba(67,56,202,0.48), rgba(99,102,241,0.22) 58%, rgba(99,102,241,0.06) 100%)',
      brief: 'A wellness app you use half-asleep, one-handed, in a dark room. Every assumption about what “tappable” means has to change.',
      role: 'Lead designer — UX, UI, brand, and the breathing-exercise motion system.',
      decisions: [
        { h: 'A palette tuned for OLED — and for not waking you.', p: 'No pure white, anywhere. Every value was chosen for a dark room and a tired eye, not for a design review under office light.' },
        { h: 'Forgiving targets.', p: 'Oversized, generous touch areas — at 1 a.m. precision is gone, so the whole screen does something useful rather than asking for accuracy you don’t have.' },
        { h: 'The app itself breathes.', p: 'One calm easing curve drives every transition and every breathing guide, so the motion language feels like a single, slow exhale.' }
      ],
      outcome: 'An app that disappears as you fall asleep — the highest compliment a wellness product can earn.'
    },
    palettely: {
      n: '04', title: 'Palettely', cat: 'Creativity',
      tag: 'A pocket tool, precise enough for designers.',
      year: '2024', platforms: 'iOS & Android',
      shot: 'assets/work/04-palettely.png', icon: 'assets/icons/palettely.png',
      url: 'https://playpalapps.github.io/Palettely/',
      tint: 'radial-gradient(ellipse 120% 95% at 50% 70%, rgba(139,92,246,0.42), rgba(249,115,22,0.20) 55%, rgba(249,115,22,0.06) 100%)',
      brief: 'A colour tool for designers — which means an audience that notices everything. The bar for craft was the user base itself.',
      role: 'Lead designer — UX, UI, brand, and the app icon.',
      decisions: [
        { h: 'Extraction in one tap — and then editable.', p: 'Pull a palette from any photo instantly, but treat the result as a draft, not a verdict. Designers want to argue with the algorithm, so the UI lets them.' },
        { h: 'A drag model they already trust.', p: 'Moodboards assemble on-device with the same direct-manipulation grammar designers know from their desktop tools — no relearning required.' },
        { h: 'A UI with no opinion about colour.', p: 'Every surface is neutral by design. The user’s colour is the subject; the app refuses to have a view.' }
      ],
      outcome: 'A pocket tool precise enough that designers keep it open next to Figma.'
    },
    paperlens: {
      n: '05', title: 'PaperLens', cat: 'Productivity',
      tag: 'Scan, sign, protect — nothing leaves the device.',
      year: '2024', platforms: 'iOS & Android',
      shot: 'assets/work/05-paperlens.png', icon: 'assets/icons/paperlens.png',
      url: 'https://playpalapps.github.io/PaperLens/',
      tint: 'radial-gradient(ellipse 120% 95% at 50% 72%, rgba(37,99,235,0.44), rgba(6,182,212,0.20) 58%, rgba(6,182,212,0.06) 100%)',
      brief: 'Three jobs — scanning, signing, protecting — folded into one flow, with the documents never leaving the phone.',
      role: 'Lead designer — UX, UI, and brand.',
      decisions: [
        { h: 'The camera leads.', p: 'Open the app and you’re already scanning. The fastest path to the thing you came to do is the default, not a choice buried in a menu.' },
        { h: 'Direct manipulation over toolbars.', p: 'Signing and redaction happen by touching the document itself — you work on the page, not on a panel of controls beside it.' },
        { h: 'Privacy, shown quietly.', p: 'A small, honest indicator makes on-device AI visible without lecturing. Trust is communicated through restraint, not a banner.' }
      ],
      outcome: 'A document tool that earns trust in the first ten seconds — and keeps it.'
    },
    astroorbit: {
      n: '06', title: 'Astro Orbit', cat: 'Arcade · Game',
      tag: 'A study in motion and feel.',
      year: '2022', platforms: 'iOS & Android',
      shot: 'assets/work/06-astroorbit.png', icon: 'assets/icons/astroorbit.png',
      url: 'https://playpalapps.github.io/AstroOrbit/',
      tint: 'radial-gradient(ellipse 120% 95% at 50% 72%, rgba(124,58,237,0.46), rgba(99,102,241,0.20) 58%, rgba(99,102,241,0.06) 100%)',
      brief: 'A one-thumb arcade game lives or dies on feel. The design work here was mostly motion — weight, timing, and readability under pressure.',
      role: 'Lead designer — UX, UI, game feel, brand, and the app icon.',
      decisions: [
        { h: 'The tutorial is the first three seconds of play.', p: 'A control scheme you understand on the first tap and master in ten minutes — no instructional screens, just a game that explains itself by being played.' },
        { h: 'Readability under chaos.', p: 'A colour and shape system that keeps “you” and “danger” instantly legible even when the screen is full and moving fast.' },
        { h: 'Juice, with restraint.', p: 'Every hop, near-miss and death has weight — but the screen never tips into confetti. Feedback you feel, not feedback that blinds you.' }
      ],
      outcome: 'A game that feels good in the hand before it’s good at anything else — which is the whole job.'
    },
    mergerise: {
      n: '07', title: 'MergeRise', cat: 'Puzzle · Game',
      tag: 'A familiar puzzle with a quiet second act.',
      year: '2023', platforms: 'iOS & Android',
      shot: 'assets/work/07-mergerise.png', icon: 'assets/icons/mergerise.png',
      url: 'https://playpalapps.github.io/MergeRise/',
      tint: 'radial-gradient(ellipse 120% 95% at 50% 72%, rgba(16,185,129,0.42), rgba(20,184,166,0.20) 58%, rgba(20,184,166,0.06) 100%)',
      brief: '2048 is a solved genre. MergeRise needed a reason to keep playing without adding noise to a board that already works.',
      role: 'Lead designer — UX, UI, progression design, and brand.',
      decisions: [
        { h: 'The merge board stays sacred.', p: 'Pure 2048, untouched. The civilisation grows in a layer above it — present, rewarding, and never in the way of the move you’re trying to make.' },
        { h: 'Progression you read in a glance.', p: 'Five thousand years of building, legible in a two-second look. Depth that never asks you to study it.' },
        { h: 'A board you can almost feel.', p: 'Warm, tactile tiles turn a maths puzzle into the sensation of handling objects in your hand.' }
      ],
      outcome: 'A familiar puzzle given a second act — extra depth that never costs the original its clarity.'
    },
    fuzzypop: {
      n: '08', title: 'Fuzzy Pop', cat: 'Family · Game',
      tag: 'A children’s game parents actually trust.',
      year: '2022', platforms: 'iOS & Android',
      shot: 'assets/work/08-fuzzypop.png', icon: 'assets/icons/fuzzypop.png',
      url: 'https://playpalapps.github.io/FuzzyPop/',
      tint: 'radial-gradient(ellipse 120% 95% at 50% 70%, rgba(236,72,153,0.40), rgba(245,158,11,0.22) 55%, rgba(245,158,11,0.07) 100%)',
      brief: 'A game for the very youngest hands — and a hard “no” to every dark pattern the category runs on.',
      role: 'Lead designer — UX, UI, brand, and the app icon.',
      decisions: [
        { h: 'The brief was a list of subtractions.', p: 'No ads, no timers, no fail states, no shop. Designing Fuzzy Pop was mostly deciding what it would refuse to be.' },
        { h: 'Sized for a three-year-old.', p: 'Targets and feedback that are huge, soft, immediate and impossible to “lose” — built for hands still learning what a screen is.' },
        { h: 'Joyful without being loud.', p: 'A palette and motion language gentle enough that a parent can hand the phone over and simply walk away.' }
      ],
      outcome: 'A children’s game parents actually trust — the rarest thing in its category.'
    },
    tzc: {
      n: '09', title: 'Time Zone Connect', cat: 'Productivity',
      tag: 'A planet, finally legible.',
      year: '2023', platforms: 'iOS & Android',
      shot: 'assets/work/09-tzc.png', icon: 'assets/icons/timezoneconnect.png',
      url: 'https://playpalapps.github.io/TimezoneConnect/',
      tint: 'radial-gradient(ellipse 120% 95% at 50% 72%, rgba(37,99,235,0.44), rgba(99,102,241,0.20) 58%, rgba(99,102,241,0.06) 100%)',
      brief: 'Time zones are a comprehension problem, not a maths problem. The UI had to make a whole planet legible at a glance.',
      role: 'Lead designer — UX, UI, and brand.',
      decisions: [
        { h: 'Overlap is shown, never calculated.', p: 'A single visual band marks where everyone’s working hours actually meet — the answer is a picture, not a sum you have to do.' },
        { h: 'People before places.', p: 'You add humans, not UTC offsets. The app does the translation from “my colleague in Berlin” to a time, so you never have to.' },
        { h: 'A five-second tool, by ambition.', p: 'Open it, see when to meet, close it. The whole design goal was to be used briefly and then left alone.' }
      ],
      outcome: 'A scheduling tool that replaces the mental math — not just the clock on the wall.'
    },
    qito: {
      n: '10', title: 'Qito', cat: 'Utilities',
      tag: 'The platonic QR scanner.',
      year: '2024', platforms: 'iOS & Android',
      shot: 'assets/work/10-qito.png', icon: 'assets/icons/qito.png',
      url: 'https://playpalapps.github.io/Qito/',
      tint: 'radial-gradient(ellipse 120% 95% at 50% 72%, rgba(82,82,91,0.40), rgba(113,113,122,0.20) 58%, rgba(161,161,170,0.07) 100%)',
      brief: 'The QR-scanner category is a swamp of ads and bloat. Qito’s entire pitch is the list of things it refuses to be.',
      role: 'Lead designer — UX, UI, brand, and the app icon.',
      decisions: [
        { h: 'Camera-first launch.', p: 'The app is scanning before you’ve finished opening it. Zero steps between intent and result.' },
        { h: 'One screen.', p: 'No tabs, no onboarding, no account. The scanner is the app — there is nothing else to find because there is nothing else.' },
        { h: 'Results that respect you.', p: 'Clear, actionable, ad-free — and gone the moment you’re done with them.' }
      ],
      outcome: 'The platonic QR scanner — the one you install right after deleting three others.'
    }
  };

  /* Reverse-engineered low-fi wireframes — the structural bones of each
     real, shipped app. Coded, not images. */
  const tile  = '<div class="wf-tile"><div class="wf-dot"></div><div class="wf-line w-80"></div></div>';
  const box1  = '<div class="wf-box" style="aspect-ratio:1"></div>';
  const STRUCTURE = {
    utilify: {
      wireframe: `<div class="wireframe">
        <div class="wf-status"><span></span><span></span></div>
        <div class="wf-row"><div class="wf-line title w-40"></div><div class="wf-fill"></div><div class="wf-circle" style="width:20px;height:20px"></div></div>
        <div class="wf-pill w-full" style="height:30px"></div>
        <div class="wf-grid" style="grid-template-columns:repeat(3,1fr)">${tile.repeat(9)}</div>
        <div class="wf-fill"></div>
        <div class="wf-row wf-center" style="gap:20px;padding-top:4px"><div class="wf-circle" style="width:22px;height:22px"></div><div class="wf-circle" style="width:22px;height:22px"></div><div class="wf-circle" style="width:22px;height:22px"></div></div>
      </div>`,
      note: 'The entire app is one screen. Every tool sits a single tap from the grid — no folders, no nesting — so the structure you see is the structure, and there is nowhere to get lost.'
    },
    canwasa: {
      wireframe: `<div class="wireframe">
        <div class="wf-status"><span></span><span></span></div>
        <div class="wf-row"><div class="wf-line w-30"></div><div class="wf-fill"></div><div class="wf-circle" style="width:18px;height:18px"></div></div>
        <div class="wf-box fill wf-fill" style="margin:2px 0"></div>
        <div class="wf-row wf-center" style="gap:14px;padding:6px 0"><div class="wf-circle" style="width:26px;height:26px"></div><div class="wf-pill" style="width:88px;height:34px"></div><div class="wf-circle" style="width:26px;height:26px"></div></div>
      </div>`,
      note: 'One decision shaped the whole layout: the canvas takes the screen, and every control collapses to a single row at the foot — present when you reach for it, invisible when you don’t.'
    },
    nightbloom: {
      wireframe: `<div class="wireframe is-dark">
        <div class="wf-status"><span></span><span></span></div>
        <div class="wf-line title w-50"></div>
        <div class="wf-box fill" style="height:108px"></div>
        <div class="wf-stack">
          ${'<div class="wf-row"><div class="wf-circle" style="width:30px;height:30px"></div><div class="wf-stack wf-fill"><div class="wf-line w-60"></div><div class="wf-line w-30"></div></div></div>'.repeat(3)}
        </div>
        <div class="wf-fill"></div>
        <div class="wf-line w-full" style="height:4px"></div>
        <div class="wf-row wf-center" style="gap:16px;padding-top:4px"><div class="wf-circle" style="width:22px;height:22px"></div><div class="wf-circle fill" style="width:40px;height:40px"></div><div class="wf-circle" style="width:22px;height:22px"></div></div>
      </div>`,
      note: 'The wireframe is dark because the decision is dark. This screen was structured for a hand in a black room — large targets, a fixed player at the foot, nothing that needs aim.'
    },
    palettely: {
      wireframe: `<div class="wireframe">
        <div class="wf-status"><span></span><span></span></div>
        <div class="wf-row"><div class="wf-line title w-40"></div><div class="wf-fill"></div><div class="wf-circle" style="width:18px;height:18px"></div></div>
        <div class="wf-box fill" style="height:118px"></div>
        <div class="wf-row" style="gap:5px">${'<div class="wf-box fill wf-fill" style="height:26px"></div>'.repeat(5)}</div>
        <div class="wf-line w-30" style="margin-top:2px"></div>
        <div class="wf-grid wf-fill" style="grid-template-columns:repeat(3,1fr)">${box1.repeat(6)}</div>
      </div>`,
      note: 'The flow reads top to bottom exactly as the task does — the photo, the palette it yields, the moodboard it feeds. The structure is the verb list.'
    },
    paperlens: {
      wireframe: `<div class="wireframe">
        <div class="wf-status"><span></span><span></span></div>
        <div class="wf-box fill wf-fill" style="display:flex;align-items:center;justify-content:center">
          <div class="wf-box" style="width:62%;height:62%;border-style:dashed"></div>
        </div>
        <div class="wf-row wf-center" style="padding:8px 0"><div class="wf-circle fill" style="width:48px;height:48px"></div></div>
        <div class="wf-row" style="gap:6px">${'<div class="wf-box fill wf-fill" style="height:34px"></div>'.repeat(3)}</div>
      </div>`,
      note: 'The camera is the screen. Capture is the one large target. Everything else — the documents you’ve already made — waits quietly at the bottom edge.'
    },
    astroorbit: {
      wireframe: `<div class="wireframe">
        <div class="wf-status"><span></span><span></span></div>
        <div class="wf-row"><div class="wf-line w-30"></div><div class="wf-fill"></div><div class="wf-circle" style="width:18px;height:18px"></div></div>
        <div class="wf-box fill wf-fill" style="display:flex;align-items:center;justify-content:center">
          <div class="wf-circle" style="width:72%;aspect-ratio:1;display:flex;align-items:center;justify-content:center"><div class="wf-circle fill" style="width:20%;aspect-ratio:1"></div></div>
        </div>
        <div class="wf-row wf-center" style="padding-top:6px"><div class="wf-pill" style="width:78px;height:24px"></div></div>
      </div>`,
      note: 'A game wireframe is mostly negative space. The job here was protecting the play field — the HUD shrinks to two corners so nothing competes with the thing you’re actually watching.'
    },
    mergerise: {
      wireframe: `<div class="wireframe">
        <div class="wf-status"><span></span><span></span></div>
        <div class="wf-row" style="gap:8px"><div class="wf-box fill wf-fill" style="height:34px"></div><div class="wf-box fill wf-fill" style="height:34px"></div></div>
        <div class="wf-grid" style="grid-template-columns:repeat(4,1fr)">${box1.repeat(16)}</div>
        <div class="wf-fill"></div>
        <div class="wf-box fill" style="height:30px"></div>
      </div>`,
      note: 'Two layers, cleanly separated: the 2048 grid is the structure’s centre and stays sacred; the civilisation lives in a strip above and below it, never crowding the board.'
    },
    fuzzypop: {
      wireframe: `<div class="wireframe">
        <div class="wf-status"><span></span></div>
        <div class="wf-row"><div class="wf-fill"></div><div class="wf-circle" style="width:28px;height:28px"></div></div>
        <div class="wf-box fill wf-fill" style="display:flex;flex-wrap:wrap;gap:12px;align-content:center;justify-content:center;padding:16px">
          ${'<div class="wf-circle fill" style="width:32px;height:32px"></div>'.repeat(6)}
        </div>
      </div>`,
      note: 'The wireframe is almost empty — and that is the design. One score, one corner, and a play field with nothing a small child could tap by mistake.'
    },
    tzc: {
      wireframe: `<div class="wireframe">
        <div class="wf-status"><span></span><span></span></div>
        <div class="wf-row"><div class="wf-line title w-50"></div><div class="wf-fill"></div><div class="wf-circle" style="width:20px;height:20px"></div></div>
        <div class="wf-stack">
          ${'<div class="wf-row"><div class="wf-circle fill" style="width:26px;height:26px"></div><div class="wf-stack wf-fill"><div class="wf-line w-50"></div><div class="wf-line w-30"></div></div><div class="wf-line w-20"></div></div>'.repeat(4)}
        </div>
        <div class="wf-fill"></div>
        <div class="wf-box" style="height:38px;display:flex;align-items:center;padding:0 6px"><div class="wf-box fill" style="height:22px;width:34%;margin-left:32%"></div></div>
        <div class="wf-row wf-center" style="padding-top:4px"><div class="wf-pill fill" style="width:124px;height:30px"></div></div>
      </div>`,
      note: 'People stack at the top, the overlap band sits below them, and the answer — the best time — is the last thing on the screen. The layout is the sentence: who, when, go.'
    },
    qito: {
      wireframe: `<div class="wireframe">
        <div class="wf-status"><span></span><span></span></div>
        <div class="wf-box fill wf-fill" style="display:flex;align-items:center;justify-content:center">
          <div class="wf-box" style="width:56%;aspect-ratio:1;border-style:dashed"></div>
        </div>
        <div class="wf-row wf-center" style="padding-top:8px"><div class="wf-pill" style="width:108px;height:28px"></div></div>
      </div>`,
      note: 'One screen, one frame, one job. The viewport fills everything, the scan target is dead centre, and the result is the only thing that ever appears on top.'
    }
  };

  const overlay  = document.getElementById('caseStudy');
  const csScroll = overlay ? overlay.querySelector('.cs-scroll') : null;
  const csClose  = overlay ? overlay.querySelector('.cs-close') : null;
  let lastTrigger = null;
  let closeTimer  = null;

  function esc(s) {
    return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  }

  function buildCase(p, key) {
    const decisions = p.decisions.map((d) =>
      `<li><div><h4>${esc(d.h)}</h4><p>${esc(d.p)}</p></div></li>`
    ).join('');
    const struct = STRUCTURE[key] || { wireframe: '', note: '' };
    return `
      <article class="cs-content" data-app="${esc(p.title)}">
        <header class="cs-head">
          <img class="cs-icon" src="${p.icon}" alt="" />
          <div class="cs-head-meta">
            <span class="cs-no">${p.n} / 10</span>
            <span class="cs-cat">${esc(p.cat)}</span>
          </div>
          <h2 class="cs-title" id="csTitle">${esc(p.title)}</h2>
          <p class="cs-tag">${esc(p.tag)}</p>
        </header>
        <section class="cs-structure">
          <span class="cs-block-label">Structure → Surface</span>
          <div class="cs-diptych" style="background:${p.tint}">
            <figure class="cs-dip">
              <div class="cs-dip-frame">${struct.wireframe}</div>
              <figcaption><b>Low-fidelity</b> · the bones</figcaption>
            </figure>
            <figure class="cs-dip">
              <div class="cs-dip-frame"><img class="cs-shot" src="${p.shot}" alt="${esc(p.title)} — shipped screen" /></div>
              <figcaption><b>Shipped</b> · the surface</figcaption>
            </figure>
          </div>
          <p class="cs-prose cs-struct-note">${esc(struct.note)}</p>
        </section>
        <div class="cs-body">
          <section class="cs-block">
            <span class="cs-block-label">The brief</span>
            <p class="cs-prose">${esc(p.brief)}</p>
          </section>
          <section class="cs-block">
            <span class="cs-block-label">My role</span>
            <p class="cs-prose">${esc(p.role)}</p>
          </section>
          <section class="cs-block">
            <span class="cs-block-label">Design decisions</span>
            <ol class="cs-decisions">${decisions}</ol>
          </section>
          <section class="cs-block">
            <span class="cs-block-label">Outcome</span>
            <p class="cs-prose cs-outcome">${esc(p.outcome)}</p>
          </section>
        </div>
        <footer class="cs-foot">
          <a class="cs-visit" href="${p.url}" target="_blank" rel="noopener">Visit the live app <span>↗</span></a>
          <span class="cs-foot-meta">${esc(p.year)} · ${esc(p.platforms)}</span>
        </footer>
      </article>`;
  }

  function openCase(key, trigger) {
    const p = PROJECTS[key];
    if (!p || !overlay) return;
    clearTimeout(closeTimer);
    lastTrigger = trigger || null;
    csScroll.innerHTML = buildCase(p, key);
    csScroll.scrollTop = 0;
    overlay.setAttribute('aria-hidden', 'false');
    doc.classList.add('cs-open');
    if (window.__bindCursorHovers) window.__bindCursorHovers(overlay);
    raf(() => raf(() => overlay.classList.add('is-open')));
    setTimeout(() => { csClose && csClose.focus(); }, 60);
  }

  function closeCase() {
    if (!overlay || !overlay.classList.contains('is-open')) return;
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    doc.classList.remove('cs-open');
    if (lastTrigger) { try { lastTrigger.focus(); } catch (e) {} }
    closeTimer = setTimeout(() => {
      if (!overlay.classList.contains('is-open')) csScroll.innerHTML = '';
    }, 700);
  }

  // Wire every case trigger — work rows, spectrum bands, icon marks
  document.querySelectorAll('[data-case]').forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openCase(trigger.dataset.case, trigger);
    });
  });

  /* ---- Floating screenshot preview (desktop) ---- */
  const preview    = document.querySelector('.work-preview');
  const previewImg = preview ? preview.querySelector('img') : null;
  if (preview && previewImg && !isCoarse && !reduced) {
    let px = innerWidth / 2, py = innerHeight / 2, tx = px, ty = py;
    let activeKey = null;
    document.querySelectorAll('.work-row').forEach((row) => {
      const link = row.querySelector('[data-case]');
      if (!link) return;
      const key = link.dataset.case;
      row.addEventListener('mouseenter', () => {
        const p = PROJECTS[key];
        if (!p) return;
        if (activeKey !== key) { previewImg.src = p.shot; activeKey = key; }
        preview.classList.add('is-on');
      });
      row.addEventListener('mouseleave', () => preview.classList.remove('is-on'));
    });
    document.addEventListener('mousemove', (e) => { px = e.clientX; py = e.clientY; }, { passive: true });
    const followTick = () => {
      tx += (px - tx) * 0.14;
      ty += (py - ty) * 0.14;
      const w = preview.offsetWidth || 220;
      const side = px > innerWidth - w - 70 ? -(w + 30) : 30;
      preview.style.transform = `translate(${tx + side}px, ${ty}px) translateY(-50%)`;
      raf(followTick);
    };
    raf(followTick);
  }

  if (overlay) {
    overlay.querySelectorAll('[data-cs-close]').forEach((el) => {
      el.addEventListener('click', closeCase);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeCase();
      // Focus trap
      if (e.key === 'Tab' && overlay.classList.contains('is-open')) {
        const focusables = overlay.querySelectorAll(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last  = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    });
  }
})();
