/* =========================================================================
   EXECUTIVE POLICY BRIEF MODAL & PRINT ENGINE
========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  const btnOpenBrief = document.getElementById('btn-open-brief');
  const briefModal = document.getElementById('brief-modal');
  const btnCloseBrief = document.getElementById('btn-close-brief');
  const btnPrintBrief = document.getElementById('btn-print-brief');

  function openBriefModal() {
    if (!briefModal) return;
    briefModal.classList.add('open');
    briefModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeBriefModal() {
    if (!briefModal) return;
    briefModal.classList.remove('open');
    briefModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (btnOpenBrief) btnOpenBrief.addEventListener('click', openBriefModal);
  if (btnCloseBrief) btnCloseBrief.addEventListener('click', closeBriefModal);
  if (briefModal) {
    briefModal.addEventListener('click', (e) => {
      if (e.target === briefModal) closeBriefModal();
    });
  }
  if (btnPrintBrief) {
    btnPrintBrief.addEventListener('click', () => {
      window.print();
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && briefModal && briefModal.classList.contains('open')) {
      closeBriefModal();
    }
  });
});
