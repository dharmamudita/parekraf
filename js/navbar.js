/* =========================================================================
   NAVBAR, SCROLL PROGRESS, CAPSULE TRACKING & MOBILE DRAWER NAVIGATION
========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const scrollProgress = document.getElementById('scroll-progress');
  const siteHeader = document.getElementById('site-header');
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('main section[id]');
  const mobileDock = document.getElementById('mobile-dock');

  function onScroll() {
    const scrollTop = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = maxScroll > 0 ? Math.min(scrollTop / maxScroll, 1) : 0;

    if (scrollProgress) scrollProgress.style.transform = `scaleX(${ratio})`;
    if (siteHeader) siteHeader.classList.toggle('scrolled', scrollTop > 40);

    let current = '';
    sections.forEach(sec => {
      if (scrollTop >= sec.offsetTop - 220) current = sec.id;
    });

    navLinks.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === `#${current}`);
    });

    document.querySelectorAll('.dock-btn[data-target]').forEach(b => {
      b.classList.toggle('active', b.dataset.target === current);
    });

    if (mobileDock) {
      mobileDock.classList.toggle('dock-visible', scrollTop > 200);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile Drawer Controls
  const mobileMenu = document.getElementById('mobile-menu');
  const navToggle = document.getElementById('nav-toggle');
  const dockMenuToggle = document.getElementById('dock-menu-toggle');
  const toggleText = document.getElementById('toggle-text');
  const mobileCloseBtn = document.getElementById('mobile-close');

  function openMobile() {
    if (!mobileMenu) return;
    mobileMenu.classList.add('open');
    mobileMenu.setAttribute('aria-hidden', 'false');
    if (navToggle) {
      navToggle.classList.add('open');
      navToggle.setAttribute('aria-expanded', 'true');
      if (toggleText) toggleText.textContent = 'TUTUP';
    }
    document.body.style.overflow = 'hidden';
  }

  function closeMobile() {
    if (!mobileMenu) return;
    mobileMenu.classList.remove('open');
    mobileMenu.setAttribute('aria-hidden', 'true');
    if (navToggle) {
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      if (toggleText) toggleText.textContent = 'MENU';
    }
    document.body.style.overflow = '';
  }

  function toggleMobileMenu() {
    if (!mobileMenu) return;
    if (mobileMenu.classList.contains('open')) closeMobile();
    else openMobile();
  }

  window.closeMobileDrawer = closeMobile;

  if (navToggle) navToggle.addEventListener('click', toggleMobileMenu);
  if (dockMenuToggle) dockMenuToggle.addEventListener('click', openMobile);
  if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', closeMobile);
  if (mobileMenu) {
    mobileMenu.addEventListener('click', (e) => {
      if (e.target === mobileMenu) closeMobile();
    });
  }
  document.querySelectorAll('.m-nav-card, .m-link').forEach(a => {
    a.addEventListener('click', closeMobile);
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobileMenu && mobileMenu.classList.contains('open')) {
      closeMobile();
    }
  });
});
