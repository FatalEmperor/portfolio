/* ── PARTICLES ── */
const cvs = document.getElementById('hero-canvas');
const cx  = cvs.getContext('2d');
let pts = [];

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
    this.a  = Math.random() * 0.45 + 0.08;
    this.c  = Math.random() > 0.55 ? '96,165,250' : '148,163,184';
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
for (let i = 0; i < 110; i++) pts.push(new Pt());

function drawLines() {
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (d < 95) {
        cx.beginPath();
        cx.moveTo(pts[i].x, pts[i].y);
        cx.lineTo(pts[j].x, pts[j].y);
        cx.strokeStyle = `rgba(96,165,250,${0.07*(1-d/95)})`;
        cx.lineWidth = 0.5;
        cx.stroke();
      }
    }
  }
}

function loop() {
  cx.clearRect(0, 0, cvs.width, cvs.height);
  // radial gradient overlay
  const g = cx.createRadialGradient(cvs.width*.5, cvs.height*.4, 0, cvs.width*.5, cvs.height*.4, cvs.width*.7);
  g.addColorStop(0, 'rgba(13,31,60,0.25)');
  g.addColorStop(1, 'rgba(6,13,24,0)');
  cx.fillStyle = g; cx.fillRect(0,0,cvs.width,cvs.height);
  pts.forEach(p => { p.step(); p.draw(); });
  drawLines();
  requestAnimationFrame(loop);
}
loop();

/* ── SMOOTH SCROLL (LENIS) ── */
const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false,
})

function raf(time) {
  lenis.raf(time)
  requestAnimationFrame(raf)
}
requestAnimationFrame(raf)

/* ── GSAP ── */
gsap.registerPlugin(ScrollTrigger);

const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
gsap.ticker.add((time)=>{ lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);

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
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', scrollY > 50);
});

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

