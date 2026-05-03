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

// Sync Lenis with GSAP ScrollTrigger
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((time)=>{
  lenis.raf(time * 1000)
})
gsap.ticker.lagSmoothing(0)

// Initial states for scrub animations
gsap.set('.hero-eyebrow,.hero-sub,.hero-desc,.hero-btns,.scroll-hint', { opacity:0, y:30 });
gsap.set('.hero-name .word', { opacity:0, y:50 });

// Hero timeline (Entrance)
const htl = gsap.timeline({ defaults:{ ease:'power4.out' } });
htl.to('.hero-eyebrow',     { opacity:1, y:0, duration:1, delay:0.2 })
   .to('.hero-name .word',  { opacity:1, y:0, duration:1.2, stagger:0.15 }, '-=0.6')
   .to('.hero-sub',         { opacity:1, y:0, duration:1 }, '-=0.8')
   .to('.hero-desc',        { opacity:1, y:0, duration:1 }, '-=0.8')
   .to('.hero-btns',        { opacity:1, y:0, duration:1 }, '-=0.8')
   .to('.scroll-hint',      { opacity:1, y:0, duration:1 }, '-=0.5');

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

// Services Scrub Parallax
gsap.from('.card-main', {
  y: 100,
  opacity: 0,
  stagger: 0.2,
  ease: 'power2.out',
  scrollTrigger: {
    trigger: '#services',
    start: 'top 85%',
    end: 'top 20%',
    scrub: 1
  }
});
gsap.from('.card-sub', {
  y: 50,
  opacity: 0,
  stagger: 0.1,
  ease: 'power2.out',
  scrollTrigger: {
    trigger: '.svc-sub',
    start: 'top 90%',
    end: 'top 50%',
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
gsap.from('.about-txt', {
  x: 50,
  opacity: 0,
  ease: 'none',
  scrollTrigger: {
    trigger: '#about',
    start: 'top 80%',
    end: 'center center',
    scrub: 1
  }
});

// Track Record Pin & Scrub
const trTl = gsap.timeline({
  scrollTrigger: {
    trigger: '#track-record',
    start: 'top top',
    end: '+=800', // Pin for 800px of scrolling
    pin: true,
    scrub: 1
  }
});
trTl.from('.tr-header', { opacity: 0, y: 50, duration: 1 })
    .from('.tr-stat-card', { opacity: 0, y: 100, scale: 0.8, stagger: 0.2, duration: 2 }, '-=0.5')
    .from('.tr-charts', { opacity: 0, y: 50, duration: 2 }, '-=1');

// Animated counters on normal enter
ScrollTrigger.create({
  trigger:'#track-record', start:'top 80%', once:true,
  onEnter() {
    document.querySelectorAll('.tr-cnt').forEach(el => {
      const target  = parseFloat(el.dataset.t);
      const dec     = parseInt(el.dataset.dec);
      const prefix  = el.dataset.prefix || '';
      const suffix  = el.dataset.suffix || '';
      el.textContent = prefix + (0).toFixed(dec) + suffix;
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

// Curriculum Scrub Overlap
gsap.from('#curTA', {
  y: 100, opacity: 0, rotation: -2, ease: 'none',
  scrollTrigger: { trigger: '#curriculum', start: 'top 80%', end: 'top 30%', scrub: 1 }
});
gsap.from('#curFA', {
  y: 150, opacity: 0, rotation: 2, ease: 'none',
  scrollTrigger: { trigger: '#curriculum', start: 'top 70%', end: 'top 20%', scrub: 1 }
});

// Pricing Scrub
gsap.from('.pkg-card', {
  y: 100, opacity: 0, stagger: 0.15, ease: 'none',
  scrollTrigger: { trigger: '#pricing', start: 'top 85%', end: 'top 30%', scrub: 1 }
});

// Testimonials Scrub
gsap.from('.founding-badge', {
  scale: 0.8, opacity: 0, y: 50, ease: 'none',
  scrollTrigger: { trigger: '#testimonials', start: 'top 90%', end: 'top 40%', scrub: 1 }
});

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

/* ── PSX TICKER FETCH ── */

async function fetchTickerData() {
  const track = document.getElementById('ticker-track');
  if (!track) return;
  
  const symbols = ['KSE100', 'OGDC', 'PPL', 'ENGRO', 'HBL', 'HUBC', 'SYS', 'MEBL', 'LUCK'];
  
  const renderMock = () => {
    const mock = [
        ['KSE100', '162,994', '+1.12%'], ['OGDC', '299.63', '+0.45%'], ['PPL', '218.70', '-0.12%'],
        ['ENGRO', '342.10', '+0.85%'], ['HBL', '112.45', '+2.10%'], ['SYS', '450.00', '-0.50%']
    ];
    let mockHtml = '';
    [...mock, ...mock].forEach(m => {
        const isPos = m[2].includes('+');
        const color = isPos ? 'kt-pos' : 'kt-neg';
        mockHtml += `
          <div class="kt-item">
            <span class="kt-sym">${m[0]}</span>
            <span class="kt-val">${m[1]}</span>
            <span class="kt-val ${color}">${m[2]}</span>
            <span class="kt-sep">|</span>
          </div>
        `;
    });
    track.innerHTML = mockHtml;
  };

  try {
    // Try local proxy first
    const response = await fetch('assets/ticker.php');
    if (!response.ok) throw new Error('Proxy down');
    const result = await response.json();
    
    if (result.data && Object.keys(result.data).length > 0) {
      let html = '';
      const syms = Object.keys(result.data);
      const displayData = [...syms, ...syms]; 
      
      displayData.forEach(sym => {
        const [price, change] = result.data[sym];
        const isPos = parseFloat(change) >= 0;
        const colorClass = isPos ? 'kt-pos' : 'kt-neg';
        const sign = isPos ? '+' : '';
        html += `
          <div class="kt-item">
            <span class="kt-sym">${sym}</span>
            <span class="kt-val">${price}</span>
            <span class="kt-val ${colorClass}">${sign}${change}</span>
            <span class="kt-sep">|</span>
          </div>
        `;
      });
      track.innerHTML = html;
    } else {
      renderMock();
    }
  } catch (err) {
    console.warn('Ticker fetch failed, using fallback display.');
    renderMock();
  }
}
</span>
            <span class="kt-val">${price}</span>
            <span class="kt-val ${colorClass}">${sign}${change}</span>
            <span class="kt-sep">|</span>
          </div>
        `;
      });
      track.innerHTML = html;
    }
  } catch (err) {
    console.error('Ticker Error:', err);
    track.innerHTML = '<span class="kt-item" style="color:#f87171">Market data currently unavailable</span>';
  }
}

fetchTickerData();
setInterval(fetchTickerData, 60000); // Refresh every minute