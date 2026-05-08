// Lightweight Lenis init for subpages. Homepage uses its own Lenis setup
// (with GSAP ScrollTrigger sync) directly in script.js.
(function () {
  if (typeof Lenis === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  // Skip on touch devices — iOS native momentum scroll is better than Lenis,
  // and Lenis hooks make the page feel unresponsive on iPhone/Android.
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const lenis = new Lenis({
    duration: 1.1,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smooth: true,
    smoothTouch: false,
    touchMultiplier: 2,
  });
  function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  // Anchor links: defer to Lenis' built-in scrollTo so #foo links feel smooth too.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: -80 });
  });
})();
