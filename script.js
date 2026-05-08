/* ── PSX TICKER (renders ticker.json into the hero ticker bar) ── */
(function () {
  const track = document.getElementById('ticker-track');
  if (!track) return;
  const escape = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  fetch('ticker.json', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(payload => {
      const items = Array.isArray(payload && payload.items) ? payload.items : [];
      if (items.length === 0) return;
      const renderItem = (it) => {
        const cls = it.dir === 'neg' ? 'kt-neg' : 'kt-pos';
        return '<div class="kt-item"><span class="kt-sym">' + escape(it.sym) + '</span> <span class="kt-val">' + escape(it.val) + '</span> <span class="kt-val ' + cls + '">' + escape(it.chg) + '</span> <span class="kt-sep">|</span></div>';
      };
      track.innerHTML = items.map(renderItem).join('') + items.map(renderItem).join('');
    })
    .catch(() => { /* keep placeholder */ });
})();

/* ── FAQ ACCORDION (delegated handler, no inline onclick) ── */
(function () {
  const grid = document.getElementById('faqGrid');
  if (!grid) return;
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq-q');
    if (!btn) return;
    const item = btn.closest('.faq-item');
    if (!item) return;
    const open = item.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    const icon = btn.querySelector('.faq-icon');
    if (icon) icon.textContent = open ? '−' : '+';
  });
})();

/* ── LEAD-MAGNET POPUP ──
   Auto-opens once per session after 25 s. Closes via backdrop click, the
   ✕ button, the "No thanks" link, or Escape. Submit hands off to WhatsApp
   with the entered phone prefilled. */
(function () {
  const overlay = document.getElementById('leadPopup');
  if (!overlay) return;
  const closeBtn = overlay.querySelector('.popup-close');
  const skipBtn  = overlay.querySelector('.popup-skip');
  const submit   = overlay.querySelector('.popup-submit');
  const phoneIn  = overlay.querySelector('#popupPhone');

  const close = () => overlay.classList.remove('open');
  const open  = () => overlay.classList.add('open');

  if (closeBtn) closeBtn.addEventListener('click', close);
  if (skipBtn)  skipBtn.addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && overlay.classList.contains('open')) close(); });

  if (submit) submit.addEventListener('click', () => {
    const phone = (phoneIn && phoneIn.value || '').trim();
    const msg = encodeURIComponent('Hi Haseeb! Please send me the free PSX Starter Guide.' + (phone ? ' My WhatsApp: ' + phone : ''));
    window.open('https://wa.me/923158674401?text=' + msg, '_blank', 'noopener,noreferrer');
    close();
  });

  // One-time auto-open (skip on touch to avoid blocking initial scroll, and
  // skip if reduced-motion users don't want surprises).
  try {
    const seen = sessionStorage.getItem('leadPopupSeen');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!seen && !reduceMotion) {
      setTimeout(() => { open(); sessionStorage.setItem('leadPopupSeen', '1'); }, 25000);
    }
  } catch (_) { /* sessionStorage blocked — skip auto-open */ }
})();

/* ── PARTICLES ──
   Mobile/touch perf: fewer particles, no O(n²) line connections, and the
   loop pauses entirely when the hero leaves the viewport. */
const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;
const cvs = document.getElementById('hero-canvas');
const cx  = cvs.getContext('2d');
let pts = [];
let heroVisible = true;
let rafId = 0;

const PARTICLE_COUNT = IS_TOUCH ? 35 : 110;
const DRAW_LINES     = !IS_TOUCH;
const LINE_DIST      = 95;

function resizeCvs() { cvs.width = innerWidth; cvs.height = innerHeight; }
resizeCvs();
window.addEventListener('resize', resizeCvs);

class Pt {
  constructor() { this.init(); }
  init() {
    this.x  = Math.random() * cvs.width;
    this.y  = Math.random() * cvs.height;
    this.r  = Math.random() * 1.4 + 0.3;
    this.vx = (Math.random() - 0.5) * 0.28;
    this.vy = (Math.random() - 0.5) * 0.28;
    this.a  = Math.random() * 0.4 + 0.12;
    this.c  = Math.random() > 0.55 ? '249,115,22' : '107,99,88';
  }
  step() {
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0 || this.x > cvs.width)  this.vx *= -1;
    if (this.y < 0 || this.y > cvs.height) this.vy *= -1;
  }
  draw() {
    cx.beginPath();
    cx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
    cx.fillStyle = `rgba(${this.c},${this.a})`;
    cx.fill();
  }
}
for (let i = 0; i < PARTICLE_COUNT; i++) pts.push(new Pt());

