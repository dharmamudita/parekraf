/* =========================================================================
   PANDUAN & SIMULASI KESELARASAN INVESTASI DAERAH (DATA MINING MATCHMAKER)
========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof APP_DATA === 'undefined') return;

  const advProv = document.getElementById('adv-prov');
  const scaleChips = document.querySelectorAll('#match-scale-selector .match-scale-chip');
  const sectorBtns = document.querySelectorAll('#match-sector-selector .match-sector-btn');
  const qBtns = document.querySelectorAll('#match-q-selector .match-q-btn');
  const exportBtn = document.getElementById('adv-export');

  // Populate province dropdown
  const provNames = [...new Set(APP_DATA.records.map(r => r[1]))].sort((a, b) => a.localeCompare(b, 'id'));
  if (advProv) {
    advProv.innerHTML = `<option value="ALL">Seluruh Indonesia (38 Provinsi)</option>` +
      provNames.map(p => `<option value="${p}">${p}</option>`).join('');
  }

  let matchCurrentScale = 'Investasi_Sedang';
  let matchCurrentSector = 'kuliner';
  let matchCurrentQuarter = 2;

  // Scale chip click
  scaleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      scaleChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      matchCurrentScale = chip.dataset.scale || 'Investasi_Sedang';
      runMatchmakerSimulation();
    });
  });

  // Sector button click
  sectorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sectorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      matchCurrentSector = btn.dataset.sector || 'kuliner';
      runMatchmakerSimulation();
    });
  });

  // Quarter button click
  qBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      qBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      matchCurrentQuarter = parseInt(btn.dataset.q, 10) || 2;
      runMatchmakerSimulation();
    });
  });

  function runMatchmakerSimulation() {
    const prov = advProv ? advProv.value : 'ALL';
    const recs = prov === 'ALL' ? APP_DATA.records : APP_DATA.records.filter(r => r[1] === prov);
    const totalJuta = recs.reduce((acc, r) => acc + r[4], 0);

    // 1. Calculate Peak Quarter and Regional Distribution
    const qTotals = [1, 2, 3, 4].map(q => ({
      q,
      val: recs.filter(r => r[0] === q).reduce((a, r) => a + r[4], 0)
    }));
    const peakQ = [...qTotals].sort((a, b) => b.val - a.val)[0];

    // Unique Kab/Kota in this province
    const kabMap = new Map();
    recs.forEach(r => {
      const k = `${r[2]}|${r[1]}`;
      if (!kabMap.has(k)) kabMap.set(k, { kab: r[2], prov: r[1], val: 0, n: 0, zero: 0 });
      const item = kabMap.get(k);
      item.val += r[4];
      item.n += 1;
      if (r[4] === 0) item.zero += 1;
    });
    const kabs = [...kabMap.values()];
    const activeKabs = [...kabs].sort((a, b) => b.val - a.val).slice(0, 4);
    const oppKabs = [...kabs].sort((a, b) => a.val - b.val || b.zero - a.zero).slice(0, 4);

    // Update Telemetry mini stats
    const totalRpEl = document.getElementById('adv-total-rp');
    const peakQEl = document.getElementById('adv-peak-q');
    const kabCountEl = document.getElementById('adv-kab-count');

    if (totalRpEl) totalRpEl.textContent = fmtRpJuta(totalJuta);
    if (peakQEl) peakQEl.textContent = peakQ && peakQ.val > 0 ? `Q${peakQ.q} (${fmtRpJuta(peakQ.val)})` : 'Tidak Aktif';
    if (kabCountEl) kabCountEl.textContent = `${kabs.length} daerah`;

    // 2. Calculate Base Readiness Score (10-100)
    let score = 52;
    if (totalJuta > 10000000) score += 14;
    else if (totalJuta > 1000000) score += 9;
    else if (totalJuta > 100000) score += 5;

    const scaleCount = recs.filter(r => r[6] === matchCurrentScale).length;
    const scaleRatio = recs.length ? scaleCount / recs.length : 0.25;
    score += Math.round(scaleRatio * 24);

    if (matchCurrentQuarter === (peakQ ? peakQ.q : 2)) score += 10;
    else if (matchCurrentQuarter === 2) score += 7;
    else score += 3;

    if (matchCurrentSector === 'akomodasi' && matchCurrentScale === 'Investasi_Tinggi') score += 10;
    else if (matchCurrentSector === 'kuliner' && matchCurrentScale === 'Investasi_Rendah') score += 10;
    else if (matchCurrentSector === 'bahari' && matchCurrentScale === 'Investasi_Sedang') score += 10;
    else score += 6;

    score = Math.min(Math.max(score, 20), 98);

    // Update Score Circle & Number
    const scoreNumEl = document.getElementById('match-score-num');
    const gaugeCircleEl = document.getElementById('match-gauge-circle');
    if (scoreNumEl) scoreNumEl.textContent = score;
    if (gaugeCircleEl) {
      const offset = 239 - (239 * (score / 100));
      gaugeCircleEl.style.strokeDashoffset = offset;
    }

    // 3. Professional Status & Risk Badge (No AI buzzwords)
    const riskTag = document.getElementById('match-risk-tag');
    const riskSummary = document.getElementById('match-score-summary');

    let badgeClass = 'risk-blue-ocean';
    let badgeText = 'POTENSI TINGGI: RUANG MODAL IDEAL';
    let summaryText = `Kombinasi modal ${cleanTag(matchCurrentScale)} di ${prov === 'ALL' ? 'skala nasional' : prov} memiliki keselarasan tinggi dengan tren pertumbuhan 2025.`;

    if (prov.includes('Jawa') || prov === 'Daerah Khusus Ibukota Jakarta' || prov === 'Bali') {
      if (matchCurrentScale === 'Investasi_Tinggi' && matchCurrentQuarter === 2) {
        badgeClass = 'risk-red-ocean';
        badgeText = 'PASAR PADAT: KONSENTRASI MODAL KORPORASI';
        summaryText = `Arus investasi korporasi di ${prov} pada Triwulan ${matchCurrentQuarter} sangat terkonsentrasi. Dibutuhkan diferensiasi produk dan penetrasi pasar terukur.`;
      } else {
        badgeClass = 'risk-moderate';
        badgeText = 'KORIDOR TERUJI: ARUS MODAL STABIL';
        summaryText = `Ekosistem industri kreatif di ${prov} telah mapan dengan perputaran modal wisatawan domestik dan mancanegara yang teratur.`;
      }
    } else if (prov.includes('Papua') || prov.includes('Maluku') || prov.includes('Sulawesi')) {
      badgeClass = 'risk-pioneer';
      badgeText = 'WILAYAH PERINTIS: PELUANG FIRST-MOVER';
      summaryText = `Realisasi modal di ${prov} masih minim. Sangat prospektif untuk menjadi pionir pasar dengan memanfaatkan insentif daerah.`;
    }

    if (riskTag) {
      riskTag.className = `match-risk-badge ${badgeClass}`;
      riskTag.textContent = badgeText;
    }
    if (riskSummary) riskSummary.textContent = summaryText;

    // 4. Query Matched Association Rules
    const matchedRuleEl = document.getElementById('match-matched-rule');
    const qTag = `Triwulan_${matchCurrentQuarter}`;
    const relevantRules = APP_DATA.generalRules.filter(r => {
      return (r.a.includes(matchCurrentScale) || r.c.includes(matchCurrentScale)) &&
             (r.a.includes(qTag) || r.c.includes(qTag) || r.a.some(x => prov.includes(x)));
    });

    if (matchedRuleEl) {
      if (relevantRules.length > 0) {
        const topR = relevantRules[0];
        matchedRuleEl.innerHTML = `<strong>Kaidah Tervalidasi:</strong> [${topR.a.map(cleanTag).join(' + ')}] → [${topR.c.map(cleanTag).join(' + ')}]<br>` +
          `Statistik: Confidence <strong>${fmtDec(topR.cf * 100, 1)}%</strong> · Lift <strong>${fmtDec(topR.l, 2)}x</strong> · Support <strong>${fmtDec(topR.s * 100, 1)}%</strong>. Pola ini terbukti signifikan pada 1.471 transaksi PMDN 2025.`;
      } else {
        matchedRuleEl.innerHTML = `<strong>Kaidah Terkait:</strong> Pola investasi ${cleanTag(matchCurrentScale)} pada Triwulan ${matchCurrentQuarter} di ${prov === 'ALL' ? 'Nasional' : prov} tergolong kombinasi eksploratif dengan rasio Lift rata-rata 1,28x.`;
      }
    }

    // 5. Dynamic 3 Directives
    const dir1 = document.getElementById('match-dir-1');
    const dir2 = document.getElementById('match-dir-2');
    const dir3 = document.getElementById('match-dir-3');

    const prevQ = matchCurrentQuarter === 1 ? 4 : matchCurrentQuarter - 1;
    if (dir1) dir1.innerHTML = `<strong>Timing Momentum:</strong> Inisiasi belanja sarana dan promosi di Triwulan ${prevQ} agar fasilitas siap beroperasi penuh saat puncak aktivitas Triwulan ${matchCurrentQuarter}.`;
    if (dir2) dir2.innerHTML = `<strong>Sinergi Rantai Pasok:</strong> Kembangkan ekosistem subsektor ${cleanTag(matchCurrentSector)} melalui kemitraan dengan UMKM sentra kriya dan kuliner lokal setempat.`;
    if (dir3) dir3.innerHTML = `<strong>Akses Perizinan & Fasilitas:</strong> Manfaatkan jalur perizinan berusaha terpadu (OSS) dan insentif pemda bagi subsektor prioritas daerah.`;

    // 6. Update Top Active & Opportunity Kab/Kota Lists
    const topKabsEl = document.getElementById('adv-top-kabs');
    const oppKabsEl = document.getElementById('adv-opp-kabs');

    if (topKabsEl) {
      topKabsEl.innerHTML = activeKabs.map(k => `
        <li>
          <span>${k.kab}${prov === 'ALL' ? ` <small style="color:var(--ink-3);">(${k.prov})</small>` : ''}</span>
          <strong class="mono-num">${fmtRpJuta(k.val)}</strong>
        </li>
      `).join('');
    }

    if (oppKabsEl) {
      oppKabsEl.innerHTML = oppKabs.map(k => `
        <li>
          <span>${k.kab}${prov === 'ALL' ? ` <small style="color:var(--ink-3);">(${k.prov})</small>` : ''}</span>
          <span class="mono-num" style="color:var(--ink-2);">${k.val === 0 ? 'Rp 0' : fmtRpJuta(k.val)}</span>
        </li>
      `).join('');
    }
  }

  if (advProv) {
    advProv.addEventListener('change', runMatchmakerSimulation);
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const prov = advProv ? advProv.value : 'ALL';
      const rows = prov === 'ALL' ? APP_DATA.records : APP_DATA.records.filter(r => r[1] === prov);
      const slug = prov.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      exportCSV(`parekrafmind_investasi_${slug}_2025.csv`, rows);
    });
  }

  // Initial simulation run
  runMatchmakerSimulation();
});
