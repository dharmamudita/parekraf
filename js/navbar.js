/* =========================================================================
   NAVBAR & MOBILE DRAWER NAVIGATION
========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const mDrawer = document.getElementById('m-drawer');
  const mOpenBtn = document.getElementById('m-open-btn');
  const mCloseBtn = document.getElementById('m-close-btn');

  function openMobile() {
    if (mDrawer) {
      mDrawer.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMobile() {
    if (mDrawer) {
      mDrawer.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (mOpenBtn) mOpenBtn.addEventListener('click', openMobile);
  if (mCloseBtn) mCloseBtn.addEventListener('click', closeMobile);
  if (mDrawer) {
    mDrawer.addEventListener('click', (e) => {
      if (e.target === mDrawer) closeMobile();
    });
  }
  document.querySelectorAll('.mobile-nav-card, .m-link').forEach(a => {
    a.addEventListener('click', closeMobile);
  });

  // Active Capsule Link Tracking
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link[data-nav]');

  function updateActiveNav() {
    const scrollY = window.pageYOffset;
    sections.forEach(sec => {
      const top = sec.offsetTop - 120;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('data-nav') === id);
        });
      }
    });
  }
  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();
});
