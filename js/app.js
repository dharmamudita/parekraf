/* =========================================================================
   PAREKRAFMIND 2025 - MAIN APPLICATION COORDINATOR & SCROLL REVEAL
========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Scroll Reveal Observer
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  // Global KPI Count-Up Animation
  const kpiCounters = document.querySelectorAll('.counter-animate');
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseFloat(el.dataset.count || '0');
        const isDecimal = String(target).includes('.');
        const duration = 1600;
        const start = performance.now();

        function step(now) {
          const progress = Math.min((now - start) / duration, 1);
          // Ease-out cubic
          const ease = 1 - Math.pow(1 - progress, 3);
          const current = target * ease;
          if (isDecimal) {
            el.textContent = current.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          } else {
            el.textContent = Math.round(current).toLocaleString('id-ID');
          }
          if (progress < 1) requestAnimationFrame(step);
          else {
            if (isDecimal) el.textContent = target.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            else el.textContent = Math.round(target).toLocaleString('id-ID');
          }
        }
        requestAnimationFrame(step);
        countObs.unobserve(el);
      }
    });
  }, { threshold: 0.2 });

  kpiCounters.forEach(c => countObs.observe(c));

  console.log('ParekrafMind 2025 Initialized. 1.471 Records Loaded.');
});
