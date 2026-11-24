/* =========================================================================
   PAREKRAFMIND 2025 - SCROLL REVEAL, KPI COUNT-UP & CARD SPOTLIGHT
========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Ambient Monochrome Spotlight on Cards
  document.addEventListener('pointermove', (e) => {
    const card = e.target.closest('.card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });

  // Scroll Reveal & KPI Count-Up
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');

      const counter = entry.target.querySelector('[data-count]');
      if (counter && !counter.dataset.animated) {
        counter.dataset.animated = '1';
        const target = parseFloat(counter.dataset.count);
        const decimals = parseInt(counter.dataset.decimals || '0', 10);
        const prefix = counter.dataset.prefix || '';
        const suffix = counter.dataset.suffix || '';
        const dur = 850;
        const start = performance.now();

        const step = (now) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = target * eased;
          counter.textContent = prefix + (decimals > 0 ? fmtDec(val, decimals) : fmtInt(Math.round(val))) + suffix;
          if (p < 1) requestAnimationFrame(step);
          else counter.textContent = prefix + (decimals > 0 ? fmtDec(target, decimals) : fmtInt(Math.round(target))) + suffix;
        };
        requestAnimationFrame(step);
      }

      revealObs.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

  window.observeNewReveals = (root) => {
    (root || document).querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
  };

  window.observeNewReveals(document);
  console.log('ParekrafMind 2025 Initialized. 1.471 Records Loaded.');
});
