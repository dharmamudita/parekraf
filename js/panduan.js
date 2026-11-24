/* =========================================================================
   SIMULASI KESELARASAN INVESTASI DAERAH (BERBASIS ATURAN ASOSIASI 38 PROVINSI)
========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof APP_DATA === 'undefined') return;

  const advProv = document.getElementById('adv-prov');
  const scaleChips = document.querySelectorAll('#match-scale-selector .match-scale-chip');
  const sectorBtns = document.querySelectorAll('#match-sector-selector .match-sector-btn');
  const qBtns = document.querySelectorAll('#match-q-selector .match-q-btn');
  const exportBtn = document.getElementById('adv-export');

  // Populate 38 Provinces dropdown
  const provNames = [...new Set(APP_DATA.records.map(r => r[1]))].sort((a, b) => a.localeCompare(b, 'id'));
  if (advProv) {
    advProv.innerHTML = `<option value="ALL">Seluruh Indonesia (38 Provinsi)</option>` +
      provNames.map(p => `<option value="${p}" ${p === 'Nusa Tenggara Barat' ? 'selected' : ''}>${p}</option>`).join('');
  }

  // Read initial state from DOM active classes
  const initScaleEl = document.querySelector('#match-scale-selector .match-scale-chip.active');
  const initSectorEl = document.querySelector('#match-sector-selector .match-sector-btn.active');
  const initQEl = document.querySelector('#match-q-selector .match-q-btn.active');

  let matchCurrentScale = initScaleEl ? initScaleEl.dataset.scale : 'Investasi_Rendah';
  let matchCurrentSector = initSectorEl ? initSectorEl.dataset.sector : 'kuliner';
  let matchCurrentQuarter = initQEl ? parseInt(initQEl.dataset.q, 10) : 2;

  scaleChips.forEach(chip => {
    chip.addEventListener('click', () => {
      scaleChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      matchCurrentScale = chip.dataset.scale || 'Investasi_Rendah';
      runMatchmakerSimulation();
    });
  });

  sectorBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sectorBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      matchCurrentSector = btn.dataset.sector || 'kuliner';
      runMatchmakerSimulation();
    });
  });

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
    const dpps = [...new Set(recs.map(r => r[3]).filter(Boolean))];
    const provZone = recs[0] ? recs[0][5] : 'Jawa';

    // Update header card meta
    const titleEl = document.getElementById('adv-title');
    const subEl = document.getElementById('adv-sub');
    const dppTagEl = document.getElementById('adv-dpp-tag');
    if (titleEl) titleEl.textContent = prov === 'ALL' ? 'Evaluasi Nasional (38 Provinsi)' : `Evaluasi Kesiapan: ${prov}`;
    if (subEl) {
      subEl.textContent = dpps.length
        ? `Kawasan Prioritas: ${dpps.map(x => x.replace('Prambananan', 'Prambanan')).join(', ')}`
        : 'Korelasi PMDN 2025 & Kaidah Asosiasi Regional';
    }
    if (dppTagEl) {
      dppTagEl.textContent = prov === 'ALL'
        ? '10 KAWASAN DPP'
        : (dpps.length ? `${dpps.length} KAWASAN DPP` : 'WILAYAH NON-DPP');
    }

    // Peak Quarter & Kab/Kota aggregation
    const qTotals = [1, 2, 3, 4].map(q => ({
      q,
      val: recs.filter(r => r[0] === q).reduce((a, r) => a + r[4], 0)
    }));
    const peakQ = [...qTotals].sort((a, b) => b.val - a.val)[0];

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
    if (peakQEl) peakQEl.textContent = peakQ && peakQ.val > 0 ? `Q${peakQ.q} (${fmtRpJuta(peakQ.val)})` : 'Belum Aktif';
    if (kabCountEl) kabCountEl.textContent = `${fmtInt(kabs.length)} daerah`;

    // Readiness Score (18-98)
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

    const scoreNumEl = document.getElementById('match-score-num');
    const gaugeCircleEl = document.getElementById('match-gauge-circle');
    if (scoreNumEl) scoreNumEl.textContent = score;
    if (gaugeCircleEl) {
      const offset = 239 - (239 * (score / 100));
      gaugeCircleEl.style.strokeDashoffset = offset;
    }

    // Risk & Opportunity Status Badge
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

    // Query Matched Association Rules (exclude rules belonging to a different archipelago zone)
    const matchedRuleEl = document.getElementById('match-matched-rule');
    const qTag = `Triwulan_${matchCurrentQuarter}`;
    const zoneSet = new Set(['Jawa', 'Sumatera', 'Bali_Nusra', 'Kalimantan', 'Sulawesi', 'Maluku_Papua']);
    const hasOtherZone = r => provZone !== 'ALL' && [...r.a, ...r.c].some(t => zoneSet.has(t) && t !== provZone);
    let relevantRules = APP_DATA.generalRules.filter(r =>
      !hasOtherZone(r) &&
      (r.a.includes(matchCurrentScale) || r.c.includes(matchCurrentScale)) &&
      (r.a.includes(qTag) || r.c.includes(qTag) || r.a.includes(provZone) || r.c.includes(provZone))
    );
    if (!relevantRules.length && provZone !== 'ALL') {
      relevantRules = APP_DATA.generalRules.filter(r => r.a.includes(provZone) || r.c.includes(provZone));
    }
    if (!relevantRules.length) {
      relevantRules = APP_DATA.generalRules.filter(r => !hasOtherZone(r) && r.a.includes(matchCurrentScale));
    }
    relevantRules.sort((a, b) => b.l - a.l);

    if (matchedRuleEl) {
      if (relevantRules.length > 0) {
        const topR = relevantRules[0];
        matchedRuleEl.innerHTML = `<strong>Kaidah Tervalidasi:</strong> [${topR.a.map(cleanTag).join(' + ')}] → [${topR.c.map(cleanTag).join(' + ')}]<br>` +
          `Statistik: Confidence <strong>${fmtDec(topR.cf * 100, 1)}%</strong> · Lift <strong>${fmtDec(topR.l, 2)}x</strong> · Support <strong>${fmtDec(topR.s * 100, 1)}%</strong> pada 1.471 transaksi PMDN 2025.`;
      } else {
        matchedRuleEl.innerHTML = `<strong>Kaidah Terkait:</strong> Pola investasi ${cleanTag(matchCurrentScale)} pada Triwulan ${matchCurrentQuarter} di ${prov === 'ALL' ? 'Nasional' : prov} tergolong kombinasi eksploratif.`;
      }
    }

    // Dynamic 3 Directives
    const sectorLabels = {
      kuliner: 'Kuliner Pesisir & Tradisi',
      kriya: 'Kriya, Batik & Tenun',
      akomodasi: 'Homestay & Eco-Resort',
      bahari: 'Wisata Bahari & Phinisi',
      event: 'Seni Pertunjukan & Budaya',
      digital: 'Aplikasi & Media Kreatif'
    };
    const dir1 = document.getElementById('match-dir-1');
    const dir2 = document.getElementById('match-dir-2');
    const dir3 = document.getElementById('match-dir-3');

    const prevQ = matchCurrentQuarter === 1 ? 4 : matchCurrentQuarter - 1;
    const leadKab = activeKabs[0] ? activeKabs[0].kab : 'sentra utama';
    const oppKab = oppKabs[0] ? oppKabs[0].kab : 'daerah penyangga';

    if (dir1) dir1.innerHTML = `<strong>Timing:</strong> Persiapan modal di ${leadKab} pada Q${prevQ} menjelang puncak Q${matchCurrentQuarter}.`;
    if (dir2) dir2.innerHTML = `<strong>Rantai Pasok:</strong> Kemitraan subsektor <em>${sectorLabels[matchCurrentSector] || cleanTag(matchCurrentSector)}</em> bersama UMKM ${oppKab}.`;
    if (dir3) dir3.innerHTML = `<strong>Perizinan:</strong> Optimalkan fasilitas OSS dan insentif daerah untuk ${cleanTag(matchCurrentScale)}.`;

    // Update Top Active & Opportunity Kab/Kota Lists
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
      const slug = prov === 'ALL' ? 'nasional_38_provinsi' : prov.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      exportCSV(`parekrafmind_investasi_${slug}_2025.csv`, rows);
    });
  }

  runMatchmakerSimulation();
});
