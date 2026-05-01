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

/* ── GSAP ── */
gsap.registerPlugin(ScrollTrigger);

// Set initial states
gsap.set('.hero-eyebrow,.hero-sub,.hero-desc,.hero-btns,.scroll-hint', { opacity:0, y:28 });
gsap.set('.hero-name .word', { opacity:0, y:45 });
gsap.set('.stat-item', { opacity:0, y:24 });
gsap.set('#svc-lbl,#svc-ttl,#svc-sub,.card-main,.card-sub', { opacity:0, y:28 });
gsap.set('#aImg', { opacity:0, x:-38 });
gsap.set('#aTxt', { opacity:0, x:38 });
gsap.set('#cInfo', { opacity:0, y:30 });
gsap.set('#cForm', { opacity:0, y:30 });

// Hero timeline
const htl = gsap.timeline({ defaults:{ ease:'power3.out' } });
htl.to('.hero-eyebrow',     { opacity:1, y:0, duration:.75, delay:.25 })
   .to('.hero-name .word',  { opacity:1, y:0, duration:.8, stagger:.18 }, '-=.35')
   .to('.hero-sub',         { opacity:1, y:0, duration:.7 }, '-=.35')
   .to('.hero-desc',        { opacity:1, y:0, duration:.7 }, '-=.5')
   .to('.hero-btns',        { opacity:1, y:0, duration:.7 }, '-=.45')
   .to('.scroll-hint',      { opacity:1, y:0, duration:.6 }, '-=.2');

// Nav scroll
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', scrollY > 50);
});

// Stats
ScrollTrigger.create({
  trigger:'#stats', start:'top 82%', once:true,
  onEnter() {
    gsap.to('.stat-item', { opacity:1, y:0, duration:.6, stagger:.14, ease:'power3.out' });
    document.querySelectorAll('.cnt').forEach(el => {
      const t = +el.dataset.t; let c = 0; const s = t / 55;
      const id = setInterval(() => {
        c += s; if (c >= t) { el.textContent = t; clearInterval(id); return; }
        el.textContent = Math.floor(c);
      }, 22);
    });
  }
});

// Services
ScrollTrigger.create({
  trigger:'#services', start:'top 80%', once:true,
  onEnter() {
    gsap.to('#svc-lbl',    { opacity:1, y:0, duration:.6, ease:'power3.out' });
    gsap.to('#svc-ttl',    { opacity:1, y:0, duration:.6, delay:.1, ease:'power3.out' });
    gsap.to('#svc-sub',    { opacity:1, y:0, duration:.6, delay:.18, ease:'power3.out' });
    gsap.to('.card-main',  { opacity:1, y:0, duration:.75, stagger:.16, delay:.28, ease:'power3.out' });
    gsap.to('.card-sub',   { opacity:1, y:0, duration:.6,  stagger:.1,  delay:.5,  ease:'power3.out' });
  }
});

// About
ScrollTrigger.create({
  trigger:'#about', start:'top 78%', once:true,
  onEnter() {
    gsap.to('#aImg', { opacity:1, x:0, duration:.95, ease:'power3.out' });
    gsap.to('#aTxt', { opacity:1, x:0, duration:.95, delay:.18, ease:'power3.out' });
    document.querySelectorAll('.sk-fill').forEach(b => {
      gsap.to(b, { width: b.dataset.w + '%', duration:1.3, delay:.55, ease:'power2.out' });
    });
  }
});

// Contact
ScrollTrigger.create({
  trigger:'#contact', start:'top 80%', once:true,
  onEnter() {
    gsap.to('#cInfo', { opacity:1, y:0, duration:.75, ease:'power3.out' });
    gsap.to('#cForm', { opacity:1, y:0, duration:.75, delay:.2, ease:'power3.out' });
  }
});

