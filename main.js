/* Shivani Sudhir — portfolio interactions
   Light touch. No frameworks. Respects reduced-motion. */

(() => {
  const isCoarse  = matchMedia('(pointer: coarse)').matches;
  const reduced   = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header scroll state ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  revealEls.forEach(el => {
    const d = el.dataset.revealDelay;
    if (d) el.style.setProperty('--reveal-delay', `${d}ms`);
  });
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ---------- Floating glyph parallax ---------- */
  const glyphs = document.querySelectorAll('.float-glyph');
  if (glyphs.length && !isCoarse && !reduced) {
    let mx = 0, my = 0, tx = 0, ty = 0;
    window.addEventListener('mousemove', (e) => {
      mx = (e.clientX / window.innerWidth  - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    const tick = () => {
      tx += (mx - tx) * 0.06;
      ty += (my - ty) * 0.06;
      glyphs.forEach(g => {
        const d = parseFloat(g.dataset.depth || 0.05);
        g.style.transform = `translate3d(${tx * d * 60}px, ${ty * d * 60}px, 0)`;
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Custom cursor + magnetic links (desktop only) ---------- */
  if (!isCoarse && !reduced) {
    const cursor = document.querySelector('.cursor');
    const dot    = document.querySelector('.cursor-dot');
    const ring   = document.querySelector('.cursor-ring');

    let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    let dx = cx, dy = cy;     // dot follows quickly
    let rx = cx, ry = cy;     // ring trails

    window.addEventListener('mousemove', (e) => {
      cx = e.clientX; cy = e.clientY;
    }, { passive: true });

    document.addEventListener('mousedown', () => cursor.classList.add('is-down'));
    document.addEventListener('mouseup',   () => cursor.classList.remove('is-down'));

    const animate = () => {
      dx += (cx - dx) * 0.35;
      dy += (cy - dy) * 0.35;
      rx += (cx - rx) * 0.18;
      ry += (cy - ry) * 0.18;
      if (dot)  dot.style.transform  = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
      if (ring) ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);

    const hoverables = document.querySelectorAll('a, button, [role="link"], [data-magnetic]');
    hoverables.forEach(el => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-hover'));
      el.addEventListener('mouseleave', () => {
        cursor.classList.remove('is-hover');
        if (el.dataset.magnetic !== undefined) el.style.transform = '';
      });
    });

    /* Magnetic pull on opted-in elements */
    const magnetics = document.querySelectorAll('[data-magnetic]');
    magnetics.forEach(el => {
      const STRENGTH = el.classList.contains('case-link') ? 0.06 : 0.22;
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width  / 2);
        const y = e.clientY - (r.top  + r.height / 2);
        el.style.transform = `translate3d(${x * STRENGTH}px, ${y * STRENGTH}px, 0)`;
      });
    });
  }

  /* ---------- Marquee: clone if too short (safety) ---------- */
  const marquee = document.querySelector('.marquee-track');
  if (marquee) {
    requestAnimationFrame(() => {
      if (marquee.scrollWidth < window.innerWidth * 2) {
        marquee.innerHTML += marquee.innerHTML;
      }
    });
  }

  /* ---------- Year stamp in footer (if a [data-year] node exists) ---------- */
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
})();
