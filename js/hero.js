/* =========================================================================
   HERO KINETIC TYPOGRAPHY & VIDEO BACKGROUND CROSSFADE
========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const SLIDES = [
    {
      l1: 'PAREKRAF', l2: 'Investasi', l3: 'NUSANTARA 2025',
      eyebrow: 'DATA MINING 2 · SEKTOR PARIWISATA & EKONOMI KREATIF',
      tagline: 'Pemetaan Komprehensif Arus Modal PMDN 38 Provinsi Berbasis <em>Algoritma Asosiasi</em>.',
      count: '01'
    },
    {
      l1: 'APRIORI', l2: 'versus', l3: 'FP-GROWTH',
      eyebrow: 'BENCHMARK · ASSOCIATION RULE MINING',
      tagline: 'Menemukan keterkaitan <em>wilayah, triwulan</em>, dan skala modal wisata.',
      count: '02'
    },
    {
      l1: 'DESTINASI', l2: 'Prioritas', l3: 'NUSANTARA',
      eyebrow: 'EQUITY · 10 KAWASAN PARIWISATA PRIORITAS',
      tagline: 'Mengukur daya tarik <em>Destinasi Prioritas</em> bagi pelaku kreatif nasional.',
      count: '03'
    }
  ];

  let activeSlide = 0;
  const heroBackdrop = document.getElementById('hero-backdrop');
  const heroSectionEl = document.getElementById('hero');
  const heroVids = document.querySelectorAll('.hero-vid');
  let isSlideBusy = false;

  // Start all videos in hardware loop immediately
  heroVids.forEach(v => {
    v.play().catch(() => {});
  });

  // Ambient Spotlight Sheen that tracks cursor smoothly without layout thrashing
  let heroPointerTicking = false;
  window.addEventListener('pointermove', (e) => {
    if (!heroSectionEl || heroPointerTicking) return;
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

    // 1. Crossfade videos immediately — pure GPU opacity crossfade (NO seek, NO currentTime=0)
    heroVids.forEach((v, i) => {
      const isActive = (i === activeSlide);
      v.classList.toggle('active', isActive);
      if (isActive && v.paused) {
        v.play().catch(() => {});
      }
    });

    // 2. Active dot updates immediately
    document.querySelectorAll('.hero-dot').forEach((d, i) => {
      d.classList.toggle('active', i === activeSlide);
    });

    // 3. Ultra-smooth Two-Phase Text Transition
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

      // Prep enter position (opposite offset)
      heroBackdrop.classList.remove('slide-exit');
      heroBackdrop.classList.add('slide-prep');

      // Force layout repaint
      void heroBackdrop.offsetWidth;

      // Glide smoothly into neutral position
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