// 3-D tilt on service cards
document.querySelectorAll('.card-main').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r  = card.getBoundingClientRect();
    const rx = ((e.clientY - r.top)  / r.height - 0.5) * -7;
    const ry = ((e.clientX - r.left) / r.width  - 0.5) *  7;
    card.style.transform = `translateY(-5px) perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});


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

/* ── CUSTOM CURSOR ── */
const cDot  = document.getElementById('cDot');
const cRing = document.getElementById('cRing');
let mx = innerWidth/2, my = innerHeight/2;
let rx = mx, ry = my;

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

/* ── HERO ORB FADE-IN ── */
gsap.to('.orb', { opacity: 0.1, duration: 2.5, stagger: 0.4, delay: 0.5, ease: 'power2.out' });

/* ── HERO BADGE INITIAL STATE ── */
gsap.set('.hero-badge', { opacity: 0, y: 16 });
gsap.to('.hero-badge', { opacity: 1, y: 0, duration: 0.8, delay: 0.15, ease: 'power3.out' });

/* ── HERO MOUSE PARALLAX ── */
const heroEl = document.getElementById('hero');
const heroContent = document.querySelector('.hero-content');
heroEl.addEventListener('mousemove', e => {
  const px = (e.clientX / innerWidth  - 0.5) * 22;
  const py = (e.clientY / innerHeight - 0.5) * 12;
  gsap.to(heroContent,   { x: px * 0.35, y: py * 0.35, duration: 0.9, ease: 'power2.out' });
  gsap.to('.orb-1', { x: px * 0.5,  y: py * 0.5,  duration: 1.2, ease: 'power2.out' });
  gsap.to('.orb-2', { x: px * -0.4, y: py * -0.3, duration: 1.4, ease: 'power2.out' });
});
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

/* ── PSX TICKER FETCH ── */

async function fetchTickerData() {
  const track = document.getElementById('ticker-track');
  if (!track) return;

  const symbols = ['KSE100', 'OGDC', 'PPL', 'ENGRO', 'HBL', 'HUBC', 'SYS', 'MEBL', 'LUCK'];

  function buildTickerHtml(items) {
    return [...items, ...items].map(([sym, price, pct]) => {
      const isPos = pct.startsWith('+');
      return `<div class="kt-item"><span class="kt-sym">${sym}</span><span class="kt-val">${price}</span><span class="kt-val ${isPos ? 'kt-pos' : 'kt-neg'}">${pct}</span><span class="kt-sep">|</span></div>`;
    }).join('');
  }

  const renderMock = () => {
    const mock = [
      ['KSE100', '162,994', '+1.12%'], ['OGDC', '299.63', '+0.45%'], ['PPL', '218.70', '-0.12%'],
      ['ENGRO', '342.10', '+0.85%'], ['HBL', '112.45', '+2.10%'], ['SYS', '450.00', '-0.50%'],
      ['MEBL', '189.30', '+0.33%'], ['HUBC', '90.50', '-0.20%'], ['LUCK', '520.00', '+1.50%']
    ];
    track.innerHTML = buildTickerHtml(mock);
  };

  function parsePsxTimeseries(sym, json) {
    const data = json.data;
    if (!data || data.length < 2) return null;
    const latest = data[0][1];
    const open   = data[data.length - 1][1];
    const pct    = open !== 0 ? ((latest - open) / open) * 100 : 0;
    const price  = latest > 1000
      ? latest.toLocaleString('en-US', { maximumFractionDigits: 0 })
      : latest.toFixed(2);
    return [sym, price, (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%'];
  }

  // Try proxies in order: Node server → PHP host → mock
  const proxies = ['/api/ticker', 'assets/ticker.php'];
  for (const endpoint of proxies) {
    try {
      const res = await fetch(endpoint);
      if (!res.ok) continue;
      const result = await res.json();
      if (result.data && Object.keys(result.data).length > 0) {
        const items = Object.entries(result.data).map(([sym, [price, change]]) => {
          const isPos = parseFloat(change) >= 0;
          return [sym, price, (isPos && !change.startsWith('+') ? '+' : '') + change];
        });
        track.innerHTML = buildTickerHtml(items);
        return;
      }
    } catch (_) {}
  }

  renderMock();
}

fetchTickerData();
setInterval(fetchTickerData, 60000); // Refresh every minute

/* ── STUDENT AUTH ──
   Primary: backend API (/api/auth/*) — PBKDF2 hashing, HMAC-signed tokens.
   Fallback: localStorage (used when backend unreachable, e.g. static hosting). */
(function authModule() {
  const TOKEN_KEY    = 'hz_token';
  const SESSION_KEY  = 'hz_session';
  const USERS_KEY    = 'hz_users';     // localStorage fallback only
  const API_BASE     = '/api/auth';

  const $ = (s, r=document) => r.querySelector(s);
  const overlay   = $('#authOverlay');
  if (!overlay) return;

  const tabSignin = $('#authTabSignin');
  const tabSignup = $('#authTabSignup');
  const formSignin= $('#authFormSignin');
  const formSignup= $('#authFormSignup');
  const errSignin = $('#authErrSignin');
  const errSignup = $('#authErrSignup');
  const navSignin = $('#navSigninBtn');
  const navAccount= $('#navAccount');
  const navAccountName = $('#navAccountName');
  const navLogout = $('#navLogoutBtn');

  let backendAvailable = null; // unknown; probed lazily

  async function probeBackend() {
    if (backendAvailable !== null) return backendAvailable;
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 1500);
      const res = await fetch(API_BASE + '/me', {
        method: 'GET',
        signal: ctrl.signal,
        headers: { 'Authorization': 'Bearer probe' }
      });
      clearTimeout(timer);
      // Any HTTP response (even 401) means backend is up
      backendAvailable = res.status >= 200 && res.status < 600;
    } catch { backendAvailable = false; }
    return backendAvailable;
  }

  /* localStorage fallback helpers */
  function readUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; }
    catch { return {}; }
  }
  function writeUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
  async function shaHash(str) {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
    }
    let h = 0; for (let i=0;i<str.length;i++) { h = ((h<<5)-h) + str.charCodeAt(i); h |= 0; }
    return String(h);
  }
  function readSession() {
    try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
    catch { return null; }
  }
  function writeSession(s) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); }
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  /* API calls */
  async function apiSignup(payload) {
    const res = await fetch(API_BASE + '/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Signup failed.');
    return data;
  }
  async function apiSignin(payload) {
    const res = await fetch(API_BASE + '/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Sign-in failed.');
    return data;
  }
  async function apiMe(token) {
    const res = await fetch(API_BASE + '/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    if (!res.ok) return null;
    return res.json();
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
    errSignin.textContent = ''; errSignup.textContent = '';
    formSignin.reset(); formSignup.reset();
  }
  function setTab(tab) {
    const isSignup = tab === 'signup';
    tabSignin.classList.toggle('active', !isSignup);
    tabSignup.classList.toggle('active',  isSignup);
    formSignin.classList.toggle('hidden',  isSignup);
    formSignup.classList.toggle('hidden', !isSignup);
  }

  function refreshNav() {
    const sess = readSession();
    if (sess && sess.email) {
      navSignin?.classList.add('hidden');
      navAccount?.classList.remove('hidden');
      navAccountName.textContent = sess.name || sess.email.split('@')[0];
    } else {
      navSignin?.classList.remove('hidden');
      navAccount?.classList.add('hidden');
    }
  }

  // On load: if we have a backend token, validate it
  async function rehydrate() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    if (!(await probeBackend())) return; // backend down — keep localStorage session as-is
    const me = await apiMe(token);
    if (me && me.user) {
      writeSession({ email: me.user.email, name: me.user.name, loginAt: Date.now() });
    } else {
      clearSession();
    }
    refreshNav();
  }

  // Event wiring
  navSignin?.addEventListener('click', e => { e.preventDefault(); showOverlay('signin'); });
  document.getElementById('mobileSignin')?.addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('hamburger')?.classList.remove('active');
    document.getElementById('navLinks')?.classList.remove('active');
    showOverlay('signin');
  });
  navLogout?.addEventListener('click', e => {
    e.preventDefault();
    clearSession();
    refreshNav();
  });
  $('#authClose')?.addEventListener('click', hideOverlay);
  overlay.addEventListener('click', e => { if (e.target === overlay) hideOverlay(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) hideOverlay(); });
  tabSignin.addEventListener('click', () => setTab('signin'));
  tabSignup.addEventListener('click', () => setTab('signup'));
  $('#authToSignup')?.addEventListener('click', e => { e.preventDefault(); setTab('signup'); });
  $('#authToSignin')?.addEventListener('click', e => { e.preventDefault(); setTab('signin'); });

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

  formSignup.addEventListener('submit', async e => {
    e.preventDefault();
    errSignup.textContent = '';
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

    setBusy(formSignup, true);
    try {
      if (await probeBackend()) {
        const data = await apiSignup({ name, email, phone, password: pw });
        localStorage.setItem(TOKEN_KEY, data.token);
        writeSession({ email: data.user.email, name: data.user.name, loginAt: Date.now() });
      } else {
        // localStorage fallback
        const users = readUsers();
        if (users[email]) throw new Error('An account with this email already exists.');
        const ph = await shaHash(pw);
        users[email] = { name, email, phone, ph, createdAt: Date.now() };
        writeUsers(users);
        writeSession({ email, name, loginAt: Date.now() });
      }
      refreshNav();
      hideOverlay();
    } catch (err) {
      errSignup.textContent = err.message || 'Signup failed.';
    } finally {
      setBusy(formSignup, false);
    }
  });

  formSignin.addEventListener('submit', async e => {
    e.preventDefault();
    errSignin.textContent = '';
    const fd = new FormData(formSignin);
    const email = (fd.get('email')||'').toString().trim().toLowerCase();
    const pw    = (fd.get('password')||'').toString();
    if (!email || !pw) return errSignin.textContent = 'Email and password required.';

    setBusy(formSignin, true);
    try {
      if (await probeBackend()) {
        const data = await apiSignin({ email, password: pw });
        localStorage.setItem(TOKEN_KEY, data.token);
        writeSession({ email: data.user.email, name: data.user.name, loginAt: Date.now() });
      } else {
        const users = readUsers();
        const user = users[email];
        if (!user) throw new Error('No account with that email.');
        const ph = await shaHash(pw);
        if (ph !== user.ph) throw new Error('Incorrect password.');
        writeSession({ email, name: user.name, loginAt: Date.now() });
      }
      refreshNav();
      hideOverlay();
    } catch (err) {
      errSignin.textContent = err.message || 'Sign-in failed.';
    } finally {
      setBusy(formSignin, false);
    }
  });

  refreshNav();
  rehydrate();
  window.HZAuth = { showOverlay, hideOverlay, refreshNav, readSession };
})();