function drawLines() {
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (d < LINE_DIST) {
        cx.beginPath();
        cx.moveTo(pts[i].x, pts[i].y);
        cx.lineTo(pts[j].x, pts[j].y);
        cx.strokeStyle = `rgba(194,65,12,${0.10*(1-d/LINE_DIST)})`;
        cx.lineWidth = 0.5;
        cx.stroke();
      }
    }
  }
}

function loop() {
  cx.clearRect(0, 0, cvs.width, cvs.height);
  const g = cx.createRadialGradient(cvs.width*.5, cvs.height*.4, 0, cvs.width*.5, cvs.height*.4, cvs.width*.7);
  g.addColorStop(0, 'rgba(249,115,22,0.08)');
  g.addColorStop(1, 'rgba(247,238,223,0)');
  cx.fillStyle = g; cx.fillRect(0,0,cvs.width,cvs.height);
  pts.forEach(p => { p.step(); p.draw(); });
  if (DRAW_LINES) drawLines();
  rafId = requestAnimationFrame(loop);
}

function startLoop() { if (!rafId) rafId = requestAnimationFrame(loop); }
function stopLoop()  { if (rafId)  { cancelAnimationFrame(rafId); rafId = 0; } }

// Pause the particle loop when hero scrolls out of view (huge mobile battery + jank win)
if ('IntersectionObserver' in window) {
  const heroEl = document.getElementById('hero');
  if (heroEl) {
    new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      heroVisible ? startLoop() : stopLoop();
    }, { threshold: 0 }).observe(heroEl);
  }
}
// Also pause when the tab is backgrounded
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopLoop(); else if (heroVisible) startLoop();
});

startLoop();

/* ── SMOOTH SCROLL (LENIS) ──
   Desktop only. iOS Safari already has best-in-class native momentum
   scroll, and Lenis hooking touch/wheel events on top of it makes the
   page feel unresponsive. Touch devices get native scroll. */
let lenis = null;
if (!IS_TOUCH && typeof Lenis !== 'undefined') {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction: 'vertical',
    gestureDirection: 'vertical',
    smooth: true,
    mouseMultiplier: 1,
    smoothTouch: false,
    touchMultiplier: 2,
    infinite: false,
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
}

/* ── GSAP ── */
gsap.registerPlugin(ScrollTrigger);

