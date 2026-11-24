/* =========================================================================
   HERO KINETIC TYPOGRAPHY & SINGLE-DECODER SMOOTH VIDEO BACKGROUND
========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const SLIDES = [
    {
      l1: 'PAREKRAF', l2: 'Investasi', l3: 'NUSANTARA 2025',
      eyebrow: 'PARIWISATA & EKONOMI KREATIF · 2025',
      tagline: 'Intelijen arus modal PMDN 38 provinsi berbasis <em>Apriori &amp; FP-Growth</em>.',
      count: '01'
    },
    {
      l1: 'APRIORI', l2: 'versus', l3: 'FP-GROWTH',
      eyebrow: 'ASSOCIATION RULE MINING · BENCHMARK',
      tagline: 'Memetakan pola keterkaitan <em>wilayah, triwulan</em>, dan skala modal wisata.',
      count: '02'
    },
    {
      l1: 'DESTINASI', l2: 'Prioritas', l3: 'NUSANTARA',
      eyebrow: '10 KAWASAN PARIWISATA PRIORITAS',
      tagline: 'Mengukur daya tarik <em>Destinasi Prioritas</em> bagi ekonomi kreatif nasional.',
      count: '03'
    }
  ];

  let activeSlide = 0;
  let isHeroInView = true;
  let videoCleanupTimer = null;
  const heroBackdrop = document.getElementById('hero-backdrop');
  const heroSectionEl = document.getElementById('hero');
  const heroVids = Array.from(document.querySelectorAll('.hero-vid'));
  let isSlideBusy = false;

  // Decode ONLY the active video so 3 simultaneous decoders never starve the GPU
  function syncActiveVideo(immediate) {
    if (videoCleanupTimer) {
      clearTimeout(videoCleanupTimer);
      videoCleanupTimer = null;
    }

    heroVids.forEach((v, i) => {
      const isActive = (i === activeSlide);
      v.classList.toggle('active', isActive);
      if (isActive) {
        if (v.preload === 'none') v.preload = 'auto';
        if (isHeroInView && v.paused) {
          v.play().catch(() => {});
        }
      }
    });

    const pauseOthers = () => {
      heroVids.forEach((v, i) => {
        if (i !== activeSlide && !v.paused) {
          v.pause();
        }
      });
    };

    if (immediate) pauseOthers();
    else videoCleanupTimer = setTimeout(pauseOthers, 900);
  }

  syncActiveVideo(true);

  // Lazy-fetch metadata for slides 1 & 2 after initial page paint settles
  setTimeout(() => {
    heroVids.forEach((v, i) => {
      if (i !== activeSlide && v.preload === 'none') {
        v.preload = 'metadata';
      }
    });
  }, 1500);

  // Pause active video automatically when scrolled past hero so scrolling/Leaflet stay 60fps
  if (heroSectionEl && typeof IntersectionObserver !== 'undefined') {
    const heroVisObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isHeroInView = entry.isIntersecting;
        const activeVid = heroVids[activeSlide];
        if (!activeVid) return;
        if (isHeroInView) {
          if (activeVid.paused) activeVid.play().catch(() => {});
        } else {
          heroVids.forEach(v => { if (!v.paused) v.pause(); });
        }
      });
    }, { threshold: 0.25 });
    heroVisObs.observe(heroSectionEl);
  }

  // Ambient Spotlight Sheen
  let heroPointerTicking = false;
  window.addEventListener('pointermove', (e) => {
    if (!heroSectionEl || !isHeroInView || heroPointerTicking) return;
    heroPointerTicking = true;
    requestAnimationFrame(() => {
      const r = heroSectionEl.getBoundingClientRect();
      if (e.clientY <= r.bottom && e.clientY >= r.top) {
        heroSectionEl.style.setProperty('--hx', `${e.clientX - r.left}px`);
        heroSectionEl.style.setProperty('--hy', `${e.clientY - r.top}px`);
      }
      heroPointerTicking = false;
    });
  }, { passive: true });

  function setSlide(idx) {
    if (isSlideBusy || !heroBackdrop) return;
    isSlideBusy = true;

    activeSlide = (idx + SLIDES.length) % SLIDES.length;
    const s = SLIDES[activeSlide];

    syncActiveVideo(false);

    document.querySelectorAll('.hero-dot').forEach((d, i) => {
      d.classList.toggle('active', i === activeSlide);
    });

    heroBackdrop.classList.add('slide-exit');
    if (heroSectionEl) heroSectionEl.classList.add('hero-meta-exit');

    setTimeout(() => {
      const l1 = document.getElementById('h-line-1');
      const l2 = document.getElementById('h-line-2');
      const l3 = document.getElementById('h-line-3');
      const eye = document.getElementById('h-eyebrow');
      const tag = document.getElementById('h-tagline');
      const cnt = document.getElementById('h-counter');

      if (l1) l1.textContent = s.l1;
      if (l2) l2.textContent = s.l2;
      if (l3) l3.textContent = s.l3;
      if (eye) eye.textContent = s.eyebrow;
      if (tag) tag.innerHTML = s.tagline;
      if (cnt) cnt.textContent = s.count;

      heroBackdrop.classList.remove('slide-exit');
      heroBackdrop.classList.add('slide-prep');
      void heroBackdrop.offsetWidth;

      requestAnimationFrame(() => {
        heroBackdrop.classList.remove('slide-prep');
        if (heroSectionEl) heroSectionEl.classList.remove('hero-meta-exit');

        setTimeout(() => {
          isSlideBusy = false;
        }, 460);
      });
    }, 190);
  }

  const prevBtn = document.getElementById('slide-prev');
  const nextBtn = document.getElementById('slide-next');
  if (prevBtn) prevBtn.addEventListener('click', () => setSlide(activeSlide - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => setSlide(activeSlide + 1));

  document.querySelectorAll('.hero-dot').forEach(d => {
    d.addEventListener('click', () => setSlide(parseInt(d.dataset.slide, 10)));
  });

  window.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') return;
    if (e.key === 'ArrowRight') setSlide(activeSlide + 1);
    if (e.key === 'ArrowLeft') setSlide(activeSlide - 1);
  });
});