// Track Record
gsap.set('#trStats .tr-stat-card', { opacity:0, y:30 });
gsap.set('#trCharts .tr-chart-card', { opacity:0, y:30 });
ScrollTrigger.create({
  trigger:'#track-record', start:'top 78%', once:true,
  onEnter() {
    gsap.to('#trStats .tr-stat-card', { opacity:1, y:0, duration:.6, stagger:.08, ease:'power3.out' });
    gsap.to('#trCharts .tr-chart-card', { opacity:1, y:0, duration:.75, stagger:.15, delay:.4, ease:'power3.out' });
    // Animated counters
    document.querySelectorAll('.tr-cnt').forEach(el => {
      const target  = parseFloat(el.dataset.t);
      const dec     = parseInt(el.dataset.dec);
      const prefix  = el.dataset.prefix || '';
      const suffix  = el.dataset.suffix || '';
      let current   = 0;
      const steps   = 60;
      const inc     = target / steps;
      const id = setInterval(() => {
        current += inc;
        if (current >= target) {
          el.textContent = prefix + target.toFixed(dec) + suffix;
          clearInterval(id); return;
        }
        el.textContent = prefix + current.toFixed(dec) + suffix;
      }, 20);
    });
  }
});

/* ── LIGHTBOX ── */
/* ── COUNTDOWN TIMER ── */
(function() {
  const stored = localStorage.getItem('pkgDeadline');
  let deadline;
  if (stored) {
    deadline = new Date(stored);
  } else {
    deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    localStorage.setItem('pkgDeadline', deadline.toISOString());
  }
  function tick() {
    const diff = deadline - Date.now();
    if (diff <= 0) {
      ['tDays','tHours','tMins','tSecs'].forEach(id => { const el = document.getElementById(id); if(el) el.textContent = '00'; });
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const fmt = n => String(n).padStart(2,'0');
    const dEl = document.getElementById('tDays');   if(dEl) dEl.textContent = fmt(d);
    const hEl = document.getElementById('tHours');  if(hEl) hEl.textContent = fmt(h);
    const mEl = document.getElementById('tMins');   if(mEl) mEl.textContent = fmt(m);
    const sEl = document.getElementById('tSecs');   if(sEl) sEl.textContent = fmt(s);
  }
  tick(); setInterval(tick, 1000);
})();

/* ── FAQ ACCORDION ── */
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(el => {
    el.classList.remove('open');
    el.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
  });
  if (!isOpen) {
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  }
}