const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (lenis) {
  // Sync Lenis with GSAP ScrollTrigger via scrollerProxy (prevents stuck-invisible elements)
  ScrollTrigger.scrollerProxy(document.body, {
    scrollTop(value) {
      return arguments.length ? lenis.scrollTo(value, { immediate: true }) : window.scrollY;
    },
    getBoundingClientRect() {
      return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
    },
    pinType: document.body.style.transform ? "transform" : "fixed"
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);
}

// Refresh ScrollTrigger after layout settles (prevents misfires on slow connections)
window.addEventListener('load', () => { ScrollTrigger.refresh(); });
setTimeout(() => ScrollTrigger.refresh(), 600);

// Safety net: any element targeted by an animation that ends up stuck invisible after 3s gets forced visible
function safetyShow(selector) {
  setTimeout(() => {
    document.querySelectorAll(selector).forEach(el => {
      const cs = getComputedStyle(el);
      if (parseFloat(cs.opacity) < 0.05 && el.offsetParent !== null) {
        el.style.opacity = '1';
        el.style.transform = 'none';
      }
    });
  }, 3000);
}

// Initial states for scrub animations
gsap.set('.hero-eyebrow,.hero-sub,.hero-desc,.hero-btns,.scroll-hint', { opacity:0, y:30 });
gsap.set('.hero-name .word', { opacity:0, y:50 });

if (REDUCE_MOTION) {
  // Skip all entrance/scrub animations — show everything immediately
  gsap.set('.hero-eyebrow,.hero-sub,.hero-desc,.hero-btns,.scroll-hint,.hero-name .word,.hero-badge,.orb,.wa-btn',
    { opacity:1, y:0, scale:1, clearProps: 'transform' });
}

// Hero timeline (Entrance) — skipped if reduced motion
if (!REDUCE_MOTION) {
  const htl = gsap.timeline({ defaults:{ ease:'power4.out' } });
  htl.to('.hero-eyebrow',     { opacity:1, y:0, duration:1, delay:0.2 })
     .to('.hero-name .word',  { opacity:1, y:0, duration:1.2, stagger:0.15 }, '-=0.6')
     .to('.hero-sub',         { opacity:1, y:0, duration:1 }, '-=0.8')
     .to('.hero-desc',        { opacity:1, y:0, duration:1 }, '-=0.8')
     .to('.hero-btns',        { opacity:1, y:0, duration:1 }, '-=0.8')
     .to('.scroll-hint',      { opacity:1, y:0, duration:1 }, '-=0.5');
}

// Hero Scrub (Parallax Out)
gsap.to('.hero-content', {
  y: -150,
  opacity: 0,
  ease: 'none',
  scrollTrigger: {
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    scrub: 1
  }
});
gsap.to('#hero-canvas', {
  y: 100,
  opacity: 0.2,
  ease: 'none',
  scrollTrigger: {
    trigger: '#hero',
    start: 'top top',
    end: 'bottom top',
    scrub: 1
  }
});

// About Image Scrub Scale
gsap.fromTo('#aImg img',
  { scale: 1.3, filter: 'brightness(0.6)' },
  { scale: 1, filter: 'brightness(1)', ease: 'none',
    scrollTrigger: {
      trigger: '#about',
      start: 'top bottom',
      end: 'center center',
      scrub: 1
    }
  }
);

/* ── CARD REVEALS (CSS-driven via IntersectionObserver — never gets stuck) ── */
const REVEAL_SELECTORS = [
  '.card-main', '.card-sub', '.about-txt',
  '#curTA', '#curFA', '.pkg-card', '.founding-badge'
];
const revealEls = document.querySelectorAll(REVEAL_SELECTORS.join(','));
revealEls.forEach((el, i) => {
  el.classList.add('reveal');
  // Stagger via inline delay (cap at 6 to avoid huge waits)
  el.style.transitionDelay = Math.min(i % 4, 5) * 90 + 'ms';
});

if (REDUCE_MOTION || !('IntersectionObserver' in window)) {
  revealEls.forEach(el => el.classList.add('in'));
} else {
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
  revealEls.forEach(el => io.observe(el));
  // Hard fallback: anything still hidden after 4s gets shown
  setTimeout(() => revealEls.forEach(el => el.classList.add('in')), 4000);
}

// WhatsApp button entrance
gsap.set('.wa-btn', { opacity:0, y:20, scale:0.85 });
gsap.to('.wa-btn', { opacity:1, y:0, scale:1, duration:0.7, delay:1.8, ease:'back.out(1.5)' });


/* ── NAV SCROLL ── */
let navTicking = false;
window.addEventListener('scroll', () => {
  if (navTicking) return;
  navTicking = true;
  requestAnimationFrame(() => {
    document.getElementById('nav').classList.toggle('scrolled', scrollY > 50);
    navTicking = false;
  });
}, { passive: true });

function openLightbox(src, caption) {
  document.getElementById('lbImg').src = src;
  document.getElementById('lbCaption').textContent = caption;
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });

// 3-D tilt on service cards (desktop only — pointless on touch and causes jank)
if (!IS_TOUCH) {
  document.querySelectorAll('.card-main').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top)  / r.height - 0.5) * -7;
      const ry = ((e.clientX - r.left) / r.width  - 0.5) *  7;
      card.style.transform = `translateY(-5px) perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}


// Smooth anchor scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (!href || href === '#' || href.length < 2) return; // ignore bare # (used by buttons)
    let t = null;
    try { t = document.querySelector(href); } catch { return; }
    if (!t) return;
    e.preventDefault();
    window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - 76, behavior:'smooth' });
  });
});

/* ── MOBILE MENU ── */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('active');
  });
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('active');
    });
  });
}

/* ── CUSTOM CURSOR ──
   Skipped entirely on touch devices — cursor is hidden via CSS there, and
   running mousemove + a permanent rAF loop on Android wastes frames. */
const cDot  = document.getElementById('cDot');
const cRing = document.getElementById('cRing');
let mx = innerWidth/2, my = innerHeight/2;
let rx = mx, ry = my;

if (!IS_TOUCH && cDot && cRing) {
  window.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    cDot.style.left = mx + 'px';
    cDot.style.top  = my + 'px';
  });

  (function ringLoop() {
    rx += (mx - rx) * 0.11;
    ry += (my - ry) * 0.11;
    cRing.style.left = rx + 'px';
    cRing.style.top  = ry + 'px';
    requestAnimationFrame(ringLoop);
  })();
}

if (!IS_TOUCH && cDot && cRing) {
  document.querySelectorAll('a, button, .card-main, .card-sub, .c-enroll').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cRing.style.transform = 'translate(-50%,-50%) scale(2)';
      cRing.style.borderColor = 'rgba(96,165,250,0.75)';
      cDot.style.opacity = '0.4';
    });
    el.addEventListener('mouseleave', () => {
      cRing.style.transform = 'translate(-50%,-50%) scale(1)';
      cRing.style.borderColor = 'rgba(96,165,250,0.45)';
      cDot.style.opacity = '1';
    });
  });
}

/* ── HERO ORB FADE-IN ── */
gsap.to('.orb', { opacity: 0.1, duration: 2.5, stagger: 0.4, delay: 0.5, ease: 'power2.out' });

/* ── HERO BADGE INITIAL STATE ── */
gsap.set('.hero-badge', { opacity: 0, y: 16 });
gsap.to('.hero-badge', { opacity: 1, y: 0, duration: 0.8, delay: 0.15, ease: 'power3.out' });

/* ── HERO MOUSE PARALLAX (desktop only) ── */
const heroEl = document.getElementById('hero');
const heroContent = document.querySelector('.hero-content');
if (!IS_TOUCH && heroEl) {
  heroEl.addEventListener('mousemove', e => {
    const px = (e.clientX / innerWidth  - 0.5) * 22;
    const py = (e.clientY / innerHeight - 0.5) * 12;
    gsap.to(heroContent,   { x: px * 0.35, y: py * 0.35, duration: 0.9, ease: 'power2.out' });
    gsap.to('.orb-1', { x: px * 0.5,  y: py * 0.5,  duration: 1.2, ease: 'power2.out' });
    gsap.to('.orb-2', { x: px * -0.4, y: py * -0.3, duration: 1.4, ease: 'power2.out' });
  });
}
heroEl.addEventListener('mouseleave', () => {
  gsap.to([heroContent, '.orb-1', '.orb-2'], { x: 0, y: 0, duration: 1, ease: 'power2.out' });
});

/* ── CONTACT FORM SUBMISSION ── */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const btn = document.getElementById('formSubmitBtn');
    const status = document.getElementById('formStatus');
    btn.disabled = true;
    btn.textContent = 'Sending…';
    status.style.display = 'none';
    try {
      const res = await fetch(contactForm.action, {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      });
      if (res.ok) {
        status.style.display = 'block';
        status.style.color = '#4ade80';
        status.textContent = '✓ Message sent! I\'ll get back to you within 24 hours.';
        contactForm.reset();
        btn.textContent = 'Send Message →';
      } else {
        throw new Error('server');
      }
    } catch {
      status.style.display = 'block';
      status.style.color = '#f87171';
      status.textContent = '✗ Something went wrong. Please message me directly on WhatsApp.';
      btn.textContent = 'Send Message →';
    }
    btn.disabled = false;
  });
}

/* ── SECTION TITLE UNDERLINES ── */
document.querySelectorAll('.s-title').forEach(el => {
  const line = document.createElement('span');
  line.className = 's-title-line';
  el.appendChild(line);
  ScrollTrigger.create({
    trigger: el, start: 'top 85%', once: true,
    onEnter: () => line.classList.add('animate')
  });
});


/* -- BACK TO TOP -- */
const backToTop = document.createElement('button');
backToTop.id = 'backToTop';
backToTop.innerHTML = '↑';
backToTop.setAttribute('aria-label', 'Back to top');
document.body.appendChild(backToTop);

window.addEventListener('scroll', () => {
  if (window.scrollY > 500) {
    backToTop.classList.add('show');
  } else {
    backToTop.classList.remove('show');
  }
});

backToTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* -- FORM VALIDATION (ENHANCED) -- */
const emailInput = document.querySelector('#contactForm input[type="email"]');
if (emailInput) {
  emailInput.addEventListener('input', function() {
    if (this.validity.typeMismatch) {
      this.setCustomValidity('Please enter a valid email address.');
    } else {
      this.setCustomValidity('');
    }
  });
}

/* -- HAMBURGER ARIA -- */
if (hamburger) {
  hamburger.setAttribute('aria-label', 'Toggle Navigation');
  hamburger.setAttribute('aria-expanded', 'false');
  
  hamburger.addEventListener('click', () => {
    const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', !isExpanded);
  });
}

/* ── PSX TICKER FETCH ──
   Ticker is rendered by the inline script in index.html which reads
   ticker.json (refreshed by a GitHub Action every 15 min during PSX hours).
   No client-side fetch loop here — it would race with the inline render
   and overwrite real values with stale fallback data. */

/* ── STUDENT AUTH ──
   Primary: backend API (/api/auth/*) — PBKDF2 hashing, HMAC-signed tokens.
   Fallback: localStorage (used when backend unreachable, e.g. static hosting). */
(function authModule() {
  const $ = (s, r=document) => r.querySelector(s);
  const overlay   = $('#authOverlay');
  if (!overlay) return;

  const auth = window.haseebAuth;

  const tabSignin = $('#authTabSignin');
  const tabSignup = $('#authTabSignup');
  const formSignin= $('#authFormSignin');
  const formSignup= $('#authFormSignup');
  const errSignin = $('#authErrSignin');
  const errSignup = $('#authErrSignup');
  const infoSignin= $('#authInfoSignin');
  const infoSignup= $('#authInfoSignup');
  const navSignin = $('#navSigninBtn');
  const navAccount= $('#navAccount');
  const navAccountName = $('#navAccountName');
  const navLogout = $('#navLogoutBtn');
  const forgotLink   = $('#authForgot');

  function showInfo(el, msg) {
    if (!el) return;
    el.textContent = msg;
    el.classList.toggle('show', !!msg);
  }
  function clearMessages() {
    if (errSignin)  errSignin.textContent = '';
    if (errSignup)  errSignup.textContent = '';
    showInfo(infoSignin, '');
    showInfo(infoSignup, '');
  }

  function showOverlay(tab='signin') {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    setTab(tab);
    setTimeout(() => $('#'+(tab==='signup'?'suEmail':'siEmail'))?.focus(), 80);
  }
  function hideOverlay() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    clearMessages();
    formSignin.reset(); formSignup.reset();
  }
  function setTab(tab) {
    const isSignup = tab === 'signup';
    tabSignin.classList.toggle('active', !isSignup);
    tabSignup.classList.toggle('active',  isSignup);
    formSignin.classList.toggle('hidden',  isSignup);
    formSignup.classList.toggle('hidden', !isSignup);
  }

  function refreshNav(user) {
    if (user && user.email) {
      navSignin?.classList.add('hidden');
      navAccount?.classList.remove('hidden');
      const name = auth?.nameOf?.(user) || user.email.split('@')[0];
      if (navAccountName) navAccountName.textContent = name;
    } else {
      navSignin?.classList.remove('hidden');
      navAccount?.classList.add('hidden');
    }
  }

  // Event wiring (UI-only — works even if Supabase is unconfigured)
  navSignin?.addEventListener('click', e => { e.preventDefault(); showOverlay('signin'); });
  document.getElementById('mobileSignin')?.addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('hamburger')?.classList.remove('active');
    document.getElementById('navLinks')?.classList.remove('active');
    showOverlay('signin');
  });
  $('#authClose')?.addEventListener('click', hideOverlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) hideOverlay(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) hideOverlay(); });
  tabSignin.addEventListener('click', () => { clearMessages(); setTab('signin'); });
  tabSignup.addEventListener('click', () => { clearMessages(); setTab('signup'); });
  $('#authToSignup')?.addEventListener('click', e => { e.preventDefault(); clearMessages(); setTab('signup'); });
  $('#authToSignin')?.addEventListener('click', e => { e.preventDefault(); clearMessages(); setTab('signin'); });

  function setBusy(form, busy) {
    const btn = form.querySelector('.auth-submit');
    if (!btn) return;
    if (busy) {
      btn.dataset.label = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Please wait…';
    } else {
      btn.disabled = false;
      btn.textContent = btn.dataset.label || btn.textContent;
    }
  }

  function requireAuth(errEl) {
    if (!auth?.ready) {
      if (errEl) errEl.textContent = 'Sign-in is not configured yet. Please try again later.';
      return false;
    }
    return true;
  }

  navLogout?.addEventListener('click', async e => {
    e.preventDefault();
    if (auth?.ready) await auth.signout();
    refreshNav(null);
  });

  forgotLink?.addEventListener('click', async e => {
    e.preventDefault();
    clearMessages();
    if (!requireAuth(errSignin)) return;
    const email = ($('#siEmail')?.value || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errSignin.textContent = 'Enter your email above first, then click "Forgot password?".';
      return;
    }
    try {
      await auth.resetPassword(email);
      showInfo(infoSignin, `If an account exists for ${email}, a reset link has been sent.`);
    } catch (err) {
      errSignin.textContent = err?.message || 'Could not send reset email.';
    }
  });

  formSignup.addEventListener('submit', async e => {
    e.preventDefault();
    clearMessages();
    const fd = new FormData(formSignup);
    const name  = (fd.get('name')||'').toString().trim();
    const email = (fd.get('email')||'').toString().trim().toLowerCase();
    const phone = (fd.get('phone')||'').toString().trim();
    const pw    = (fd.get('password')||'').toString();
    const pw2   = (fd.get('password2')||'').toString();

    if (name.length < 2)                          return errSignup.textContent = 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return errSignup.textContent = 'Enter a valid email.';
    if (phone && !/^[\d\s+()-]{7,}$/.test(phone)) return errSignup.textContent = 'Enter a valid phone number.';
    if (pw.length < 8)                             return errSignup.textContent = 'Password must be 8+ characters.';
    if (pw !== pw2)                                return errSignup.textContent = 'Passwords do not match.';
    const termsBox = formSignup.querySelector('.auth-check input[type="checkbox"]');
    if (termsBox && !termsBox.checked)             return errSignup.textContent = 'Please accept Terms & Privacy.';
    if (!requireAuth(errSignup)) return;

    setBusy(formSignup, true);
    try {
      const { needsVerification } = await auth.signup({ name, email, phone, password: pw });
      if (needsVerification) {
        formSignup.reset();
        showInfo(infoSignup, `Check ${email} to confirm your address. Once verified, sign in to continue.`);
      } else {
        hideOverlay();
      }
    } catch (err) {
      errSignup.textContent = err?.message || 'Signup failed.';
    } finally {
      setBusy(formSignup, false);
    }
  });

  formSignin.addEventListener('submit', async e => {
    e.preventDefault();
    clearMessages();
    const fd = new FormData(formSignin);
    const email = (fd.get('email')||'').toString().trim().toLowerCase();
    const pw    = (fd.get('password')||'').toString();
    if (!email || !pw) return errSignin.textContent = 'Email and password required.';
    if (!requireAuth(errSignin)) return;

    setBusy(formSignin, true);
    try {
      await auth.signin({ email, password: pw });
      hideOverlay();
    } catch (err) {
      errSignin.textContent = err?.message || 'Sign-in failed.';
    } finally {
      setBusy(formSignin, false);
    }
  });

  // Subscribe to auth state and rehydrate
  if (auth?.ready) {
    auth.onChange(refreshNav);
    auth.getUser().then(refreshNav);
  } else {
    refreshNav(null);
  }
  window.HZAuth = { showOverlay, hideOverlay, refreshNav, readSession };
})();