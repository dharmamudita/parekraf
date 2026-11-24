/* =========================================================================
   10 DESTINASI PARIWISATA PRIORITAS (DPP) & MODAL DETAIL
========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof APP_DATA === 'undefined') return;

  const dppGrid = document.getElementById('dpp-grid');
  const maxDpp = Math.max(...APP_DATA.dppList.map(d => d.valMiliar), 1);
  const dppModal = document.getElementById('dpp-modal');
  let currentDppRaw = null;

  const catClassMap = {
    Investasi_Tinggi: 'cat-tinggi',
    Investasi_Sedang: 'cat-sedang',
    Investasi_Rendah: 'cat-rendah',
    Investasi_Nol: 'cat-nol'
  };

  function openDppModal(d) {
    if (!d || !dppModal) return;
    currentDppRaw = d.raw;
    const rows = APP_DATA.records.filter(r => r[3] === d.raw);
    const provs = [...new Set(rows.map(r => r[1]))].join(', ');
    const totalJuta = rows.reduce((acc, r) => acc + r[4], 0);
    const qTotals = [1, 2, 3, 4].map(q => ({
      q,
      val: rows.filter(r => r[0] === q).reduce((acc, r) => acc + r[4], 0),
      cnt: rows.filter(r => r[0] === q).length
    }));
    const peakQ = [...qTotals].sort((a, b) => b.val - a.val)[0];

    document.getElementById('modal-dpp-prov').textContent = provs || 'INDONESIA';
    document.getElementById('modal-dpp-title').textContent = d.name;
    document.getElementById('modal-dpp-sector').textContent = `Sektor kreatif lokal: ${d.sector}`;
    document.getElementById('modal-dpp-total').textContent = fmtRpJuta(totalJuta);
    document.getElementById('modal-dpp-count').textContent = `${rows.length} laporan`;
    document.getElementById('modal-dpp-peak').textContent = peakQ && peakQ.val > 0 ? `Triwulan ${peakQ.q}` : 'Belum aktif';

    document.getElementById('modal-dpp-quarters').innerHTML = qTotals.map(qt => `
      <div class="modal-q-item">
        <div class="sim-mini-lbl" style="margin-bottom:2px;">Q${qt.q} (${qt.cnt} data)</div>
        <div class="mono-num" style="font-weight:600; color:${peakQ && qt.q === peakQ.q && qt.val > 0 ? 'var(--ink)' : 'var(--ink-2)'};">${fmtRpJuta(qt.val)}</div>
      </div>
    `).join('');

    const cleanKey = 'DPP_' + d.raw.replace(/ - /g, '_').replace(/ /g, '_');
    const matchedDppRules = APP_DATA.dppRules.filter(r => r.a.includes(cleanKey));
    const ruleHtml = matchedDppRules.length
      ? matchedDppRules.map(r => `<strong>Pola Asosiasi:</strong> ${r.a.map(cleanTag).join(' + ')} → ${r.c.map(cleanTag).join(' + ')} (Confidence <strong>${fmtDec(r.cf * 100, 1)}%</strong>, Lift <strong>${fmtDec(r.l, 2)}x</strong>).`).join('<br>')
      : `<strong>Status Kawasan:</strong> ${d.rule}. Belum muncul aturan berfrekuensi tinggi pada min_support 4% karena jumlah pelaporan dan nilai realisasi masih terbatas — berpotensi untuk penguatan rantai pasok UMKM lokal.`;
    document.getElementById('modal-dpp-rule').innerHTML = ruleHtml;

    const sortedRows = [...rows].sort((a, b) => b[4] - a[4]);
    document.getElementById('modal-dpp-tbody').innerHTML = sortedRows.map(r => `
      <tr>
        <td class="mono-num">Q${r[0]}</td>
        <td><strong>${r[2]}</strong></td>
        <td><span class="cat-badge ${catClassMap[r[6]]}">${cleanTag(r[6])}</span></td>
        <td class="mono-num" style="text-align:right;">${fmtDec(r[4], 2)}</td>
      </tr>
    `).join('');

    dppModal.classList.add('open');
    dppModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeDppModal() {
    if (!dppModal) return;
    dppModal.classList.remove('open');
    dppModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  window.openDppModalByName = (nameOrRaw) => {
    if (!nameOrRaw) return;
    const target = APP_DATA.dppList.find(d =>
      d.raw.toLowerCase() === nameOrRaw.toLowerCase() ||
      d.name.toLowerCase() === nameOrRaw.toLowerCase() ||
      d.name.toLowerCase().includes(nameOrRaw.toLowerCase()) ||
      nameOrRaw.toLowerCase().includes(d.name.toLowerCase())
    );
    if (target) openDppModal(target);
  };

  const closeBtn = document.getElementById('modal-dpp-close');
  if (closeBtn) closeBtn.addEventListener('click', closeDppModal);
  if (dppModal) {
    dppModal.addEventListener('click', (e) => {
      if (e.target === dppModal) closeDppModal();
    });
  }

  const exportDppBtn = document.getElementById('modal-dpp-export');
  if (exportDppBtn) {
    exportDppBtn.addEventListener('click', () => {
      if (!currentDppRaw) return;
      const rows = APP_DATA.records.filter(r => r[3] === currentDppRaw);
      const slug = currentDppRaw.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      exportCSV(`parekrafmind_dpp_${slug}_2025.csv`, rows);
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dppModal && dppModal.classList.contains('open')) {
      closeDppModal();
    }
  });

  if (dppGrid) {
    dppGrid.innerHTML = APP_DATA.dppList.map((d, idx) => {
      const pct = Math.max((d.valMiliar / maxDpp) * 100, d.valMiliar > 0 ? 4 : 0);
      const valText = d.valMiliar >= 1000 ? `Rp ${fmtDec(d.valMiliar / 1000, 2)} T` : `Rp ${fmtDec(d.valMiliar, 1)} M`;
      const isWeak = d.valMiliar < 10;
      return `
        <article class="card dpp-card reveal" tabindex="0" role="button" data-dpp-idx="${idx}" aria-label="Lihat detail destinasi ${d.name}">
          <div>
            <div class="dpp-rank">
              <span>#${String(idx + 1).padStart(2, '0')}</span>
              <span>${d.n} data · ${d.high} tinggi</span>
            </div>
            <h3 class="dpp-name">${d.name}</h3>
            <div class="dpp-val" style="${isWeak ? 'color:var(--ink-3);' : ''}">${valText}</div>
            <div class="dpp-bar-track"><div class="dpp-bar-fill" style="width:${pct.toFixed(1)}%;"></div></div>
            <p class="dpp-sector">${d.sector}</p>
          </div>
          <div>
            <div class="dpp-rule-tag ${isWeak ? 'muted' : ''}">${d.rule}</div>
            <div class="dpp-cta-hint">Lihat info &amp; rincian →</div>
          </div>
        </article>
      `;
    }).join('');

    dppGrid.querySelectorAll('.dpp-card').forEach(card => {
      const idx = parseInt(card.dataset.dppIdx, 10);
      card.addEventListener('click', () => openDppModal(APP_DATA.dppList[idx]));
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDppModal(APP_DATA.dppList[idx]);
        }
      });
    });

    if (window.observeNewReveals) {
      window.observeNewReveals(dppGrid);
    } else {
      dppGrid.querySelectorAll('.reveal').forEach(el => el.classList.add('in-view'));
    }
  }

  // DPP Mobile Carousel Swipe & Control Buttons
  const dppSwipePrev = document.getElementById('dpp-swipe-prev');
  const dppSwipeNext = document.getElementById('dpp-swipe-next');
  const dppCounterBadge = document.getElementById('dpp-carousel-counter');

  if (dppSwipePrev && dppSwipeNext && dppGrid) {
    dppSwipePrev.addEventListener('click', () => {
      dppGrid.scrollBy({ left: -290, behavior: 'smooth' });
    });
    dppSwipeNext.addEventListener('click', () => {
      dppGrid.scrollBy({ left: 290, behavior: 'smooth' });
    });

    dppGrid.addEventListener('scroll', () => {
      const cardWidth = 284;
      const currentIdx = Math.min(Math.round(dppGrid.scrollLeft / cardWidth) + 1, APP_DATA.dppList.length);
      if (dppCounterBadge) {
        dppCounterBadge.textContent = `${Math.max(currentIdx, 1)} / ${APP_DATA.dppList.length}`;
      }
    }, { passive: true });
  }
});