/* ── LEAD MAGNET POPUP ── */
function closePopup() {
  document.getElementById('leadPopup').classList.remove('open');
  document.body.style.overflow = '';
  sessionStorage.setItem('popupSeen', '1');
}
function submitPopup() {
  const phone = document.getElementById('popupPhone').value.trim();
  if (!phone) { document.getElementById('popupPhone').style.borderColor = '#ef4444'; return; }
  const msg = encodeURIComponent('Hi Haseeb! I want the free PSX Starter Guide. My number: ' + phone);
  window.open('https://wa.me/923158674401?text=' + msg, '_blank');
  closePopup();
}
// Show popup after 45 seconds OR on exit-intent, whichever comes first
if (!sessionStorage.getItem('popupSeen')) {
  let popupShown = false;
  function showPopup() {
    if (popupShown) return;
    popupShown = true;
    document.getElementById('leadPopup').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  // Timed trigger — 45 seconds
  setTimeout(showPopup, 45000);
  // Exit-intent trigger — mouse leaves toward top of viewport
  document.addEventListener('mouseleave', function onExitIntent(e) {
    if (e.clientY <= 10) {
      showPopup();
      document.removeEventListener('mouseleave', onExitIntent);
    }
  });
}
// Close popup on overlay click
document.getElementById('leadPopup').addEventListener('click', function(e) {
  if (e.target === this) closePopup();
});

/* ── PRICING ANIMATIONS ── */
gsap.set('#pkgGrid .pkg-card', { opacity:0, y:35 });
gsap.set('#mentorCard', { opacity:0, y:25 });
gsap.set('.payment-strip', { opacity:0, y:20 });
ScrollTrigger.create({
  trigger:'#pricing', start:'top 78%', once:true,
  onEnter() {
    gsap.to('#pkgGrid .pkg-card', { opacity:1, y:0, duration:.75, stagger:.15, ease:'power3.out' });
    gsap.to('#mentorCard',  { opacity:1, y:0, duration:.7, delay:.5, ease:'power3.out' });
    gsap.to('.payment-strip', { opacity:1, y:0, duration:.6, delay:.7, ease:'power3.out' });
    // Seat bars animate
    document.querySelectorAll('.seats-fill').forEach(b => {
      const w = b.style.width;
      b.style.width = '0%';
      gsap.to(b, { width: w, duration:1.2, delay:.8, ease:'power2.out' });
    });
  }
});

/* ── FAQ ANIMATIONS ── */
gsap.set('#faqGrid .faq-item', { opacity:0, y:22 });
ScrollTrigger.create({
  trigger:'#faq', start:'top 80%', once:true,
  onEnter() {
    gsap.to('#faqGrid .faq-item', { opacity:1, y:0, duration:.55, stagger:.07, ease:'power3.out' });
  }
});

/* ── PSX TICKER DATA ── */
(function initTicker() {

  // Symbol → element-id map
  const SYM_ID = {
    'KSE-100':'t-kse', 'OGDC':'t-ogdc', 'PPL':'t-ppl', 'HBL':'t-hbl',
    'ENGROH':'t-engro', 'MCB':'t-mcb', 'UBL':'t-ubl', 'LUCK':'t-luck',
    'FFC':'t-ffc', 'PSO':'t-pso'
  };

  function setStock(sym, price, pct) {
    const id = SYM_ID[sym];
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    const pctNum = parseFloat(pct);
    const arrow  = isNaN(pctNum) ? '' : (pctNum >= 0 ? ' ▲' : ' ▼');
    const pctStr = isNaN(pctNum) ? '' : ` (${pctNum >= 0 ? '+' : ''}${pctNum.toFixed(2)}%)`;
    el.textContent = price + pctStr + arrow;
    el.className   = 'kt-val ' + (isNaN(pctNum) ? 'kt-neu' : (pctNum >= 0 ? 'kt-pos' : 'kt-neg'));
  }

  // Apply static fallback immediately so ticker never shows blank
  const FALLBACK = {
    'KSE-100':['165,634',''], 'OGDC':['299.63',''], 'PPL':['218.70',''],
    'HBL':['301.16',''],  'ENGROH':['279.07',''], 'MCB':['405.62',''],
    'UBL':['355.93',''],  'LUCK':['434.36',''],   'FFC':['526.99',''],
    'PSO':['362.22','']
  };
  Object.entries(FALLBACK).forEach(([sym, [p, c]]) => setStock(sym, p, c));

  // Duplicate ticker items for seamless CSS loop
  const track = document.getElementById('kseTicker');
  if (track && !track.dataset.duped) {
    track.innerHTML += track.innerHTML;
    track.dataset.duped = '1';
  }

  async function refresh() {
    // ── 1. PSX stocks via local PHP proxy (live) ─────────────────────────
    try {
      const r = await fetch('assets/ticker.php', { cache: 'no-store' });
      if (r.ok) {
        const j = await r.json();
        const d = j.data || {};
        Object.entries(d).forEach(([sym, arr]) => {
          if (arr && arr[0]) setStock(sym, arr[0], arr[1] || '');
        });
        const ts = document.getElementById('tickerTime');
        if (ts) {
          const t = new Date();
          ts.textContent = t.toLocaleTimeString('en-PK', { hour:'2-digit', minute:'2-digit' });
        }
        return; // success — skip Yahoo fallback
      }
    } catch(e) { /* PHP proxy not available — fall through */ }

  }

  refresh();
  setInterval(refresh, 5 * 60 * 1000); // auto-refresh every 5 min
})();

// Sample Analysis
gsap.set('#saGrid .sa-card', { opacity:0, y:30 });
ScrollTrigger.create({ trigger:'#sample-analysis', start:'top 78%', once:true,
  onEnter() { gsap.to('#saGrid .sa-card', { opacity:1, y:0, duration:.75, stagger:.15, ease:'power3.out' }); }
});

// Before/After
gsap.set('#baGrid .ba-col', { opacity:0, x:0, y:30 });
gsap.set('#baGrid .ba-arrow', { opacity:0, scale:0.5 });
ScrollTrigger.create({ trigger:'#before-after', start:'top 78%', once:true,
  onEnter() {
    gsap.to('#baGrid .ba-col', { opacity:1, y:0, duration:.8, stagger:.2, ease:'power3.out' });
    gsap.to('#baGrid .ba-arrow', { opacity:1, scale:1, duration:.6, delay:.3, ease:'back.out(1.5)' });
  }
});

// Blog
gsap.set('#blogGrid .blog-card', { opacity:0, y:30 });
ScrollTrigger.create({ trigger:'#blog', start:'top 78%', once:true,
  onEnter() { gsap.to('#blogGrid .blog-card', { opacity:1, y:0, duration:.6, stagger:.08, ease:'power3.out' }); }
});

// Referral
gsap.set('#refBox', { opacity:0, y:30 });
ScrollTrigger.create({ trigger:'#referral', start:'top 78%', once:true,
  onEnter() { gsap.to('#refBox', { opacity:1, y:0, duration:.85, ease:'power3.out' }); }
});

// Certificate
gsap.set('#certWrap .cert-frame', { opacity:0, x:-40 });
gsap.set('#certWrap .cert-txt',   { opacity:0, x:40 });
ScrollTrigger.create({ trigger:'#certificate', start:'top 78%', once:true,
  onEnter() {
    gsap.to('#certWrap .cert-frame', { opacity:1, x:0, duration:.9, ease:'power3.out' });
    gsap.to('#certWrap .cert-txt',   { opacity:1, x:0, duration:.9, delay:.18, ease:'power3.out' });
  }
});

// How It Works
gsap.set('#hiwS1, #hiwS2, #hiwS3, #hiwS4', { opacity:0, y:35 });
ScrollTrigger.create({
  trigger:'#how-it-works', start:'top 78%', once:true,
  onEnter() {
    gsap.to('#hiwS1, #hiwS2, #hiwS3, #hiwS4', {
      opacity:1, y:0, duration:.7, stagger:.14, ease:'power3.out'
    });
  }
});

// Curriculum
gsap.set('#curTA, #curFA', { opacity:0, y:35 });
ScrollTrigger.create({
  trigger:'#curriculum', start:'top 78%', once:true,
  onEnter() {
    gsap.to('#curTA', { opacity:1, y:0, duration:.8, ease:'power3.out' });
    gsap.to('#curFA', { opacity:1, y:0, duration:.8, delay:.18, ease:'power3.out' });
  }
});

// Testimonials
gsap.set('.founding-badge', { opacity:0, y:30 });
gsap.set('.tst-placeholder', { opacity:0, y:25 });
ScrollTrigger.create({
  trigger:'#testimonials', start:'top 78%', once:true,
  onEnter() {
    gsap.to('.founding-badge', { opacity:1, y:0, duration:.85, ease:'power3.out' });
    gsap.to('.tst-placeholder', { opacity:1, y:0, duration:.65, stagger:.12, delay:.35, ease:'power3.out' });
  }
});

// WhatsApp button entrance
gsap.set('.wa-btn', { opacity:0, y:20, scale:0.85 });
gsap.to('.wa-btn', { opacity:1, y:0, scale:1, duration:.7, delay:1.8, ease:'back.out(1.5)' });

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
    e.preventDefault();
    const t = document.querySelector(a.getAttribute('href'));
    if (t) window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - 76, behavior:'smooth' });
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
backToTop.innerHTML = '?';
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